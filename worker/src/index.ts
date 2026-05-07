/**
 * LinguTab — Cloudflare Worker proxy for Workers AI (Qwen 3 30B).
 *
 * History note: originally a Gemini API proxy. Google geo-fences Gemini at
 * the Cloudflare-edge IP level (not user IP), so requests routed via APAC
 * data centers from Vietnam fail with "User location is not supported".
 * We migrated to Cloudflare Workers AI — runs on Cloudflare's own GPU fleet,
 * no geo-restriction, keyless via the env.AI binding.
 *
 * Two-tier rate limiting:
 *   1. Per-user (KV)  — for endpoints requiring auth (story generation)
 *   2. Per-IP fallback — for /generate (legacy translation/Q&A endpoints)
 *
 * Endpoints:
 *   POST /generate         → forwards prompt to Workers AI (anon, IP-rate-limited)
 *   POST /generate-story   → AI story generator (auth required, 3/day/user)
 *   GET  /quota            → check remaining story credits for current user
 *   GET  /health           → liveness check
 *
 * Deploy:
 *   1. Create KV:       wrangler kv:namespace create "RATE_LIMITER"
 *   2. Wire KV id in wrangler.toml + uncomment [[kv_namespaces]] block
 *   3. Deploy:          npm run deploy
 *
 * (No GEMINI_API_KEY needed — Workers AI uses the Cloudflare account binding.)
 */

export interface Env {
  /**
   * Cloudflare Workers AI binding — gives access to the model catalog
   * via env.AI.run(modelId, params). Free for moderate daily usage and
   * NOT geo-restricted (the killer feature for users in Vietnam where
   * Gemini's IP-based geo-fence rejects Cloudflare edge locations).
   */
  AI: {
    run: (model: string, params: unknown) => Promise<{
      response?: string;
      [key: string]: unknown;
    }>;
  };
  ALLOWED_ORIGINS: string;
  RATE_LIMITER?: KVNamespace;

  /** R2 bucket for custom flashcard images (replaces Drive appData) */
  IMAGES?: R2Bucket;

  // ─── Exam audio TTS configuration ───────────────────────────────────────
  /**
   * TTS provider override — forces specific provider, bypassing auto fallback.
   * Values: "elevenlabs" | "aura2" | "melotts" | unset (auto chain).
   * Default behavior (unset): ElevenLabs → Aura-2 → melotts.
   */
  TTS_PROVIDER?: string;
  /**
   * ElevenLabs API key (set via `wrangler secret put ELEVENLABS_API_KEY`).
   * Note: free tier blocks Cloudflare datacenter IPs as "unusual activity".
   * Only works on paid plans ($5+/mo). If absent or fails, falls back to Aura-2.
   */
  ELEVENLABS_API_KEY?: string;
  /** ElevenLabs voice ID. Default: Dorothy (warm British female). */
  ELEVENLABS_VOICE_ID?: string;
  /** ElevenLabs model. Default: `eleven_multilingual_v2`. */
  ELEVENLABS_MODEL_ID?: string;
  /**
   * Deepgram Aura-2 voice. Default: `asteria` (clear teacher-like female).
   * Other options: athena, helena, aurora, hera, luna, etc. (40 total).
   * No API key needed — uses Workers AI binding.
   */
  AURA2_VOICE?: string;
  /**
   * Cache version prefix for exam audio in R2. Bump (e.g. "v1" → "v2") to
   * force regeneration of all cached audio after a voice/provider change.
   * Old cache entries are left in R2 (manually delete to free storage).
   */
  AUDIO_CACHE_VERSION?: string;
  /**
   * Cache version prefix for exam scenes in R2. Bump to force regeneration
   * after prompt changes. Storage is cheap so old cache entries can stay.
   */
  SCENE_CACHE_VERSION?: string;

  // ─── Monitoring system bindings ─────────────────────────────────────────
  /** D1 database for metrics_snapshots + alerts_log */
  DB?: D1Database;
  /** Resend.com API key (for alert emails) */
  RESEND_API_KEY?: string;
  /** Verified sender, e.g. "alerts@kspstudio.com" */
  RESEND_FROM_EMAIL?: string;
  /** Recipient — Jason's email */
  RESEND_TO_EMAIL?: string;
  /** Bearer token for /admin/* endpoints (Jason only) */
  ADMIN_TOKEN?: string;

