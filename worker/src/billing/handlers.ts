/**
 * Billing endpoints — Lemon Squeezy integration.
 *
 * Endpoints:
 *   POST /billing/webhook        → receives subscription/order events from LS
 *   GET  /billing/checkout-info  → returns store URL + variant IDs (auth'd user)
 *
 * Lemon Squeezy ("LS") flow:
 *   1. User clicks "Upgrade" in our UI
 *   2. Frontend calls /billing/checkout-info to get store_url + variant_id
 *   3. Frontend opens https://{store}.lemonsqueezy.com/buy/{variant_id}
 *      with `?checkout[custom][user_id]=<sub>&checkout[email]=<email>`
 *   4. User pays, LS sends webhook with `meta.custom_data.user_id`
 *   5. Webhook handler verifies HMAC, looks up the user, sets tier='pro'
 *      (or 'lifetime' for one-time orders), records expiry from LS data
 *
 * Why custom_data and not LS customer_id: at checkout time the LS
 * customer_id doesn't exist yet (LS creates it on payment). The custom field
 * is the only way to reliably link the new subscription back to *our* user.
 *
 * Webhook security: HMAC-SHA256 over raw body using
 * env.LEMON_SQUEEZY_WEBHOOK_SECRET. Lemon Squeezy sends signature in
 * `X-Signature` header as hex. We compute and compare in constant time.
 *
 * Idempotency: webhooks can fire multiple times for the same event (network
 * retries, etc). We treat every write as upsert and the audit log is
 * append-only; double-firing the same event causes no user-visible damage.
 *
 * Variant → tier mapping: configured via env. The worker maps
 *   LEMON_SQUEEZY_VARIANT_PRO_MONTHLY → 'pro'  (subscription_*)
 *   LEMON_SQUEEZY_VARIANT_PRO_YEARLY  → 'pro'  (subscription_*)
 *   LEMON_SQUEEZY_VARIANT_LIFETIME    → 'lifetime' (order_created)
 * Adding a new variant = update the env, no code change.
 */

import { effectiveTier, type Tier } from './tier';

export interface BillingEnv {
  DB?: D1Database;
  /** HMAC-SHA256 secret configured in Lemon Squeezy webhook settings. */
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
  /** Store subdomain — `linguatab` from `https://linguatab.lemonsqueezy.com` */
  LEMON_SQUEEZY_STORE_URL?: string;
  /** Variant IDs (numbers as strings — LS uses int IDs but env vars are strings). */
  LEMON_SQUEEZY_VARIANT_PRO_MONTHLY?: string;
  LEMON_SQUEEZY_VARIANT_PRO_YEARLY?: string;
  LEMON_SQUEEZY_VARIANT_LIFETIME?: string;
  /** Display prices (USD) — purely informational, used by /checkout-info to
   *  render the upgrade UI without hitting the LS API. */
  PRICE_PRO_MONTHLY?: string; // e.g. "4.99"
  PRICE_PRO_YEARLY?: string;  // e.g. "39.99"
  PRICE_LIFETIME?: string;    // e.g. "99"
}

export interface VerifiedUser {
  userId: string;
  email: string;
}

// ─── HMAC verification ────────────────────────────────────────────────────
/**
 * Constant-time HMAC-SHA256 verification of the raw webhook body.
 * Returns true iff signatureHex matches HMAC(secret, body).
 *
 * We use Web Crypto (available in Cloudflare Workers) — no Node crypto.
 */
