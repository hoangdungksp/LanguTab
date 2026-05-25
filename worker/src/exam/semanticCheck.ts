/**
 * Worker: Semantic check module — D-16 Phase 2 (v1.7.8-pre)
 *
 * Admin-only endpoint to validate whether a Flux-generated scene image
 * actually matches the audio script the kid listens to. Built on top of
 * the existing Gemini integration (see captionGridSceneGemini in
 * handlers.ts for the pre-existing pattern).
 *
 * Why a separate file: handlers.ts is already 1500+ lines and growing.
 * New feature work gets its own module; handlers.ts only owns the route
 * wiring (added in the route case inside handleAdminExamRequest).
 *
 * Route (wired in handlers.ts):
 *   POST /admin/exam/semantic-check/:levelId/:partId
 *     body: { audioScript: string, sceneId: string }
 *     auth: Bearer ADMIN_TOKEN (validated upstream in index.ts route guard)
 *
 * Output: SemanticCheckResult shape matching client service.
 */

import type { Env } from '../index';
import { isValidSceneId } from './scenes';

// ─── Types ─────────────────────────────────────────────────────────────

export type SemanticStatus = 'pass' | 'warn' | 'fail' | 'error';

interface GeminiSemanticResult {
  caption: string;
  image_entities: string[];
  script_entities: string[];
  missing_entities: string[];
  extra_entities: string[];
  confidence: number;
}

interface PersistedResult {
  status: SemanticStatus;
  confidence: number;
  caption?: string;
  imageEntities?: string[];
  scriptEntities?: string[];
  missingEntities?: string[];
  extraEntities?: string[];
  geminiModel?: string;
  errorDetail?: string;
}

// ─── Status thresholds ─────────────────────────────────────────────────
// Confidence is (script entities found in image) / (total script entities).
// Empirically chosen — Cambridge YLE Listening expects every named object
// in the script to be visible. We allow a small margin for paraphrase
// (e.g. "ball" vs "soccer ball") before flagging.
const STATUS_PASS_THRESHOLD = 0.85;
const STATUS_WARN_THRESHOLD = 0.6;

const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Local helpers (private to this module) ───────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deriveStatus(confidence: number): SemanticStatus {
  if (confidence >= STATUS_PASS_THRESHOLD) return 'pass';
  if (confidence >= STATUS_WARN_THRESHOLD) return 'warn';
  return 'fail';
}

// ─── R2 scene fetch ────────────────────────────────────────────────────

/**
 * Fetch raw bytes of a scene image from R2. Returns Uint8Array on success
 * or { error } on failure. Mirrors the key format used by
 * getSceneFromCache(): `exam-scenes/${cacheVersion}/${sceneId}.jpg`
 */
async function loadSceneBytesFromR2(
  env: Env,
  sceneId: string,
): Promise<Uint8Array | { error: string }> {
  if (!env.IMAGES) return { error: 'R2 not configured' };
  if (!isValidSceneId(sceneId)) {
    return { error: `Unknown sceneId: ${sceneId}` };
  }

  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
  const obj = await env.IMAGES.get(r2Key);
  if (!obj) {
    return {
      error:
        `Scene not pre-warmed: ${sceneId}. ` +
        `Admin must POST /admin/exam/scenes/warm-all first.`,
    };
  }
  const buf = await obj.arrayBuffer();
  return new Uint8Array(buf);
}

// ─── Gemini call ───────────────────────────────────────────────────────

/**
 * Single Gemini Vision call that returns structured JSON containing both
 * the image caption and the entity comparison. Doing it in one call (vs
 * two separate "caption" then "compare" calls) halves the API cost and
 * lets Gemini reason about the relationship between script + image with
 * full context.
 */