  // ─── Billing / Lemon Squeezy ────────────────────────────────────────────
  /** HMAC-SHA256 secret from Lemon Squeezy webhook settings */
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
  /** Store subdomain — `linguatab` from `https://linguatab.lemonsqueezy.com` */
  LEMON_SQUEEZY_STORE_URL?: string;
  /** Lemon Squeezy variant IDs for each plan */
  LEMON_SQUEEZY_VARIANT_PRO_MONTHLY?: string;
  LEMON_SQUEEZY_VARIANT_PRO_YEARLY?: string;
  LEMON_SQUEEZY_VARIANT_LIFETIME?: string;
  /** Display prices (USD) — for the upgrade UI */
  PRICE_PRO_MONTHLY?: string;
  PRICE_PRO_YEARLY?: string;
  PRICE_LIFETIME?: string;
}

/**
 * Default model for story generation.
 *
 * @cf/qwen/qwen3-30b-a3b-fp8 — Qwen 3 30B MoE (Nov 2025), Alibaba's flagship
 * multilingual model. Native-speaker-quality Chinese (Alibaba is Chinese, the
 * model was trained predominantly on Chinese text), strong Vietnamese, and
 * long enough context window for our prompts (~8K).
 *
 * Workers AI runs this on Cloudflare's GPU fleet — no geo-restriction, no
 * API key, no quota worries for Jason's personal-use volumes (3 stories/day
 * × small user base).
 *
 * If we ever need to swap (e.g. quality issue), other strong candidates:
 *   - @cf/meta/llama-3.3-70b-instruct-fp8-fast (Vietnamese very good, Chinese OK)
 *   - @cf/qwen/qwen2.5-coder-32b-instruct (code-specific, NOT for prose)
 */
const DEFAULT_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';

// ─── Rate limits ───────────────────────────────────────────────────────────
const ANON_REQUESTS_PER_MINUTE = 10;
const ANON_REQUESTS_PER_DAY = 200;
// Story quota is tier-dependent now — see worker/src/billing/tier.ts. The
// old hard-coded `STORY_REQUESTS_PER_DAY = 3` has been replaced by
// `quotaFor(tier)` resolved per-request via getUserTier().

// ─── CORS ──────────────────────────────────────────────────────────────────
function corsHeaders(origin: string, allowedOrigins: string[]): HeadersInit {
  const isAllowed = allowedOrigins.some(
    (a) => a === '*' || a === origin || origin.startsWith(a),
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '*',
    // PUT + DELETE needed for /sync/images/* (R2 image upload + delete).
    // POST for /generate-story, /sync/push, /sync/upload-all, /billing/webhook.
    // GET for /quota, /sync/pull, /sync/status, /sync/download-all,
    //         /sync/images/* (download), /billing/tier, /billing/checkout-info.
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── Auth verification ─────────────────────────────────────────────────────
interface VerifiedUser {
  /** Stable Google account ID (the OAuth `sub` claim) — primary rate-limit key. */
  userId: string;
  email: string;
}

/**
 * Verify a Google OAuth access token via Google's tokeninfo endpoint.
 * Returns user id + email, or null on failure (expired/invalid/network).
 *
 * The v3 endpoint returns `sub` directly without JWT decoding. Cost: ~1
 * subrequest per call, free on Cloudflare. Latency ~50-100ms.
 */
async function verifyGoogleToken(accessToken: string): Promise<VerifiedUser | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      sub?: string;
      email?: string;
      expires_in?: string;
    };
    if (!data.sub || !data.email) return null;
    const expiresIn = parseInt(data.expires_in ?? '0', 10);
    if (expiresIn <= 0) return null;
    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
}

