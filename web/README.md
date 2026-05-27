# LinguTab Web (D-21)

Web app: landing + **admin dashboard** (manage users/roles, view learner
progress). Vite + React SPA on **Cloudflare Pages**, sharing the worker API +
D1 with the extension. No extension code is touched.

## Setup

```bash
cd web
npm install
cp .env.example .env.local   # fill in the two values below
npm run dev                  # http://localhost:5173
```

`.env.local`:
- `VITE_GOOGLE_CLIENT_ID` — a Google **Web** OAuth client ID. In
  console.cloud.google.com → APIs & Services → Credentials → create/edit an
  *OAuth client (Web application)* and add to **Authorized JavaScript origins**:
  `http://localhost:5173`, your `https://<project>.pages.dev`, and later
  `https://lingutab.com`.
- `VITE_WORKER_URL` — defaults to the prod worker.

## How auth works
Google Identity Services (browser) issues an OAuth **access token**; the app
sends it as `Authorization: Bearer …` to the worker, which already verifies
Google access tokens (same path the extension uses). The dashboard requires
the signed-in user's D1 role to be `admin` (set roles in the Users table — the
first admin is seeded in migration 13).

## Backend endpoints used (worker)
- `GET /exam/me` — who am I (role/tier)
- `GET /admin/users`, `POST /admin/users/role`, `GET /admin/users/:id/progress`,
  `GET /admin/stats` — admin only
- `GET/POST /exam/progress` — the extension mirrors learner progress here
  (migration `14_exam_progress.sql`)

## Deploy (Cloudflare Pages)
```bash
npm run build
npx wrangler pages deploy dist --project-name lingutab-web
```
Set the two `VITE_*` as Pages environment variables (Build settings). Point
`lingutab.com` at the Pages project in the Cloudflare dashboard when ready.

> ⚠️ Privacy (D-21): collecting children's age/data triggers COPPA/GDPR-K —
> update the Privacy Policy + parental consent before enabling age capture.
