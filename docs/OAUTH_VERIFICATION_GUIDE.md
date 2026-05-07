# OAuth Verification Guide — LinguaNewTab

End-to-end guide to remove the "unverified app" warning Google shows on the
consent screen and to display LinguaNewTab's name + logo properly to users
who sign in.

> **TL;DR for v0.15.x:** All 3 scopes the extension requests
> (`drive.appdata`, `userinfo.email`, `userinfo.profile`) are classified as
> **non-sensitive** by Google. We therefore only need **brand verification**
> (lighter-weight, ~3-5 business days) — not the full sensitive-scope
> verification with demo video and security assessment.

---

## What we're aiming for

Today, when a user clicks "Sign in with Google" inside LinguaNewTab, Chrome
shows them a generic OAuth consent screen with a yellow "unverified app"
banner — most Vietnamese users get scared and back out.

After verification:

- The yellow banner goes away
- The consent screen shows the LinguaNewTab logo + "By KSP Studio"
- Up to 100 user limit is removed (currently 100 unique sign-ins / day cap)

---

## Pre-flight checklist

Before submitting, you need:

- [x] **Privacy Policy** — `PRIVACY_POLICY.md`, deployed to a public URL
- [x] **Terms of Service** — `TERMS_OF_SERVICE.md`, deployed to a public URL
- [x] **Homepage** — `landing/index.html`, deployed to a public URL
- [ ] **Domain ownership** verified in Google Search Console
- [ ] All three URLs hosted on the **same domain** (Google's requirement)
- [ ] OAuth consent screen up-to-date with current app info

---

## Step 1 — Pick a domain and host the landing page

You need to host the `landing/` directory on a domain you own. Options:

### Option A — Cloudflare Pages with a custom domain (recommended)

1. Buy/use a domain you own. Suggestions:
   - `linguatab.com` — clean, brandable
   - `linguanewtab.com` — exact app name
   - Subdomain of a domain you already own, e.g. `linguatab.kspstudio.com`
2. Cloudflare dashboard → Workers & Pages → Pages → **Create project** →
   Direct upload → drag the `landing/` folder → deploy.
3. Pages → your project → Custom domains → Add → enter the domain → follow
   DNS instructions (CNAME or workers.dev).
4. After DNS propagates (~5 min), confirm `https://linguatab.com`,
   `https://linguatab.com/privacy.html`, and `https://linguatab.com/terms.html`
   all load correctly.

### Option B — `linguatab.pages.dev` (zero-config but ugly URL)

Skip step 3 — use the auto-generated `*.pages.dev` URL. Google **does**
accept `*.pages.dev` for verification; only downside is users see
"linguatab.pages.dev" instead of a branded domain in the consent screen.

> If you go with Option B, replace `linguatab.com` everywhere below with
> your actual `*.pages.dev` URL.

---

## Step 2 — Verify domain ownership in Search Console

Google requires the OAuth project owner to also be a verified owner of the
homepage domain via Search Console.

1. Go to <https://search.google.com/search-console>
2. **Add property** → **URL prefix** → enter `https://linguatab.com/`
3. Verification method:
   - Easiest if domain is on Cloudflare DNS: pick **Domain** instead of
     URL prefix, then add the TXT record Google gives you in Cloudflare DNS
   - Otherwise pick **HTML file** and upload `google<...>.html` to
     `landing/`, redeploy, then click Verify
4. Wait for the green check → domain is verified

> ⚠️ The Google account you use here MUST be the same Google account that
> owns the OAuth project (Step 3 below). If you have multiple accounts,
> double-check or you'll get "We can't approve your OAuth verification
> request until your site ownership verification is complete."

---

## Step 3 — Update the OAuth consent screen

Go to <https://console.cloud.google.com/> → select the LinguaNewTab project
→ APIs & Services → **OAuth consent screen**.

### App information

| Field | Value |
|-------|-------|
| App name | `LinguaNewTab` |
| User support email | `jasonnguyenksp@gmail.com` |
| App logo | Upload a 120×120 PNG (use `landing/icon-128.png` and resize) |

### App domain

| Field | Value |
|-------|-------|
| Application home page | `https://linguatab.com` |
| Application privacy policy link | `https://linguatab.com/privacy.html` |
| Application terms of service link | `https://linguatab.com/terms.html` |

### Authorised domains

Add: `linguatab.com` (or your `*.pages.dev` if Option B).

> Google often reformats this — make sure it's just the bare domain, no
> `https://`, no path.

### Developer contact

| Field | Value |
|-------|-------|
| Email addresses | `jasonnguyenksp@gmail.com` |

### Save

Click **Save and continue**. You don't need to change scopes yet — the
existing 3 scopes are correct.

---

## Step 4 — Switch from Testing to In Production

Same OAuth consent screen page → at the top, look for **Publishing status**
(or **Audience**, depending on which version of Cloud Console you have).

Currently it says **Testing**.

Click **Publish app** → confirm.

Status becomes **In production**.

> At this point any Google user can sign in (no longer limited to test
> users), but they will see the "unverified app" yellow banner until the
> next step completes.

---

## Step 5 — Submit for brand verification

Same OAuth consent screen page → if any of the consent screen elements (logo,
home URL, privacy/terms URLs) trigger verification, you'll see a **Prepare
for verification** button or a **Submit for verification** form.

Click it. Fill out:

- Confirm contact email
- Confirm domain ownership (auto-checks via Search Console)
- For each scope, confirm "I've read the API Services User Data Policy"

For non-sensitive scopes, no scope justification or demo video is required.
Click **Submit**.

You'll get an email from `oauth-noreply@google.com` confirming receipt.

---

## Step 6 — Wait

Brand verification typically takes **3–5 business days**. You can keep
developing in the meantime; sign-ins still work, they just show the
unverified banner.

If Google asks for clarification (rare for non-sensitive scopes), reply
**directly to the email** they sent you. Common asks:

- "Please confirm `drive.appdata` is the only Drive scope you use" — answer
  yes, paste the exact scope URL, link to source code where you call
  `gapi.client.drive.files.create({ parents: ['appDataFolder'] })`
- "Why does your extension need OAuth?" — paste a short paragraph about
  cloud sync (per-user sync of FSRS state across devices)

---

## Step 7 — Verify success

When verification completes:

- Email arrives: "Your app is now verified"
- Open a fresh Chrome profile (no cached consent), install LinguaNewTab,
  click Sign in
- Consent screen shows LinguaNewTab logo + "By KSP Studio" + green
  "verified" indicator
- No yellow "unverified" banner

---

## Troubleshooting

### "Domain ownership verification failed"

Most common cause: the Google account that owns the OAuth project is **not**
a verified owner of the domain in Search Console. Either add the OAuth
project owner as a Search Console owner, or use the same Google account in
both places.

### "Privacy Policy URL not accessible"

Google's automated check fetches the URL with a generic User-Agent. If your
hosting provider blocks bots, allow Google's verification User-Agent
(`Mozilla/5.0 (compatible; Google-OAuth-Verification/1.0)`) or use
Cloudflare Pages which has no bot blocking.

### Different scopes shown vs requested

Google compares the scopes declared in your OAuth consent screen
configuration against the scopes your extension actually requests. They
must match exactly. Check `manifest.json`:

```json
"oauth2": {
  "client_id": "...",
  "scopes": [
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

These three must be checked in the OAuth consent screen → Scopes section.

### Test users no longer work after publishing

Once you switch to **In production**, the **Test users** list becomes
irrelevant — every Google user can sign in. If you specifically want some
users to NOT see the unverified banner during the 3-5 day wait, add them as
test users BEFORE you click Publish.

---

## Future scope changes

If we later add a new sensitive or restricted scope (e.g. switching from
Drive `appDataFolder` to a different Drive scope, or adding Calendar/Gmail
integration), we'll need to **re-verify** with the heavier sensitive-scope
process — including a demo video and possibly a security assessment.

The clean path to avoid that: **stick with `drive.appdata`** for now (or
migrate to Cloudflare R2 → drop the Drive scope entirely, which would
*reduce* our verification footprint).
