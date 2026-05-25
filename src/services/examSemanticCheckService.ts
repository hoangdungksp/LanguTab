/**
 * examSemanticCheckService — D-16 Phase 2 (v1.7.8-pre)
 *
 * Admin-only tool: run Gemini-powered semantic check on a (level, part) —
 * does the scene image actually match what the audio script describes?
 *
 * Flow:
 *   1. Admin opens an exam part in admin mode
 *   2. Clicks "Run semantic check"
 *   3. Client calls POST /admin/exam/semantic-check/:lvl/:part
 *   4. Worker fetches scene from R2, sends image + script to Gemini Vision
 *   5. Worker stores result in D1 (exam_semantic_checks table)
 *   6. Client receives result + displays status (pass/warn/fail/error)
 *
 * Mirrors examAudioScriptService + examCalibrationService patterns
 * (Sprint 4.9.4 / 4.9): admin_token from sessionStorage, throws on error
 * so caller can show user-facing message.
 *
 * Phase 3 (future) will add a GET endpoint to list cached results for the
 * admin dashboard.
 */

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export type SemanticStatus = 'pass' | 'warn' | 'fail' | 'error';

export interface SemanticCheckResult {
  status: SemanticStatus;
  confidence: number;            // 0.0 to 1.0
  caption?: string;              // Gemini's free-form image caption
  imageEntities?: string[];      // objects/people Gemini saw in image
  scriptEntities?: string[];     // objects/people mentioned in audio script
  missingEntities?: string[];    // in script but NOT in image (red flag)
  extraEntities?: string[];      // in image but NOT in script (yellow flag)
  geminiModel?: string;
  checkedAt?: number;            // epoch seconds (worker timestamp)
  errorDetail?: string;          // populated when status='error'
}

/**
 * Run a fresh semantic check. Caller (admin tool UI) needs admin_token
 * in sessionStorage (auto-provisioned by adminModeService based on user
 * email match — see Sprint 4.9.5.1).
 *
 * Body shape sent to worker:
 *   - audioScript: the EFFECTIVE script (defaults from levels.ts merged
 *     with any admin override from D1). Caller should fetch via
 *     getEffectiveAudioScript() from examAudioScriptService BEFORE
 *     calling this so the check reflects what users actually hear.
 *   - sceneId: scene ID matching the worker SCENE_IDS registry.
 *
 * Throws on auth / network / server error so caller can surface a
 * user-facing message. Worker logs Gemini errors to its own console.
 */
export async function runSemanticCheck(
  levelId: string,
  partId: string,
  audioScript: string,
  sceneId: string,
): Promise<SemanticCheckResult> {
  const token = sessionStorage.getItem('admin_token');
  if (!token) throw new Error('Admin token not set in sessionStorage');

  const url =
    `${WORKER_URL}/admin/exam/semantic-check/` +
    `${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ audioScript, sceneId }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    // 502 = Gemini upstream error, 404 = scene not warmed in R2
    // 503 = D1 or GEMINI_API_KEY missing
    throw new Error(
      `Semantic check failed: HTTP ${resp.status} ${body.slice(0, 200)}`,
    );
  }

  return resp.json() as Promise<SemanticCheckResult>;
}