async function verifyHmac(
  body: string,
  signatureHex: string,
  secret: string,
): Promise<boolean> {
  if (!signatureHex || !secret) return false;
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(body));
    const computedHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedHex.length !== signatureHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedHex.length; i++) {
      mismatch |= computedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

// ─── Webhook payload types ────────────────────────────────────────────────
/**
 * Subset of Lemon Squeezy webhook fields we actually consume. The full
 * payload has dozens of fields; we deliberately keep this narrow so when
 * LS adds new fields we don't accidentally start depending on them.
 *
 * Reference: https://docs.lemonsqueezy.com/api/webhooks
 */
interface LSWebhookEnvelope {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      [k: string]: unknown;
    };
  };
  data?: {
    id?: string;          // subscription_id or order_id
    type?: 'subscriptions' | 'orders' | string;
    attributes?: {
      status?: string;             // 'active', 'cancelled', 'expired', 'paid', ...
      customer_id?: number | string;
      variant_id?: number | string;
      renews_at?: string | null;   // ISO date
      ends_at?: string | null;     // ISO date — set when cancelled
      // Customer info — present on orders and subscriptions. Used to upsert
      // a skeleton user row if the user paid before ever signing in to the
      // extension on this device (otherwise the UPDATE would no-op and the
      // user would stay on Free despite paying).
      user_email?: string;
      user_name?: string;
      // For order_created
      first_order_item?: { variant_id?: number | string };
      // For order_refunded — present on the refunded order
      refunded?: boolean;
      refunded_at?: string | null;
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Resolve which tier a given LS variant ID maps to. Returns null if the
 * variant isn't configured — we still log the event but don't change tier
 * (defensive: Jason might add a new variant in LS before updating env).
 */
function variantToTier(env: BillingEnv, variantId: string): Tier | null {
  if (env.LEMON_SQUEEZY_VARIANT_LIFETIME && variantId === env.LEMON_SQUEEZY_VARIANT_LIFETIME) {
    return 'lifetime';
  }
  if (
    (env.LEMON_SQUEEZY_VARIANT_PRO_MONTHLY && variantId === env.LEMON_SQUEEZY_VARIANT_PRO_MONTHLY) ||
    (env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY && variantId === env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY)
  ) {
    return 'pro';
  }
  return null;
}

// ─── Webhook handler ──────────────────────────────────────────────────────
async function handleWebhook(req: Request, env: BillingEnv): Promise<Response> {
  if (!env.DB) return jsonResp({ error: 'Database not configured' }, 500);
  if (!env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return jsonResp({ error: 'Webhook secret not configured' }, 500);
  }

  // Read raw body for HMAC verification BEFORE parsing JSON. Reading body
  // twice would either need .clone() or a buffer; simpler to read once
  // as text and parse afterwards.
  const rawBody = await req.text();
  const signature = req.headers.get('X-Signature') || '';
  const sigOk = await verifyHmac(rawBody, signature, env.LEMON_SQUEEZY_WEBHOOK_SECRET);
  if (!sigOk) {
    // Don't leak details — 401 with no body is plenty. Log on Cloudflare side
    // for debugging if Jason needs to investigate.
    console.warn('[billing] webhook signature mismatch');
    return jsonResp({ error: 'Invalid signature' }, 401);
  }

  let payload: LSWebhookEnvelope;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResp({ error: 'Invalid JSON' }, 400);
  }

  const eventName = payload.meta?.event_name ?? 'unknown';
  const lsId = payload.data?.id ?? null;
  const lsType = payload.data?.type ?? null;
  const attrs = payload.data?.attributes ?? {};
  const customUserId = payload.meta?.custom_data?.user_id ?? null;
  const lsCustomerId = attrs.customer_id != null ? String(attrs.customer_id) : null;
  const lsUserEmail = attrs.user_email ?? null;
  const lsUserName = attrs.user_name ?? null;
  const variantId =
    attrs.variant_id != null
      ? String(attrs.variant_id)
      : attrs.first_order_item?.variant_id != null
        ? String(attrs.first_order_item.variant_id)
        : null;

  // ─── Resolve target user ────────────────────────────────────────────────
  // Prefer custom_data.user_id (set by us at checkout). Fall back to
  // looking up by ls_subscription_id for events that arrive after the
  // initial creation (subscription_updated etc). For order_refunded we
  // can also look up by ls_order_id via billing_events history.
  let userId = customUserId;
  if (!userId && lsType === 'subscriptions' && lsId) {
    const row = await env.DB
      .prepare(`SELECT id FROM users WHERE ls_subscription_id = ? LIMIT 1`)
      .bind(lsId)
      .first<{ id: string }>();
    userId = row?.id ?? null;
  }
  // For order_refunded: look up the original order in billing_events to
  // find the user. (Refund events from LS arrive without custom_data.)
  if (!userId && lsType === 'orders' && lsId && eventName === 'order_refunded') {
    const row = await env.DB
      .prepare(
        `SELECT user_id FROM billing_events
         WHERE ls_order_id = ? AND user_id IS NOT NULL
         ORDER BY id DESC LIMIT 1`,
      )
      .bind(lsId)
      .first<{ user_id: string }>();
    userId = row?.user_id ?? null;
  }

  // ─── Compute the new tier (if applicable) ───────────────────────────────
  let appliedTier: Tier | null = null;
  let appliedExpiresAt: number | null = null;

  // Refund event handled explicitly — drops user to free regardless of
  // variant. We log the event always; tier change applies only if we
  // can resolve the user.
  if (eventName === 'order_refunded') {
    appliedTier = 'free';
    appliedExpiresAt = null;
  } else if (variantId) {
    const baseTier = variantToTier(env, variantId);

    if (eventName === 'subscription_created' || eventName === 'subscription_resumed') {
      if (baseTier === 'pro') {
        appliedTier = 'pro';
        appliedExpiresAt = isoToMs(attrs.renews_at);
      }
    } else if (
      eventName === 'subscription_updated' ||
      eventName === 'subscription_payment_success'
    ) {
      // payment_success arrives on each successful renewal — extends expiry.
      // updated arrives on plan changes / status flips.
      // Status governs whether it's active (renewing) or about to lapse.
      // 'on_trial', 'active', 'paused' (still grants access), 'past_due'
      // (grace period — keep Pro). Only 'cancelled', 'expired',
      // 'unpaid' should drop them (and even then, only at ends_at).
      const status = attrs.status ?? 'active'; // payment_success often omits status — treat as active
      if (['active', 'on_trial', 'paused', 'past_due'].includes(status) && baseTier === 'pro') {
        appliedTier = 'pro';
        appliedExpiresAt = isoToMs(attrs.renews_at) ?? isoToMs(attrs.ends_at);
      } else if (['cancelled', 'expired', 'unpaid'].includes(status)) {
        // Don't downgrade immediately — let user finish out their paid period.
        // If ends_at is missing (rare), DON'T set expires_at to now (would
        // immediately revoke). Leave appliedTier null so existing tier_expires_at
        // is preserved and effectiveTier() handles the eventual downgrade.
        const endsAtMs = isoToMs(attrs.ends_at);
        if (endsAtMs !== null) {
          appliedTier = 'pro';
          appliedExpiresAt = endsAtMs;
        }
        // else: skip update, audit-log only
      }
    } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      const endsAtMs = isoToMs(attrs.ends_at);
      if (endsAtMs !== null) {
        appliedTier = 'pro';
        appliedExpiresAt = endsAtMs;
      }
      // else: skip — see comment above
    } else if (eventName === 'order_created') {
      // One-time purchase = lifetime. We treat it as terminal: never expires.
      if (baseTier === 'lifetime') {
        appliedTier = 'lifetime';
        appliedExpiresAt = null;
      }
    }
  }

  // ─── Apply to user table (UPSERT — handle "paid before first sync") ─────
  // Use INSERT ... ON CONFLICT so a user who paid via Lemon Squeezy before
  // ever opening the extension's sync flow still gets their tier set. The
  // skeleton row's email/name come from LS; ensureUser() will overwrite
  // them with fresh Google values on first real sync.
  if (userId && appliedTier) {
    const now = Date.now();
    await env.DB
      .prepare(
        `INSERT INTO users (
           id, email, display_name, tier, tier_expires_at,
           ls_subscription_id, ls_customer_id, created_at, last_active_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           tier = excluded.tier,
           tier_expires_at = excluded.tier_expires_at,
           ls_subscription_id = COALESCE(excluded.ls_subscription_id, users.ls_subscription_id),
           ls_customer_id = COALESCE(excluded.ls_customer_id, users.ls_customer_id),
           -- Don't overwrite email/display_name if user already exists;
           -- ensureUser() pulls those fresh from Google on each sign-in.
           last_active_at = excluded.last_active_at`,
      )
      .bind(
        userId,
        // Skeleton-row defaults: use LS email/name. If LS didn't include them
        // (very old API versions), use a placeholder that ensureUser() will
        // overwrite on first sync.
        lsUserEmail ?? `pending+${userId.slice(0, 8)}@linguatab.local`,
        lsUserName ?? null,
        appliedTier,
        appliedExpiresAt,
        lsType === 'subscriptions' ? lsId : null,
        lsCustomerId,
        now, // created_at — only used if INSERT path runs
        now,
      )
      .run();
  }

  // ─── Always log to billing_events (audit trail) ─────────────────────────
  await env.DB
    .prepare(
      `INSERT INTO billing_events (
         user_id, event_name, ls_subscription_id, ls_order_id,
         ls_customer_id, ls_variant_id, applied_tier, applied_expires_at,
         raw_json, received_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      userId,
      eventName,
      lsType === 'subscriptions' ? lsId : null,
      lsType === 'orders' ? lsId : null,
      lsCustomerId,
      variantId,
      appliedTier,
      appliedExpiresAt,
      rawBody.length > 50_000 ? rawBody.slice(0, 50_000) : rawBody,
      Date.now(),
    )
    .run();

  return jsonResp({ ok: true, applied_tier: appliedTier });
}

// ─── Checkout-info handler ────────────────────────────────────────────────
/**
 * Returns the data the upgrade modal needs to construct a Lemon Squeezy
 * checkout URL. Auth required so we can prefill `email` and embed the
 * verified `user_id` in `custom_data`.
 *
 * Returns 503 if the store isn't configured yet (so the UI can show
 * "Payment temporarily unavailable" instead of breaking).
 */
async function handleCheckoutInfo(env: BillingEnv, user: VerifiedUser): Promise<Response> {
  const store = env.LEMON_SQUEEZY_STORE_URL;
  if (!store) {
    return jsonResp({ error: 'billing_not_configured' }, 503);
  }

  // Build the user-specific checkout URL for each available plan.
  // Pattern: https://{store}.lemonsqueezy.com/buy/{variant_id}
  //          ?checkout[custom][user_id]=...
  //          &checkout[email]=...
  //          &logo=0  (hide store logo for cleaner embed)
  const buildUrl = (variantId: string): string => {
    const u = new URL(`https://${store}.lemonsqueezy.com/buy/${variantId}`);
    u.searchParams.set('checkout[custom][user_id]', user.userId);
    u.searchParams.set('checkout[email]', user.email);
    u.searchParams.set('logo', '0');
    u.searchParams.set('media', '0');
    u.searchParams.set('desc', '0');
    return u.toString();
  };

  return jsonResp({
    plans: {
      pro_monthly: env.LEMON_SQUEEZY_VARIANT_PRO_MONTHLY
        ? {
            url: buildUrl(env.LEMON_SQUEEZY_VARIANT_PRO_MONTHLY),
            price_usd: env.PRICE_PRO_MONTHLY ?? null,
          }
        : null,
      pro_yearly: env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY
        ? {
            url: buildUrl(env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY),
            price_usd: env.PRICE_PRO_YEARLY ?? null,
          }
        : null,
      lifetime: env.LEMON_SQUEEZY_VARIANT_LIFETIME
        ? {
            url: buildUrl(env.LEMON_SQUEEZY_VARIANT_LIFETIME),
            price_usd: env.PRICE_LIFETIME ?? null,
          }
        : null,
    },
  });
}