// ─── Anonymous rate limiting (legacy /generate) ────────────────────────────
async function checkAnonRateLimit(
  kv: KVNamespace | undefined,
  clientId: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!kv) return { ok: true };
  const now = Date.now();
  const minuteKey = `rl:${clientId}:${Math.floor(now / 60_000)}`;
  const dayKey = `rl:${clientId}:${new Date().toISOString().slice(0, 10)}`;
  const [minuteCount, dayCount] = await Promise.all([
    kv.get(minuteKey).then((v) => parseInt(v ?? '0', 10)),
    kv.get(dayKey).then((v) => parseInt(v ?? '0', 10)),
  ]);
  if (minuteCount >= ANON_REQUESTS_PER_MINUTE) {
    return { ok: false, reason: `Rate limit: ${ANON_REQUESTS_PER_MINUTE}/phút` };
  }
  if (dayCount >= ANON_REQUESTS_PER_DAY) {
    return { ok: false, reason: `Rate limit: ${ANON_REQUESTS_PER_DAY}/ngày` };
  }
  await Promise.all([
    kv.put(minuteKey, String(minuteCount + 1), { expirationTtl: 120 }),
    kv.put(dayKey, String(dayCount + 1), { expirationTtl: 86400 * 2 }),
  ]);
  return { ok: true };
}

// ─── Per-user story rate limiting ──────────────────────────────────────────
interface StoryRateResult {
  ok: boolean;
  remaining: number;
  resetAt: string;
  reason?: string;
}

/**
 * Strict per-tier daily quota that DEDUCTS atomically before generation.
 * Caller MUST call refundStoryCredit() if generation fails so user isn't
 * charged for our errors.
 *
 * The `quota` argument comes from quotaFor(tier) and varies by user tier:
 * 3/day for free, 30/day for pro/lifetime, 0 for banned.
 *
 * Race condition note: KV is eventually consistent, so two near-simultaneous
 * requests COULD both pass the check. Worst case: user gets 1 free extra.
 * Acceptable trade-off vs. the complexity of distributed locks.
 */
async function checkStoryRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
  quota: number,
): Promise<StoryRateResult> {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0,
  ));
  const resetAt = tomorrow.toISOString();

  if (!kv) {
    return { ok: true, remaining: quota, resetAt };
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const userKey = `story:${userId}:${dateKey}`;
  const currentCount = parseInt((await kv.get(userKey)) ?? '0', 10);

  if (currentCount >= quota) {
    return {
      ok: false,
      remaining: 0,
      resetAt,
      reason:
        quota === 0
          ? `Tài khoản này không thể tạo truyện AI. Liên hệ hỗ trợ nếu bạn nghĩ đây là nhầm lẫn.`
          : `Bạn đã hết ${quota} truyện hôm nay. Quay lại ngày mai nhé!`,
    };
  }

  await kv.put(userKey, String(currentCount + 1), { expirationTtl: 86400 * 2 });
  return {
    ok: true,
    remaining: quota - currentCount - 1,
    resetAt,
  };
}

async function refundStoryCredit(
  kv: KVNamespace | undefined,
  userId: string,
): Promise<void> {
  if (!kv) return;
  const dateKey = new Date().toISOString().slice(0, 10);
  const userKey = `story:${userId}:${dateKey}`;
  const currentCount = parseInt((await kv.get(userKey)) ?? '0', 10);
  if (currentCount > 0) {
    await kv.put(userKey, String(currentCount - 1), { expirationTtl: 86400 * 2 });
  }
}