async function semanticCheckGemini(
  apiKey: string,
  imageBytes: Uint8Array,
  audioScript: string,
): Promise<GeminiSemanticResult | { error: string }> {
  // Base64 encode (chunked to avoid stack overflow on large images)
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < imageBytes.length; i += chunkSize) {
    const chunk = imageBytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);

  // Prompt design notes:
  //   - Explicit role + structured JSON output to keep Gemini disciplined
  //   - "What you ACTUALLY see" — Flux sometimes generates near-matches
  //     and we need Gemini to be honest about discrepancies
  //   - Normalization rules to make entity matching robust ("cat" matches
  //     "kitten", "ball" matches "soccer ball")
  //   - Ignore Cambridge-specific filler ("Listen and...", "There is one
  //     example", "Colour the X Y") so script entities are clean
  const prompt =
    'You are validating that an exam image matches the audio script\n' +
    'for a children\'s English listening exam (Cambridge YLE style).\n\n' +
    'AUDIO SCRIPT:\n' +
    audioScript +
    '\n\n' +
    'Look at the image. Extract the entities (objects, animals, people,\n' +
    'activities) that you ACTUALLY see, then compare with entities\n' +
    'mentioned in the script.\n\n' +
    'Return ONLY this JSON shape (no markdown fence, no prose):\n' +
    '{\n' +
    '  "caption": "1-2 sentence description of what is visible",\n' +
    '  "image_entities": ["entity1", "entity2", ...],\n' +
    '  "script_entities": ["entity1", "entity2", ...],\n' +
    '  "missing_entities": ["in script but NOT in image"],\n' +
    '  "extra_entities": ["in image but NOT in script"],\n' +
    '  "confidence": 0.0 to 1.0\n' +
    '}\n\n' +
    'Rules:\n' +
    '- Be ACCURATE — describe what you SEE, not what should be there.\n' +
    '- Normalize entity names: lowercase, singular ("cat" not "kitten",\n' +
    '  "ball" not "balls"). Treat near-matches as the same entity\n' +
    '  ("cat" matches "kitten", "child" matches "kid").\n' +
    '- Ignore filler phrases like "look at", "listen", "colour the",\n' +
    '  "this is", "there is one example", "now you listen and colour".\n' +
    '- confidence = (script entities also visible in image) /\n' +
    '  (total script entities). 1.0 = perfect match, 0.0 = nothing\n' +
    '  in image matches script.';

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let resp: Response;
  try {
    console.log(
      `[semantic-check] calling Gemini, image=${imageBytes.byteLength}B, ` +
      `script=${audioScript.length} chars`,
    );
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,           // low temp for factual analysis
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    return {
      error: `Gemini fetch threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { error: `Gemini HTTP ${resp.status}: ${body.slice(0, 300)}` };
  }

  let data: unknown;
  try {
    data = await resp.json();
  } catch (err) {
    return { error: `Gemini response JSON parse failed: ${err}` };
  }

  const d = data as Record<string, unknown>;
  const candidates = d.candidates as Array<Record<string, unknown>> | undefined;
  if (!candidates || candidates.length === 0) {
    return {
      error: `Gemini no candidates: ${JSON.stringify(d).slice(0, 200)}`,
    };
  }
  const content = candidates[0].content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts?.[0]?.text as string | undefined;
  if (!text) {
    return { error: 'Gemini empty text in candidate' };
  }

  // Parse JSON. responseMimeType: application/json should give clean JSON
  // but we fall back to regex extraction if Gemini wraps it.
  let parsed: GeminiSemanticResult;
  try {
    parsed = JSON.parse(text) as GeminiSemanticResult;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { error: `Gemini no JSON in: ${text.slice(0, 300)}` };
    try {
      parsed = JSON.parse(m[0]) as GeminiSemanticResult;
    } catch (err) {
      return { error: `Gemini JSON parse failed: ${err}` };
    }
  }

  // Validate + normalize shape — Gemini sometimes omits empty arrays
  if (typeof parsed.caption !== 'string') {
    return { error: 'Gemini result missing caption field' };
  }
  if (typeof parsed.confidence !== 'number') {
    return { error: 'Gemini result missing numeric confidence field' };
  }
  if (!Array.isArray(parsed.image_entities)) parsed.image_entities = [];
  if (!Array.isArray(parsed.script_entities)) parsed.script_entities = [];
  if (!Array.isArray(parsed.missing_entities)) parsed.missing_entities = [];
  if (!Array.isArray(parsed.extra_entities)) parsed.extra_entities = [];

  // Clamp confidence to [0, 1] defensively
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

  return parsed;
}

// ─── D1 persistence ────────────────────────────────────────────────────

async function persistSemanticCheck(
  env: Env,
  levelId: string,
  partId: string,
  result: PersistedResult,
): Promise<number> {
  if (!env.DB) return 0;
  const checkedAt = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT OR REPLACE INTO exam_semantic_checks (
       level_id, part_id, status, confidence,
       caption_text, image_entities, script_entities,
       missing_entities, extra_entities,
       gemini_model, error_detail, checked_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    levelId,
    partId,
    result.status,
    result.confidence,
    result.caption ?? null,
    JSON.stringify(result.imageEntities ?? []),
    JSON.stringify(result.scriptEntities ?? []),
    JSON.stringify(result.missingEntities ?? []),
    JSON.stringify(result.extraEntities ?? []),
    result.geminiModel ?? null,
    result.errorDetail ?? null,
    checkedAt,
  ).run();
  return checkedAt;
}

// ─── Public handler ────────────────────────────────────────────────────

/**
 * Admin: POST /admin/exam/semantic-check/:levelId/:partId
 *
 * Body: { audioScript: string, sceneId: string }
 *
 * Workflow:
 *   1. Validate body
 *   2. Fetch scene image from R2 (must already be admin-warmed)
 *   3. Call Gemini Vision with image + audioScript
 *   4. Derive status from confidence
 *   5. Upsert to exam_semantic_checks
 *   6. Return result as JSON
 *
 * Errors are persisted as status='error' rows so the Phase 3 dashboard
 * shows that the check was attempted, not just missing.
 */
export async function adminRunSemanticCheck(
  env: Env,
  levelId: string,
  partId: string,
  req: Request,
): Promise<Response> {
  if (!env.DB) return jsonResponse({ error: 'D1 not configured' }, 503);

  const geminiKey = (env as unknown as { GEMINI_API_KEY?: string })
    .GEMINI_API_KEY;
  if (!geminiKey) {
    return jsonResponse(
      { error: 'GEMINI_API_KEY not configured on worker' },
      503,
    );
  }

  let body: { audioScript?: string; sceneId?: string };
  try {
    body = (await req.json()) as { audioScript?: string; sceneId?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { audioScript, sceneId } = body;
  if (
    !audioScript ||
    typeof audioScript !== 'string' ||
    audioScript.trim() === ''
  ) {
    return jsonResponse(
      { error: 'audioScript (non-empty string) required in body' },
      400,
    );
  }
  if (!sceneId || typeof sceneId !== 'string') {
    return jsonResponse({ error: 'sceneId (string) required in body' }, 400);
  }

  // ─── Step 1: Fetch image from R2 ────────────────────────────────
  const bytesOrErr = await loadSceneBytesFromR2(env, sceneId);
  if (!(bytesOrErr instanceof Uint8Array)) {
    const errorDetail = bytesOrErr.error;
    await persistSemanticCheck(env, levelId, partId, {
      status: 'error',
      confidence: 0,
      errorDetail,
      geminiModel: GEMINI_MODEL,
    });
    return jsonResponse(
      { status: 'error', confidence: 0, errorDetail },
      404,
    );
  }
  const imageBytes = bytesOrErr;

  // ─── Step 2: Call Gemini ────────────────────────────────────────
  const geminiResult = await semanticCheckGemini(
    geminiKey,
    imageBytes,
    audioScript,
  );

  if ('error' in geminiResult) {
    const errorDetail = geminiResult.error;
    console.error('[semantic-check] Gemini failed:', errorDetail);
    await persistSemanticCheck(env, levelId, partId, {
      status: 'error',
      confidence: 0,
      errorDetail,
      geminiModel: GEMINI_MODEL,
    });
    return jsonResponse(
      { status: 'error', confidence: 0, errorDetail },
      502,
    );
  }

  // ─── Step 3: Derive status + persist ────────────────────────────
  const status = deriveStatus(geminiResult.confidence);
  const persisted: PersistedResult = {
    status,
    confidence: geminiResult.confidence,
    caption: geminiResult.caption,
    imageEntities: geminiResult.image_entities,
    scriptEntities: geminiResult.script_entities,
    missingEntities: geminiResult.missing_entities,
    extraEntities: geminiResult.extra_entities,
    geminiModel: GEMINI_MODEL,
  };
  const checkedAt = await persistSemanticCheck(env, levelId, partId, persisted);

  // ─── Step 4: Return result ──────────────────────────────────────
  return jsonResponse({
    status: persisted.status,
    confidence: persisted.confidence,
    caption: persisted.caption,
    imageEntities: persisted.imageEntities,
    scriptEntities: persisted.scriptEntities,
    missingEntities: persisted.missingEntities,
    extraEntities: persisted.extraEntities,
    geminiModel: persisted.geminiModel,
    checkedAt,
  });
}
