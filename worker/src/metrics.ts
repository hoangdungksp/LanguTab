/**
 * Metrics collection for the monitoring system.
 *
 * Sources of truth:
 *   1. KV counters (real-time, cheap)
 *      - neurons:<date>             → AI Neurons used today
 *      - rl:<ip>:<date>             → per-IP request count (legacy)
 *      - story:<userId>:<date>      → per-user story count
 *      - dau:<date>                 → unique users today (Set semantics via key prefix)
 *
 *   2. D1 queries (via getD1Metrics)
 *      - Pro user count (when subscription system lives)
 *      - Total user count
 *      - Cumulative story count today
 *
 *   3. Cloudflare Analytics Engine API (skipped for now)
 *      - Workers requests / errors are technically there but the API is
 *        rate-limited and adds 50-100ms per snapshot. We'll add it when
 *        we actually need precise request counts; for now we estimate
 *        from user-facing endpoints we instrument.
 *
 * Called every 15 minutes by the cron handler. Cheap (~5 KV reads + 1-2 D1
 * queries), well under any free-tier cap.
 */

export interface Metrics {
  /** Unix milliseconds when this snapshot was taken */
  timestamp: number;

  /** Workers AI Neurons usage (the most cost-sensitive metric) */
  neurons: {
    used: number;
    limit: number;
    /** 0..1 — for threshold comparison */
    percentUsed: number;
  };

  /** Workers request count (estimated from instrumented endpoints) */
  workers: {
    requests: number;
    limit: number;
    percentUsed: number;
  };

  /** KV writes today (we approximate from our own put() calls; CF usage may be slightly higher) */
  kv: {
    writes: number;
    limit: number;
    percentUsed: number;
  };

  /** Business metrics */
  users: {
    /** Daily Active Users (unique sub claims seen today) */
    dau: number;
    /** Monthly Active Users — last 30 days */
    mau: number;
    total: number;
    pro: number;
  };

  /** AI generation health */
  ai: {
    storiesGenerated: number;
    successRate: number;
    avgLatencyMs: number;
  };

  /** Errors */
  errors: {
    count: number;
    /** errors / total requests over last 15 mins, 0..1 */
    rate: number;
  };
}

// ─── Free-tier limits ──────────────────────────────────────────────────────
// These match Cloudflare's Workers Free tier as of 2026. Adjust if Jason
// upgrades to Workers Paid ($5/mo) which raises Workers requests to 10M/mo
// and Workers AI overage to $0.011/1K Neurons.
const NEURONS_DAILY_LIMIT = 10_000;
const WORKERS_DAILY_LIMIT = 100_000;
const KV_WRITES_DAILY_LIMIT = 1_000;

// ─── Public API ────────────────────────────────────────────────────────────
export async function collectMetrics(env: {
  RATE_LIMITER?: KVNamespace;
  DB?: D1Database;
}): Promise<Metrics> {
  const now = Date.now();
  const date = new Date().toISOString().slice(0, 10);

  // KV-backed counters — these are real-time and cheap.
  const kvMetrics = await collectKvMetrics(env.RATE_LIMITER, date);

  // D1-backed business metrics. Skip if D1 not yet bound (early dev).
  const d1Metrics = env.DB
    ? await collectD1Metrics(env.DB, date)
    : { totalUsers: 0, proUsers: 0, mau: 0 };

  // AI generation success/latency comes from a sliding window we maintain
  // in KV — see incrementGenerationSuccess() / Failure() below.
  const aiHealth = await collectAiHealth(env.RATE_LIMITER, date);

  return {
    timestamp: now,
    neurons: {
      used: kvMetrics.neuronsUsed,
      limit: NEURONS_DAILY_LIMIT,
      percentUsed: kvMetrics.neuronsUsed / NEURONS_DAILY_LIMIT,
    },
    workers: {
      requests: kvMetrics.workersRequests,
      limit: WORKERS_DAILY_LIMIT,
      percentUsed: kvMetrics.workersRequests / WORKERS_DAILY_LIMIT,
    },
    kv: {
      writes: kvMetrics.kvWrites,
      limit: KV_WRITES_DAILY_LIMIT,
      percentUsed: kvMetrics.kvWrites / KV_WRITES_DAILY_LIMIT,
    },
    users: {
      dau: kvMetrics.dau,
      mau: d1Metrics.mau,
      total: d1Metrics.totalUsers,
      pro: d1Metrics.proUsers,
    },
    ai: {
      storiesGenerated: kvMetrics.storiesToday,
      successRate: aiHealth.successRate,
      avgLatencyMs: aiHealth.avgLatencyMs,
    },
    errors: {
      count: aiHealth.errorCount,
      rate: aiHealth.errorRate,
    },
  };
}

// ─── KV-backed counters (helpers) ──────────────────────────────────────────
async function collectKvMetrics(
  kv: KVNamespace | undefined,
  date: string,
): Promise<{
  neuronsUsed: number;
  workersRequests: number;
  kvWrites: number;
  dau: number;
  storiesToday: number;
}> {
  if (!kv) {
    return { neuronsUsed: 0, workersRequests: 0, kvWrites: 0, dau: 0, storiesToday: 0 };
  }
  const [neurons, workers, kvWrites, dau, stories] = await Promise.all([
    kv.get(`neurons:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`workers_reqs:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`kv_writes:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`dau_count:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`stories_global:${date}`).then((v) => parseInt(v ?? '0', 10)),
  ]);
  return {
    neuronsUsed: neurons,
    workersRequests: workers,
    kvWrites,
    dau,
    storiesToday: stories,
  };
}