// ─── Generic AI proxy (legacy /generate endpoint) ──────────────────────────
async function proxyGenerate(req: Request, env: Env): Promise<Response> {
  const body = (await req.json()) as {
    prompt: string;
    model?: string;
    temperature?: number;
  };
  if (!body?.prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Allow caller override but default to our story-tuned model. The legacy
  // /generate endpoint is used by translation/Q&A features in the extension
  // that don't need JSON-strict output, so a generic chat model is fine.
  const model = body.model ?? DEFAULT_MODEL;
  try {
    const aiResp = await env.AI.run(model, {
      messages: [{ role: 'user', content: body.prompt }],
      temperature: body.temperature ?? 0.7,
    });
    // Reshape to look like the old Gemini response so existing client code
    // (src/services/gemini.ts) keeps working without changes. We mimic the
    // candidates[].content.parts[].text path.
    const text = typeof aiResp.response === 'string' ? aiResp.response : '';
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'AI request failed',
      detail: String(err instanceof Error ? err.message : err),
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

// ─── Story generation ──────────────────────────────────────────────────────
interface StoryRequest {
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  genre: string;
  description: string;
  sentenceCount: number;
  includeDialogue: boolean;
}

/**
 * Build the Gemini prompt for story generation. Verbose by design — Gemini
 * Flash benefits from explicit structure; vague prompts produce inconsistent
 * output (missing pinyin, English fallback in Vietnamese, wrong row count).
 *
 * Strict JSON output is requested via `response_mime_type` in the API call,
 * but we also include "respond ONLY with JSON" as belt-and-suspenders since
 * the mime type isn't always honored on Flash.
 */
function buildStoryPrompt(req: StoryRequest): string {
  const { hskLevel, genre, description, sentenceCount, includeDialogue } = req;

  const dialogueClause = includeDialogue
    ? 'Câu chuyện PHẢI có ít nhất 2 câu đối thoại bằng dấu ngoặc kép "" giữa các nhân vật.'
    : 'Câu chuyện không cần có đối thoại trực tiếp.';

  const breakHint = sentenceCount >= 8
    ? '\n- Sử dụng 2-3 đoạn ngắt "P_BREAK" giữa các đoạn để chia câu chuyện thành 3-4 paragraphs.'
    : '';

  return `Bạn là người viết truyện ngắn cho học sinh Việt Nam đang học tiếng Trung HSK level ${hskLevel}.

Yêu cầu cốt lõi:
- Thể loại: ${genre}
- Mô tả: ${description}
- Vocabulary: chỉ dùng từ HSK 1-${hskLevel} (đơn giản, phổ biến). KHÔNG dùng từ chuyên ngành cao cấp.
- Số câu chính: ${sentenceCount} câu (đếm cẩn thận, không nhiều hơn không ít hơn).
- ${dialogueClause}${breakHint}

Format output (JSON nghiêm ngặt):
{
  "title": {
    "zh": "tiêu đề tiếng Trung giản thể",
    "pinyin": "Pīnyīn Yǒu Dấu Thanh",
    "vi": "tiêu đề tiếng Việt"
  },
  "description": {
    "zh": "mô tả ngắn 1-2 câu tiếng Trung",
    "pinyin": "pinyin có dấu",
    "vi": "mô tả tiếng Việt"
  },
  "newWords": [
    {
      "id": "nw_gen_<unique_short_id>",
      "hanzi": "từ mới (chỉ liệt kê 3-7 từ KHÔNG nằm trong HSK 1-${hskLevel})",
      "pinyin": "pinyin có dấu",
      "vi": "nghĩa tiếng Việt ngắn gọn"
    }
  ],
  "rows": [
    { "zh": "câu tiếng Trung", "pinyin": "Pinyin Yǒu Dấu", "vi": "tiếng Việt tự nhiên" },
    "P_BREAK",
    { "zh": "...", "pinyin": "...", "vi": "..." }
  ]
}

CRITICAL RULES:
1. "rows" array PHẢI có đúng ${sentenceCount} object câu (không tính P_BREAK).
2. Pinyin PHẢI có dấu thanh (ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ).
3. Mỗi câu tiếng Trung kết thúc bằng "。" hoặc "！" hoặc "？".
4. Vietnamese PHẢI là tiếng Việt thật (có dấu), KHÔNG dùng English fallback.
5. newWords id format: "nw_gen_<6 chars random>" (ví dụ: "nw_gen_a1b2c3").
6. CHỈ trả về JSON object, KHÔNG có markdown code fence, KHÔNG giải thích.
7. Câu chuyện phải có cốt truyện rõ ràng (mở đầu - diễn biến - kết thúc).`;
}

async function proxyGenerateStory(
  req: Request,
  env: Env,
  user: VerifiedUser,
): Promise<Response> {
  const body = (await req.json()) as StoryRequest;

  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (![1, 2, 3, 4, 5, 6].includes(body.hskLevel)) {
    return new Response(JSON.stringify({ error: 'hskLevel must be 1-6' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.genre || body.genre.length > 50) {
    return new Response(JSON.stringify({ error: 'genre required (≤50 chars)' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!body.description || body.description.length > 500) {
    return new Response(JSON.stringify({ error: 'description required (≤500 chars)' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  // Sentence count caps tied to HSK level — see buildStoryPrompt rationale
  const maxSentences = body.hskLevel <= 2 ? 15 : body.hskLevel <= 4 ? 20 : 25;
  if (body.sentenceCount < 5 || body.sentenceCount > maxSentences) {
    return new Response(JSON.stringify({
      error: `sentenceCount must be 5-${maxSentences} for HSK ${body.hskLevel}`,
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const prompt = buildStoryPrompt(body);

  // Workers AI uses messages-style input (OpenAI-compatible). Models like
  // Qwen take system+user pair; we put the bulk in user since the prompt
  // already includes role + format expectations explicitly.
  const aiInput = {
    messages: [
      {
        role: 'system',
        content:
          'Bạn là một nhà văn chuyên viết truyện ngắn cho học sinh học tiếng Trung. ' +
          'Bạn LUÔN trả về JSON object hợp lệ theo format được yêu cầu, không có ' +
          'markdown code fence, không có giải thích thêm.',
      },
      { role: 'user', content: prompt },
    ],
    // Temperature higher than typical translation tasks — encourage creative
    // variation in plots/characters. Qwen at 0.9 still respects the JSON
    // structure constraint reliably; going to 1.0+ starts producing free-form
    // text that ignores the format spec.
    temperature: 0.9,
    // 8K — empirically tuned. Real generated stories rarely exceed 4K tokens
    // (HSK 1-3 stories are 200-600 words ≈ 1-2K tokens; reasoning takes ~2K
    // more), so 8K leaves comfortable headroom. The previous 16K limit just
    // gave Qwen3 room to over-think and produced no quality gain — pure
    // latency cost (30-60s vs 15-25s typical now).
    max_tokens: 8000,
  };

  const aiStartTime = Date.now();

  try {
    // env.AI.run() is the Cloudflare Workers AI binding. Different models
    // return text at different paths; we try all known shapes.
    const aiResp = await env.AI.run(DEFAULT_MODEL, aiInput);

    // Log the full shape ONCE to wrangler tail so we can see what Qwen
    // actually returns. After we see the shape we can simplify this.
    console.log('[ai] response keys:', Object.keys(aiResp));
    console.log('[ai] response sample:', JSON.stringify(aiResp).slice(0, 1000));

    // Track Neurons consumption from the response usage info if available.
    // Workers AI usage shape: { prompt_tokens, completion_tokens, total_tokens }
    const usage = (aiResp as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
    if (usage && env.RATE_LIMITER) {
      const neurons = estimateNeurons(
        usage.prompt_tokens ?? 0,
        usage.completion_tokens ?? 0,
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      recordNeuronUsage(env.RATE_LIMITER, neurons).catch(() => {});
    }

    // Try every known response path used by Workers AI models in the wild:
    //   - .response                       — most chat models (Llama, Mistral)
    //   - .choices[0].message.content     — OpenAI-compatible models
    //   - .result.response                — older REST API wrapping
    //   - .output_text                    — some new models
    // Qwen3 with reasoning may also return:
    //   - .choices[0].message.content     — final answer
    //   - .choices[0].message.reasoning   — chain-of-thought (skip this)
    const r = aiResp as Record<string, unknown>;
    const choices = (r.choices as Array<{ message?: { content?: string } }> | undefined);

    // Coerce non-string `.response` (e.g. some Qwen reasoning modes return
    // an object). Workers AI sometimes wraps the answer in nested objects.
    const responseField = r.response;
    const responseAsString =
      typeof responseField === 'string'
        ? responseField
        : (responseField && typeof responseField === 'object'
            ? JSON.stringify(responseField)
            : null);

    const text =
      responseAsString ??
      choices?.[0]?.message?.content ??
      ((r.result as { response?: string } | undefined)?.response) ??
      (typeof r.output_text === 'string' ? r.output_text : null) ??
      '';

    if (!text) {
      await refundStoryCredit(env.RATE_LIMITER, user.userId);
      console.error('[ai] empty response', JSON.stringify(aiResp).slice(0, 500));
      return new Response(JSON.stringify({
        error: 'AI trả về phản hồi rỗng',
        detail: JSON.stringify(aiResp).slice(0, 300),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // Strip markdown fence if model ignored format instruction
    // (Qwen sometimes wraps JSON in ```json ... ``` despite explicit ask)
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let storyJson;
    try {
      storyJson = JSON.parse(cleaned);
    } catch {
      await refundStoryCredit(env.RATE_LIMITER, user.userId);
      console.error('[ai] invalid JSON', cleaned.slice(0, 500));
      // Track failure for monitoring (validation pipeline failure)
      if (env.RATE_LIMITER) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        recordAiFailure(env.RATE_LIMITER).catch(() => {});
      }
      return new Response(JSON.stringify({
        error: 'AI trả về JSON không hợp lệ. Thử lại nhé.',
        rawSnippet: cleaned.slice(0, 300),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // ─── Success path: track latency, story count, active user ─────────
    const latencyMs = Date.now() - aiStartTime;
    if (env.RATE_LIMITER) {
      // Fire-and-forget; don't slow down the response
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.all([
        recordAiSuccess(env.RATE_LIMITER, latencyMs),
        recordStoryGenerated(env.RATE_LIMITER),
        recordActiveUser(env.RATE_LIMITER, user.userId),
      ]).catch(() => {});
    }

    return new Response(JSON.stringify({
      story: storyJson,
      meta: { user: { email: user.email }, model: DEFAULT_MODEL },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    await refundStoryCredit(env.RATE_LIMITER, user.userId);
    console.error('[ai] exception', err);
    if (env.RATE_LIMITER) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.all([
        recordAiFailure(env.RATE_LIMITER),
        recordError(env.RATE_LIMITER),
      ]).catch(() => {});
    }
    return new Response(JSON.stringify({
      error: 'Tạo truyện thất bại',
      detail: String(err instanceof Error ? err.message : err),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// ─── Quota check ───────────────────────────────────────────────────────────
async function getQuotaInfo(
  env: Env,
  user: VerifiedUser,
): Promise<Response> {
  const tier = await getUserTier(env.DB, user.userId);
  const limit = quotaFor(tier);
  const dateKey = new Date().toISOString().slice(0, 10);
  const userKey = `story:${user.userId}:${dateKey}`;
  const used = env.RATE_LIMITER
    ? parseInt((await env.RATE_LIMITER.get(userKey)) ?? '0', 10)
    : 0;
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0,
  ));
  return new Response(JSON.stringify({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: tomorrow.toISOString(),
    tier,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// ─── Router ────────────────────────────────────────────────────────────────
// ─── Imports for monitoring system ─────────────────────────────────────────
import { runMonitorCron } from './monitor';
import {
  recordWorkerRequest,
  recordActiveUser,
  recordError,
  recordAiSuccess,
  recordAiFailure,
  recordStoryGenerated,
  recordNeuronUsage,
  estimateNeurons,
} from './metrics';
import { handleAdminRequest } from './admin/handlers';
import { handleSyncRequest } from './sync/handlers';
import { handleBillingRequest } from './billing/handlers';
import { handleExamRequest, handleAdminExamRequest } from './exam/handlers';
import { getUserTier, quotaFor } from './billing/tier';

export default {
  /**
   * Cron handler — runs every 15 minutes per wrangler.toml [triggers].
   * Collects metrics, persists snapshots, sends alerts. Cheap operation,
   * runs in the background, doesn't block any user request.
   */
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await runMonitorCron(event, env);
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    // ─── Monitoring instrumentation ──────────────────────────────────────
    // Best-effort, fire-and-forget. Never fail the request because metrics
    // tracking errored. Floats over the rest of the handler concurrent.
    if (env.RATE_LIMITER) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      recordWorkerRequest(env.RATE_LIMITER).catch(() => {});
    }

    const origin = req.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
    const cors = corsHeaders(origin, allowedOrigins);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // ─── Admin endpoints (Bearer ADMIN_TOKEN required) ──────────────────
    // Handler returns null if path doesn't match /admin/*; otherwise it
    // fully owns the response. Auth is internal to handleAdminRequest.
    const adminResp = await handleAdminRequest(req, env);
    if (adminResp) {
      const headers = new Headers(adminResp.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, String(v)));
      return new Response(adminResp.body, { status: adminResp.status, headers });
    }

    // ─── Admin exam endpoints (separate handler family) ─────────────────
    // /admin/exam/scenes/* — scene generation control. Bearer ADMIN_TOKEN
    // required (verified inline since handleAdminExamRequest has no own auth).
    if (url.pathname.startsWith('/admin/exam/')) {
      const adminAuth = req.headers.get('Authorization');
      if (
        !env.ADMIN_TOKEN ||
        !adminAuth?.startsWith('Bearer ') ||
        adminAuth.slice(7) !== env.ADMIN_TOKEN
      ) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      const examAdminResp = await handleAdminExamRequest(req, env);
      if (examAdminResp) {
        const headers = new Headers(examAdminResp.headers);
        Object.entries(cors).forEach(([k, v]) => headers.set(k, String(v)));
        return new Response(examAdminResp.body, { status: examAdminResp.status, headers });
      }
    }

    // Try to verify auth (used by /quota and /generate-story)
    const authHeader = req.headers.get('Authorization');
    let user: VerifiedUser | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.slice(7);
      user = await verifyGoogleToken(accessToken);
    }

    try {
      let resp: Response;

      // ─── Sync endpoints (auth required) ──────────────────────────────
      // All /sync/* endpoints require Google OAuth. Sync handler returns
      // null only if path doesn't match /sync/*; auth check is done here
      // since it's the same flow as /quota and /generate-story.
      if (url.pathname.startsWith('/sync/')) {
        if (!user) {
          resp = new Response(JSON.stringify({
            error: 'Bạn cần đăng nhập Google để đồng bộ',
          }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
          });
        } else {
          const syncResp = await handleSyncRequest(req, env, user);
          resp = syncResp ?? new Response(JSON.stringify({ error: 'Sync endpoint not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }
      } else if (url.pathname === '/quota' && req.method === 'GET') {
        if (!user) {
          resp = new Response(JSON.stringify({ error: 'Auth required' }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
          });
        } else {
          resp = await getQuotaInfo(env, user);
        }
      } else if (url.pathname === '/generate-story' && req.method === 'POST') {
        if (!user) {
          resp = new Response(JSON.stringify({
            error: 'Bạn cần đăng nhập Google để tạo truyện AI',
          }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
          });
        } else {
          const tier = await getUserTier(env.DB, user.userId);
          const quota = quotaFor(tier);
          const rl = await checkStoryRateLimit(env.RATE_LIMITER, user.userId, quota);
          if (!rl.ok) {
            resp = new Response(JSON.stringify({
              error: rl.reason,
              remaining: rl.remaining,
              resetAt: rl.resetAt,
              tier,
              limit: quota,
            }), { status: 429, headers: { 'Content-Type': 'application/json' } });
          } else {
            resp = await proxyGenerateStory(req, env, user);
          }
        }
      } else if (url.pathname.startsWith('/exam/')) {
        // Exam routes (audio TTS, future: attempt persistence). Auth check
        // happens inside the handler since some endpoints will need user
        // context for personalized data (history, etc.) while audio is
        // currently logged-in-only.
        const examResp = await handleExamRequest(req, env, user);
        resp = examResp ?? new Response(JSON.stringify({ error: 'Exam endpoint not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      } else if (url.pathname.startsWith('/billing/')) {
        // Webhook (POST /billing/webhook) is public — auth via HMAC inside.
        // /billing/checkout-info + /billing/tier require user auth.
        const billingResp = await handleBillingRequest(req, env, user);
        resp = billingResp ?? new Response(JSON.stringify({ error: 'Billing endpoint not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      } else if (url.pathname === '/generate' && req.method === 'POST') {
        const clientId =
          req.headers.get('X-Client-Id') ||
          req.headers.get('CF-Connecting-IP') ||
          'anonymous';
        const rl = await checkAnonRateLimit(env.RATE_LIMITER, clientId);
        if (!rl.ok) {
          resp = new Response(JSON.stringify({ error: rl.reason }), {
            status: 429, headers: { 'Content-Type': 'application/json' },
          });
        } else {
          resp = await proxyGenerate(req, env);
        }
      } else {
        resp = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }

      const headers = new Headers(resp.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, String(v)));
      return new Response(resp.body, { status: resp.status, headers });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: String(err instanceof Error ? err.message : err) }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...cors } },
      );
    }
  },
};
