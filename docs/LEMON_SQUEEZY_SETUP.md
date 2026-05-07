# Lemon Squeezy Setup — LinguTab Pro

End-to-end guide to wire up the Pro tier (introduced in v0.15.0).

The code is fully shipped — once you complete steps 1–4 below, the
`✨ Nâng cấp Pro` button in the new-tab UI will start opening real
checkout flows and the webhook handler will auto-grant Pro on payment.

---

## 1. Create a Lemon Squeezy account & store

1. Sign up at https://app.lemonsqueezy.com — free to start
2. Create a store (e.g. `linguatab`) — note the subdomain, you'll need it
3. Complete merchant onboarding (KYC, tax info)

> Test mode: every store starts in test mode. Use this for E2E tests
> before going live. Test cards: `4242 4242 4242 4242`, any future expiry.

---

## 2. Create products + variants

LinguTab v0.15.0 supports three plans. Create them as separate products
in Lemon Squeezy so each has its own variant ID:

| Plan          | Type           | Suggested price (USD) | Notes |
|---------------|----------------|-----------------------|-------|
| Pro Monthly   | Subscription   | `$4.99 / month`       | Cancel anytime |
| Pro Yearly    | Subscription   | `$39.99 / year`       | ~33% discount, the "best value" highlight |
| Lifetime      | Single payment | `$99 one-time`        | Limited-time launch offer |

For each variant, copy the **Variant ID** (a number, visible in the
URL when editing). You'll paste these as worker secrets in step 4.

> Skip Lifetime if you don't want to offer it — the Upgrade modal
> auto-hides plans whose variant ID isn't configured.

---

## 3. Configure the webhook endpoint

In Lemon Squeezy → **Settings → Webhooks → + Create**:

| Field            | Value |
|------------------|-------|
| Callback URL     | `https://lingua-newtab-worker.kspstudio.workers.dev/billing/webhook` |
| Signing secret   | Generate a strong random string — you'll paste this into worker too |
| Events to send   | Check all of: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `order_created` |

**Save the signing secret somewhere safe** — Lemon Squeezy only shows it once.

---

## 4. Set worker secrets + redeploy

Run from the `worker/` directory:

```bash
# Webhook HMAC secret (from step 3)
wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET

# Store subdomain — just the subdomain, not the full URL.
# e.g. for `https://linguatab.lemonsqueezy.com`, enter: linguatab
wrangler secret put LEMON_SQUEEZY_STORE_URL

# Variant IDs (from step 2). Skip any plan you don't offer.
wrangler secret put LEMON_SQUEEZY_VARIANT_PRO_MONTHLY
wrangler secret put LEMON_SQUEEZY_VARIANT_PRO_YEARLY
wrangler secret put LEMON_SQUEEZY_VARIANT_LIFETIME

# Display prices (informational, used by Upgrade modal). USD as a
# bare number — "4.99", "39.99", "99". No "$" prefix.
wrangler secret put PRICE_PRO_MONTHLY
wrangler secret put PRICE_PRO_YEARLY
wrangler secret put PRICE_LIFETIME

# Apply the new D1 migration
wrangler d1 execute lingua-newtab-metrics --remote \
  --file=src/db/migrations/09_billing.sql

# Deploy
npm run deploy
```

After deploy, hit `/billing/checkout-info` with a real user token —
should return per-plan URLs containing `checkout[custom][user_id]=...`.

---

## 5. End-to-end test (test mode)

Before going live:

1. Lemon Squeezy → **Settings** → confirm **Test mode** is ON
2. In Chrome, open a new tab → click `✨ Nâng cấp Pro` → choose any plan
3. The Lemon Squeezy checkout opens in a new tab
4. Pay with `4242 4242 4242 4242`, any future expiry, any CVC
5. Return to the LinguTab tab — the badge should flip from `⚡ Nâng cấp Pro`
   to `✨ PRO` within ~30s (focus event triggers `refreshTier()`)
6. Open Settings → Account → confirm Gói shows `Pro (đến <date>)`
7. Open story-gen modal — limit should show `30` instead of `3`

If anything fails, query the audit log:

```bash
wrangler d1 execute lingua-newtab-metrics --remote --command \
  "SELECT event_name, applied_tier, applied_expires_at, received_at
   FROM billing_events ORDER BY id DESC LIMIT 20"
```

You'll see exactly which webhook events arrived and which tier was applied.

---

## 6. Manual override (admin tool)

If a webhook fails to deliver and a paying user is stuck on Free, you can
manually upgrade them via the admin endpoint:

```bash
curl -X POST https://lingua-newtab-worker.kspstudio.workers.dev/admin/upgrade \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<google_sub>", "tier": "pro", "expires_at": 1764547200000, "reason": "manual_refund_replay"}'
```

`user_id` is the Google `sub` claim (visible in `/admin/users`).
`expires_at` is Unix ms; for `lifetime` you can pass `null`.

This is also the path Jason should use to test the Pro UI **before**
finishing Lemon Squeezy setup — flip yourself to `tier='pro'` and
confirm the Header badge, Account modal, and StoryGenModal all show
the right state.

---

## 7. Going live

Once all test flows work:

1. Lemon Squeezy → **Test mode → OFF**
2. Re-verify webhook delivery (LS sometimes resets webhook config on
   test/live toggle — check the URL is still pointed at the worker)
3. Start a real (small) purchase from a non-Jason Google account to
   verify production flow before announcing publicly

---

## Architecture notes

**Why custom_data + ls_subscription_id**: at checkout, Lemon Squeezy
hasn't created the customer/subscription yet, so we embed our user_id
in `checkout[custom][user_id]`. The first webhook payload includes it
back in `meta.custom_data.user_id`, and we persist the LS subscription
ID on the user row so subsequent `subscription_updated` /
`subscription_cancelled` events (which don't include custom_data) can
still find the right user via `WHERE ls_subscription_id = ?`.

**Why audit log**: webhooks fire multiple times under retries.
`billing_events` is append-only and idempotent applies make this safe.
If anything is ever in dispute, the raw payload + apply result for
every event is on disk forever.

**Tier expiry**: subscription_cancelled doesn't drop the user to free
immediately — they keep Pro until `tier_expires_at` passes. The
`effectiveTier()` helper folds that check into every quota lookup so
no separate downgrade cron is needed.