// ─── Tier echo (auth'd quick lookup, used by useTier hook) ────────────────
/**
 * Quick endpoint for the client to ask "what tier am I?" without hitting
 * the heavier /sync/status (which also computes counts of every table).
 * Useful right after upgrade — UI calls this to refresh.
 */
async function handleTier(env: BillingEnv, user: VerifiedUser): Promise<Response> {
  if (!env.DB) return jsonResp({ tier: 'free', tier_expires_at: null });
  const row = await env.DB
    .prepare(`SELECT tier, tier_expires_at FROM users WHERE id = ?`)
    .bind(user.userId)
    .first<{ tier: Tier; tier_expires_at: number | null }>();
  return jsonResp({
    tier: effectiveTier(row),
    tier_expires_at: row?.tier_expires_at ?? null,
  });
}

// ─── Main router ──────────────────────────────────────────────────────────
export async function handleBillingRequest(
  req: Request,
  env: BillingEnv,
  user: VerifiedUser | null,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/billing/')) return null;

  // Webhook is the ONLY billing endpoint that doesn't need user auth (it's
  // authenticated via HMAC signature instead).
  if (url.pathname === '/billing/webhook' && req.method === 'POST') {
    return handleWebhook(req, env);
  }

  // All other billing endpoints require user auth.
  if (!user) {
    return jsonResp({ error: 'Auth required' }, 401);
  }

  if (url.pathname === '/billing/checkout-info' && req.method === 'GET') {
    return handleCheckoutInfo(env, user);
  }
  if (url.pathname === '/billing/tier' && req.method === 'GET') {
    return handleTier(env, user);
  }

  return jsonResp({ error: 'Billing endpoint not found' }, 404);
}
