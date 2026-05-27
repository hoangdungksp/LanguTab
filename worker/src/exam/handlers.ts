/**
 * /exam/* handlers — exam audio + (future) attempt persistence.
 *
 * For v1.0.x the only endpoint here is POST /exam/audio: given an audioKey
 * and an audioScript, return the MP3 bytes. The audio is stored in R2
 * under `exam-audio/{audioKey}` so subsequent calls hit the cache.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Why TTS-on-demand instead of pre-generating
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Pre-generating every audio file at deploy time would mean:
 *   - 12 audio files × all future tests × all languages = lots of upfront
 *     Workers AI calls (cost: Neurons) AND R2 storage even if tests are
 *     never attempted
 *   - Re-deploys would either skip existing files (logic complexity) or
 *     regenerate everything wastefully
 *
 * On-demand generation:
 *   - First user to play a question pays the ~3-5s TTS latency
 *   - Subsequent plays (same user, other users) hit R2 cache instantly
 *   - Audio is stored forever (no expiry); cache hit rate approaches 100%
 *     after the first user completes each test
 *
 * The trade-off: kid waits 3-5s on first play. Acceptable because (a)
 * they typically replay multiple times, so amortized cost is small, (b)
 * we show a loading spinner so they know something is happening, (c)
 * for the very first user this is the only "cost" of the entire exam.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TTS model choice
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Workers AI offers multiple TTS models. We use `@cf/myshell-ai/melotts`
 * because:
 *   - It's the canonical English TTS in Workers AI (best documented)
 *   - Returns base64 MP3 — easy to decode and store
 *   - Voice quality is acceptable for kid-level exams (clear pronunciation,
 *     natural prosody on simple sentences)
 *   - Free tier is generous enough for our scale
 *
 * If quality issues arise, we can swap to OpenAI TTS via API or ElevenLabs
 * by changing only this file. The audioScript field is text — model-agnostic.
 */

import type { Env } from '../index';
import type { VerifiedUser } from '../sync/handlers';
import { SCENE_PROMPTS, isValidSceneId } from './scenes';
import { adminRunSemanticCheck } from './semanticCheck';

const TTS_MODEL = '@cf/myshell-ai/melotts';
/** Image generation model — Flux-1-Schnell, free, ~5-10s per 1024×1024 JPEG. */
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';

interface AudioRequestBody {
  /** R2 object key (relative to "exam-audio/" prefix) */
  audioKey: string;
  /** English text to read aloud (used only on cache miss) */
  audioScript: string;
  /** Admin-only: force re-generation even if already cached (overwrite). */
  force?: boolean;
}

/**
 * Returns null if the path doesn't match an exam route, signaling the main
 * router to try the next handler family. Otherwise returns the Response.
 */
export async function handleExamRequest(
  req: Request,
  env: Env,
  user: VerifiedUser | null,
): Promise<Response | null> {
  const url = new URL(req.url);

  // POST /exam/audio — READ-ONLY for normal users. Returns cached audio from
  // R2 if present, else 404. NEVER generates TTS (no API spend by users).
  // Only admin generates audio via POST /admin/exam/audio/generate. This
  // mirrors the scene-image model: admin creates, all users read.
  if (url.pathname === '/exam/audio' && req.method === 'POST') {
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Auth required for exam audio' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return getAudioFromCacheReadOnly(req, env);
  }

  // GET /exam/scene/:sceneId — fetch scene image from R2 cache.
  // Read-only: never triggers Flux generation. If scene not yet cached,
  // returns 404 with admin-warming hint. Generation requires admin auth
  // via separate /admin/exam/scenes/* endpoints. This prevents abuse —
  // only Super Admin can spend Workers AI Neurons on scene generation,
  // protecting the budget while serving all 1k+ users from cache.
  if (url.pathname.startsWith('/exam/scene/') && req.method === 'GET') {
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Auth required for exam scene' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const sceneId = url.pathname.replace('/exam/scene/', '');
    return getSceneFromCache(env, sceneId, req);
  }

  // Sprint 4.9: GET /exam/calibration/:levelId/:partId — public read of
  // drop zone overrides. No auth required so anonymous users see the
  // calibrated zones (they affect grading visibility too).
  const calMatch = url.pathname.match(/^\/exam\/calibration\/([^/]+)\/([^/]+)$/);
  if (calMatch && req.method === 'GET') {
    return getCalibrationPublic(env, decodeURIComponent(calMatch[1]), decodeURIComponent(calMatch[2]));
  }

  // Sprint 4.9.4: GET /exam/audio-script/:levelId/:partId — public read.
  // Returns admin-edited audio script if present, null otherwise. Frontend
  // uses this to override hardcoded script in levels.ts so audio matches
  // what the admin saw in the actual AI-generated image.
  const scriptMatch = url.pathname.match(/^\/exam\/audio-script\/([^/]+)\/([^/]+)$/);
  if (scriptMatch && req.method === 'GET') {
    return getAudioScriptPublic(env, decodeURIComponent(scriptMatch[1]), decodeURIComponent(scriptMatch[2]));
  }

  // Path doesn't match — defer to next router
  return null;
}

/**
 * Cache-aware path with provider-prefixed keys.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Why provider-prefixed cache
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each TTS provider gets its own R2 namespace:
 *   exam-audio/v1/elevenlabs/level1/p1.mp3
 *   exam-audio/v1/aura2/level1/p1.mp3
 *   exam-audio/v1/melotts/level1/p1.mp3
 *
 * Lookup tries each provider in preferred quality order, returning the
 * first cache hit. Generation caches under the provider that actually
 * succeeded.
 *
 * This solves the upgrade scenario: if ElevenLabs free tier was failing
 * (cached as melotts), once user upgrades to paid plan, future cache
 * misses generate fresh ElevenLabs and cache there. The melotts cache is
 * dereferenced naturally — no manual cleanup needed.
 *
 * Also: each audio file generated via paid TTS (ElevenLabs/Aura-2) is
 * stored permanently in R2. Cost is one-time per audio file. Subsequent
 * plays — by same user, by other users, after Cloudflare deployments,
 * after browser refreshes — all hit R2 cache. Zero recurring cost.
 */
/**
 * READ-ONLY audio lookup for normal users. Checks R2 cache across providers;
 * returns the cached MP3 or 404. Never calls TTS — generation is admin-only.
 */