// ─── D1 business metrics ───────────────────────────────────────────────────
async function collectD1Metrics(
  db: D1Database,
  date: string,
): Promise<{ totalUsers: number; proUsers: number; mau: number }> {
  // Defensive: if the users table doesn't exist yet (D1 set up before
  // multi-user infra ships), return zeros instead of crashing the cron.
  try {
    const total = await db
      .prepare(`SELECT COUNT(*) as c FROM users`)
      .first<{ c: number }>();
    const pro = await db
      .prepare(`SELECT COUNT(*) as c FROM users WHERE tier = 'pro' AND expires_at > ?`)
      .bind(Date.now())
      .first<{ c: number }>();
    const mauCutoff = Date.now() - 30 * 24 * 3600_000;
    const mau = await db
      .prepare(`SELECT COUNT(*) as c FROM users WHERE last_active_at >= ?`)
      .bind(mauCutoff)
      .first<{ c: number }>();
    return {
      totalUsers: total?.c ?? 0,
      proUsers: pro?.c ?? 0,
      mau: mau?.c ?? 0,
    };
  } catch {
    return { totalUsers: 0, proUsers: 0, mau: 0 };
  }
}

// ─── AI generation health ──────────────────────────────────────────────────
async function collectAiHealth(
  kv: KVNamespace | undefined,
  date: string,
): Promise<{
  successRate: number;
  avgLatencyMs: number;
  errorCount: number;
  errorRate: number;
}> {
  if (!kv) {
    return { successRate: 1.0, avgLatencyMs: 0, errorCount: 0, errorRate: 0 };
  }
  const [success, failure, latencySum, errors, requests] = await Promise.all([
    kv.get(`ai_success:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`ai_failure:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`ai_latency_sum:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`errors:${date}`).then((v) => parseInt(v ?? '0', 10)),
    kv.get(`workers_reqs:${date}`).then((v) => parseInt(v ?? '0', 10)),
  ]);
  const total = success + failure;
  return {
    successRate: total > 0 ? success / total : 1.0,
    avgLatencyMs: success > 0 ? Math.round(latencySum / success) : 0,
    errorCount: errors,
    errorRate: requests > 0 ? errors / requests : 0,
  };
}

// ─── Instrumentation helpers (called from main worker handlers) ────────────
//
// These let the main router increment counters cheaply. Each call is one KV
// read + one KV write; we batch via `expirationTtl` for auto-cleanup.

/** Increment any KV counter atomically (best-effort; KV is eventually consistent). */
async function bumpCounter(
  kv: KVNamespace,
  key: string,
  delta = 1,
  ttlSeconds = 86400 * 2,
): Promise<void> {
  const current = parseInt((await kv.get(key)) ?? '0', 10);
  await kv.put(key, String(current + delta), { expirationTtl: ttlSeconds });
}

/** Track Workers AI Neurons consumed by a single AI call. */
export async function recordNeuronUsage(
  kv: KVNamespace | undefined,
  neurons: number,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  await bumpCounter(kv, `neurons:${date}`, neurons);
}

/** Track one Worker request (call at top of fetch handler). */
export async function recordWorkerRequest(
  kv: KVNamespace | undefined,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  // Async fire-and-forget to keep request hot path fast
  await bumpCounter(kv, `workers_reqs:${date}`).catch(() => {});
}

/** Track a successful AI generation with its latency. */
export async function recordAiSuccess(
  kv: KVNamespace | undefined,
  latencyMs: number,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  await Promise.all([
    bumpCounter(kv, `ai_success:${date}`),
    bumpCounter(kv, `ai_latency_sum:${date}`, latencyMs),
  ]);
}

/** Track a failed AI generation. */
export async function recordAiFailure(
  kv: KVNamespace | undefined,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  await bumpCounter(kv, `ai_failure:${date}`);
}

/** Track a server-side error (e.g. 5xx response from Worker). */
export async function recordError(
  kv: KVNamespace | undefined,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  await bumpCounter(kv, `errors:${date}`);
}

/**
 * Track a unique active user. Uses a per-user marker key so concurrent
 * requests don't double-count, then increments the global DAU counter
 * only on first sight of the day.
 */
export async function recordActiveUser(
  kv: KVNamespace | undefined,
  userId: string,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  const markerKey = `dau_seen:${userId}:${date}`;
  // Already counted today?
  if (await kv.get(markerKey)) return;
  // First time today — set marker and bump DAU
  await Promise.all([
    kv.put(markerKey, '1', { expirationTtl: 86400 * 2 }),
    bumpCounter(kv, `dau_count:${date}`),
  ]);
}

/** Track a successful story generation (separate from AI success — only counts /generate-story). */
export async function recordStoryGenerated(
  kv: KVNamespace | undefined,
): Promise<void> {
  if (!kv) return;
  const date = new Date().toISOString().slice(0, 10);
  await bumpCounter(kv, `stories_global:${date}`);
}

/**
 * Estimate Neurons consumed for a Workers AI request.
 *
 * Cloudflare's pricing page lists per-model rates (e.g. Qwen 3 30B is
 * ~31050 neurons/M tokens). We don't get exact billing data per request,
 * so we estimate from token counts (input + output ≈ a few hundred neurons
 * per story).
 *
 * Conservative estimate to avoid undercounting.
 */
export function estimateNeurons(
  promptTokens: number,
  completionTokens: number,
): number {
  // Qwen 3 30B FP8 — approximate, will refine with real billing data
  const NEURONS_PER_M_TOKEN = 31_050;
  const totalTokens = promptTokens + completionTokens;
  return Math.ceil((totalTokens / 1_000_000) * NEURONS_PER_M_TOKEN);
}