async function getAudioFromCacheReadOnly(req: Request, env: Env): Promise<Response> {
  let body: AudioRequestBody;
  try {
    body = (await req.json()) as AudioRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.audioKey || !body.audioScript) {
    return new Response(
      JSON.stringify({ error: 'audioKey and audioScript required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const cacheVersion = env.AUDIO_CACHE_VERSION || 'v1';
  const scriptHash = await sha256Short(body.audioScript);

  for (const provider of preferredProvidersForLookup(env, langFromAudioKey(body.audioKey))) {
    const r2Key = `exam-audio/${cacheVersion}/${provider}/${body.audioKey}.${scriptHash}`;
    const cached = await env.IMAGES.get(r2Key);
    if (cached) {
      return new Response(cached.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          // Audio for a given (key+scriptHash) is content-addressed and never
          // changes — safe to cache immutably on the client.
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Audio-Source': 'r2-cache',
          'X-Audio-Provider': provider,
        },
      });
    }
  }

  // Not generated yet — admin must create it. No TTS here.
  return new Response(
    JSON.stringify({
      error: 'Audio chưa được tạo cho bài thi này',
      hint: 'Admin must POST /admin/exam/audio/generate',
      audioKey: body.audioKey,
    }),
    { status: 404, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * Admin-only: report whether audio for (audioKey, audioScript) is cached in
 * R2, without downloading it. Powers the admin "có audio / chưa có audio"
 * badge so admin knows which parts still need generating.
 */
async function adminAudioStatus(req: Request, env: Env): Promise<Response> {
  let body: AudioRequestBody;
  try {
    body = (await req.json()) as AudioRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.audioKey || !body.audioScript) {
    return new Response(JSON.stringify({ error: 'audioKey and audioScript required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!env.IMAGES) {
    return new Response(JSON.stringify({ cached: false }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
  const cacheVersion = env.AUDIO_CACHE_VERSION || 'v1';
  const scriptHash = await sha256Short(body.audioScript);
  for (const provider of preferredProvidersForLookup(env, langFromAudioKey(body.audioKey))) {
    const r2Key = `exam-audio/${cacheVersion}/${provider}/${body.audioKey}.${scriptHash}`;
    const head = await env.IMAGES.head(r2Key);
    if (head) {
      return new Response(JSON.stringify({ cached: true, provider }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response(JSON.stringify({ cached: false }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

async function getOrGenerateAudio(req: Request, env: Env): Promise<Response> {
  let body: AudioRequestBody;
  try {
    body = (await req.json()) as AudioRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.audioKey || !body.audioScript) {
    return new Response(
      JSON.stringify({ error: 'audioKey and audioScript required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (body.audioScript.length > 1000) {
    return new Response(
      JSON.stringify({ error: 'audioScript too long (max 1000 chars)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!/^[a-zA-Z0-9_/.-]+$/.test(body.audioKey) || body.audioKey.length > 200) {
    return new Response(
      JSON.stringify({ error: 'Invalid audioKey format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const cacheVersion = env.AUDIO_CACHE_VERSION || 'v1';

  // Sprint 4.9.3: Hash audioScript into cache key so script changes
  // automatically invalidate cache without bumping AUDIO_CACHE_VERSION.
  // Otherwise: admin updates levels.ts audioScript, deploys, cache key
  // stays same → worker serves old audio matching old script. The 8-char
  // hex hash is short enough not to bloat keys but unique enough to
  // separate any meaningful change (collision space ~4 billion).
  const scriptHash = await sha256Short(body.audioScript);

  // ─── Cache lookup: try each provider in preferred quality order ─────
  // Skipped when admin requests force re-generation (Regen → overwrite).
  const lang = langFromAudioKey(body.audioKey);
  const lookupOrder = preferredProvidersForLookup(env, lang);
  for (const provider of body.force ? [] : lookupOrder) {
    const r2Key = `exam-audio/${cacheVersion}/${provider}/${body.audioKey}.${scriptHash}`;
    const cached = await env.IMAGES!.get(r2Key);
    if (cached) {
      console.log(`[exam-audio] cache hit (${provider}):`, r2Key);
      return new Response(cached.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Audio-Source': 'r2-cache',
          'X-Audio-Provider': provider,
          'X-Cache-Key': r2Key,
        },
      });
    }
  }

  // ─── Cache miss everywhere — generate fresh + cache by provider ─────
  console.log('[exam-audio] cache miss → generating:', body.audioKey);
  const ttsStart = Date.now();
  // Part 2/3: stitch per-question segments with 2s gaps (falls back to
  // single-shot if stitching isn't possible for the engine).
  const gapped = partWantsGaps(body.audioKey)
    ? await generateWithGaps(env, body.audioScript, lang)
    : null;
  const { bytes, provider } = gapped
    ?? await generateTTSWithProvider(env, body.audioScript, lang);
  const ttsMs = Date.now() - ttsStart;
  console.log(
    `[exam-audio] TTS done via ${provider} in ${ttsMs}ms (${bytes.byteLength} bytes)`,
  );

  // ⚠️ CRITICAL — must AWAIT the R2 put.
  //
  // In Cloudflare Workers, fire-and-forget promises (without ctx.waitUntil
  // or await) get CANCELLED when the worker isolate terminates after sending
  // the response. The previous fire-and-forget pattern caused R2 puts to
  // silently fail → cache never populated → every request a miss → every
  // play hit ElevenLabs. With ElevenLabs at $0.30/1k chars, this bleeds
  // money fast.
  //
  // Awaiting adds ~100-300ms latency to the FIRST request per audio file
  // (cache miss path only). Subsequent requests stream from R2 (~50ms).
  // The latency is acceptable; the previous behavior was not.
  const freshKey = `exam-audio/${cacheVersion}/${provider}/${body.audioKey}.${scriptHash}`;
  let putOk = false;
  try {
    await env.IMAGES!.put(freshKey, bytes, {
      httpMetadata: { contentType: 'audio/mpeg' },
    });
    putOk = true;
    console.log(`[exam-audio] R2 cached ✓: ${freshKey} (${bytes.byteLength} bytes)`);
  } catch (err) {
    console.error('[exam-audio] R2 put FAILED:', err);
    // Still return audio to user even if cache failed — they get the audio,
    // we just paid for TTS without saving it. Next request will retry.
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Audio-Source': 'tts-fresh',
      'X-Audio-Provider': provider,
      'X-Audio-Cached': putOk ? 'true' : 'false',
      'X-TTS-Latency-Ms': String(ttsMs),
    },
  });
}

/**
 * Returns the list of providers to try for cache lookup, in preferred
 * quality order. The order also reflects which providers are actually
 * worth checking — no point looking up ElevenLabs cache if ElevenLabs key
 * isn't configured (would never have been generated/cached).
 */
function preferredProvidersForLookup(env: Env, lang: 'en' | 'zh' = 'en'): string[] {
  // D-23: Chinese uses Qwen-TTS (if key) → MeloTTS-zh. The English-only
  // providers (Aura-2, ElevenLabs Dorothy) don't apply.
  if (lang === 'zh') {
    return env.DASHSCOPE_API_KEY ? ['qwen', 'melotts'] : ['melotts'];
  }

  // Forced provider modes — only check that one provider's cache
  if (env.TTS_PROVIDER === 'elevenlabs') return ['elevenlabs'];
  if (env.TTS_PROVIDER === 'aura2') return ['aura2'];
  if (env.TTS_PROVIDER === 'melotts') return ['melotts'];

  // Auto mode: prefer higher quality providers
  if (env.ELEVENLABS_API_KEY) {
    return ['elevenlabs', 'aura2', 'melotts'];
  }
  return ['aura2', 'melotts'];
}

/** Detect exam language from the audioKey prefix (`zh/...` = Chinese). */
function langFromAudioKey(audioKey: string): 'en' | 'zh' {
  return audioKey.startsWith('zh/') ? 'zh' : 'en';
}

/** Fallback path used if R2 binding is missing — generate every request. */
async function generateAudioWithoutCache(req: Request, env: Env): Promise<Response> {
  let body: AudioRequestBody;
  try {
    body = (await req.json()) as AudioRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.audioScript || body.audioScript.length > 1000) {
    return new Response(
      JSON.stringify({ error: 'audioScript invalid' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  console.warn('[exam-audio] no R2 binding — uncached generation');
  const { bytes, provider } = await generateTTSWithProvider(env, body.audioScript);
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-Audio-Source': 'tts-fresh-uncached',
      'X-Audio-Provider': provider,
    },
  });
}

/**
 * Generate TTS — provider hierarchy:
 *
 *   1. ElevenLabs (if `ELEVENLABS_API_KEY` set + works)
 *      Studio quality, $0.30/1k chars (~$72/240k chars)
 *      Note: ElevenLabs free tier blocks Cloudflare datacenter IPs as
 *      "unusual activity" — only works on paid plans ($5+/mo).
 *
 *   2. Deepgram Aura-2 (Workers AI partner model) — DEFAULT
 *      Context-aware, natural pacing, 40 voices, $0.03/1k chars
 *      (~$7.20 for full 240k char catalog, one-time)
 *      Runs on Cloudflare network → no IP blocking issues.
 *
 *   3. melotts (Workers AI free tier) — last resort fallback
 *      Robotic but always available.
 *
 * Override hierarchy via env var `TTS_PROVIDER`:
 *   - "elevenlabs" → ElevenLabs only (errors if key missing)
 *   - "aura2"      → Aura-2 only (skip ElevenLabs even if key set)
 *   - "melotts"    → melotts only (force free tier for testing)
 *   - unset        → 1 → 2 → 3 fallback chain
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Aura-2 voice picks (curated for Cambridge YLE Listening style)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   - asteria ⭐ default — clear female, teacher-like
 *   - athena              — professional warm female
 *   - helena              — warm narrator female
 *   - aurora              — friendly female
 *   - hera                — confident female
 *   - luna                — gentle female (Aura-2 model default)
 *
 * Override via wrangler.toml: `AURA2_VOICE = "athena"`
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ElevenLabs voice picks (if upgraded to paid)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   - Dorothy ⭐ default (`ThT5KcBeYPX3keUQqHPh`) — warm British female
 *   - Lily              (`pFZP5JQG7iQjIQuC4Bku`) — gentle British female
 *   - Sarah             (`EXAVITQu4vr4xnSDxMaL`) — clear American female
 *   - Charlotte         (`XB0fDUnXU5powFXDhCwa`) — warm narrator
 *   - Alice             (`Xb7hH8MSUJpSbSDYk0k2`) — confident British
 */

/** Default ElevenLabs voice — Dorothy. */
const ELEVENLABS_DEFAULT_VOICE_ID = 'ThT5KcBeYPX3keUQqHPh';
/** Default ElevenLabs model — best quality multilingual. */
const ELEVENLABS_DEFAULT_MODEL_ID = 'eleven_multilingual_v2';
/** Default Aura-2 speaker. */
const AURA2_DEFAULT_VOICE = 'asteria';

/**
 * Run the TTS fallback chain and return bytes + the actual provider used.
 *
 * Callers need the provider name so they can cache the audio under the
 * right R2 namespace. This way, when free-tier ElevenLabs falls back to
 * Aura-2 today, the audio is cached at `aura2/...`. Tomorrow when the user
 * upgrades ElevenLabs, the lookup tries `elevenlabs/...` first (miss),
 * generates fresh ElevenLabs audio, caches at `elevenlabs/...`. The old
 * Aura-2 cache becomes orphaned but isn't served anymore.
 */
async function generateTTSWithProvider(
  env: Env,
  text: string,
  lang: 'en' | 'zh' = 'en',
): Promise<{ bytes: ArrayBuffer; provider: string }> {
  // ─── D-23: Chinese audio ────────────────────────────────────────────
  // Qwen-TTS (Cherry voice, D-1) when DASHSCOPE_API_KEY is set; otherwise
  // free Workers-AI MeloTTS with lang='zh'. Aura-2/ElevenLabs are English.
  if (lang === 'zh') {
    if (env.DASHSCOPE_API_KEY) {
      try {
        return { bytes: await generateQwenTTS(env, text), provider: 'qwen' };
      } catch (err) {
        console.warn('[exam-audio] Qwen-TTS failed, falling back to MeloTTS-zh:', err);
      }
    }
    return { bytes: await generateMeloTTS(env, text, 'zh'), provider: 'melotts' };
  }

  const forced = env.TTS_PROVIDER;

  // Forced provider modes — used for testing/debugging. Errors propagate
  // so the user sees them rather than getting silent fallback.
  if (forced === 'elevenlabs') {
    return { bytes: await generateElevenLabsTTS(env, text), provider: 'elevenlabs' };
  }
  if (forced === 'aura2') {
    return { bytes: await generateAura2TTS(env, text), provider: 'aura2' };
  }
  if (forced === 'melotts') {
    return { bytes: await generateMeloTTS(env, text), provider: 'melotts' };
  }

  // ─── Auto fallback chain ────────────────────────────────────────────
  if (env.ELEVENLABS_API_KEY) {
    try {
      const bytes = await generateElevenLabsTTS(env, text);
      return { bytes, provider: 'elevenlabs' };
    } catch (err) {
      console.warn('[exam-audio] ElevenLabs failed, falling back to Aura-2:', err);
    }
  }

  try {
    const bytes = await generateAura2TTS(env, text);
    return { bytes, provider: 'aura2' };
  } catch (err) {
    console.warn('[exam-audio] Aura-2 failed, falling back to melotts:', err);
  }

  const bytes = await generateMeloTTS(env, text);
  return { bytes, provider: 'melotts' };
}

/**
 * Call Deepgram Aura-2 via Workers AI binding. Returns ReadableStream of
 * MP3 audio bytes — we collect into ArrayBuffer for R2 storage.
 *
 * Aura-2 is context-aware: it adjusts pacing, expressiveness, and even
 * inserts natural fillers ("um", "uh") based on punctuation + sentence
 * structure. Quality of input directly affects output naturalness, so we
 * keep audioScripts well-punctuated with short sentences.
 */
async function generateAura2TTS(env: Env, text: string): Promise<ArrayBuffer> {
  const speaker = env.AURA2_VOICE || AURA2_DEFAULT_VOICE;
  // The AI binding signature returns broad union types; the Aura-2 model
  // returns ReadableStream when encoding is set to a binary format.
  // Double-cast through `unknown` is the TS-recommended escape hatch when
  // the runtime contract is well-known but doesn't match the static types.
  const stream = (await env.AI.run('@cf/deepgram/aura-2-en', {
    text,
    speaker,
    encoding: 'mp3',
  })) as unknown as ReadableStream;
  // ReadableStream → ArrayBuffer via Response wrapper (cleanest API)
  return await new Response(stream).arrayBuffer();
}

/**
 * Call ElevenLabs API and return raw MP3 bytes.
 * Throws on auth/quota failure so caller can fall back.
 */
async function generateElevenLabsTTS(env: Env, text: string): Promise<ArrayBuffer> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }
  const voiceId = env.ELEVENLABS_VOICE_ID || ELEVENLABS_DEFAULT_VOICE_ID;
  const modelId = env.ELEVENLABS_MODEL_ID || ELEVENLABS_DEFAULT_MODEL_ID;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.85,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `ElevenLabs ${res.status}: ${errBody.slice(0, 200) || res.statusText}`,
    );
  }

  return res.arrayBuffer();
}

/**
 * Fallback: Workers AI melotts. Free, robotic, but always available.
 * Returns JSON { audio: "base64..." }. We decode and return raw bytes.
 */
async function generateMeloTTS(env: Env, text: string, lang: 'en' | 'zh' = 'en'): Promise<ArrayBuffer> {
  const aiResp = (await env.AI.run(TTS_MODEL, {
    prompt: text,
    lang,
  })) as { audio?: string;[key: string]: unknown };

  if (!aiResp.audio || typeof aiResp.audio !== 'string') {
    console.error('[exam-audio] melotts returned no audio. Keys:', Object.keys(aiResp));
    throw new Error('melotts did not return audio');
  }

  const binStr = atob(aiResp.audio);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * D-23: Qwen-TTS via Alibaba DashScope (D-1: qwen3-tts-flash, voice Cherry,
 * Singapore/intl region). Production Chinese voice. Requires DASHSCOPE_API_KEY.
 *
 * DashScope returns an audio URL (short-lived) which we then download into an
 * ArrayBuffer for R2 caching. Throws on any failure so the caller falls back
 * to MeloTTS-zh. NOTE: endpoint/response shape per DashScope qwen-tts docs —
 * validate end-to-end once the key is configured.
 */
async function generateQwenTTS(env: Env, text: string): Promise<ArrayBuffer> {
  if (!env.DASHSCOPE_API_KEY) throw new Error('DASHSCOPE_API_KEY not configured');
  const model = env.QWEN_TTS_MODEL || 'qwen3-tts-flash';
  const voice = env.QWEN_TTS_VOICE || 'Cherry';

  const res = await fetch(
    'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: { text, voice } }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Qwen-TTS HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    output?: { audio?: { url?: string; data?: string } };
  };
  const audioUrl = data.output?.audio?.url;
  const audioData = data.output?.audio?.data;
  if (audioUrl) {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`Qwen-TTS audio download HTTP ${audioRes.status}`);
    return await audioRes.arrayBuffer();
  }
  if (audioData) {
    const bin = atob(audioData);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  throw new Error('Qwen-TTS returned no audio url/data');
}

// ─── D-23/UX: 2-second gaps between questions (Part 2 & 3 only) ─────────
// Part 2 (write) and Part 3 (tick) are discrete numbered questions; learners
// need a clear pause to tell them apart. TTS engines ignore SSML/text pauses,
// so we TTS each question segment separately and stitch them with real PCM
// silence into one WAV. Only applied to p2/p3; everything else stays single-shot.

// Gap AFTER a "Question N." marker is short (it belongs with its question);
// every other gap (after a question, after an answer) is the default.
const GAP_AFTER_MARKER_SEC = 1;
const GAP_DEFAULT_SEC = 2;

/** A relabeled question marker: "Question 3." / "第三题。". */
function isMarker(seg: string, lang: 'en' | 'zh'): boolean {
  const t = seg.trim();
  return lang === 'zh'
    ? /^第[一二三四五六七八九十]+题。$/.test(t)
    : /^Question \d+\.$/.test(t);
}

/**
 * Relabel question markers so they're unmistakable: "One." → "Question 1.",
 * "一。" → "第一题。". A lone ordinal segment is a MARKER (not a number answer
 * read-back) iff the NEXT segment is a question (ends with ? / ？). This stops
 * the "Two" (marker) vs "Two" (answer = 2) confusion.
 */
function relabelQuestionMarkers(segs: string[], lang: 'en' | 'zh'): string[] {
  const isQuestion = (s?: string) => !!s && /[?？]\s*$/.test(s.trim());
  if (lang === 'zh') {
    return segs.map((s, i) => {
      const m = s.trim().match(/^([一二三四五六七八九十]+)。$/);
      return m && isQuestion(segs[i + 1]) ? `第${m[1]}题。` : s;
    });
  }
  const ord: Record<string, number> = {
    One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8,
  };
  return segs.map((s, i) => {
    const m = s.trim().match(/^(One|Two|Three|Four|Five|Six|Seven|Eight)\.$/);
    return m && isQuestion(segs[i + 1]) ? `Question ${ord[m[1]]}.` : s;
  });
}

/** True for Part 2 / Part 3 audio keys (e.g. `level1/p2.mp3`, `zh/level5/p3.mp3`). */
function partWantsGaps(audioKey: string): boolean {
  return /\/p[23]\.[a-z0-9]+$/i.test(audioKey);
}

/**
 * Split a part script into individual sentences so we can pause after EACH
 * one — after the question AND after the answer. EN splits on . ? ! followed
 * by space; ZH splits after 。？！.
 */
/** Split into individual sentences (after . ? ! / 。？！). */
function splitSentences(script: string, lang: 'en' | 'zh'): string[] {
  const re = lang === 'zh' ? /(?<=[。？！])/ : /(?<=[.?!])\s+/;
  return script.split(re).map((s) => s.trim()).filter(Boolean);
}

/** Merge everything up to & including the "Now listen…/现在听…" transition into
 *  ONE intro segment (no gaps inside the intro). */
function mergeIntro(segs: string[], lang: 'en' | 'zh'): string[] {
  const transRe = lang === 'zh' ? /现在.{0,4}(听|写)/ : /Now\s+listen/i;
  const idx = segs.findIndex((s) => transRe.test(s));
  if (idx >= 0 && idx < segs.length - 1) {
    return [segs.slice(0, idx + 1).join(' '), ...segs.slice(idx + 1)];
  }
  return segs;
}

/**
 * A "read-back" is the redundant single-word answer echo Cambridge scripts add
 * ("Sam is nine years old. Nine." / "三号。三。"). Jason wants these dropped from
 * the audio. Markers are already relabeled to "Question N." (multi-token) so
 * they survive; spelling keeps its hyphens so it survives too.
 */
function isReadback(seg: string, lang: 'en' | 'zh'): boolean {
  const t = seg.trim();
  if (lang === 'zh') return /^[一二三四五六七八九十两]+。$/.test(t);
  return /^[A-Za-z]+\.$/.test(t); // a lone word + period
}

/**
 * Slow down spelled-out names: "B-U-D-D-Y" reads too fast. Turning hyphens
 * into commas makes the TTS pause briefly between letters → clearer spelling.
 */
function slowSpelling(text: string): string {
  return text.replace(/\b([A-Za-z](?:-[A-Za-z]){1,})\b/g, (m) => m.split('-').join(', '));
}

/** Parse a standard PCM WAV → sample rate + raw PCM data bytes. Null if not WAV. */
function parseWavPcm(buf: ArrayBuffer): { sampleRate: number; data: Uint8Array } | null {
  const view = new DataView(buf);
  if (buf.byteLength < 44) return null;
  // 'RIFF' .... 'WAVE'
  if (view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) {
    return null;
  }
  let offset = 12;
  let sampleRate = 0;
  while (offset + 8 <= buf.byteLength) {
    const id = view.getUint32(offset, false);
    const size = view.getUint32(offset + 4, true);
    if (id === 0x666d7420 /* 'fmt ' */) {
      sampleRate = view.getUint32(offset + 12, true);
    } else if (id === 0x64617461 /* 'data' */) {
      const start = offset + 8;
      const end = Math.min(start + size, buf.byteLength);
      return { sampleRate: sampleRate || 24000, data: new Uint8Array(buf.slice(start, end)) };
    }
    offset += 8 + size + (size % 2); // chunks are word-aligned
  }
  return null;
}

/** Wrap mono 16-bit PCM bytes in a WAV container. */
function pcmToWav(pcm: Uint8Array, sampleRate: number): ArrayBuffer {
  const out = new ArrayBuffer(44 + pcm.length);
  const v = new DataView(out);
  const w4 = (o: number, s: string) => { for (let i = 0; i < 4; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w4(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w4(8, 'WAVE');
  w4(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w4(36, 'data'); v.setUint32(40, pcm.length, true);
  new Uint8Array(out, 44).set(pcm);
  return out;
}

/** ElevenLabs as raw 24 kHz mono 16-bit PCM (for stitching). */
async function generateElevenLabsPcm(env: Env, text: string): Promise<ArrayBuffer> {
  if (!env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');
  const voiceId = env.ELEVENLABS_VOICE_ID || ELEVENLABS_DEFAULT_VOICE_ID;
  const modelId = env.ELEVENLABS_MODEL_ID || ELEVENLABS_DEFAULT_MODEL_ID;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_24000`,
    {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.65, similarity_boost: 0.85, style: 0, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) {
    const e = await res.text().catch(() => '');
    throw new Error(`ElevenLabs PCM HTTP ${res.status}: ${e.slice(0, 150)}`);
  }
  return await res.arrayBuffer();
}

/** Which provider the gap-stitched audio is cached under — must match the
 *  read path's first lookup so it isn't shadowed by an older entry. */
function gapProvider(env: Env, lang: 'en' | 'zh'): string {
  if (lang === 'zh') return 'qwen';
  return env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'aura2';
}

/** TTS one segment → mono-16-bit PCM (+ rate). Null if engine can't give WAV/PCM. */
async function ttsSegmentPcm(
  env: Env,
  rawText: string,
  lang: 'en' | 'zh',
): Promise<{ sampleRate: number; data: Uint8Array } | null> {
  const text = slowSpelling(rawText); // space out spelled letters so they're clear
  try {
    if (lang === 'zh') {
      if (!env.DASHSCOPE_API_KEY) return null; // melotts format unknown → skip gaps
      return parseWavPcm(await generateQwenTTS(env, text));
    }
    // English: prefer ElevenLabs PCM (matches read preference + same voice as
    // Part 1/4). Fall back to Aura-2 linear16. Both 24 kHz mono 16-bit.
    if (env.ELEVENLABS_API_KEY) {
      try {
        const pcm = new Uint8Array(await generateElevenLabsPcm(env, text));
        if (pcm.byteLength) return { sampleRate: 24000, data: pcm };
      } catch (err) {
        console.warn('[exam-audio] ElevenLabs PCM failed, trying Aura-2:', err);
      }
    }
    const speaker = env.AURA2_VOICE || AURA2_DEFAULT_VOICE;
    const stream = (await env.AI.run('@cf/deepgram/aura-2-en', {
      text, speaker, encoding: 'linear16',
    })) as unknown as ReadableStream;
    const pcm = new Uint8Array(await new Response(stream).arrayBuffer());
    return pcm.byteLength ? { sampleRate: 24000, data: pcm } : null;
  } catch (err) {
    console.warn('[exam-audio] segment TTS failed:', err);
    return null;
  }
}

/**
 * Generate part audio with 2s gaps between questions. Returns null on any
 * issue so the caller falls back to a normal single-shot generation (no gaps,
 * never broken audio).
 */
async function generateWithGaps(
  env: Env,
  script: string,
  lang: 'en' | 'zh',
): Promise<{ bytes: ArrayBuffer; provider: string } | null> {
  // Pipeline: split → relabel markers (One.→Question 1.) → drop read-backs →
  // merge intro. Relabel runs on the full list so the "next is a question"
  // check is valid; read-backs are dropped before the intro merge so the
  // example section is cleaned too.
  const sentences = splitSentences(script, lang);
  if (sentences.length < 2) return null;
  const labeled = relabelQuestionMarkers(sentences, lang);
  const cleaned = labeled.filter((s) => !isReadback(s, lang));
  const segments = mergeIntro(cleaned, lang);
  if (segments.length < 2) return null;

  const pcms: { sampleRate: number; data: Uint8Array }[] = [];
  for (const seg of segments) {
    const pcm = await ttsSegmentPcm(env, seg, lang);
    if (!pcm) return null; // any failure → abort, single-shot fallback
    pcms.push(pcm);
  }
  const sampleRate = pcms[0].sampleRate;
  if (pcms.some((p) => p.sampleRate !== sampleRate)) return null;

  // Gap before segment i (i>0) depends on the PRECEDING segment: short after a
  // "Question N." marker so it stays glued to its question, default elsewhere.
  const gapBytesBefore = (i: number) => {
    const sec = isMarker(segments[i - 1], lang) ? GAP_AFTER_MARKER_SEC : GAP_DEFAULT_SEC;
    return sampleRate * sec * 2; // mono 16-bit
  };
  let total = pcms.reduce((n, p) => n + p.data.length, 0);
  for (let i = 1; i < pcms.length; i++) total += gapBytesBefore(i);
  const combined = new Uint8Array(total);
  let pos = 0;
  pcms.forEach((p, i) => {
    if (i > 0) { pos += gapBytesBefore(i); } // leave zeroed silence
    combined.set(p.data, pos); pos += p.data.length;
  });
  return { bytes: pcmToWav(combined, sampleRate), provider: gapProvider(env, lang) };
}

// ─── Scene image: read-only user path ──────────────────────────────────

/**
 * User-facing endpoint: read scene from R2 cache. NEVER generates.
 *
 * Architectural decision (Sprint 4.7.2): scene generation moved to admin-only
 * endpoints to enforce that Workers AI Flux Neurons are spent ONCE per scene,
 * by an authorized admin, not by every user who happens to be the first to
 * play a level. With 1k+ users, the difference between "first user triggers
 * generation" and "admin pre-warms" is the difference between abuse-prone
 * and abuse-resistant.
 *
 * If admin hasn't pre-warmed scenes yet, user gets 404 → frontend shows
 * "scene not yet ready" fallback. Admin warms via:
 *   POST /admin/exam/scenes/warm-all  (Bearer ADMIN_TOKEN)
 */
async function getSceneFromCache(env: Env, sceneId: string, req?: Request): Promise<Response> {
  if (!isValidSceneId(sceneId)) {
    return new Response(
      JSON.stringify({ error: `Unknown sceneId: ${sceneId}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
  const cached = await env.IMAGES.get(r2Key);

  if (!cached) {
    // Not pre-warmed — admin needs to generate before users can see it
    console.log('[exam-scene] cache miss (admin warming required):', r2Key);
    return new Response(
      JSON.stringify({
        error: 'Scene not yet generated',
        hint: 'Admin must run POST /admin/exam/scenes/warm-all',
        sceneId,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Cache strategy: the R2 object can be OVERWRITTEN by admin upload, so we
  // must NOT use `immutable` (that made the browser keep the old default for
  // up to a year — the "image reverts on reopen" bug). Instead use the R2
  // object's ETag + must-revalidate so the browser revalidates every load:
  //   - unchanged → worker returns 304 (tiny), browser reuses cached bytes
  //   - changed (admin uploaded) → worker returns 200 with the new image
  const etag = cached.httpEtag;
  const ifNoneMatch = req?.headers.get('If-None-Match');
  const cacheControl = 'public, max-age=0, must-revalidate';
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, 'Cache-Control': cacheControl, 'X-Scene-Source': 'r2-304' },
    });
  }

  console.log('[exam-scene] cache hit:', r2Key);
  return new Response(cached.body, {
    status: 200,
    headers: {
      'Content-Type': cached.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': cacheControl,
      ...(etag ? { ETag: etag } : {}),
      'X-Scene-Source': 'r2-cache',
    },
  });
}

// ─── Scene image: admin generation path ────────────────────────────────

/**
 * Admin endpoint dispatcher for scene management.
 *
 * Routes:
 *   POST /admin/exam/scenes/warm-all    → batch generate all 12 scenes
 *   POST /admin/exam/scenes/:id/generate → regenerate single scene
 *   GET  /admin/exam/scenes/status      → list status of all scenes
 *
 * All require Bearer ADMIN_TOKEN. Returns null if path doesn't match so
 * caller can try other handlers.
 */
export async function handleAdminExamRequest(
  req: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(req.url);

  // POST /admin/exam/scenes/warm-all
  if (url.pathname === '/admin/exam/scenes/warm-all' && req.method === 'POST') {
    return adminWarmAllScenes(env);
  }

  // POST /admin/exam/scenes/:id/generate
  const genMatch = url.pathname.match(/^\/admin\/exam\/scenes\/([^/]+)\/generate$/);
  if (genMatch && req.method === 'POST') {
    return adminGenerateScene(env, decodeURIComponent(genMatch[1]));
  }

  // GET /admin/exam/scenes/status
  if (url.pathname === '/admin/exam/scenes/status' && req.method === 'GET') {
    return adminScenesStatus(env);
  }

  // ─── D-18: Admin manual scene image workflow ───────────────────────
  // GET  /admin/exam/scenes/:id/prompt  → canonical image-gen prompt to
  //   copy into an external AI tool (DALL·E / Midjourney / Imagen).
  // POST /admin/exam/scenes/:id/upload  → upload the generated image (raw
  //   bytes) → overwrites the R2-cached scene so it matches the audio.
  const promptMatch = url.pathname.match(/^\/admin\/exam\/scenes\/([^/]+)\/prompt$/);
  if (promptMatch && req.method === 'GET') {
    return adminGetScenePrompt(decodeURIComponent(promptMatch[1]));
  }
  const uploadMatch = url.pathname.match(/^\/admin\/exam\/scenes\/([^/]+)\/upload$/);
  if (uploadMatch && req.method === 'POST') {
    return adminUploadScene(env, decodeURIComponent(uploadMatch[1]), req);
  }

  // D-18: POST /admin/exam/audio/generate — admin-only TTS generation.
  // Body { audioKey, audioScript }. Generates (if not cached) + stores in R2
  // so normal users can then read it via GET-only /exam/audio. This is the
  // only path that spends TTS budget.
  if (url.pathname === '/admin/exam/audio/generate' && req.method === 'POST') {
    if (!env.IMAGES) {
      return new Response(JSON.stringify({ error: 'R2 not configured' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }
    return getOrGenerateAudio(req, env);
  }

  // D-18: POST /admin/exam/audio/status — does this (audioKey, audioScript)
  // already have cached audio in R2? Lets the admin UI show "✓ có audio" vs
  // "⚠️ chưa có audio". Uses HEAD (no body download).
  if (url.pathname === '/admin/exam/audio/status' && req.method === 'POST') {
    return adminAudioStatus(req, env);
  }

  // ─── Sprint 4.9: Calibration override endpoints ────────────────────
  // POST   /admin/exam/calibration/:levelId/:partId  → save zones
  // DELETE /admin/exam/calibration/:levelId/:partId  → reset to default
  const calMatch = url.pathname.match(/^\/admin\/exam\/calibration\/([^/]+)\/([^/]+)$/);
  if (calMatch) {
    const [, levelId, partId] = calMatch;
    if (req.method === 'POST') {
      return adminSaveCalibration(env, decodeURIComponent(levelId), decodeURIComponent(partId), req);
    }
    if (req.method === 'DELETE') {
      return adminDeleteCalibration(env, decodeURIComponent(levelId), decodeURIComponent(partId));
    }
  }

  // ─── Sprint 4.9.4: Audio script override endpoints ─────────────────
  // POST   /admin/exam/audio-script/:levelId/:partId  → save script
  // DELETE /admin/exam/audio-script/:levelId/:partId  → reset to default
  const scriptMatch = url.pathname.match(/^\/admin\/exam\/audio-script\/([^/]+)\/([^/]+)$/);
  if (scriptMatch) {
    const [, levelId, partId] = scriptMatch;
    if (req.method === 'POST') {
      return adminSaveAudioScript(env, decodeURIComponent(levelId), decodeURIComponent(partId), req);
    }
    if (req.method === 'DELETE') {
      return adminDeleteAudioScript(env, decodeURIComponent(levelId), decodeURIComponent(partId));
    }
  }

  // ─── D-16 Phase 2: Semantic check endpoint ─────────────────────────
  // POST /admin/exam/semantic-check/:levelId/:partId
  //   → run Gemini-powered image vs script validation, persist to D1
  const semMatch = url.pathname.match(/^\/admin\/exam\/semantic-check\/([^/]+)\/([^/]+)$/);
  if (semMatch && req.method === 'POST') {
    const [, levelId, partId] = semMatch;
    return adminRunSemanticCheck(env, decodeURIComponent(levelId), decodeURIComponent(partId), req);
  }

  // ─── Sprint 4.9.5: Vision auto-caption endpoint ────────────────────
  // POST /admin/exam/scenes/:sceneId/recaption — vision-describe scene,
  // build Cambridge-style script, save to D1 exam_audio_scripts.
  const recaptionMatch = url.pathname.match(/^\/admin\/exam\/scenes\/([^/]+)\/recaption$/);
  if (recaptionMatch && req.method === 'POST') {
    return adminRecaptionScene(env, decodeURIComponent(recaptionMatch[1]), req);
  }

  return null;
}

/** Bulk-generate every scene in the registry. Idempotent — skips already-cached. */
async function adminWarmAllScenes(env: Env): Promise<Response> {
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const start = Date.now();

  // Sequential generation to avoid overwhelming Workers AI quota in parallel.
  // 12 scenes × ~10s each = ~2 min total — well under worker CPU time limit
  // for a single request? Actually no — Workers have 30s CPU time on free
  // tier. We use ctx.waitUntil approach instead — return early, generate
  // in background. But waitUntil isn't accessible here without ctx wiring.
  //
  // For Sprint 4.7.2 ship: do generation synchronously and split into
  // multiple admin calls if needed. /warm-all does up to 6 scenes per call,
  // admin runs it twice for full warm. Better: have client iterate calling
  // /admin/exam/scenes/:id/generate per scene, reading status between calls.
  // Iterate over the SceneId-typed keys explicitly. Object.keys returns
  // string[] which TS can't narrow to SceneId without help — so we cast
  // through Object.entries which preserves the value type.
  for (const [sceneId, spec] of Object.entries(SCENE_PROMPTS)) {
    const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
    const existing = await env.IMAGES.get(r2Key);
    if (existing) {
      results[sceneId] = 'already-cached';
      continue;
    }
    try {
      const bytes = await generateSceneViaFlux(env, spec.prompt);
      await env.IMAGES.put(r2Key, bytes, {
        httpMetadata: { contentType: 'image/jpeg' },
      });
      results[sceneId] = `generated (${bytes.byteLength} bytes)`;
      console.log(`[admin-warm] generated: ${sceneId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors[sceneId] = msg;
      console.error(`[admin-warm] failed: ${sceneId}:`, msg);
    }
  }

  const totalMs = Date.now() - start;
  return new Response(
    JSON.stringify(
      { totalMs, results, errors, cacheVersion },
      null,
      2,
    ),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

/** Regenerate a single scene. Overwrites existing cache (force regeneration). */
async function adminGenerateScene(env: Env, sceneId: string): Promise<Response> {
  if (!isValidSceneId(sceneId)) {
    return new Response(
      JSON.stringify({ error: `Unknown sceneId: ${sceneId}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
  const start = Date.now();

  try {
    const bytes = await generateSceneViaFlux(env, SCENE_PROMPTS[sceneId].prompt);
    await env.IMAGES.put(r2Key, bytes, {
      httpMetadata: { contentType: 'image/jpeg' },
    });
    const ms = Date.now() - start;
    console.log(`[admin-generate] ${sceneId} done in ${ms}ms`);
    return new Response(
      JSON.stringify({
        sceneId,
        bytes: bytes.byteLength,
        latencyMs: ms,
        r2Key,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Generation failed',
        sceneId,
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/**
 * D-18: Return the canonical image-generation prompt for a scene so an admin
 * can paste it into an external AI image tool. This is the SAME prompt Flux
 * uses, which is derived from the audio script source — so an image generated
 * from it will match what the audio describes.
 */
function adminGetScenePrompt(sceneId: string): Response {
  if (!isValidSceneId(sceneId)) {
    return new Response(
      JSON.stringify({ error: `Unknown sceneId: ${sceneId}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const spec = SCENE_PROMPTS[sceneId];
  return new Response(
    JSON.stringify({ sceneId, prompt: spec.prompt, aspect: spec.aspect ?? 'landscape' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * D-18: Admin uploads a manually-generated image for a scene. Raw image bytes
 * in the request body (Content-Type image/*). Overwrites the R2-cached scene
 * at the same key getSceneFromCache reads, so every user immediately sees the
 * admin-provided image instead of the Flux output.
 */
async function adminUploadScene(env: Env, sceneId: string, req: Request): Promise<Response> {
  if (!isValidSceneId(sceneId)) {
    return new Response(
      JSON.stringify({ error: `Unknown sceneId: ${sceneId}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const bytes = await req.arrayBuffer();
  if (!bytes || bytes.byteLength === 0) {
    return new Response(
      JSON.stringify({ error: 'Empty image body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  // Sanity cap — exam scenes are small JPEGs; reject anything huge.
  if (bytes.byteLength > 8_000_000) {
    return new Response(
      JSON.stringify({ error: 'Image too large (max 8MB)', bytes: bytes.byteLength }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const contentType = req.headers.get('Content-Type') || 'image/jpeg';
  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
  await env.IMAGES.put(r2Key, bytes, { httpMetadata: { contentType } });
  console.log(`[admin-upload] ${sceneId} → ${r2Key} (${bytes.byteLength} bytes, ${contentType})`);

  return new Response(
    JSON.stringify({ ok: true, sceneId, bytes: bytes.byteLength, r2Key, contentType }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

/** List all scenes + their R2 cache status (cached or missing). */
async function adminScenesStatus(env: Env): Promise<Response> {
  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const status: Record<string, {
    cached: boolean;
    bytes?: number;
    uploadedAt?: string;
  }> = {};

  for (const sceneId of Object.keys(SCENE_PROMPTS)) {
    const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
    // R2 head() returns metadata without downloading body — fast for status check
    const obj = await env.IMAGES.head(r2Key);
    status[sceneId] = obj
      ? {
          cached: true,
          bytes: obj.size,
          uploadedAt: obj.uploaded.toISOString(),
        }
      : { cached: false };
  }

  return new Response(
    JSON.stringify({ cacheVersion, scenes: status }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * Call Flux-1-Schnell via Workers AI binding. Returns JPEG bytes.
 *
 * The Cloudflare wrapper for flux-1-schnell returns base64-encoded JPEG in
 * `{ image: string }` format. We decode to raw bytes for direct streaming
 * + R2 storage.
 *
 * Schnell uses 4 inference steps by default — fast (~5s) at the cost of
 * some quality vs Flux-Dev's 28 steps. For kid-level cartoon scenes this
 * tradeoff is worth it: free tier + acceptable quality.
 */
async function generateSceneViaFlux(env: Env, prompt: string): Promise<ArrayBuffer> {
  // Sprint 4.7.4: 16:9 wide format requested by Jason. Workers AI Flux
  // accepts width/height as multiples of 64 within range 256-2048.
  // 1280×720 is the canonical 16:9 size that fits within Schnell's
  // training distribution and produces clean compositions.
  //
  // Larger Neuron cost vs 1024×1024:
  //   - 1024×1024 = 4 tiles of 512² = 4 × 4.80 = 19.2 + 4 × 9.60 = 57.6 N
  //   - 1280×720  = 3 tiles of 512² = 3 × 4.80 = 14.4 + 4 × 9.60 = 53.6 N
  // Slightly cheaper actually (fewer tiles).
  const result = (await env.AI.run(IMAGE_MODEL, {
    prompt,
    width: 1280,
    height: 720,
    seed: Math.floor(Math.random() * 1_000_000),
  })) as { image?: string;[key: string]: unknown };

  if (!result.image || typeof result.image !== 'string') {
    console.error('[exam-scene] Flux returned no image. Keys:', Object.keys(result));
    throw new Error('Flux did not return image');
  }

  // Decode base64 → bytes. atob is available in Workers runtime.
  const binStr = atob(result.image);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
}

// ───────────────────────────────────────────────────────────────────
// Sprint 4.9: Drop zone calibration handlers
// ───────────────────────────────────────────────────────────────────

interface ZoneOverride {
  zone_id: string;
  x: number;       // 0-1 fraction of scene width
  y: number;       // 0-1 fraction of scene height
  width: number;   // 0-1 fraction
  height: number;  // 0-1 fraction
}

/**
 * Public read: GET /exam/calibration/:levelId/:partId
 * Returns array of overrides, or empty array if none. No auth required —
 * all clients need this to render correctly.
 */
export async function getCalibrationPublic(
  env: Env,
  levelId: string,
  partId: string,
): Promise<Response> {
  if (!env.DB) {
    // No D1 configured → return empty (no overrides). Client falls back
    // to hardcoded zones in levels.ts.
    return jsonResponse({ zones: [] });
  }
  try {
    const result = await env.DB.prepare(
      `SELECT zone_id, x, y, width, height
         FROM drop_zone_overrides
        WHERE level_id = ? AND part_id = ?`
    ).bind(levelId, partId).all<ZoneOverride>();
    return jsonResponse({ zones: result.results || [] });
  } catch (err) {
    console.error('[calibration] read error:', err);
    return jsonResponse({ zones: [] }); // Fail soft — never block exam
  }
}

/**
 * Admin: POST /admin/exam/calibration/:levelId/:partId
 * Body: { zones: [{ zone_id, x, y, width, height }, ...] }
 * Upserts each zone via INSERT OR REPLACE.
 */
async function adminSaveCalibration(
  env: Env,
  levelId: string,
  partId: string,
  req: Request,
): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'D1 not configured' }, 503);
  }
  let body: { zones?: ZoneOverride[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  const zones = body.zones;
  if (!Array.isArray(zones) || zones.length === 0) {
    return jsonResponse({ error: 'zones array required' }, 400);
  }
  // Validate each zone
  for (const z of zones) {
    if (
      typeof z.zone_id !== 'string' ||
      typeof z.x !== 'number' ||
      typeof z.y !== 'number' ||
      typeof z.width !== 'number' ||
      typeof z.height !== 'number'
    ) {
      return jsonResponse({ error: 'Invalid zone: ' + JSON.stringify(z) }, 400);
    }
    if (z.x < 0 || z.x > 1 || z.y < 0 || z.y > 1 ||
        z.width <= 0 || z.width > 1 || z.height <= 0 || z.height > 1) {
      return jsonResponse({ error: `Zone ${z.zone_id}: coords must be 0-1 fractions` }, 400);
    }
  }
  const now = Date.now();
  const updatedBy = req.headers.get('X-Admin-Email') || 'admin';

  // Batch upsert via D1 batch API
  const stmts = zones.map((z) =>
    env.DB!.prepare(
      `INSERT OR REPLACE INTO drop_zone_overrides
         (level_id, part_id, zone_id, x, y, width, height, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(levelId, partId, z.zone_id, z.x, z.y, z.width, z.height, now, updatedBy)
  );
  try {
    await env.DB.batch(stmts);
    console.log(`[calibration] saved ${zones.length} zones for ${levelId}/${partId}`);
    return jsonResponse({ ok: true, saved: zones.length });
  } catch (err) {
    console.error('[calibration] save error:', err);
    return jsonResponse({ error: 'Save failed: ' + String(err) }, 500);
  }
}

/**
 * Admin: DELETE /admin/exam/calibration/:levelId/:partId
 * Removes all overrides for this level/part — client falls back to
 * hardcoded defaults from levels.ts.
 */
async function adminDeleteCalibration(
  env: Env,
  levelId: string,
  partId: string,
): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'D1 not configured' }, 503);
  }
  try {
    const result = await env.DB.prepare(
      `DELETE FROM drop_zone_overrides WHERE level_id = ? AND part_id = ?`
    ).bind(levelId, partId).run();
    return jsonResponse({ ok: true, deleted: result.meta.changes });
  } catch (err) {
    console.error('[calibration] delete error:', err);
    return jsonResponse({ error: 'Delete failed' }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Short SHA-256 hash for cache keys. 8 hex chars = 32 bits = ~4B collision
 * space, fine for cache invalidation purposes. Uses Web Crypto API
 * available in Workers runtime.
 */
async function sha256Short(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hashBuf);
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ───────────────────────────────────────────────────────────────────
// Sprint 4.9.4: Audio script override handlers
// ───────────────────────────────────────────────────────────────────

/**
 * Public read: GET /exam/audio-script/:levelId/:partId
 * Returns { script: string } if override exists, { script: null } otherwise.
 * Frontend uses override when present, falls back to hardcoded levels.ts.
 */
export async function getAudioScriptPublic(
  env: Env,
  levelId: string,
  partId: string,
): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ script: null });
  }
  try {
    const row = await env.DB.prepare(
      `SELECT script FROM exam_audio_scripts WHERE level_id = ? AND part_id = ?`
    ).bind(levelId, partId).first<{ script: string }>();
    return jsonResponse({ script: row?.script ?? null });
  } catch (err) {
    console.error('[audio-script] read error:', err);
    return jsonResponse({ script: null }); // Fail soft
  }
}

/**
 * Admin: POST /admin/exam/audio-script/:levelId/:partId
 * Body: { script: string }
 * Upserts script for this level/part.
 */
async function adminSaveAudioScript(
  env: Env,
  levelId: string,
  partId: string,
  req: Request,
): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'D1 not configured' }, 503);
  }
  let body: { script?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  const script = body.script?.trim();
  if (!script || typeof script !== 'string') {
    return jsonResponse({ error: 'script field required (non-empty string)' }, 400);
  }
  if (script.length > 5000) {
    return jsonResponse({ error: 'script too long (max 5000 chars)' }, 400);
  }
  const now = Date.now();
  const updatedBy = req.headers.get('X-Admin-Email') || 'admin';
  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO exam_audio_scripts
         (level_id, part_id, script, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(levelId, partId, script, now, updatedBy).run();
    console.log(`[audio-script] saved ${script.length} chars for ${levelId}/${partId}`);
    return jsonResponse({ ok: true, length: script.length });
  } catch (err) {
    console.error('[audio-script] save error:', err);
    return jsonResponse({ error: 'Save failed: ' + String(err) }, 500);
  }
}

/**
 * Admin: DELETE /admin/exam/audio-script/:levelId/:partId
 * Removes override → frontend falls back to hardcoded script.
 */
async function adminDeleteAudioScript(
  env: Env,
  levelId: string,
  partId: string,
): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'D1 not configured' }, 503);
  }
  try {
    const result = await env.DB.prepare(
      `DELETE FROM exam_audio_scripts WHERE level_id = ? AND part_id = ?`
    ).bind(levelId, partId).run();
    return jsonResponse({ ok: true, deleted: result.meta.changes });
  } catch (err) {
    console.error('[audio-script] delete error:', err);
    return jsonResponse({ error: 'Delete failed' }, 500);
  }
}

// ───────────────────────────────────────────────────────────────────
// Sprint 4.9.5: Vision-based audio script auto-generation
// ───────────────────────────────────────────────────────────────────

/**
 * Describe a 6-character grid scene by feeding the rendered image to a
 * vision model. Returns one description string per zone position.
 *
 * Prompt design considerations:
 * - We force JSON output with exact keys to avoid free-form parsing
 * - We constrain to "clothing + activity" format matching Cambridge YLE
 *   audio style (see sceneCharacters.ts buildDragNameAudioScript)
 * - We tell the model the grid layout explicitly so it pairs descriptions
 *   to the right zones
 * - Temperature kept default (~0.7) for some natural variation; we'd lower
 *   if responses become too rigid
 */
/**
 * Workers AI vision models (fallback chain). Llama 3.2 Vision is best
 * Cloudflare-native quality but requires one-time license acceptance.
 * Llava doesn't need licensing.
 *
 * Sprint 4.9.5.7: Gemini Vision API is now PRIMARY (much better accuracy
 * for cartoon images). Cloudflare models are fallback if Gemini fails.
 */
const VISION_MODELS = [
  '@cf/meta/llama-3.2-11b-vision-instruct',
  '@cf/llava-hf/llava-1.5-7b-hf',
] as const;

/**
 * Sprint 4.9.5.7: Caption an image using Google Gemini Vision API.
 *
 * Why Gemini over Cloudflare Workers AI vision:
 * - Better accuracy on cartoon/illustration images (tested with v1.7.6)
 * - Free tier generous (1000 req/day, 30 RPM) — covers 60 levels easily
 * - Better prompt instruction-following for structured JSON output
 *
 * Required env: GEMINI_API_KEY (set via `wrangler secret put GEMINI_API_KEY`)
 * Get key from: https://aistudio.google.com/apikey
 *
 * Returns null if GEMINI_API_KEY not configured (caller falls back to
 * Cloudflare vision).
 */
async function captionGridSceneGemini(
  apiKey: string,
  imageBytes: Uint8Array,
): Promise<{ zones?: Record<string, string>; error?: string }> {
  // Convert image bytes → base64 (Gemini expects inline_data with base64)
  // Use chunked conversion to avoid stack overflow on large images
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < imageBytes.length; i += chunkSize) {
    const chunk = imageBytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);

  const prompt =
    'You are analyzing a cartoon image of children playing. Look CAREFULLY at the image ' +
    'and identify each child you can see. For EACH child, describe:\n' +
    '1. The dominant color of their clothing (red/blue/green/yellow/pink/purple/orange/etc.)\n' +
    '2. The clothing item (shirt/dress/hat/sweater/t-shirt/etc.)\n' +
    '3. The activity they are doing (use -ing verb form)\n\n' +
    'Format each description as: "wearing a [color] [clothing] and [activity]"\n' +
    'Examples:\n' +
    '- "wearing a red shirt and flying a kite"\n' +
    '- "wearing a blue dress and reading a book"\n' +
    '- "wearing a yellow t-shirt and riding a bicycle"\n\n' +
    'Be ACCURATE — describe what you ACTUALLY see, not what you think should be there. ' +
    'If a child has orange/red hair, that is NOT a hat. ' +
    'If you see a kite floating alone (no child holding it), do NOT assign "flying kite" ' +
    'to a child who is not holding it.\n\n' +
    'Map each child to one of these positions in the image (left to right, top to bottom): ' +
    'tl (top-left), tm (top-middle), tr (top-right), ' +
    'bl (bottom-left), bm (bottom-middle), br (bottom-right). ' +
    'If the image has fewer than 6 children clustered together, assign them ' +
    'left-to-right to tl, tm, tr first, then bl, bm, br. ' +
    'If a position has no child, write "no child visible".\n\n' +
    'Output ONLY this JSON, nothing else:\n' +
    '{"tl":"...","tm":"...","tr":"...","bl":"...","bm":"...","br":"..."}';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let resp: Response;
  try {
    console.log(`[gemini] calling Gemini 2.5 Flash, image=${imageBytes.byteLength} bytes`);
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
          temperature: 0.2,  // Low temp for accurate description
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    return { error: `Gemini fetch threw: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { error: `Gemini HTTP ${resp.status}: ${body.slice(0, 300)}` };
  }

  let data: unknown;
  try {
    data = await resp.json();
  } catch (err) {
    return { error: `Gemini JSON parse: ${err}` };
  }

  console.log('[gemini] response keys:', Object.keys(data as object));

  // Extract text from Gemini response shape:
  //   { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  const d = data as Record<string, unknown>;
  const candidates = d.candidates as Array<Record<string, unknown>> | undefined;
  if (!candidates || candidates.length === 0) {
    return { error: `Gemini no candidates: ${JSON.stringify(d).slice(0, 300)}` };
  }
  const content = candidates[0].content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  if (!parts || parts.length === 0) {
    return { error: 'Gemini empty parts' };
  }
  const text = parts[0].text as string | undefined;
  if (!text) {
    return { error: `Gemini no text: ${JSON.stringify(parts[0]).slice(0, 200)}` };
  }

  console.log('[gemini] text output:', text.slice(0, 500));

  // Gemini with responseMimeType: application/json should return clean JSON
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: extract JSON if wrapped in markdown/prose
    const m = text.match(/\{[\s\S]*"tl"[\s\S]*\}/);
    if (!m) return { error: `Gemini no JSON in: ${text.slice(0, 300)}` };
    try {
      parsed = JSON.parse(m[0]);
    } catch (err) {
      return { error: `Gemini JSON parse failed: ${err}` };
    }
  }

  // Validate
  const required = ['tl', 'tm', 'tr', 'bl', 'bm', 'br'];
  const missing = required.filter((z) => typeof parsed[z] !== 'string' || !parsed[z].trim());
  if (missing.length > 0) {
    return { error: `Gemini missing zones: ${missing.join(',')}. Got: ${JSON.stringify(parsed)}` };
  }

  return { zones: parsed };
}

/**
 * Auto-accept Llama Community License by sending the magic prompt.
 * Cloudflare requires this once per account before the model can be used.
 * Returns true if accepted (or already accepted), false if failed.
 */
async function acceptLlamaLicense(env: Env): Promise<boolean> {
  if (!env.AI) return false;
  try {
    console.log('[vision] auto-accepting Llama license...');
    await (env.AI as Ai).run(VISION_MODELS[0] as never, { prompt: 'agree' } as never);
    console.log('[vision] license accepted');
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // If the response itself errors but it's because we already accepted
    // (different error from 5016), treat as success.
    if (!msg.includes('5016')) {
      console.log('[vision] license accept got non-5016 response (likely already accepted):', msg.slice(0, 100));
      return true;
    }
    console.error('[vision] license auto-accept failed:', msg);
    return false;
  }
}

async function captionGridScene(
  env: Env,
  imageBytes: Uint8Array,
): Promise<{ zones?: Record<string, string>; error?: string; model?: string }> {
  if (!env.AI) {
    return { error: 'AI binding not available' };
  }

  // Sprint 4.9.5.7: Try Gemini Vision first (best accuracy on cartoon images,
  // free tier covers 60+ levels easily). Fall back to Cloudflare models if
  // Gemini key not configured or call fails.
  const geminiKey = (env as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY;
  if (geminiKey) {
    console.log('[vision] trying Gemini 2.5 Flash...');
    const geminiResult = await captionGridSceneGemini(geminiKey, imageBytes);
    if (geminiResult.zones) {
      return { zones: geminiResult.zones, model: 'gemini-2.5-flash' };
    }
    console.error('[vision] Gemini failed:', geminiResult.error);
    console.log('[vision] falling back to Cloudflare models...');
  } else {
    console.log('[vision] GEMINI_API_KEY not set, using Cloudflare models');
  }

  const imageArr = Array.from(imageBytes);

  const prompt =
    'You are analyzing a cartoon image showing a 3-by-2 grid of children. ' +
    'The image is divided into 6 cells:\n' +
    '- Top row: top-left (tl), top-middle (tm), top-right (tr)\n' +
    '- Bottom row: bottom-left (bl), bottom-middle (bm), bottom-right (br)\n\n' +
    'Look CAREFULLY at each cell. For EACH child, identify:\n' +
    '1. The dominant color of their clothing (e.g., red, blue, green, yellow, pink, purple, orange)\n' +
    '2. The clothing item (shirt, dress, hat, sweater, t-shirt, etc.)\n' +
    '3. The activity they are doing (use -ing verb form)\n\n' +
    'Format each description as: "wearing a [color] [clothing] and [activity]"\n' +
    'Examples:\n' +
    '- "wearing a red shirt and flying a kite"\n' +
    '- "wearing a blue dress and reading a book"\n' +
    '- "wearing a green hat and kicking a soccer ball"\n\n' +
    'Be ACCURATE about colors — if the shirt is yellow, write "yellow", not "red". ' +
    'Be ACCURATE about activities — describe what you actually see them doing. ' +
    'If a cell is unclear, give your best guess but stay close to what you see. ' +
    'Output ONLY this JSON, nothing else:\n' +
    '{"tl":"...","tm":"...","tr":"...","bl":"...","bm":"...","br":"..."}';

  let lastError = '';

  // Try each model in order
  for (let attempt = 0; attempt < VISION_MODELS.length; attempt++) {
    const model = VISION_MODELS[attempt];
    let response: unknown;

    try {
      console.log(`[vision] attempt ${attempt + 1} with ${model}, image=${imageBytes.byteLength} bytes`);
      response = await (env.AI as Ai).run(model as never, {
        image: imageArr,
        prompt,
        max_tokens: 512,
      } as never);
      console.log('[vision] raw response keys:', Object.keys(response as object));
      console.log('[vision] raw response:', JSON.stringify(response).slice(0, 500));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `${model}: ${msg}`;
      console.error(`[vision] ${model} threw:`, msg);

      // If error 5016, try auto-accepting license then retry SAME model once
      if (msg.includes('5016') && attempt === 0) {
        const accepted = await acceptLlamaLicense(env);
        if (accepted) {
          try {
            console.log(`[vision] retrying ${model} after license acceptance`);
            response = await (env.AI as Ai).run(model as never, {
              image: imageArr,
              prompt,
              max_tokens: 512,
            } as never);
            console.log('[vision] retry response:', JSON.stringify(response).slice(0, 500));
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            console.error('[vision] retry also failed:', retryMsg);
            lastError = `${model} retry: ${retryMsg}`;
            continue; // Move to next model
          }
        } else {
          continue; // License fail, try next model
        }
      } else {
        continue; // Non-5016 error, try next model
      }
    }

    // Parse response (same logic as before)
    let text = '';
    const r = response as Record<string, unknown>;
    if (typeof r.description === 'string') text = r.description;
    else if (typeof r.response === 'string') text = r.response;
    else if (r.result && typeof (r.result as Record<string, unknown>).description === 'string') {
      text = (r.result as Record<string, string>).description;
    } else {
      lastError = `${model}: Unexpected response shape: ${JSON.stringify(response).slice(0, 200)}`;
      console.error('[vision]', lastError);
      continue;
    }

    if (!text.trim()) {
      lastError = `${model}: Empty text in response`;
      continue;
    }

    console.log('[vision] text output:', text.slice(0, 500));

    // Extract JSON
    let jsonStr: string | null = null;
    const m1 = text.match(/\{[^{}]*"tl"[^{}]*"tm"[^{}]*"tr"[^{}]*"bl"[^{}]*"bm"[^{}]*"br"[^{}]*\}/s);
    if (m1) jsonStr = m1[0];
    if (!jsonStr) {
      const m2 = text.match(/\{[^{}]*"tl"[^{}]*\}/s);
      if (m2) jsonStr = m2[0];
    }
    if (!jsonStr) {
      const m3 = text.match(/\{[\s\S]*?"tl"[\s\S]*?"br"[\s\S]*?\}/);
      if (m3) jsonStr = m3[0];
    }

    if (!jsonStr) {
      lastError = `${model}: No JSON found in output: ${text.slice(0, 300)}`;
      console.error('[vision]', lastError);
      continue;
    }

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const repaired = jsonStr
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1');
      try {
        parsed = JSON.parse(repaired);
      } catch (err) {
        lastError = `${model}: JSON parse failed: ${String(err)}`;
        continue;
      }
    }

    const required = ['tl', 'tm', 'tr', 'bl', 'bm', 'br'];
    const missing = required.filter((z) => typeof parsed[z] !== 'string' || !parsed[z].trim());
    if (missing.length > 0) {
      lastError = `${model}: Missing zones: ${missing.join(',')}`;
      continue;
    }

    return { zones: parsed, model };
  }

  return { error: lastError || 'All vision models failed' };
}

/**
 * Build a Cambridge-YLE-format audio script from vision-generated
 * descriptions. Produces the same shape as buildDragNameAudioScript on
 * the frontend, but uses vision-derived traits instead of hardcoded ones.
 */
function buildAudioScriptFromVision(
  visionZones: Record<string, string>, // {tl: "wearing red...", ...}
  nameForZone: Record<string, string>, // {zone_tl: "Ben", zone_tm: "Sue", ...}
  exampleZoneId: string,
): string {
  // Strip "zone_" prefix to match vision zone keys (tl/tm/etc)
  const zKey = (id: string) => id.replace(/^zone_/, '');

  const exampleName = nameForZone[exampleZoneId];
  const exampleDesc = visionZones[zKey(exampleZoneId)];
  if (!exampleName || !exampleDesc) {
    throw new Error(`Missing example name/desc for ${exampleZoneId}`);
  }

  const others: string[] = [];
  for (const [zoneId, name] of Object.entries(nameForZone)) {
    if (zoneId === exampleZoneId) continue;
    const desc = visionZones[zKey(zoneId)];
    if (!desc) continue;
    others.push(`${name} is ${desc}.`);
  }

  return [
    'Look at the picture. Listen and look. There is one example.',
    `${exampleName} is ${exampleDesc}. Can you see ${exampleName}?`,
    'Now you listen and write the names.',
    ...others,
  ].join(' ');
}

/**
 * Admin endpoint: regenerate scene + auto-caption + save script to D1.
 *
 *   POST /admin/exam/scenes/:id/recaption
 *   Body: {
 *     levelId: string,                       // e.g., "level1"
 *     partId: string,                        // e.g., "lvl1_p1"
 *     nameForZone: Record<string, string>,   // {zone_tl: "Ben", ...}
 *     exampleZoneId: string,                 // e.g., "zone_tl"
 *     regenerateImage?: boolean              // also re-run Flux first?
 *   }
 *
 * Workflow:
 *   1. (Optional) regenerate scene image via Flux
 *   2. Fetch current image from R2
 *   3. Call vision model on bytes → 6 descriptions
 *   4. Build Cambridge-style audio script
 *   5. Upsert to exam_audio_scripts in D1
 *   6. Return { script, visionZones, ms }
 */
async function adminRecaptionScene(
  env: Env,
  sceneId: string,
  req: Request,
): Promise<Response> {
  if (!isValidSceneId(sceneId)) {
    return jsonResponse({ error: `Unknown sceneId: ${sceneId}` }, 404);
  }
  if (!env.IMAGES || !env.AI || !env.DB) {
    return jsonResponse({ error: 'IMAGES/AI/DB binding not configured' }, 503);
  }

  let body: {
    levelId?: string;
    partId?: string;
    nameForZone?: Record<string, string>;
    exampleZoneId?: string;
    regenerateImage?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { levelId, partId, nameForZone, exampleZoneId, regenerateImage } = body;
  if (!levelId || !partId || !nameForZone || !exampleZoneId) {
    return jsonResponse({
      error: 'Required: levelId, partId, nameForZone, exampleZoneId',
    }, 400);
  }

  const cacheVersion = env.SCENE_CACHE_VERSION || 'v1';
  const r2Key = `exam-scenes/${cacheVersion}/${sceneId}.jpg`;
  const start = Date.now();

  // Step 1: optionally regenerate image
  if (regenerateImage) {
    try {
      console.log(`[recaption] regenerating ${sceneId}...`);
      const fresh = await generateSceneViaFlux(env, SCENE_PROMPTS[sceneId].prompt);
      await env.IMAGES.put(r2Key, fresh, {
        httpMetadata: { contentType: 'image/jpeg' },
      });
      console.log(`[recaption] new image: ${fresh.byteLength} bytes`);
    } catch (err) {
      return jsonResponse({
        error: 'Image regen failed',
        detail: String(err),
      }, 502);
    }
  }

  // Step 2: fetch image from R2
  const imageObj = await env.IMAGES.get(r2Key);
  if (!imageObj) {
    return jsonResponse({
      error: `Scene image not in R2: ${r2Key}`,
      hint: 'Pass regenerateImage:true or run /admin/exam/scenes/:id/generate first',
    }, 404);
  }
  const imageBytes = new Uint8Array(await imageObj.arrayBuffer());

  // Step 3: vision caption
  const visionResult = await captionGridScene(env, imageBytes);
  if (visionResult.error || !visionResult.zones) {
    return jsonResponse({
      error: 'Vision captioning failed',
      detail: visionResult.error || 'unknown',
    }, 502);
  }
  const visionZones = visionResult.zones;

  // Step 4: build script
  let script: string;
  try {
    script = buildAudioScriptFromVision(visionZones, nameForZone, exampleZoneId);
  } catch (err) {
    return jsonResponse({
      error: 'Script build failed',
      detail: String(err),
      visionZones,
    }, 500);
  }

  // Step 5: save to D1
  const now = Date.now();
  const updatedBy = req.headers.get('X-Admin-Email') || 'admin-vision';
  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO exam_audio_scripts
         (level_id, part_id, script, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(levelId, partId, script, now, updatedBy).run();
  } catch (err) {
    return jsonResponse({
      error: 'D1 save failed',
      detail: String(err),
      script,
      visionZones,
    }, 500);
  }

  const ms = Date.now() - start;
  console.log(`[recaption] ${sceneId} → ${levelId}/${partId} done in ${ms}ms`);
  return jsonResponse({
    ok: true,
    sceneId,
    levelId,
    partId,
    script,
    visionZones,
    ms,
    regeneratedImage: !!regenerateImage,
  });
}
