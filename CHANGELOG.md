# Changelog

Format: [Semver](https://semver.org/) · Ngày theo `YYYY-MM-DD`.

## [1.7.3] — 2026-05-07

### 🐛 Sprint 4.9.5.3 — Fix worker admin dispatch + D1 binding

After v1.7.2 ship, Jason replaced worker/ folder + ran `wrangler deploy`. Two issues surfaced:

#### Issue 1: D1 binding missing from deploy

`worker/wrangler.toml` shipped with the D1 binding block COMMENTED OUT (it was a setup template instructing the reader to uncomment + paste their own database_id). Jason already had D1 set up so this was just a packaging mistake.

Result: After deploy, bindings showed `RATE_LIMITER, IMAGES, AI` but NO `DB`. All endpoints needing D1 (calibration, audio scripts, vision recaption) would fail with 503.

**Fix**: Uncommented the D1 block in `wrangler.toml` with the actual `database_id = "9729612b-2b94-4ad0-a708-2dfda0a379db"`. Future zips ship with D1 binding live.

#### Issue 2: `/admin/exam/*` returning 404 from wrong dispatcher

curl test still returned `{"error":"Admin endpoint not found"}` after correct deploy. Root cause: dispatcher ordering bug.

`worker/src/index.ts` flow:
```typescript
const adminResp = await handleAdminRequest(req, env);  // 1st
if (adminResp) return adminResp;
if (url.pathname.startsWith('/admin/exam/')) {         // 2nd (never reached)
  ...handleAdminExamRequest
}
```

`handleAdminRequest` (in `admin/handlers.ts`) catches every path starting with `/admin/`, then has a hardcoded routing table for `/admin/metrics`, `/admin/users` etc. For paths NOT in that table, it returned a 404 Response — not null. So the flow ended there and never reached `handleAdminExamRequest`.

This explains why ALL admin exam endpoints failed (recaption, calibration, audio script). The bug was latent since v1.4.0 (when calibration endpoints were added) — it just wasn't tested with curl until Jason did so for v1.7.0.

**Fix**: Made `handleAdminRequest` defer paths starting with `/admin/exam/` by returning `null`:

```typescript
export async function handleAdminRequest(req, env) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/admin/')) return null;
  // NEW: Defer /admin/exam/* to handleAdminExamRequest in index.ts
  if (url.pathname.startsWith('/admin/exam/')) return null;
  ...rest
}
```

Now `/admin/exam/scenes/park_kids/recaption` correctly falls through to the exam admin handler.

#### Files changed

- `worker/wrangler.toml` — D1 binding uncommented with real database_id
- `worker/src/admin/handlers.ts` — early return null for `/admin/exam/*`

#### Verify after applying

After replacing worker/ + deploy, bindings should show:
```
- D1 Databases:                ← Was missing in v1.7.2 deploy
  - DB: lingua-newtab-metrics
- KV Namespaces:
  - RATE_LIMITER: ...
- R2 Buckets:
  - IMAGES: lingua-newtab-images
- AI: ...
- Vars: AUDIO_CACHE_VERSION=v4, SCENE_CACHE_VERSION=v4
```

Curl test should now return:
```bash
{"ok":true,"sceneId":"park_kids","script":"Look at the picture...",...}
```

Or if scene image not yet in R2 v4:
```bash
{"error":"Scene image not in R2: exam-scenes/v4/park_kids.jpg",...}
```

(The latter means worker is fine; just need to warm the v4 scene cache.)

#### Lessons learned

1. **Worker/ folder updates not in update.sh** — Jason had to manually replace. Backlog: extend update.sh to handle worker/.
2. **Wrangler.toml setup-template in shipped zip** — wrangler.toml D1 block was commented "for first-time setup". Should ship with binding live + a separate setup doc.
3. **Catch-all 404 dispatchers eat valid paths** — handleAdminRequest claimed "returns null if not admin path" but actually returned 404 for unknown admin paths. Two fixes: (a) early-return null for known sibling routes (this fix), (b) move all admin routing into a single dispatcher.

## [1.7.2] — 2026-05-07

### 🐛 Sprint 4.9.5.2 — Fix "Failed to fetch" on admin endpoints

User feedback after v1.7.1:
> Khi nhấn "Auto-caption từ image hiện tại" hoặc các nút khác đều là ❌ Failed to fetch.
> Các nút Lưu script, Lưu calibration không nhấn được.

#### Root cause

When I created `examCalibrationService.ts` (v1.4.0) and `examAudioScriptService.ts` (v1.6.0), I used:

```typescript
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';
```

But `VITE_WORKER_URL` was **never defined** — no `.env` file in the project sets it. So `WORKER_URL = ''` and all fetch URLs became relative paths like `/admin/exam/calibration/level1/lvl1_p1` which don't resolve to the worker. Browser tries to fetch from extension origin → CORS / ERR_FAILED.

Other services in the codebase (`examAudioService`, `examSceneService`, `storyGenService`, `r2ImageService`) all hardcode the URL:

```typescript
const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';
```

I should have followed the existing pattern. My bad — this was a copy-paste mistake from a different project template. Fixed now.

#### Files fixed

- `src/services/examCalibrationService.ts` — hardcoded URL
- `src/services/examAudioScriptService.ts` — hardcoded URL
- `src/newtab/components/ExamPartView.tsx` — hardcoded URL in vision recaption fetch (was using inline `import.meta.env.VITE_WORKER_URL || ''`)

All 6 admin endpoints affected by this bug:
- `GET /exam/calibration/:levelId/:partId` (public read)
- `POST /admin/exam/calibration/:levelId/:partId` (Lưu calibration)
- `DELETE /admin/exam/calibration/:levelId/:partId`
- `GET /exam/audio-script/:levelId/:partId` (public read)
- `POST /admin/exam/audio-script/:levelId/:partId` (Lưu script)
- `DELETE /admin/exam/audio-script/:levelId/:partId`
- `POST /admin/exam/scenes/:sceneId/recaption` (Vision auto-caption)

After fix, all use `https://lingua-newtab-worker.kspstudio.workers.dev/...`.

#### Why selftest didn't catch this

Selftest only verifies UI renders correctly — doesn't actually click admin save/recaption buttons (would require auth setup + worker mocking). Adding integration test for admin endpoints is on the backlog (`worker/test/admin-endpoints.test.ts`).

#### Verify after deploying v1.7.2

DevTools → Network tab → click "🧠 Auto-caption từ image hiện tại" → check the request URL:
- ✅ Correct: `https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/park_kids/recaption`
- ❌ Bug (v1.7.0/v1.7.1): `chrome-extension://nfcohf.../admin/exam/scenes/park_kids/recaption`

If still seeing the chrome-extension URL → extension has cached old assets. Disable + enable extension in `chrome://extensions/` to force fresh load.

#### Worker deploy still required for vision endpoint

The `/admin/exam/scenes/:sceneId/recaption` endpoint was added in v1.7.0 worker handler but the worker may not have been deployed since then. Verify with:

```bash
curl -X POST https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/park_kids/recaption \
  -H "Authorization: Bearer 5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212" \
  -H "Content-Type: application/json" \
  -d '{"levelId":"level1","partId":"lvl1_p1","exampleZoneId":"zone_tl","nameForZone":{"zone_tl":"Ben","zone_tm":"Sue","zone_tr":"Dan","zone_bl":"Pat","zone_bm":"Bob"}}'
```

- 401 → wrong token (shouldn't happen with the one above)
- 404 → endpoint not deployed yet (run `wrangler deploy`)
- 200 with JSON containing `script` → working

## [1.7.1] — 2026-05-07

### 🛠️ Sprint 4.9.5.1 — Email-based admin mode + auto-expand vision UI

User feedback after v1.7.0:
> Super admin mỗi lần phải thao tác bật admin mode, copy cái này nhiều lần "sessionStorage.setItem('admin_token', '...')" rất phiền phức. Mình cần với email của mình vào bật lên trong cài đặt thôi.
> Tính năng audio caption hiện tại chưa thấy hiển thị "🧠 Auto-caption từ image hiện tại" khoàn toàn không thấy.

Two UX issues. Both fixed.

#### Fix 1: Email-based admin mode (no more DevTools)

Workflow before: Open DevTools → paste sessionStorage.setItem command → reload → admin features visible. Repeat every session.

Workflow after: Sign in with admin email → admin features auto-visible. Toggle off in Account Settings if needed.

**Implementation**:

New file `src/services/adminModeService.ts`:
```typescript
const ADMIN_EMAILS = ['jasonnguyenksp@gmail.com', 'dungthichvar@gmail.com'];

export function isAdminEmail(email: string | null): boolean { ... }
export function isAdminActive(email: string | null): boolean { ... }
export function provisionAdminToken(email: string | null): void {
  if (isAdminActive(email)) sessionStorage.setItem('admin_token', TOKEN);
  else sessionStorage.removeItem('admin_token');
}
export function setAdminEnabled(enabled: boolean, email: string | null): void { ... }
```

`App.tsx` calls `provisionAdminToken(status.user.email)` on:
- Mount (covers page reload)
- Auth state change (covers fresh sign-in)
- Sign-out (clears token)

**Settings UI** in Account Settings modal — only renders if signed-in email matches:

```
🛠️ Super Admin
Tài khoản này có quyền admin. Khi bật, các tính năng admin (calibration,
edit audio script, vision auto-caption) sẽ hiện trong Phòng thi.

Admin mode: BẬT                              [✕ Tắt admin mode]
```

State persists in `localStorage.linguanewtab.admin_disabled`.

**Security trade-off acknowledged**: Admin token is now in client code (extension JS), readable by anyone who unzips. Acceptable for current dev/private build phase. Sprint 5.0 (CWS submission) will replace with Google ID token verification at worker level — admin endpoints will check user.email against ADMIN_EMAILS env var, no static token needed.

#### Fix 2: Vision section auto-visible

Issue: AdminAudioScriptEditor was collapsed by default, with vision auto-caption section nested inside the expanded view. Admin had to click "▸ 📝 ADMIN: Edit audio script" to see the vision buttons.

Fix: Editor now auto-expands when admin mode is active. Single line change:
```typescript
const [expanded, setExpanded] = useState(true);  // was false
```

Vision section is the most-used admin feature, doesn't make sense to hide it behind a click.

#### Files added

- `src/services/adminModeService.ts` — admin email config + provisioning logic

#### Files changed

- `src/newtab/App.tsx`:
  - Imports `fetchSyncStatus`, `provisionAdminToken`
  - Calls `provisionAdminToken(email)` on mount + auth change
  - Falls back to `provisionAdminToken(null)` on signed-out / network error
- `src/services/examCalibrationService.ts`:
  - Updated `isAdminMode()` doc comment (logic unchanged — still checks token)
- `src/newtab/components/AccountSettingsModal.tsx`:
  - Imports admin mode helpers
  - Added `<AdminModeSection email={status.user.email} />` after account info
  - New `AdminModeSection` component at bottom of file — renders only if email is admin
- `src/newtab/components/ExamPartView.tsx`:
  - `AdminAudioScriptEditor` initial `expanded` state: `false` → `true`

#### How to use (post-deploy)

For Jason / dungthichvar:
1. Sign in with `jasonnguyenksp@gmail.com` or `dungthichvar@gmail.com`
2. Admin features auto-appear in Phòng thi tab
3. To disable temporarily: Header → Account → Super Admin section → "✕ Tắt admin mode"
4. To re-enable: same place → "✓ Bật admin mode"

#### Self-test

```
[Page 4 Admin] script editor toolbar visible ✓
[Page 4 Admin] script editor expanded — 1 textarea(s) rendered ✓
```

(textarea count is 1 instead of 2 because editor no longer needs separate
expand step — just renders directly visible.)

## [1.7.0] — 2026-05-07

### 🧠 Sprint 4.9.5 — Vision auto-caption (workers AI)

User feedback after v1.6.0:
> Cách đổi Audio này có vẻ không hợp lý, nhưng vẫn cứ giữ lại đi sau có thể dụng. Nhưng hãy cùng cách tiếp cận khác, sau khi tạo hình thì Hãy cho AI xem lại hình mới tạo và liệt kê đặc trưng làm mô tả cho âm thanh.

Excellent suggestion. Manual edit (v1.6.0) doesn't scale to 60 levels. Vision model auto-caption does — and it's accurate because it describes the actual rendered pixels, not the prompt that was sent to Flux.

#### Architecture

```
[Admin clicks "Auto-caption from current image"]
       ↓
POST /admin/exam/scenes/park_kids/recaption
  body: { levelId, partId, nameForZone, exampleZoneId }
       ↓
[Worker]
  1. Fetch image bytes from R2: exam-scenes/v4/park_kids.jpg
  2. Call @cf/meta/llama-3.2-11b-vision-instruct with prompt:
       "Describe each child in this 3×2 grid. Format:
        wearing [color] [item] and [activity]. Output JSON only."
  3. Parse {tl,tm,tr,bl,bm,br} from vision response
  4. Build Cambridge-YLE script:
       "Look at the picture. Listen and look. There is one example.
        Ben is wearing a red shirt and is flying a yellow kite. ..."
  5. INSERT OR REPLACE into D1 exam_audio_scripts
       ↓
[Audio cache key includes script hash]
       ↓
[Next time user plays audio → fresh TTS gen with vision-derived script]
```

#### Two modes

1. **Auto-caption from current image** — fast (~2-5s), uses whatever's already in R2
2. **Regenerate image + auto-caption** — full pipeline (~10-15s), re-runs Flux first

Mode 2 useful when admin wants to try a different render seed before captioning.

#### Vision model output design

Constrained JSON to avoid free-form parsing issues:

```json
{"tl":"wearing a red shirt and flying a yellow kite",
 "tm":"wearing a blue dress and reading a book",
 "tr":"wearing a green hat and kicking a soccer ball",
 "bl":"wearing a yellow t-shirt and riding a bicycle",
 "bm":"wearing a pink sweater and eating an ice cream",
 "br":"wearing an orange shirt and drawing with crayons"}
```

Output cleanup uses regex to extract first `{...}` block in case vision wraps with markdown fences or adds prose.

#### Files added

- (none — vision logic added to existing `worker/src/exam/handlers.ts`)

#### Files changed

- `worker/src/exam/handlers.ts`:
  - Added `captionGridScene()` — vision model wrapper
  - Added `buildAudioScriptFromVision()` — formats Cambridge YLE script
  - Added `adminRecaptionScene()` — endpoint handler
  - Wired route `POST /admin/exam/scenes/:sceneId/recaption`
- `src/newtab/components/ExamPartView.tsx`:
  - `AudioPlayer` now passes `page` to editor
  - Added `buildNameForZone()` helper
  - `AdminAudioScriptEditor` accepts `recaptionContext` prop
  - Renders purple vision section with 2 buttons (auto-caption / regen+caption)
  - Editor textarea pre-fills with vision-generated script after success

#### Cost estimate

- Vision model: ~3 neurons per call (free tier 10k/day)
- 60 levels × 1 drag part = 60 calls = 180 neurons → essentially free
- Flux regeneration: ~10 neurons per call (already part of existing budget)
- TTS regeneration after script change: ~$0.30/1k chars × ~500 chars = ~$0.15 per audio
  - Only if user plays the audio after admin recaption

#### Workflow recommendation

For each level that has audio/image mismatch:
1. Open exam Part 1 in admin mode
2. Expand "📝 ADMIN: Edit audio script"
3. Click "🧠 Auto-caption từ image hiện tại"
4. Wait ~3s — script auto-fills in textarea
5. Review/tweak if vision missed something
6. Click "💾 Lưu script" if manual tweaks were made (auto-caption already saved)

For pristine setup of new levels:
1. Click "🎨 Tạo image mới + auto-caption" → fresh Flux + vision in one go

#### Edge cases handled

- Vision model returns malformed JSON → log + 502 error, don't crash
- Missing zones in vision output → 502 with detail
- Image not in R2 → 404 with hint to generate first
- Vision available but model fails → 502, manual edit still works as fallback

#### What still requires manual work

- Levels NOT using grid scenes (write/tick/colour parts) — vision auto-caption only handles 6-character grid
- Movers/Flyers with more complex scenes (TBD if grid pattern still applies)

These remain manually editable via v1.6.0 textarea.

## [1.6.0] — 2026-05-07

### 🎙️ Sprint 4.9.4 — Admin-editable audio scripts (D1 override)

User feedback after v1.5.1:
> Audio mô tả hoàn toàn sai với hình được generate ra. Có cách nào fix vấn đề này.

#### Root cause

Hardcoded audio scripts in `levels.ts` describe characters that AI Flux is *prompted* to render, but Flux is non-deterministic — actual rendered images often diverge significantly from prompts. So:
- Audio: "Tom is wearing a red shirt and is flying a yellow kite"
- Image: shows different clothing/activities/positions

Mismatch breaks Cambridge YLE listening exercise — kid hears one thing, sees another.

#### Why "regenerate audio from image" doesn't work

User suggested: generate audio first, use audio as image prompt. But that's already what we do — same source describes both. The issue isn't the source; it's that Flux Schnell is fast/free/non-deterministic. To be perfectly deterministic we'd need:
- DALL-E 3 ($0.04/image, much more prompt-faithful) or
- Vision model captioning the actual generated image (extra neurons cost) or
- Manual human curation (this sprint's choice)

#### Solution: human-in-the-loop overrides

Admin views actual AI-generated image, edits audio script to match what they see, saves to D1. All users get the matching script + audio.

**Architecture** (mirrors Sprint 4.9 calibration):
```
Public read:  GET    /exam/audio-script/:levelId/:partId  → { script: string | null }
Admin write:  POST   /admin/exam/audio-script/:levelId/:partId
Admin reset:  DELETE /admin/exam/audio-script/:levelId/:partId
```

D1 table `exam_audio_scripts` (PK `level_id, part_id`).

**Frontend logic**:
1. AudioPlayer fetches override via `getEffectiveAudioScript(levelId, partId, defaultScript)`
2. Returns override if D1 has one, else hardcoded `defaultScript`
3. Hash of effective script becomes part of audio cache key (Sprint 4.9.3)
4. → Editing script automatically invalidates audio cache → fresh TTS gen

**Admin UI**:
- Collapsible toolbar below audio player (only visible in admin mode)
- Textarea prefilled with current script (override or default)
- Save/Default/Delete buttons
- "● Chưa lưu" indicator when textarea differs from saved state
- "override active" badge when D1 has override

#### Files added

- `worker/src/db/migrations/11_exam_audio_scripts.sql`
- `src/services/examAudioScriptService.ts` — get/save/delete + cache

#### Files changed

- `worker/src/exam/handlers.ts`:
  - Added `getAudioScriptPublic`, `adminSaveAudioScript`, `adminDeleteAudioScript`
  - Routing wired into `handleExamRequest` + `handleAdminExamRequest`
- `src/newtab/components/ExamPartView.tsx`:
  - `AudioPlayer` now takes `levelId`, `partId` props
  - Calls `getEffectiveAudioScript()` before TTS request
  - Renders `AdminAudioScriptEditor` below player when admin mode active
  - New `AdminAudioScriptEditor` component: collapsible textarea with Save/Default/Reset

#### Deployment

After applying v1.6.0:
```bash
cd worker
wrangler d1 execute lingua-newtab-metrics --remote \
  --file=src/db/migrations/11_exam_audio_scripts.sql
wrangler deploy
```

Then for each scene that doesn't match audio:
1. Open exam in admin mode
2. Click "📝 ADMIN: Edit audio script" to expand
3. Look at the actual image, edit textarea to describe what's there
4. Click "💾 Lưu script" → audio regenerates with new text

#### Workflow recommendation

Don't try to fix all 60 levels at once. Calibration order:
1. Calibrate Starters levels 1-5 first (most-used by new users)
2. Test with real users → see which levels they struggle with → fix those
3. Movers/Flyers calibrate later (lower priority since locked behind progression)

Or use a simpler approach: keep Flux as-is for now, override only the 5-10 levels that matter most for first-impression UX.

#### Future automation (deferred)

Sprint 4.10+: Vision model integration. Workers AI has `@cf/meta/llama-3.2-11b-vision-instruct`. Could:
1. Generate scene image with Flux
2. Auto-call vision model to describe each grid position
3. Pre-fill admin textarea with vision-generated description
4. Admin reviews/edits, saves

This would reduce admin manual work to "review & approve" instead of "type from scratch". Not required for launch — current manual flow works.

## [1.5.1] — 2026-05-06

### 🔧 Sprint 4.9.3 — Audio cache: hash audioScript into key

User feedback after v1.5.0:
> Tải bản mới nhất về rồi, nhưng sao âm thanh vẫn còn cache cũ không có audio mới vẫn miêu tả nhân vật theo vị trí.

Root cause: Audio cache key was `exam-audio/{version}/{provider}/{audioKey}` where `audioKey = "level1/p1"`. Cache version bump (v3 → v4) DID invalidate old keys, BUT only if the worker was deployed with the new env var. If worker wasn't redeployed, production still ran v3 → still served old audio.

Even if worker was redeployed, future audioScript changes would silently serve stale audio because `audioKey` doesn't reflect script content.

#### Fix: Hash audioScript into cache key

New cache key: `exam-audio/{version}/{provider}/{audioKey}.{scriptHash}`

Where `scriptHash` = first 8 hex chars of SHA-256(audioScript). Now any audioScript change → different hash → new cache key → cache miss → regenerate.

This is defense in depth on top of `AUDIO_CACHE_VERSION`. The version still works for global invalidation; the hash protects against per-key staleness.

#### Frontend blob cache also fixed

`src/services/examAudioService.ts` had in-memory `blobCache` keyed by `audioKey` only. Same problem: script change → blob cache returns old audio. Now keyed by `audioKey + scriptHash`.

#### Files changed

- `worker/src/exam/handlers.ts`:
  - Added `sha256Short()` helper using Web Crypto SubtleCrypto
  - Both lookup + write use `${audioKey}.${scriptHash}` suffix
  - Response header `X-Cache-Key` exposes full key for debugging
- `src/services/examAudioService.ts`:
  - Added `scriptHash()` helper
  - `getAudioUrl()` cache key now `${audioKey}::${hash}`

#### Migration / behavior after deploy

- All existing v4 cached audio (from v1.5.0 if any was generated) becomes orphaned — no key matches new scheme
- First user to hit each (audioKey, audioScript) pair → triggers fresh TTS gen → caches under new key
- Old orphan keys stay in R2 indefinitely (~MB of waste, ignorable)
- Future audioScript edits auto-invalidate without manual cache version bump

#### Why this wasn't done from the start

Original design assumed audioScripts are stable per audioKey. The reality is admin tweaks copy frequently (vocabulary changes, typo fixes, pedagogical rewrites). Hash-based invalidation makes the cache robust to those edits.

## [1.5.0] — 2026-05-05

### 🎓 Sprint 4.9.2 — Audio scripts: appearance + activity / Part 4 calibration

User feedback after v1.4.1:

> Sao cái audio phần part 1 generate ra xàm vậy? Phần Audio Mô tả nhân vật cho đúng ngoại hình để trẻ học chứ mô tả right on the left, top of the right, bottom....chi vậy?
> Yêu cầu mô tả đúng như hình AI tạo ra, ví dụ như tóc nâu, đang thả diều, đang đọc sách, đang chạy xe đạp.

> Tại part 4 tại sao mình là Super Admin lại không chỉnh được vị trí của khung để tô màu như part 1? Yêu cầu phải cho chỉnh vị trí kéo di chuyển về đúng chỗ cần tô màu, sau đó lưu lại và những lần sau phải được lấy từ Database ra không phải kéo thả lại chỉnh vị trí lại.

Two pedagogical/UX fixes shipped together.

#### Fix 1: Audio scripts now describe appearance + activity

Old (Sprint 4.7.3 — position-based):
> "Tom is in the top-left of the picture. Sue is in the top-middle. Dan is in the top-right..."

This is useless for vocabulary learning — kids just count grid cells.

New (Sprint 4.9.2 — trait-based):
> "Tom is wearing a red shirt and is flying a yellow kite.
> Sue is wearing a blue dress and is reading a book.
> Dan is wearing a green hat and is kicking a soccer ball."

Now teaches Cambridge YLE Starters vocabulary:
- **Colors**: red, blue, green, yellow, pink, orange, purple, brown
- **Clothing**: shirt, dress, hat, sweater, t-shirt, swimsuit, hair bow, party hat
- **Verbs+ing**: flying, reading, kicking, riding, eating, drawing, swimming, etc.
- **Nouns**: kite, book, soccer ball, bicycle, ice cream, crayons, sandcastle, etc.

#### Single source of truth for scene + audio

New file `src/data/exam/sceneCharacters.ts` defines each scene's 6 characters with traits:

```typescript
export const PARK_KIDS_CHARS: SceneCharacterSet = {
  setting: 'children playing at a sunny park',
  background: 'Park background with green grass, trees, blue sky.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl',
      clothing: 'wearing a red shirt',     activity: 'flying a yellow kite' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm',
      clothing: 'wearing a blue dress',    activity: 'reading a book' },
    // ... 4 more characters
  ],
};
```

Two helper functions derive both:
1. `buildScenePrompt(chars)` → AI Flux scene prompt (used by worker scenes.ts)
2. `buildDragNameAudioScript(chars, nameMap, exampleId)` → TTS audio script

Now scene prompts and audio scripts can never go out of sync.

#### 6 drag scenes redesigned

- **park_kids**: kite/book/soccer/bicycle/ice cream/crayons
- **beach_family**: sandcastle/towel/kite/seashells/swimming/umbrella
- **classroom**: blackboard/textbook/raising hand/notebook/tablet/sandwich
- **playground**: slide/swing/climbing/jump rope/hopscotch/soccer
- **kitchen_baking**: egg/flour/spoon/cookie cutter/cupcakes/cookie tray
- **birthday_party**: candles/balloon/present/cake slice/juice/party horn

#### Cache version bumped v3 → v4

`AUDIO_CACHE_VERSION` and `SCENE_CACHE_VERSION` in `worker/wrangler.toml` bumped to `v4`. After deploy:
- Old cached audio (position-based scripts) ignored
- Old cached scenes (clothing-only prompts) ignored
- Worker generates new audio with appearance descriptions on first user request
- Admin should run `/admin/exam/scenes/warm-all` to pre-generate v4 scenes

#### Fix 2: Part 4 (Colour) calibration

Same drag-resize tool now works for Part 4. Previously color region positions were hardcoded in `getRegionHotspot()` for `garden_objects_outline` only — bedroom/farm scenes had NO clickable regions at all (returned `null`).

**Architecture changes**:

`ColourPart.regions` now carries x/y/width/height coords:
```typescript
regions: { id: string; label: string; x: number; y: number; width: number; height: number }[]
```

`ColourPart.example` also carries coords:
```typescript
example: { regionId: string; color: string; x, y, width, height: number }
```

**Default coords** added to all 3 colour scenes (garden, bedroom, farm) in `levels.ts`. Admin calibrates per actual AI-rendered scene.

**ColourView refactored**:
- Reuses existing `CalibrationZone` component from DragNameView
- Admin mode shows toolbar with full reference: `bed = pink (ví dụ)`, `teddy = brown`, `lamp = yellow`, etc.
- Hides color palette in admin mode (admin doesn't color, just calibrates)
- Save → POST `/admin/exam/calibration/levelN/lvlN_p4` → D1
- Public read → GET → all users see calibrated regions

#### Files added

- `src/data/exam/sceneCharacters.ts` — character registry + builders

#### Files changed

- `src/types/exam.ts` — `ColourPart.regions` + `example` got coords
- `src/data/exam/levels.ts`:
  - `buildGridDragPart` uses `buildDragNameAudioScript` instead of inline string
  - `makeParkDragPart`, `makeBeachDragPart` collapsed to 1-line delegates
  - `makeGardenColourPart`, `makeBedroomColourPart`, `makeFarmColourPart` got region coords
- `worker/src/exam/scenes.ts` — 6 drag scene prompts rewritten with activities
- `worker/wrangler.toml` — cache versions v3 → v4
- `src/newtab/components/ExamPartView.tsx`:
  - `ColourView` accepts `levelId` prop
  - `ColourView` admin mode renders `CalibrationZone` for each region
  - `ColourView` toolbar with answer reference (color name per region)
  - Color palette hidden in admin mode
- `src/newtab/components/ExamSession.tsx` — already passes `levelId` (Sprint 4.9)

#### Self-test

```
[Page 1 PlanetsScreen] planet/card gap: 66.0px ✓
[Page 2 Roadmap] level 1 node visible ✓
[Page 3 ExamSession] LISTENING label visible ✓
[Page 4 Admin mode] toolbar visible ✓
[Page 4 Admin mode] 6 resize handles rendered ✓
✓ All pages rendered successfully
```

#### Deployment notes

After applying v1.5.0:

1. Deploy worker with new cache versions:
   ```bash
   cd worker
   wrangler deploy
   ```

2. (Optional) Pre-warm new v4 scenes via admin endpoint:
   ```bash
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/warm-all
   ```
   Generates 12 fresh scenes (~30s × 12 = 6 min total). Old v3 scenes stay
   in R2 but are unreferenced — clean up later if needed.

3. Calibrate Part 4 regions per scene via admin mode — defaults are
   reasonable but won't match exact AI-rendered positions.

## [1.4.1] — 2026-05-05

### 🛠️ Sprint 4.9.1 — Calibration UX: show character names

User feedback after v1.4.0:
> zone_tl, zone_tm, zone_tr.... Vậy làm sao biết cái ô nào là của đáp án trên (ví dụ cần kéo Sue, Dan, Pat, Bob) thì kéo ô nào mới đúng?

Right — admin nhìn `zone_tl` không biết zone đó của Sue hay Dan. Phải lookup từ `correctMapping` (name → zoneId) để show character name trên zone.

#### Changes

**1. Build zone-to-name lookup**

```typescript
const zoneNameLookup = useMemo(() => {
  const m: Record<string, string> = {};
  m[part.exampleZoneId] = part.exampleName;
  for (const [name, zoneId] of Object.entries(part.correctMapping)) {
    m[zoneId] = name;
  }
  return m;
}, [...]);
```

**2. CalibrationZone shows character name prominently**

Each zone in admin mode displays:
- **Big pill**: Character name (e.g., "Sue" purple, "Ben" coral for example)
- **Small pill below**: zone_id reference (e.g., "zone_tm")
- **Tooltip**: Full coords + zone_id

**3. Toolbar shows answer mapping**

Admin sees full reference at top:
```
Đáp án:  Ben = zone_tl (ví dụ)  Sue = zone_tm  Dan = zone_tr  Pat = zone_bl  Bob = zone_bm
```

Now admin scans audio script + this row to know exactly where to drag each zone.

#### Edge case: orphan zones

If a level has fewer names than the 6-zone grid (e.g., level1 uses only 4 names + 1 example = 5 zones used), the unused zone shows `?` as displayName. Admin can either:
- Position it offscreen / overlap with used zone (will never receive a drop)
- Future Sprint 4.9.2: hide zones not in `correctMapping` from UI

#### Files changed

- `src/newtab/components/ExamPartView.tsx`:
  - `DragNameView`: added `zoneNameLookup` memo
  - `CalibrationZone`: accepts `displayName` prop, renders name pill + zone_id subtitle
  - Toolbar: added "Đáp án" reference row showing all `name = zone_id` pairs

#### Self-test

```
[Page 4 Admin mode] toolbar visible ✓
[Page 4 Admin mode] 6 resize handles rendered ✓
```

Visual screenshot confirms character names display correctly on all zones.

## [1.4.0] — 2026-05-05

### 🛠️ Sprint 4.9 — Admin Calibration Tool (drop zone drag-resize)

Drop zones cho Phòng thi Part 1 (drag-name) trước đây hardcoded 3×2 grid trong `levels.ts`. AI Flux scenes thật không guarantee characters đứng đúng vị trí grid → kéo tên không trúng người.

Calibration tool fix triệt để: admin (Jason) drag-resize từng zone trên scene thật → save vào D1 → mọi user xem zones calibrated.

#### Architecture

```
                    ┌─────── ADMIN ───────┐
                    │ sessionStorage      │
                    │ admin_token = ...   │
                    └──────────┬──────────┘
                               │ enables
                               ▼
┌─────────────────────────────────────────────┐
│  ExamPartView.DragNameView                   │
│   ├─ getCalibration() → fetch on mount       │
│   ├─ mergedZones = override ?? hardcoded     │
│   └─ adminMode → render <CalibrationZone/>   │
│       with 4 corner handles + drag-move      │
└────────────┬────────────────────────────────┘
             │ POST { zones: [...] }
             ▼
┌─────────────────────────────────────────────┐
│  Worker: /admin/exam/calibration/...         │
│   ├─ Validates Bearer ADMIN_TOKEN            │
│   ├─ Validates zone coords are 0-1 fractions │
│   └─ D1 batch INSERT OR REPLACE              │
└────────────┬────────────────────────────────┘
             ▼
        ┌──────────────────────────┐
        │  D1: drop_zone_overrides  │
        │  PK (level_id,part_id,    │
        │       zone_id)            │
        └──────────────────────────┘
                  ▲
                  │ public read
                  │
        Public GET /exam/calibration/:levelId/:partId
                  ▲
                  │ no auth, all clients
                  │
            All users → see calibrated zones
```

#### Files added

- `worker/src/db/migrations/10_drop_zone_overrides.sql` — D1 schema
- `src/services/examCalibrationService.ts` — frontend API service (get/save/delete)
- `docs/admin-calibration.md` — admin usage guide

#### Files changed

- `worker/src/exam/handlers.ts`:
  - `getCalibrationPublic()` — public GET endpoint
  - `adminSaveCalibration()` — admin POST upsert (validates 0-1 coords)
  - `adminDeleteCalibration()` — admin DELETE reset
  - Routing wired into `handleExamRequest` + `handleAdminExamRequest`
- `src/newtab/components/ExamPartView.tsx`:
  - `DragNameView` accepts `levelId` prop, fetches overrides on mount
  - Merge logic: override coords win, hardcoded labels kept
  - Admin mode (sessionStorage `admin_token` set) → renders `<CalibrationZone/>` with pointer-event drag-resize handlers
  - 4 corner resize handles, center drag-to-move, min size 4%, clamp 0-1
  - "Lưu calibration" toolbar with dirty indicator
- `src/newtab/components/ExamSession.tsx` — passes `levelId={`level${level.levelNumber}`}` to ExamPartView

#### Worker endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/exam/calibration/:levelId/:partId` | Public |
| POST | `/admin/exam/calibration/:levelId/:partId` | Bearer ADMIN_TOKEN |
| DELETE | `/admin/exam/calibration/:levelId/:partId` | Bearer ADMIN_TOKEN |

#### Self-test verification

```
[Page 1 PlanetsScreen] planet/card gap: 66.0px ✓
[Page 2 Roadmap] level 1 node visible ✓
[Page 3 ExamSession] LISTENING label visible ✓
[Page 4 Admin mode] toolbar visible ✓
[Page 4 Admin mode] 6 resize handles rendered ✓
✓ All pages rendered successfully
```

Selftest now extends to admin mode: sets `sessionStorage.admin_token = 'test-token-fake'`, reloads, navigates back into exam, verifies admin toolbar + resize handles render.

#### Deployment notes

After applying v1.4.0, run D1 migration on production:

```bash
cd worker
wrangler d1 execute lingua-newtab-metrics --remote \
  --file=src/db/migrations/10_drop_zone_overrides.sql
wrangler deploy
```

Frontend update via update.sh as usual.

## [1.3.7] — 2026-05-05

### 🔄 Sprint 4.8.7 — Vertical roadmap (revert) + restore exam white card

User feedback (after viewing v1.3.6 screenshots):
> Đổi roadmap lại thành chiều dọc và làm theo thiết kế hình đính kèm (roadmap.png, exam.png)

#### Roadmap reverted to vertical

- `computeLayout()` reverted from horizontal (4 rows × N cols) to vertical (4 cols × N rows)
- Snake path flows top-to-bottom with left-right zigzag per row
- For 20 levels → 5 rows in vertical layout (was 5 cols horizontal)
- Container changed from `overflow-x-auto` to centered `flex justify-center`
- Outer wrapper added `max-w-5xl` to constrain horizontal extent on large screens

#### ExamSession — restored white card wrapper

Per `exam.png` reference (outer light-blue bg + inner white card):
- Outer: planet-themed `pageBg` full-bleed (cosmic identity preserved)
- Inner: `rounded-3xl bg-white p-4 shadow-xl` card containing all exam UI
- White card creates visual focus on exam content while planet bg preserves planet identity

#### What stayed (from previous sprints)

- Plain text-only header on Roadmap (no card border) — Jason approved this
- Removed info cards "Cấu trúc bài thi" + "Hệ thống sao"
- No App-level footer
- Sour Gummy headings
- Full-bleed planet-themed page backgrounds

#### Self-test verification

```
[Page 1 PlanetsScreen] planet/card gap: 65.9px ✓
[Page 2 Roadmap] level 1 node visible ✓
[Page 3 ExamSession] LISTENING label visible ✓
✓ All 3 pages rendered successfully
```

#### File changes

- `src/newtab/components/TabExam.tsx`:
  - `computeLayout()` reverted to vertical (4 cols × N rows)
  - Roadmap container: `flex justify-center` + `max-w-5xl`
- `src/newtab/components/ExamSession.tsx`:
  - Restored `<div className="rounded-3xl bg-white p-4 shadow-xl">` wrapper around exam UI
  - Exam content sits on white card with soft shadow

## [1.3.6] — 2026-05-05

### 🧹 Sprint 4.8.6 — Roadmap horizontal layout + clean borders

User feedback (after viewing v1.3.5 screenshots):
> Bỏ hết border, border radius trong trang Roadmap.
> Heading chỗ này "← Hành tinh / STARTERS / ⭐0/20" bỏ hết border background, chỉ để text style giống PlanetsScreen.
> Cho full-width Roadmap và đi theo chiều ngang.
> Bỏ 2 bảng "Cấu trúc bài thi" + "Hệ thống sao".
> Bỏ footer cho tất cả các trang.
> Page exam cũng vậy — bỏ border + full width.

#### Roadmap changes

**Plain text-only heading** (matches PlanetsScreen style):
- Removed paper card with chunky border around header
- Back button "← Hành tinh" is now floating bare text (top-left, no border/background)
- "STARTERS" centered Sour Gummy 5xl-6xl with theme color, no card
- "⭐ 0/20" plain text floating top-right, no border

**Full-width horizontal snake path** (was vertical):
- New `computeLayout()`: 4 rows × N cols (was 4 cols × N rows)
- Snake direction: top-to-bottom alternates per column instead of left-to-right per row
- Container is overflow-x-auto for horizontal scroll on narrow screens
- Wider visual canvas: levels 1-20 spread horizontally across ~1100px

**No borders/rounded corners**:
- Outer wrapper: removed `rounded-chunk`, no border
- Inner map canvas: removed `rounded-chunk border-2`, no rounded edges
- Cleaner minimalist look matching PlanetsScreen aesthetic

**Removed sections**:
- "📋 Cấu trúc bài thi" info card
- "⭐ Hệ thống sao" info card

#### ExamSession changes

**No inner paper card border** (was wrapped in `rounded-chunk border-[3px] bg-paper`):
- Removed outer chunky border + shadow + paper background
- Exam content sits directly on planet-themed full-bleed bg
- Inner exam UI elements (audio player, drop zones) keep their borders — those are functional UI, not decoration
- Wider content area (max-w removed)

#### Footer removed (all tabs)

`<footer>` element removed from `App.tsx` entirely. Reasons:
- Was creating cream gap below full-bleed pages (especially Phòng thi)
- Version + credit info less essential on every screen
- Can be re-surfaced in settings panel later if needed

App container's `py-4 md:py-5` → `pt-4 md:pt-5` (no bottom padding) so full-bleed pages can extend to viewport bottom.

#### File changes

- `src/newtab/App.tsx`:
  - Removed `<footer>` element
  - `py-4 md:py-5` → `pt-4 md:pt-5`
- `src/newtab/components/TabExam.tsx`:
  - Roadmap completely rewritten: full-bleed -mt-2 + min-h-screen + plain text header + no info cards
  - `computeLayout()` rewritten for horizontal layout (4 rows × N cols)
- `src/newtab/components/ExamSession.tsx`:
  - Removed inner paper card wrapper (border, shadow, bg-paper)
  - Direct planet-themed bg, full-width content

#### Self-test

`selftest.py` confirmed all 3 pages render successfully with horizontal Roadmap, no overlap, no footer, full-bleed extending to viewport.

## [1.3.5] — 2026-05-05

### 🎨 Sprint 4.8.5 — UI consistency across all 3 Phòng thi pages

User feedback: 3 pages (PlanetsScreen, Roadmap, ExamSession) had inconsistent visual styles — different backgrounds, header patterns, margin treatments.

#### Unified pattern

All 3 pages now follow the same shell pattern:
1. **Full-bleed background** — escapes parent container, no cream visible around content
2. **Planet-themed page background** — each planet has its own `pageBg` gradient
3. **mt-6 from tabs** — consistent breathing room from nav above
4. **Paper card header** — chunky rounded-chunk border + Sour Gummy planet name + status badge
5. **Inner content area** — page-specific (carousel / snake path / exam UI)

#### Per-page result

| Page | Theme background | Header content |
|------|------------------|----------------|
| PlanetsScreen | Cosmic purple/pink (always) | "CHOOSE YOUR PLANET" Sour Gummy |
| Roadmap | Planet's `pageBg` (mint/blue/purple) | Back btn + planet name (Sour Gummy) + ⭐ progress |
| ExamSession | Planet's `pageBg` (mint/blue/purple) | ✕ btn + planet title block (theme bg) + timer |

When user navigates Starters → Roadmap → Exam, they see consistent green theme throughout.
Movers → blue theme, Flyers → purple theme.

#### File changes

- `src/data/exam/planets.ts` — added `pageBg` field to `PlanetTheme`:
  - Starters: `from-emerald-200 via-mint-100 to-green-50`
  - Movers: `from-sky-300 via-sky-100 to-blue-50`
  - Flyers: `from-purple-300 via-pink-100 to-fuchsia-50`
- `src/newtab/components/TabExam.tsx` — Roadmap now uses full-bleed wrapper with `planet.theme.pageBg`, paper card header
- `src/newtab/components/ExamSession.tsx`:
  - Imports `getPlanet`, `planetForLevel` to derive planet from level number
  - Wrapped in full-bleed planet-themed container (mt-6)
  - Title block now uses planet's `buttonBg` instead of hardcoded blue
  - Planet name dynamic (was hardcoded "STARTERS")

#### Self-test verification

`selftest.py` updated to verify all 3 pages render successfully:
```
[Page 1 PlanetsScreen] planet/card gap: 65.8px
[Page 2 Roadmap] level 1 node visible
[Page 3 ExamSession] LISTENING label visible
✓ All 3 pages rendered successfully
```

Screenshots saved at `/tmp/sync_{1,2,3}_*.png`.

## [1.3.4] — 2026-05-05

### ✅ Sprint 4.8.4 — Verified flex-flow layout (NO overlap, finally)

User's screenshot of v1.3.3 still showed card overlapping center planet despite my math claiming 138px gap. Rather than continuing to debug absolute positioning issues, this version:

#### Approach change

**Replaced absolute positioning with flex flow**:
- Planets are now flex children with REAL DOM sizes (responsive `w-[]/h-[]` Tailwind classes) — NOT transform: scale
- Center planet: 200/280/320px at mobile/tablet/desktop breakpoints
- Side planets: 80/140/160px at same breakpoints
- The flex container's height is determined by the tallest child (center planet)
- Card sits BELOW planets in normal flow → impossible to overlap

**Why previous attempts failed**:
- v1.3.2: tight 380px min-h with translate-y-50% positioning
- v1.3.3: bumped to 520px min-h, but absolute positioning + float animation still found ways to overflow
- v1.3.4: **eliminated absolute positioning entirely** — layout space matches visual space exactly

#### Self-test infrastructure (NEW)

Added `selftest.py` — Playwright-based headless layout verification:
1. Builds the extension (`vite build`)
2. Serves dist via local HTTP
3. Headless Chromium navigates to Phòng thi tab
4. Measures bounding boxes of center planet vs info card
5. Asserts gap >= 16px (clean separation)

Self-test result for v1.3.4:
```
Center planet bottom: 643.1px
Card top:             708.0px
Gap:                  64.9px
PASS: planet bottom < card top with 64.9px clean gap
```

This script will run before every future ship to prevent regressions.

#### File changes

- `src/newtab/components/PlanetsScreen.tsx` — complete rewrite (~330 lines):
  - Flex-row carousel with responsive sized planets (no absolute positioning)
  - Arrow buttons remain absolute (overlay only, don't affect layout)
  - PlanetCircle takes parent's size via `h-full w-full` (sized by parent classes)
  - Foreground emoji also responsive: text-5xl (mobile) → text-7xl (sm) → text-8xl (md)
- `selftest.py` — new layout verification script

#### Trade-off acknowledged

The "carousel perspective" effect (where center is large and sides are smaller) is now achieved via REAL size differences, not visual scale-down of equal-sized elements. Side planets are genuinely smaller in DOM. This means side planets are slightly smaller than they appeared in v1.3.3 (160px vs scaled-from-340 187px on desktop), but the trade-off for guaranteed-correct layout is worth it.

#### Visual fidelity vs video reference

Still not matching video's 3D-rendered detailed planets — that requires AI-gen images or hired illustrator (deferred to Sprint 4.10+). Current v1.3.4 has CSS gradient bodies + SVG decorations + emoji icons. Layout is now correct; visual polish is a separate axis.

## [1.3.3] — 2026-05-05

### 🩹 Sprint 4.8.3 — Honest layout fix (carousel actually doesn't overlap card now)

User feedback (screenshot of v1.3.2):
- Card vẫn overlap center planet bottom
- Side planets cũng nằm ngay tại vị trí card
- Trees trên planet trông weird (như cà chua nâu)

#### Root cause analysis

v1.3.2 claimed "stacked layout no overlap" but math was too tight:
- Carousel min-h: 380px
- Planet center anchor: 50% top = 190px
- Planet radius: 170px (340/2)
- Float animation: ±18px
- Glow extension: -inset-4 = +16px each side
- Worst-case planet bottom: 190 + 170 + 18 + 16 = **394px** (16px BEYOND boundary)

Card sat mt-8 below, but planet's float animation + glow pushed it into card's space.

#### Fixes

**Carousel min-height**: 380px → **520px**
- Worst-case planet bottom now 394px — well within 520px
- Plenty of safety margin even with future animation tweaks

**Card gap**: `mt-8` → **`mt-12`** (32px → 48px)
- More visual separation between carousel and card

**Tree visual fix**:
- Trunk now starts at foliage bottom edge (cy + size*0.85), no longer overlaps foliage interior
- Added third highlight layer for more depth (#86efac brightest spot)
- Trees now look like actual trees, not "cà chua với cuống nâu"

#### File changes

- `src/newtab/components/PlanetsScreen.tsx`:
  - Carousel `minHeight: 520px` (from 380)
  - Card div `mt-12` (from mt-8)
  - `Tree` component restructured: trunk first (z-order behind), then foliage layers

#### Realistic expectations

This iteration prioritizes layout correctness over visual perfection. AI Flux-generated detailed planet images (matching the video reference's polished 3D look) can come in Sprint 4.10+ once core UX is stable.

## [1.3.2] — 2026-05-05

### 🛠️ Sprint 4.8.2 — Planets UI fixes (full-bleed cosmic + bigger planets + stacked layout)

User feedback (screenshot review of v1.3.1):
1. "Phần phòng thi vẫn dính sát menu" — cosmic touched tabs
2. "Background màu kem đổi thành background của hành tinh đang có" — cream parent visible around cosmic
3. "Full width toàn bộ không bị giới hạn container" — cosmic was constrained to parent
4. "Hành tinh to lên" — too small
5. "Vị trí không đúng và UI không đẹp" — card overlapped center planet awkwardly

#### Fixes

**Full-bleed cosmic background**:
- New CSS utility `.full-bleed` in `styles.css` — escapes parent container via `width: 100vw` + viewport-anchored positioning
- Cosmic now spans entire viewport width regardless of LinguTab's max-width container
- Cream parent background no longer visible around the cosmic area

**Margin from tabs**:
- Container has `mt-6` (was missing) — clear breathing room from nav tabs above
- No more "dính sát menu" complaint

**Stacked layout (no overlap)**:
- Restructured: heading → carousel → info card → pagination dots — all stacked vertically
- Info card moved BELOW planets (was overlapping center planet bottom)
- Carousel area has `min-height: 380px` — dedicated space for planets
- Card has its own `mt-8` margin from carousel — clean separation

**Bigger planets**:
- Center planet: 240px → **340px** (42% bigger)
- Side planets: scaled to 50-55% of new size (still smaller than before but proportional)
- Atmospheric glow extended `-inset-4` for prominence

**Improved planet visuals**:
- Foreground emoji moved from top-15% → centered (`flex items-center justify-center`)
- Emoji size: 5xl → **8xl** (text-8xl, ~6rem) — clearly visible on planet face
- Drop shadow `drop-shadow-2xl` for emoji depth
- New `Tree`, `Mushroom`, `Star` SVG component helpers — more detailed than scatter dots

**Card improvements**:
- Padding: 5x4 → 6x5 (more breathing room)
- Heading: 4xl-5xl → **5xl-6xl** Sour Gummy (more prominent)
- Subtitle: text-sm → text-base (more readable)
- ⭐ progress badge: 2xl → 3xl Sour Gummy
- CEFR badges: text-xs → text-sm (more legible)
- START button: 18px → text-xl, py-2 → py-3 (bigger tap target)

**More stars in starfield**:
- 16 → 22 stars
- Wider spread for full-bleed background coverage

#### Files changed

- `src/newtab/styles.css`: added `.full-bleed` utility class
- `src/newtab/components/PlanetsScreen.tsx`: complete layout restructure (stacked, full-bleed, bigger)

#### No worker changes

Frontend-only. Apply via `update.sh --no-deploy`.

## [1.3.1] — 2026-05-05

### 🪐 Sprint 4.8.1 — Carousel planets + Sour Gummy

User feedback: "Đáng lẽ phải vẽ hành tinh hình tròn và có thể di chuyển như video này càng tốt. Đổi font heading thành Sour Gummy."

#### Carousel-style PlanetsScreen

Replaced rectangular cards with **3D space carousel**:
- 3 round planets in horizontal arrangement
- Center planet: full size (240px), full opacity, faster idle float (2.5s)
- Side planets: 60% scale, 50% opacity, slower idle float (3s) — perspective effect
- ◀ ▶ arrow buttons cycle which planet is centered (modulo 3, infinite loop)
- Click side planet → rotates it to center
- Click center planet → enters that planet's roadmap (if unlocked)
- Pagination dots below indicate current planet (1 of 3)

#### Cosmic background

- Pink/purple gradient (`from-purple-900 via-purple-800 to-pink-800`)
- 16 twinkling stars at fixed positions (CSS keyframe `twinkle` 2s loop)
- Stars have varied sizes (1-2px) and animation delays for organic feel

#### Pure CSS/SVG round planets

Each planet is a circular div with:
- Atmospheric glow (blurred radial gradient behind, theme-colored)
- Planet body (radial gradient — theme-colored sphere)
- Slow rotating decoration layer (40s loop) with theme-specific SVG:
  - 🦕 Starters: scattered trees + brown trunks
  - 🍄 Movers: red mushrooms with white spots + wispy clouds
  - 🪐 Flyers: 5-pointed yellow stars + purple asteroids
- Static foreground emoji (🦕/🍄/🪐) at top for instant recognition
- Fake 3D shading (radial gradients for highlight + shadow)

#### Sour Gummy font

Replaced **Freckle Face** with **Sour Gummy** (variable axis):
- Imports weights 100-900 from Google Fonts
- Used for: PHÒNG THI heading, planet names (STARTERS/MOVERS/FLYERS), START button, level numbers
- "Wobbly gummy bear" vibe matches kid theme better than Freckle Face

#### Bottom info card

- White paper card with chunky ink shadow (matches existing UI language)
- Planet name in massive Sour Gummy (4xl-5xl)
- Vietnamese subtitle in Be Vietnam Pro
- ⭐ progress badge + CEFR badges (A1 / A2 / B1) per planet
- START → button below (theme-gradient, full width)
- Locked state: hide START button, show unlock requirement message

#### New theme fields per planet

`PlanetTheme` extended with:
- `bodyGradient` — CSS radial-gradient for planet body
- `glowColor` — atmospheric glow color
- `badgeBg` — Tailwind class for CEFR badges
- `buttonBg` — Tailwind class for START button gradient
- `cefrBadges` — string array per planet (Starters: ['A1'], Movers: ['A1', 'A2'], Flyers: ['A2', 'B1'])

#### Animations

New Tailwind keyframes:
- `floatSlow` — translateY ±12px over 3s (side planets)
- `floatMedium` — translateY ±18px over 2.5s (center planet)
- `rotateSlow` — full rotation over 40s (decoration layer)
- `twinkle` — opacity + scale pulse over 2s (background stars)

#### File changes

- `tailwind.config.js`: heading font Sour Gummy + 4 new animations + keyframes
- `src/newtab/styles.css`: import Sour Gummy variable font from Google Fonts
- `src/data/exam/planets.ts`: extended `PlanetTheme` + `Planet` interfaces, populated new fields for 3 planets
- `src/newtab/components/PlanetsScreen.tsx`: complete rewrite (~280 lines) — carousel layout, round planets, decorations, info card, starfield

#### Trade-offs vs. video reference

| Aspect | Video (professional) | v1.3.1 (current) |
|--------|---------------------|------------------|
| Planet detail | 3D-rendered with toys/slides/candy | CSS gradient + SVG icons |
| Decorations | Fully illustrated | Theme-emoji + small SVG shapes |
| Aesthetic | Polished AAA game UI | Stylized cartoon, consistent |
| Performance | N/A | Lightweight (no images) |
| Customization | Hard to change | Easy via `theme` config |

For higher visual fidelity later (Sprint 4.10+), can swap to:
- AI Flux-generated planet images (round with theme decorations baked in)
- Hire illustrator for hero planet renders
- Adopt Lottie animations for moving decorations

## [1.3.0] — 2026-05-05

### 🪐 Sprint 4.8 + 4.11 — Planets navigation + 60 levels (Movers + Flyers)

#### What's new

**3 Planets navigation**:
- New landing screen `PlanetsScreen` — 3 hero cards stacked vertically:
  - 🦕 STARTERS (mint theme, dinosaur decoration) — Pre-A1, levels 1-20
  - 🍄 MOVERS (sky blue, mushroom) — A1/A2, levels 21-40
  - 🪐 FLYERS (purple, planet) — A2/B1, levels 41-60
- Each card uses Freckle Face heading (5xl-6xl), Be Vietnam Pro subtitle
- Background emoji decorations rotate on hover
- Click planet → enter that planet's roadmap

**60 levels total**:
- Starters (1-20): existing — basic vocab, simple present
- Movers (21-40): NEW — past tense narratives, comparatives, ~600 word vocab
- Flyers (41-60): NEW — future tense, conditionals, abstract topics, ~1000 vocab
- Each difficulty has separate audio scripts with appropriate complexity

**Scene rotation across 60 levels**:
- 6 drag scenes rotated: park_kids, beach_family, classroom, playground, kitchen_baking, birthday_party
- 3 write scenes: pet_girl, family_dinner, weekend_activities
- 3 colour scenes: garden_objects_outline, bedroom_outline, farm_outline
- Each scene appears in ~10 levels — only 12 unique R2 generations needed for 60 levels

**Progress tracking** (localStorage MVP):
- `examProgressService.ts` — `markLevelCompleted`, `isLevelCompleted`, `countCompletedInRange`
- Storage key `linguanewtab.exam.progress.v1`
- Best-of-attempts: re-attempts only update if higher score
- ExamSession persists totalStars on finish (≥1 star = completed)

**Level gating**:
- Movers locked until 12/20 Starters complete
- Flyers locked until 12/20 Movers complete
- Locked planet shows 🔒 overlay + grayscale styling
- Click on locked planet does nothing (button disabled)

**Roadmap improvements**:
- Planet-themed header (border + bg gradient match planet theme)
- Back button "← Hành tinh" returns to PlanetsScreen
- Live progress badge "⭐ N/20" updates after each completion
- Completed level nodes: gold border + ⭐ badge in corner
- Removed lock-by-userProgress (any level in unlocked planet is playable)

#### File changes

**New files**:
- `src/data/exam/planets.ts` — 3 planets registry, gating logic, theme config
- `src/services/examProgressService.ts` — localStorage progress persistence
- `src/newtab/components/PlanetsScreen.tsx` — landing screen with 3 hero cards

**Modified**:
- `src/data/exam/levels.ts`:
  - Expanded from 20 to 60 levels
  - Added `MOVER_NAMES` (5 pools) + `FLYER_NAMES` (5 pools)
  - New helpers: `buildGridDragPart`, `makeClassroomDragPart`, `makePlaygroundDragPart`, `makeKitchenDragPart`, `makeBirthdayDragPart`
  - New write parts: `makeMoverWritePart`, `makeFlyerWritePart` (3 scene variants each)
  - New tick parts: `makeMoverTickPart`, `makeFlyerTickPart` (A2/B1 difficulty)
  - New colour parts: `makeBedroomColourPart`, `makeFarmColourPart`
  - `makeLevel` accepts difficulty, scales time limit (30/35/40 min)
- `src/newtab/components/TabExam.tsx`:
  - 3-screen flow: PlanetsScreen → Roadmap → ExamSession
  - Planet-themed Roadmap header with back button
  - LevelNode shows ⭐ badge on completed levels (gold theme)
  - Progress refreshes on exam exit via key prop bump
- `src/newtab/components/ExamSession.tsx`:
  - `markLevelCompleted` called on `finishAttempt` with `totalStars`

#### Setup

No worker changes — pure frontend. Just:

```bash
bash ~/Documents/lingua-newtab/update.sh --no-deploy
```

Reload Chrome → New Tab → "Phòng thi" → see 3 planets.

#### Cost note

60 levels × 4 parts × ~60 chars audio = ~14,400 ElevenLabs chars on first play (one-time, then R2 cached forever). Within Starter $5/mo quota (30k credits/mo). Generated lazily as users encounter each part — Jason can pre-warm via test playthrough.

#### Known limitations (Sprint 4.9+)

- ⚠️ **Drop zones still use 3×2 grid** — works for grid-composed AI scenes, but won't perfectly align with non-grid character positions. Sprint 4.9 (calibration tool) will let admin precisely calibrate per-scene.
- 📊 **Progress is local-only** — not synced across devices. D1 sync coming in Sprint 5+ once `exam_attempts` schema lands.
- 🎨 **SVG icons unchanged** — Sprint 4.10 will polish Tick part picture options for more detailed cartoons.

## [1.2.5] — 2026-05-05

### 🎨 Sprint 4.7.5 — Freckle Face heading font

User request: "Tôi thấy front này phù hợp làm header nè: Freckle Face. Heading toàn bộ là tiếng Anh nhé như vậy cho dễ."

#### Why Freckle Face

- **Playful kid vibe** — distinctive "freckle/spotted" texture matches Cambridge YLE textbook aesthetic
- **Display-only font** — designed specifically for large headings, not body text
- **Latin-only** — no Vietnamese diacritic glyphs. Headings are English (STARTERS, MOVERS, FLYERS, LISTENING) so no coverage needed.

Falls back to Be Vietnam Pro if anyone accidentally puts Vietnamese in a `font-heading` class.

#### Implementation

**`tailwind.config.js`**:
```js
fontFamily: {
  heading: ['"Freckle Face"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
}
```

**`src/newtab/styles.css`** (top of file, before @tailwind directives):
```css
@import url('https://fonts.googleapis.com/css2?family=Freckle+Face&display=swap');
```

`display=swap` ensures text renders in fallback while Google Fonts loads → no FOIT (flash of invisible text).

#### Components updated

- `TabExam.tsx`: STARTERS title in roadmap top bar — Freckle Face 2xl
- `ExamSession.tsx`: STARTERS + LISTENING labels in exam header — Freckle Face for kid-friendly vibe; removed duplicated `[STARTERS]` prefix in title

#### Future use (Sprint 4.8)

When 3 Planets navigation ships, headings will be:
- `STARTERS` (Cấp 1) — green planet card heading
- `MOVERS` (Cấp 2) — blue planet card heading
- `FLYERS` (Cấp 3) — purple planet card heading

All in Freckle Face, all-caps, large size for big-impact kid-friendly hero text.

## [1.2.4] — 2026-05-05

### 🐛 Sprint 4.7.4 — UI patch + 16:9 image conversion

User feedback (Jason):
1. **Khung bài thi đụng menu Tabs** — yêu cầu margin top
2. **Generate hình 16:9 + full container** — không 1:1 nữa

#### Margin-top fix

`ExamSession.tsx` container:
- Removed `-mx-2 -my-2 sm:-mx-4 sm:-my-4` (negative margins pushing flush against tabs)
- Added `mt-4` for breathing room from tab nav above
- `min-h-[80vh]` → `min-h-[70vh]` for less forced empty space on short parts
- Removed `overflow-hidden` constraint

#### 16:9 image conversion

**Worker — Flux generation params**:
- `generateSceneViaFlux()` now passes `width: 1280, height: 720` (was default 1024×1024)
- Workers AI Flux accepts dimensions in 64-multiples within 256-2048 range
- Slightly cheaper Neuron cost: 1280×720 = ~53.6 N vs 1024×1024 = ~57.6 N

**Worker — Scene prompts** (`scenes.ts`):
- All 12 scene prompts rewritten with "Wide 16:9 aspect ratio" + "Wide horizontal cartoon"
- Drag scenes (`park_kids`, `beach_family`): explicit 3×2 grid composition reinforced
- Write scenes (`pet_girl`, `family_dinner`, `weekend_activities`): subject + context spread horizontally
- Colour scenes (`garden_objects_outline`, `bedroom_outline`, `farm_outline`): 6 objects spread across wide image

**Frontend — Container aspects**:
- Drag scene container: `mx-auto aspect-square w-full max-w-[640px]` → `aspect-video w-full`
- Colour scene container: same fix
- Write scene container: `aspect-square max-h-[320px]` → `aspect-video`
- All containers now match 16:9 image aspect → no clipping, no letterbox

#### Cache invalidation needed

Old square scenes in R2 are stale. After deploy:

```toml
# wrangler.toml [vars]
SCENE_CACHE_VERSION = "v3"
```

Then warm-all to regenerate at 16:9.

#### File changes

- `worker/src/exam/handlers.ts`: `generateSceneViaFlux` adds `width: 1280, height: 720`
- `worker/src/exam/scenes.ts`: all 12 prompts rewritten for wide format
- `src/newtab/components/ExamSession.tsx`: margin fix
- `src/newtab/components/ExamPartView.tsx`: 3 container aspect changes (drag, write, colour)

## [1.2.3] — 2026-05-05

### 🚨 Sprint 4.7.3 — CRITICAL bug fixes

User report (Jason):
1. **Audio cache không persist** — mỗi lần reload extension click Play tốn ElevenLabs credit
2. **Drop zones lệch hoàn toàn** — drag answer vào không match vị trí characters
3. **Hình bị che** — yêu cầu hiển thị full

#### 🔥 Critical fix #1: Audio cache R2 put never completed

**Root cause**: Worker fired-and-forgot R2 put without await:
```typescript
env.IMAGES!.put(freshKey, bytes, {...}).catch(...);  // ❌ promise dropped
```

In Cloudflare Workers, fire-and-forget promises **get cancelled when the worker isolate terminates after sending the response**. Without `await` or `ctx.waitUntil()`, the put never completed → R2 never received the audio → next request was always a cache miss → ElevenLabs charged on every request → bleeds money on every extension reload.

**Fix**: Properly await R2 put + log success/failure:
```typescript
try {
  await env.IMAGES!.put(freshKey, bytes, {...});
  console.log(`[exam-audio] R2 cached ✓: ${freshKey}`);
} catch (err) {
  console.error('[exam-audio] R2 put FAILED:', err);
}
```

Trade-off: ~100-300ms extra latency on first request per audio file (cache miss path only). Subsequent requests stream from R2 (~50ms). Acceptable cost vs. monetary leak.

New response header: `X-Audio-Cached: true|false` — verifies whether R2 put succeeded.

#### 🎯 Critical fix #2: Drop zones recalibrated for AI scenes (3×2 grid)

**Root cause**: Drop zones in `levels.ts` were calibrated for old hand-coded SVG park scene with specific character positions. AI Flux generates non-deterministic character placements that don't match those coordinates.

**Fix**: Force a 3×2 grid composition via:

1. **Scene prompts now demand grid layout**:
   ```
   IMPORTANT COMPOSITION: Six different children arranged clearly in a 3×2 grid,
   two horizontal rows of three children each. Each child stands in their own
   grid cell with empty space around them.
   ```

2. **Drop zones are grid cells** (not character-specific coords):
   ```
   Top row: y=0.05..0.50 (45% height)
   Bottom row: y=0.50..0.95 (45% height)
   Col 1: x=0.02..0.32 (30% width)
   Col 2: x=0.35..0.65 (30% width)
   Col 3: x=0.68..0.98 (30% width)
   ```

3. **Audio scripts reference positions, not features**:
   - Before: "Ben is the boy with grey hair holding a kite"
   - After: "Ben is in the top-left of the picture"

This way, even if AI generates different character features each regeneration, the **position is deterministic** and drop zones reliably align.

#### 🖼️ Critical fix #3: Image full visible (square aspect)

**Root cause**: Container was `aspect-[2/1]` (landscape) while AI Flux outputs 1024×1024 (square). With `object-cover`, top/bottom of square image got cropped. With `object-contain`, image fit fully but with letterbox bars + drop zones still didn't align (zones were on container space, not image space).

**Fix**: Container now matches AI image aspect:
```diff
- <div className="aspect-[2/1] ...">
+ <div className="mx-auto aspect-square w-full max-w-[640px] ...">
```

`ExamScene` switched back to `object-cover` — but now safe because container aspect (1:1) matches image aspect (1:1) → no cropping occurs. Drop zones use relative coords (0-1) that map directly onto image pixels.

#### File changes

**Worker**:
- `worker/src/exam/handlers.ts`:
  - `getOrGenerateAudio()`: replaced fire-and-forget R2 put with awaited put + try/catch + success log
  - Added `X-Audio-Cached` response header
- `worker/src/exam/scenes.ts`:
  - `park_kids` and `beach_family` prompts rewritten to force 3×2 grid composition
  - Aspect changed to `'square'` to match Flux 1024×1024 output

**Frontend**:
- `src/data/exam/levels.ts`:
  - `makeParkDragPart()` and `makeBeachDragPart()` rewritten with 3×2 grid drop zones
  - Audio scripts use position descriptors ("top-left", "bottom-middle", etc.)
- `src/newtab/components/ExamPartView.tsx`:
  - Drag scene container: `aspect-[2/1]` → `aspect-square` with `max-w-[640px]` and `mx-auto`
  - Colour scene container: same fix
- `src/newtab/components/ExamScene.tsx`:
  - Switched back to `object-cover` (safe with matching aspect ratios)

#### Setup steps

```bash
# Standard update
bash ~/Documents/lingua-newtab/update.sh

# Then bump cache versions to invalidate buggy cache:
nano ~/Downloads/lingua-newtab/worker/wrangler.toml
```

Add to `[vars]`:
```toml
[vars]
ALLOWED_ORIGINS = "*"
AUDIO_CACHE_VERSION = "v3"   # bump from previous to invalidate buggy cache
SCENE_CACHE_VERSION = "v2"   # bump because scene prompts changed
```

Then redeploy + re-warm scenes:
```bash
cd ~/Downloads/lingua-newtab/worker && npx wrangler deploy
bash ~/Documents/lingua-newtab/update.sh --warm  # regenerate 12 scenes with new prompts
```

#### Verifying audio cache fix

Open `npx wrangler tail`, then play same audio twice in Chrome:

**First play** (cache miss):
```
POST /exam/audio
[exam-audio] cache miss → generating: level1/p1.mp3
[exam-audio] TTS done via elevenlabs in 5234ms (543192 bytes)
[exam-audio] R2 cached ✓: exam-audio/v3/elevenlabs/level1/p1.mp3 (543192 bytes)
```

**Second play** (cache HIT — no ElevenLabs call):
```
POST /exam/audio
[exam-audio] cache hit (elevenlabs): exam-audio/v3/elevenlabs/level1/p1.mp3
```

Response headers:
- First play: `X-Audio-Source: tts-fresh`, `X-Audio-Cached: true`
- Second play: `X-Audio-Source: r2-cache`

If `X-Audio-Cached: false` on first play → R2 binding broken (check `IMAGES` binding in `wrangler.toml`).

## [1.2.2] — 2026-05-05

### 🐛 Sprint 4.7.2 — Bug fixes from user testing

User report (Jason):
1. **AI scenes don't match audio prompts** (e.g. "Ben holding a kite" but no kid in image holds a kite)
2. **Drop zones misaligned** with character positions in AI image
3. **Image clipped due to height limit** — full image not visible
4. **Carousel UX bad for Part 2/3** — dot navigation distracts from listening
5. **Cost concern**: any user can trigger Flux generation = abuse risk for 1k+ users

#### Architecture changes

**Admin-only scene generation** (issue #5):
- User endpoint `GET /exam/scene/:id` is now **read-only** — never triggers Flux
- Returns 404 with admin-warming hint if scene not pre-cached
- New admin endpoints (require `Bearer ADMIN_TOKEN`):
  - `POST /admin/exam/scenes/warm-all` — bulk-generate all 12 scenes (idempotent, skips already-cached)
  - `POST /admin/exam/scenes/:id/generate` — regenerate single scene (force overwrite)
  - `GET /admin/exam/scenes/status` — list cache status of all scenes (cached/missing, bytes, uploadedAt)
- Cost guarantee: 1 generation per scene total, regardless of user count. 1k users or 100k users = same Workers AI Neuron usage as 1 user.
- Workflow: Super Admin pre-warms once after deploy → all users serve from R2 cache forever.

**Image clipping fix** (issue #3):
- `ExamScene` switched from `object-cover` to `object-contain` with `max-h-full max-w-full`
- Full AI-generated image now visible (with letterbox bars when container aspect != 1:1 image aspect)
- Container is `flex items-center justify-center bg-cream` for centered display

**Part 2 (Write) carousel removal** (issue #4):
- All 5 sub-questions render on a single page — no dot navigation
- New layout: shared scene (left) + vertical list of 5 question rows (right)
- Each question row: number badge + prompt + fill-in input
- Filled rows turn mint outline (visual progress indicator)
- New helper component `WriteQuestionRow` — owns its input state to avoid re-rendering all 5 inputs on every keystroke

**Part 3 (Tick) carousel removal** (issue #4):
- All 5 sub-questions render on a single page — no dot navigation
- New layout: example block (compact, top) + vertical list of 5 question rows
- Each question row: number badge + prompt + 3 picture options A/B/C
- Filled rows turn mint outline
- New helper component `TickQuestionRow`

**Page count math** (page list rebuild):
- `ExamPage` discriminated union no longer has `questionIndex` for write/tick
- `buildPageList()` produces 1 page per part for write/tick (was 5 pages each)
- Typical level page count: 12 → 4 (drag, write, tick, colour)
- Progress bar + page navigation auto-adjust

#### File changes

**Worker**:
- `worker/src/exam/handlers.ts`:
  - `getOrGenerateScene()` removed
  - `getSceneFromCache()` added — read-only user path, 404 on miss
  - `handleAdminExamRequest()` exported — admin route dispatcher
  - `adminWarmAllScenes()`, `adminGenerateScene()`, `adminScenesStatus()` added
  - `Object.entries(SCENE_PROMPTS)` instead of `Object.keys()` for type safety
- `worker/src/index.ts`:
  - `handleAdminExamRequest` imported alongside `handleExamRequest`
  - Inline `Bearer ADMIN_TOKEN` check before dispatching `/admin/exam/*` paths

**Frontend**:
- `src/services/examSceneService.ts`:
  - `ExamSceneError` kind now includes `'not-warmed'`
  - 404 status handled distinctly with admin-contact message
- `src/newtab/components/ExamScene.tsx`:
  - `object-contain` + `max-h-full max-w-full` for full image display
- `src/newtab/components/ExamSession.tsx`:
  - `ExamPage` type updated — write/tick no longer have `questionIndex`
  - `buildPageList()` produces 1 page per write/tick part
- `src/newtab/components/ExamPartView.tsx`:
  - `WriteView` rewritten to render all 5 questions vertically
  - `WriteQuestionRow` extracted (owns input state)
  - `TickView` rewritten to render all 5 questions vertically with example header
  - `TickQuestionRow` extracted

#### Setup steps (Jason)

1. Apply v1.2.2 source (npm install + npm run build)
2. Deploy worker: `cd worker && npx wrangler deploy`
3. **Pre-warm scenes** (one-time, ~2 min):
   ```bash
   curl -X POST https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/warm-all \
     -H "Authorization: Bearer 5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212" \
     -H "Content-Type: application/json"
   ```
   Expected response: JSON with results for all 12 scenes
4. Reload extension in Chrome
5. Users now hit cache — zero Flux generation per user

#### Verifying

```bash
# Check scene status (which are cached)
curl -X GET https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Regenerate single scene (e.g. if quality bad)
curl -X POST https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/park_kids/generate \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Known limitations (deferred to Sprint 4.8)

- 🎯 **Drop zone misalignment**: hardcoded coords in `levels.ts` calibrated for old SVG, not AI scene character positions. Will build admin calibration tool with drag-rectangle UI to map drop zones onto generated images.
- 🎲 **AI artifacts persist**: Flux schnell can produce extra fingers/weird faces. Bump `SCENE_CACHE_VERSION` env var or use `/admin/exam/scenes/:id/generate` to retry with new seed until satisfactory.
- 📐 **Letterbox bars**: object-contain shows full image but with empty bars when container aspect != 1:1. Cosmetic only.

## [1.2.1] — 2026-05-05

### 🎵 Sprint 4.7.1 — Audio scrubbing (seek + skip controls)

User feedback: "Khi Nhấn Play thì không có tua ngược lại được, YÊU CẦU cho user có thể kéo tua tới lui để nghe lại đoạn đọc nếu họ nghe không rõ."

Patch: Audio progress bar trong Phòng thi đổi từ static visualizer thành **draggable seek slider** + thêm **skip backward/forward 10s buttons**. Quan trọng cho kid-level Cambridge YLE Listening — đoạn audio dài 4-7 phút, nghe lại đoạn cụ thể là feature critical.

#### Changes

**`src/newtab/components/ExamPartView.tsx` — AudioPlayer**:
- Static `<div>` progress bar → native `<input type="range">` for accessibility + keyboard (arrow keys = ±1s)
- New `seekTo(seconds)` helper clamps to `[0, duration]` so seek can't overflow
- `⏪10` button skips backward 10 seconds — disabled until audio loaded
- `10⏩` button skips forward 10 seconds — disabled until audio loaded
- Time display moves below slider on small screens (sm:inline) to fit tap targets
- CSS var `--progress` drives WebKit track gradient fill

**`src/newtab/styles.css`**:
- New `.exam-audio-slider` styles with cross-browser thumb + track:
  - WebKit (Safari/Chrome/Edge): `::-webkit-slider-thumb`, `::-webkit-slider-runnable-track`
  - Firefox: `::-moz-range-thumb`, `::-moz-range-track`, `::-moz-range-progress`
- Coral chunky thumb (matches LinguTab brand) with `box-shadow` for raised feel
- Mint→purple gradient fill on track shows playback progress
- Disabled state grays out everything (audio not yet loaded)
- Focus ring for keyboard navigation accessibility

#### UX flow

1. User clicks ▶ to play → audio loads + plays
2. **While playing**: thumb slides left-to-right showing position
3. **User clicks anywhere on track**: jumps to that position instantly
4. **User drags thumb**: scrubs through audio (currentTime updates in real-time)
5. **User clicks ⏪10**: jumps back 10 seconds (or to 0 if near start)
6. **User clicks 10⏩**: jumps forward 10 seconds (or to end if near end)
7. **Keyboard**: focus slider + arrow keys → ±1 second per press

#### Why native `<input type="range">` over custom div

Native range inputs:
- Free keyboard accessibility (arrow keys, Home/End, Page Up/Down)
- Touch gestures handled by browser (no manual pointer event wiring)
- Screen reader announcement built-in
- Drag works on mobile + desktop with same code

Trade-off: cross-browser styling needs WebKit + Mozilla pseudo-elements (verbose CSS). Acceptable for one component.

#### No worker/backend changes

Sprint 4.7.1 is frontend-only. No redeploy needed.

## [1.2.0] — 2026-05-05

### 🎨 Sprint 4.7 — AI-generated scene illustrations (Workers AI Flux)

Phòng thi v1 dùng inline SVG hand-coded (geometric shapes, characters đơn giản từ circle/rect/path). v1.2.0 thay bằng **AI-generated cartoon illustrations** qua Workers AI Flux-1-Schnell, cached R2 forever — Cambridge YLE-style scenes với 6 distinct characters mỗi scene, vibrant colors, kid-friendly cartoon style.

#### Backend changes

**New file**: `worker/src/exam/scenes.ts`
- 12 scene IDs với curated prompts cho Cambridge YLE Listening style
- 6 drag-name scenes: `park_kids`, `beach_family`, `classroom`, `playground`, `kitchen_baking`, `birthday_party`
- 3 write-part scenes: `pet_girl`, `family_dinner`, `weekend_activities`
- 3 colour-part outline scenes: `garden_objects_outline`, `bedroom_outline`, `farm_outline`
- Each prompt designed với 6 distinct characters, "no text", "evenly spaced", "cartoon style"

**New endpoint**: `GET /exam/scene/:sceneId` (worker)
- Auth required (Google Bearer token)
- Validates sceneId against `SCENE_IDS` allowlist (no abuse)
- Cache-aware: tries R2 first, generates via Flux on miss
- Returns `image/jpeg` bytes with 1-year edge cache

**TTS provider hierarchy completion** (carry-forward Sprint 4.5.2):
- `generateTTSWithProvider()` returns `{bytes, provider}` tuple
- Cache lookup tries providers in preferred quality order: ElevenLabs → Aura-2 → melotts
- Cache key includes provider name: `exam-audio/v1/elevenlabs/level1/p1.mp3`
- Solves upgrade scenario: free-tier melotts cache không stale ElevenLabs paid plan
- New env vars: `TTS_PROVIDER`, `AURA2_VOICE`, `SCENE_CACHE_VERSION`

**Image model**: `@cf/black-forest-labs/flux-1-schnell`
- Returns base64 JPEG in `{ image: string }` format
- 1024×1024 resolution, 4 inference steps (default for Schnell)
- Latency: ~5-10s on cache miss, instant from R2 thereafter

#### Frontend changes

**New service**: `examSceneService.ts`
- `getSceneUrl(sceneId)` → blob URL (with session-level Map cache)
- `clearSceneCache()` — revoke all blob URLs (called on TabExam unmount)
- Same auth + caching pattern as `examAudioService`

**New component**: `ExamScene.tsx`
- Renders `<img>` with blob URL once loaded
- Loading skeleton with theme-appropriate emoji + animated shimmer
- Error fallback with retry hint
- `themeFor(sceneId)` picks emoji + bg color per scene category

**Updated**: `ExamPartView.tsx`
- Replaced 3 `getScene(part.sceneId) ?? <FallbackScene />` calls with `<ExamScene sceneId={part.sceneId} />`
- Removed unused `FallbackScene` helper

**Updated**: `TabExam.tsx`
- `clearSceneCache()` added to unmount cleanup

#### Cost projection

- 1 Flux 1024×1024 @ 4 steps ≈ 58 Neurons (4 tiles × 4.80 + 4 steps × 9.60)
- 12 scenes × 58 = ~696 Neurons total
- Workers AI free tier: 10,000 Neurons/day
- **Effective cost**: $0 (7% of daily free quota, refreshes daily)
- Beyond free tier: $0.011 / 1k Neurons = ~$0.008 for full catalog

#### UX flow

1. User opens Phòng thi level 1 → Part 1 (drag-name with park scene)
2. ExamScene component fetches `/exam/scene/park_kids`
3. **Lần đầu** (cache miss): worker generates Flux → 5-10s → caches R2 forever
   - User sees themed skeleton (🌳 emoji + shimmer animation) while waiting
4. **Lần sau**: cache hit → R2 streams JPEG → blob URL → instant render
5. Other users on different devices: cache hit ngay từ lần đầu
6. After deploy/redeploy: cache vẫn còn (R2 not affected by worker deploys)

#### File changes

**Worker**:
- `worker/src/exam/scenes.ts` — new file (180 lines, prompt registry)
- `worker/src/exam/handlers.ts` — added scene endpoint + Flux generator (~110 lines added)
- `worker/src/index.ts` — added `SCENE_CACHE_VERSION` to Env interface

**Frontend**:
- `src/services/examSceneService.ts` — new file (110 lines)
- `src/newtab/components/ExamScene.tsx` — new file (140 lines)
- `src/newtab/components/ExamPartView.tsx` — replaced 3 getScene calls + removed FallbackScene
- `src/newtab/components/TabExam.tsx` — added clearSceneCache to unmount

#### Setup steps (Jason)

1. Apply v1.2.0 source (npm install + npm run build)
2. Deploy worker: `cd worker && npx wrangler deploy`
3. (Optional) Bump cache versions in `wrangler.toml [vars]` if regenerating from previous cache state:
   ```toml
   AUDIO_CACHE_VERSION = "v3"
   SCENE_CACHE_VERSION = "v1"  # first time, no bump needed
   ```
4. Reload extension in Chrome
5. First user opens each level → scenes generate via Flux (5-10s per scene)
6. Subsequent users get instant R2 cache hits

#### Known limitations

- 🎲 **AI artifacts**: Flux can produce extra fingers, weird faces, etc. Bump `SCENE_CACHE_VERSION` for full regeneration if needed
- 🎯 **Character consistency**: drop zone coordinates may not perfectly match generated character positions (manual calibration needed for production polish)
- 🖼️ **Square aspect**: Flux outputs 1024×1024; CSS object-cover crops to scene aspect ratios
- 🔇 **One-time generation latency**: first user per scene waits 5-10s. Could be pre-warmed via post-deploy script (Sprint 4.7.1).

## [1.1.1] — 2026-05-04

### 🎤 Sprint 4.5.1 — Switch exam TTS to ElevenLabs (studio quality)

Voice melotts robotic không phù hợp cho kid-level Cambridge-style content. Sprint 4.5.1 swap sang ElevenLabs primary với fallback graceful về melotts.

#### Changes

**`worker/src/exam/handlers.ts`**:
- New: `generateElevenLabsTTS(env, text)` calling `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with model `eleven_multilingual_v2`
- Modified: `generateTTS()` dispatcher tries ElevenLabs first if `ELEVENLABS_API_KEY` set, falls back to melotts on auth/quota error or missing key
- Voice settings tuned for kids' education: `stability: 0.65`, `similarity_boost: 0.85`, `speaker_boost: true`
- Returns audio/mpeg bytes directly (ElevenLabs API gives raw MP3, no base64 unwrap needed unlike melotts)

**`worker/src/index.ts` Env interface**:
- `ELEVENLABS_API_KEY?: string` — secret (via `wrangler secret put`)
- `ELEVENLABS_VOICE_ID?: string` — default `ThT5KcBeYPX3keUQqHPh` (Dorothy)
- `ELEVENLABS_MODEL_ID?: string` — default `eleven_multilingual_v2`
- `AUDIO_CACHE_VERSION?: string` — default `v1`, bump to invalidate old cached audio

**Cache versioning**:
- R2 key now includes version prefix: `exam-audio/{version}/level{N}/p{N}.mp3`
- Old `exam-audio/level{N}/...` from v1.0.1 deferenced (still in R2, can manually delete to free storage)
- Bump `AUDIO_CACHE_VERSION` env var to force regeneration after voice change

#### Recommended voice IDs (curated for Cambridge YLE Listening style)

| Voice | ID | Description |
|-------|-----|------------|
| **Dorothy** ⭐ default | `ThT5KcBeYPX3keUQqHPh` | Warm British female |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | Gentle British female |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Clear American female |
| Charlotte | `XB0fDUnXU5powFXDhCwa` | Warm narrator female |
| Alice | `Xb7hH8MSUJpSbSDYk0k2` | Confident British female |

Override via wrangler.toml:
```toml
[vars]
ELEVENLABS_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"
```

#### Cost projection

- 240k chars (300 levels) × $0.30 per 1k = ~**$72 one-time**
- ElevenLabs Creator tier ($22/mo, 100k chars) → 3 months to bootstrap full catalog
- Free tier (10k chars/mo) → 12.5 levels per month for testing
- All audio cached in R2 forever after first generation → zero recurring cost per playback

#### Setup steps (Jason)

```bash
# 1. Add API key as worker secret
cd worker
echo "sk_xxx_your_elevenlabs_key" | npx wrangler secret put ELEVENLABS_API_KEY

# 2. (Optional) Override default voice/model in wrangler.toml [vars] section
# Default: Dorothy (British female), eleven_multilingual_v2

# 3. Deploy
npx wrangler deploy

# 4. Test endpoint with curl
curl -X POST https://lingua-newtab-worker.kspstudio.workers.dev/exam/audio \
  -H "Content-Type: application/json" \
  -d '{"audioKey":"level1/p1.mp3","audioScript":"Hello, this is a test."}'
# Expected: 401 "Auth required" (because no Google token)
```

Cache from v1.0.1 (melotts audio) is invalidated automatically by version prefix. New audio plays will TTS-generate first time then cache.

## [1.1.0] — 2026-05-04

### 🎮 Phòng thi v2 — Game-style Roadmap + Cambridge Listening format

**Major redesign**: rewrites the entire exam system from scratch to match the Cambridge YLE Listening test format the user demoed via screenshots. v1.0.x was a simple linear UI; v1.1.0 is a full game-style learning experience.

#### Roadmap UI (TabExam)

- Snake-shaped path with numbered nodes (Levels 1, 2, 3, ..., up to 300 in the long run; v1.1.0 ships 20)
- Background decorations: trees, clouds, cute critters scattered across the canvas
- Locked nodes (above user's progress) show 🔒 in grey; unlocked show numbers in mint green
- "STARTERS" branding header with star count progress
- Horizontal scrolling for >20 levels; row alternates L→R, R→L with y-wiggle for the wave shape

#### Cambridge-style ExamSession layout

Top bar mirrors the Cambridge YLE app:
- ✕ red exit button (left)
- "STARTERS" / "[STARTERS] Bài thi N" / "LISTENING" title block
- Coral progress bar with 🚀 rocket icon tracking question position
- Cream time card with countdown (pulses coral when <60s)

Side navigation:
- Large red circular ◀ ▶ buttons at left/right edges of the question card
- Last page shows 🏁 mint button instead of ▶ (= submit)

Question card spans most of the screen with an instruction banner styled like the Cambridge format ("LISTEN. DRAG THE NAME AND DROP IT ONTO THE CORRECT PERSON IN THE PICTURE. THERE IS ONE EXAMPLE.").

#### 4 Cambridge part formats

Each level now has exactly 4 parts × 5 graded items + 1 example each:

**Part 1 — Listen & match names** (1 page, drag-and-drop):
- Scene with 6+ characters
- 5 names to drag + 1 pre-placed example (coral label)
- 6 dropzones overlaid on the scene with dashed coral borders
- Drag→drop, click to remove

**Part 2 — Listen & write** (5 pages, fill-in-blank):
- Shared scene image (girl + cat) with 2 examples shown filled
- 5 questions with prefix/blank/suffix layout
- Dot navigator at bottom for sub-question progress
- Case-insensitive trim match against accepted variants

**Part 3 — Listen & tick** (5 pages, multiple choice):
- Example shown on left with checkmark on correct answer
- 5 graded questions on the right with 3 picture options A/B/C
- Picture options use SVG icons (clocks, animals, food, items, scenes)
- Dot navigator for progress

**Part 4 — Listen & colour** (1 page):
- Outline (B&W) garden scene with 5+ colorable regions
- 1 region pre-colored as example
- 8-color palette at top
- Tap region → tap color → SVG region tints with mix-blend-multiply overlay

#### SVG asset library

`src/data/exam/examScenes.tsx`:
- 8 reusable scenes (park_kids, beach_family, classroom, kitchen, pet_girl, farm_scene, bedroom, garden_objects), each with optional `outline` mode
- Inline SVG with bold cartoon shapes, saturated colors, kid-friendly geometric characters

`src/data/exam/examIcons.tsx`:
- 35+ icons: bags (3 variants), clocks (3 hours), animals (5), food (5), items (8), scenes (6), counts (4)
- 120×120 viewBox, designed for thumbnail readability

#### Audio system carries over

- Workers AI TTS via `@cf/myshell-ai/melotts`, R2-cached at `exam-audio/level{N}/p{N}.mp3`
- Audio script per part (5 sub-questions in one continuous narration)
- Replay-anytime player with proper time display "00:11/04:30" + purple progress bar

#### Generator pattern (scales to 300 levels)

`src/data/exam/levels.ts`:
- `makeLevel(N)` produces a complete `ExamLevel` from templates
- Templates: `makeParkDragPart`, `makeBeachDragPart`, `makePetWritePart`, `makeStandardTickPart`, `makeGardenColourPart`
- 4-name pools rotated by `levelNumber % 4` so adjacent levels feel different
- Part 1 alternates park/beach scene (odd vs even level)
- Currently 20 starter levels — to scale: add more scene + icon templates, expand the for-loop

#### New types (`src/types/exam.ts`)

```typescript
ExamLevel { levelNumber, difficulty, title, timeLimitSec, parts: [4 parts] }
DragNamePart, WritePart, TickPart, ColourPart  // 4 part types
ExamAnswer  // discriminated union, 4 shapes
ExamPartResult { totalGraded, correctCount, starEarned, itemResults[] }
ExamAttemptResult { totalStars 0-4, partResults, ... }
STARS_PER_LEVEL = 4  // one star per part
```

#### New grading service

`gradeAttempt(level, answers, startedAt, finishedAt)` → `ExamAttemptResult`
- Each part awards 1 star if ≥ 4 of 5 items correct (write/tick) or ≥ 80% items correct (drag/colour)
- Total stars 0-4 per level

#### Results modal

- 4 stars (one per part) instead of 5 shields
- Animated reveal with staggered delay
- Per-part breakdown with "Đạt"/"Chưa đạt" badges
- "Quay lại" + "Thi lại" CTAs

### Breaking changes

- v1.0.x exam data files are deprecated. `level1_test1.ts` removed; use `getLevel(1)` from new `data/exam/index.ts`
- Type renamed: `ExamTest` → `ExamLevel`, with shape changes (4 parts always, named question types)
- Dexie schema unchanged (no exam attempts persisted yet — Sprint 4.7)

### Known limitations (defer to next patches)

- 💾 Results in-memory only (no Dexie persistence yet) — Sprint 4.7
- 📜 No attempt history view — Sprint 4.7
- 🔒 No level-gating yet — `userProgress = allLevels.length` so all 20 levels are unlocked
- 🎨 Scenes are SVG geometric shapes (not professional illustrations) — improving in v1.2.x
- 🎯 Cấp 2 / Cấp 3 (Movers/Flyers) chưa có data — Sprint 4.8+
- 🎤 TTS voice is American melotts; British voice swap deferred

### No worker changes

Sprint 4.6 is frontend-only. The `/exam/audio` endpoint from v1.0.1 still works as-is — no redeploy needed.

## [1.0.1] — 2026-05-03

### 🔊 Audio TTS wired up — Phòng thi giờ playable thật sự

Sprint 4 ship UI nhưng audio chỉ console.log. v1.0.1 connect audio thật qua Workers AI TTS + R2 caching.

#### Backend

**New endpoint**: `POST /exam/audio` (worker)
- Body: `{ audioKey: string, audioScript: string }`
- Auth: required (Google sign-in)
- Returns: MP3 bytes with `Content-Type: audio/mpeg`

**Logic**:
1. Validate audioKey format (no path traversal, ≤200 chars)
2. Validate audioScript length (≤1000 chars)
3. Try fetch from R2 (`exam-audio/{audioKey}`)
4. **Cache hit**: stream R2 bytes directly with 1-year cache header
5. **Cache miss**: call `@cf/myshell-ai/melotts` Workers AI model with the script, decode base64 → MP3 bytes, fire-and-forget store in R2 (so user doesn't wait), return bytes immediately

**Headers**:
- `X-Audio-Source: r2-cache` | `tts-fresh` | `tts-fresh-uncached` (debug)
- `X-TTS-Latency-Ms: <ms>` (only when fresh)

**File**: `worker/src/exam/handlers.ts` (140 lines)

#### Frontend

**New service**: `examAudioService.ts`
- `getAudioUrl(audioKey, audioScript)` → blob URL (with session-level Map cache)
- `clearAudioCache()` — revoke all blob URLs (called on TabExam unmount)
- `prefetchAudio([...])` — best-effort prefetch helper for Sprint 4.6+

**Audio caching strategy** (2 layers):
1. Server: R2 holds MP3s persistently across all users
2. Client: Map<audioKey, blobUrl> per session, cleared on tab-leave

**Why blob URL instead of streaming `<audio src=workerURL>`**: Browser doesn't always cache POST responses, so streaming would re-fetch every replay. Blob URLs give zero-latency replay after first fetch.

#### Updated components

**`ExamQuestionView.AudioPlayer`** — full rewrite:
- Loading spinner when fetching (3-5s first time)
- Error display if auth fails or worker errors (kid can still answer based on screen text)
- Replay restarts from beginning (kids expect "play" = "from start")
- Reset state when audioKey changes (next question)
- Helper text: "Lần đầu mất 3-5 giây để tạo audio"

**`ExamQuestion` types** — added `audioScript: string` field to all 4 question shapes (drag-name, tick, write, color). Existing tests data updated với English narration scripts:
- Drag-name: multi-sentence character introduction ("Tom is the boy with the red shirt...")
- Tick: question + answer hint ("What does Tom have? Tom has a dog.")
- Write: full sentence with target word ("My name is Tom. Tom.")
- Color: instruction list ("Color the flower red. Color the tree green...")

#### TTS model: `@cf/myshell-ai/melotts`

Why melotts:
- Canonical English TTS in Workers AI catalog
- Returns base64 MP3 (easy to decode + serve)
- Voice quality acceptable for kid exams (clear, natural prosody)
- Free tier supports our scale

Trade-offs:
- 3-5s latency on cache miss
- Voice is American English (may sound less polished than ElevenLabs/OpenAI)
- Mitigated by R2 cache: latency only hits the very first user to play each question

If quality is insufficient, can swap to OpenAI TTS or ElevenLabs by changing only `worker/src/exam/handlers.ts:generateTTS()` — frontend stays the same.

#### Cost projection

For 1 test (12 audio files):
- First user takes test → ~12 TTS calls × ~5s each (most happen in parallel as kid navigates)
- Workers AI free tier: ~10,000 Neurons/day. 12 melotts calls ≈ 100 Neurons. Effectively free.
- R2 storage: ~600 KB per test (12 × ~50KB MP3)
- Subsequent users: 0 Neurons (R2 cache hit), <100ms latency

#### Worker requires redeploy this time

Unlike Sprints 2/3/4, Sprint 4.5 modifies the worker. Apply via:
```bash
cd worker && npx wrangler deploy
```

Existing IMAGES R2 bucket reused with `exam-audio/` prefix — no new bucket needed.

## [1.0.0] — 2026-05-03

### 🎯 Phòng thi MVP — Cambridge YLE-style interactive exams

**Major release**: ship a fully working interactive exam system replacing the v0.17 placeholder. 1 sample test (Cấp 1 — Bài thi 1) demonstrating all 4 question types, with grading, shield system, và results modal.

#### New types (`src/types/exam.ts`)

```typescript
ExamQuestion (discriminated union):
  - DragNameQuestion   // listening_drag_name
  - TickQuestion       // listening_tick (multiple choice)
  - WriteQuestion      // listening_write (fill blank)
  - ColorQuestion      // listening_color (listen + color)

ExamPart            // 1 section, multiple Qs same type
ExamTest            // ExamPart[] + level + time limit
ExamAnswer          // user response, 4 shapes
ExamPartResult      // graded part with shield earned
ExamAttemptResult   // full graded test
```

#### New data files

- `src/data/exam/level1_test1.ts` — Cấp 1 sample test (4 parts, 12 questions total)
  - Part 1: Drag names (1 scene with 4 characters)
  - Part 2: Tick correct picture (5 questions, vocabulary check)
  - Part 3: Listen and write (5 questions, fill blanks)
  - Part 4: Listen and color (1 scene with 4 colorable regions)
- `src/data/exam/index.ts` — registry + `getTestsForLevel`, `getTestById` helpers

#### New service: `examGradingService`

Pure grading logic (no I/O):
- `gradeAttempt(test, answers, startedAt, finishedAt)` → `ExamAttemptResult`
- `didPassAttempt(result)` → `boolean` (≥ half shields earned)
- Per-type comparison rules: drag-name (every name → correct zone), tick (id match), write (case-insensitive trimmed match against accepted variants), color (every region → correct color)

#### New components

- `ExamRunner.tsx` — orchestrator, manages currentPart/currentQuestion state, time tracking, navigation, auto-submit on timeout
- `ExamQuestionView.tsx` — renders question + audio player + delegates to type-specific subrenderers (DragName, Tick, Write, Color)
- `ExamResultsModal.tsx` — 5-shield row visualization, per-part breakdown with pass/fail badges, "thi lại" CTA
- `TabExam.tsx` — replaced placeholder with real test selector (3-level cards) + question type info + shield system explainer

#### UX features shipped

- Time limit + animated countdown (turns coral + pulses < 60s)
- Progress bar (current question / total questions across parts)
- Drag-and-drop with native HTML5 drag API for name placement
- Color palette + region-based coloring (tap region → tap color)
- Replay-anytime audio button (with play count display)
- Animated 5-shield reveal on results screen (staggered animation)
- Per-part breakdown showing which areas to practice
- "Thoát" button with confirmation (prevents accidental exit)

#### Known limitations (intentional for MVP, addressed in v1.0.x)

- **Audio not yet wired**: clicking ▶️ logs `audioKey` to console but doesn't play. v1.0.1 will wire this to a `worker/src/exam/handlers.ts` route that streams from R2 (with TTS generation on miss). The frontend code is forward-compatible — only the fetch URL needs to land.
- **Scene art is emoji-based**: drag-name scene shows generic 🌳👫🏡 instead of custom illustration. Real scene art ships in v1.0.2 (priority: ship gameplay first).
- **No persistence**: results are in-memory only. v1.0.1 adds Dexie storage (`exam_attempts` table) + sync to D1 via `/exam/submit`.
- **No attempt history**: completed attempts disappear after closing results. v1.0.1 will show "lần trước: 4/5 khiên" beside each test.
- **No level-gating**: any user can attempt any level. v1.1+ may add "phải đạt 3 khiên ở Cấp 1 để mở khóa Cấp 2".
- **Cấp 2 / Cấp 3 chưa có bài thi**: cards show "🔒 Sắp mở khóa". v1.0.x patches will add `level2_test1.ts`, `level3_test1.ts`, etc.

### Naming conventions

User-facing labels avoid Cambridge trademark:
- "Cấp 1 / 2 / 3" instead of "Starters / Movers / Flyers"
- "Bài thi 1" instead of "Test 1" with Cambridge branding
- "Khiên" (shield) used same as Cambridge YLE convention since the metaphor is industry-standard

## [0.18.0] — 2026-05-03

### 📚 EN data expansion: 500 → 1025 words (gấp đôi)

Thay thế single tier `oxford_500` (500 từ flat) bằng **6-tier progression** mô phỏng Cambridge YLE:

| Tier ID | Label | Words | Target audience |
|---------|-------|-------|-----------------|
| `en_level_1` | Cấp 1 — Cơ bản | 280 | Pre-A1, lớp 1-2 (6-8t) |
| `en_level_2` | Cấp 2 — Sơ trung | 220 | A1, lớp 3-4 (8-10t) |
| `en_level_3` | Cấp 3 — Trung cấp | 140 | A2, lớp 5-6 (10-12t) |
| `en_level_4` | Cấp 4 — Tiểu học cơ bản | 110 | School vocab (10-11t) |
| `en_level_5` | Cấp 5 — Tiểu học nâng cao | 158 | Advanced primary (11-13t) |
| `en_level_6` | Cấp 6 — Chuẩn bị nâng cao | 117 | KET/PET prep |
| **Total** | | **1025** | |

### Topic coverage by level

**Level 1 (Pre-A1)**: pronouns, greetings, family, numbers 1-20, colors, body parts, animals (pets/farm/zoo), food/drink basic, school items, clothes, home, toys, basic verbs (eat/sleep/play/run), basic adjectives, question words, time, weather, common prepositions.

**Level 2 (A1)**: days/months, numbers 21-100, daily routines (wake up, brush, dress), sports (football/tennis/swimming), jobs, transportation (bus/train/plane), more food (meals/fruits/vegetables), body health, feelings (angry/tired/excited), more adjectives (clean/dirty/easy/hard), more animals (butterfly/dolphin/penguin), home items (sofa/fridge), cooking actions, conjunctions (because/so), nature (sea/mountain/river).

**Level 3 (A2)**: past tense verbs (regular ed-form + 20 common irregulars), comparatives + superlatives, travel (hotel/airport/passport/ticket), countries (Vietnam/America/Japan), technology (computer/phone/internet/email), music + entertainment (guitar/movie/concert), cooking deeper (recipe/bake/fry, taste adjectives), environment (pollution/recycle/planet), more action verbs (choose/wait/arrive/leave), mental verbs (believe/understand/agree).

**Level 4 (school basic)**: school subjects (math/science/history/geography), classroom items (notebook/eraser/scissors/glue), geography (continent/desert/jungle/volcano), science basics (gas/liquid/solid/metal/wood), living things (plant/seed/insect/wing), body health (bone/blood/heart/brain), everyday verbs (borrow/lend/share/wear/carry), descriptive adjectives (difficult/important/famous/safe/dangerous), abstract concepts (idea/plan/problem/solution).

**Level 5 (school advanced)**: modal verbs (will/would/should/could/might/must), time expressions (soon/later/early/on time/century), community + society (neighbor/village/capital/culture/festival), hobbies (collecting/photography/chess), abstract concepts (love/peace/truth/dream/memory), mental verbs (imagine/decide/explain/describe/promise/apologize), creative verbs (build/design/invent/discover), descriptive adjectives (wonderful/perfect/modern/ancient/soft/sharp), money + numbers (dollar/price/half/quarter), more animals (eagle/octopus/wolf), more food (pasta/beef/shrimp/pineapple), closing prep/conjunctions (each/although/across/above).

**Level 6 (academic prep)**: academic concepts (research/theory/fact/opinion/evidence/summary), grammar terms (verb/noun/spelling/pronunciation), communication (message/letter/announcement/news), career + workplace (manager/employee/engineer/scientist/lawyer), health + emergency (accident/injury/cure/patient), government + civics (president/election/citizen/freedom/justice), academic verbs (analyze/predict/observe/calculate/recommend/develop/improve), formal adjectives (serious/comfortable/public/national/possible/necessary), formal connectors (whether/instead/however/therefore/although/eventually).

### Design principles

- **Concrete over abstract** ở levels 1-3 (children point to things, not concepts).
- **Simple example sentences ≤6 words** ở Cấp 1, expanding gradually.
- **Vietnamese translations match school textbooks** (avoid literary synonyms).
- **Emoji hints** cho mọi từ — visual cue cho non-readers.
- **No Cambridge trademark** — file naming dùng "level1/2/3..." thay vì "starters/movers/flyers" để tránh trademark issues khi submit Chrome Web Store.

### Breaking changes (internal)

- Removed `src/data/en/oxford500.ts` (500 từ flat tier)
- Tier ID `oxford_500` → 6 new IDs (`en_level_1` through `en_level_6`)
- `langLabels.en.tagline`: "IPA · Oxford 3000 · Phonemes" → "IPA · 6 cấp độ · Phonemes"

**Migration**: User progress data (FSRS state, review_log) chỉ key bằng `word.id` (e.g. `en_001`). IDs cũ trong oxford500.ts đã được tái sử dụng cho Level 1 với same word semantics — most user progress should carry over seamlessly. Edge cases: từ trong oxford500 không có trong new structure sẽ "mồ côi" (đã review nhưng không còn trong active tier) — sync sẽ gracefully drop những entries này khi rebuild.

### Roadmap

- v0.18.x — incremental expansion: thêm từ vào các levels existing dựa trên user feedback (target 1500-2000 words eventually)
- v0.19.0 — exam data files (Level 1 Test 1) + ExamRunner orchestrator
- v1.0.0 — Phòng thi MVP

## [0.17.0] — 2026-05-03

### 🎨 Feature 1 — Tab Stats moved into Account & Sync modal

Stats tab cũ ở top-level nav không còn — feature giờ ở trong **Avatar dropdown → Tài khoản & Đồng bộ → tab "Thống kê"**.

**Reasoning**: Stats là "look back" surface cá nhân, không phải learning action chính. Top-level slot dành cho action (học, ôn, thi). Modal mở qua avatar là natural home cho personal analytics.

**Changes**:
- `AccountSettingsModal` giờ có inner tab navigation: "Tài khoản & Đồng bộ" / "Thống kê"
- Pill-style TabPill component (white card cho active, low-contrast cho inactive)
- Modal max-width tăng từ `xl` → `3xl` để Stats charts đủ rộng
- Removed `TabStats.tsx` (component `StatsSection` giữ nguyên, được render trong modal)
- Removed top-level `'stats'` từ `TabId` type và `<TabNav>` SECONDARY_TABS

### 🎯 Feature 2 — Top-level slot mới: Phòng thi (placeholder cho v1.0)

Thay slot Stats trong SECONDARY_TABS = **🎯 Phòng thi**. Component placeholder showing:
- Hero "Sắp ra mắt v1.0" với progress badge
- 6 feature preview cards (3 levels, 4 question types, AI TTS, 5-shield, progress tracking, sync)
- 3-level lộ trình teaser (Cấp 1/2/3 với target age groups)
- Mục tiêu ship: tháng 6/2026

User browsing extension thấy được roadmap minh bạch + tăng anticipation cho v1.0.

### ⚡ Feature 3 — Animated story generation progress

Replace simple "⏳ Đang viết truyện..." spinner với **animated 4-phase progress UI**:

```
Phase 1 (0-5s):    🤔 Đang lên ý tưởng
Phase 2 (5-12s):   ✍️ Đang viết câu chuyện
Phase 3 (12-18s):  🎨 Đang chọn từ vựng
Phase 4 (18s+):    🌐 Đang hoàn thiện và dịch
```

UI elements:
- Progress bar fills 0-95% theo elapsed time (5% cuối khi completion thật)
- Animated bouncing emoji per phase
- Animated dots `...` cyclic
- Phase breadcrumbs với checkmarks cho phases đã qua
- Shimmer overlay trên progress bar
- "X giây / ~25s" timer

**Why "perceived progress" thay vì true SSE streaming**: Qwen returns JSON, không phải plain text. Partial JSON không renderable. True streaming ~80% effort cho 20% UX gain. Phase indicator: 5% effort cho 80% UX gain. Có thể revisit true SSE nếu user feedback đòi hỏi typewriter content.

**Implementation**: New component `StoryGenProgress.tsx` (165 lines). StoryGenModal swap form body → `<StoryGenProgress />` khi `submitting`. Form state preserved (cancel mid-flight không mất HSK/genre/desc selections).

### 🎨 Tailwind additions

- `animate-shimmer` — 2s linear infinite, slides white gradient từ left to right
- `shimmer` keyframe `0% translateX(-100%)` → `100% translateX(200%)`

## [0.16.6] — 2026-05-03

### 🐛 Critical bug fixes trước khi shift focus sang v0.17+

**1. Bug #20 — Stories không reset khi đổi ngôn ngữ học** (`useAppStore.setLang`)

Repro: Truyện kể → click vào 1 truyện HSK → đang đọc → click `EN` ở header → **truyện vẫn render chữ Trung** dù `targetLang='en'`.

Root cause: `setLang(lang)` chỉ update `targetLang` trong Zustand. `activeStoryId` (state riêng) không bị clear → StoryReader vẫn render story cũ mặc dù `targetLang` đã đổi.

Fix: `setLang` giờ reset `activeStoryId` + `catalogReturnContext` cùng `targetLang`. Stories tab quay về level selector cho lang mới. Cũng tránh stale wordId references (catalog return context) point tới word không tồn tại trong lang mới.

**2. Performance — Story generation timeout giảm 30-60s → 15-25s** (`worker/src/index.ts`)

Workers AI Qwen3 30B `max_tokens: 16384` quá rộng → model "over-think" mỗi request, mất 30-60s.

Empirical observation: stories thực tế dưới 4K tokens (HSK 1-3 chỉ ~600 từ ≈ 1-2K tokens; reasoning ~2K). 16K là pure latency cost, không cải thiện quality.

Fix: giảm `max_tokens: 16384 → 8000`. Vẫn dư headroom, generate xong nhanh ~50%.

### 📋 Strategic plan locked — Path B (Maximalist)

Roadmap mới sau audit Jason ngày 03/05:

```
v0.17.0 (week 1): Stats refactor + Story streaming + Exam tab placeholder
v0.18.0 (week 2-3): EN data 500 → 2000 từ (Cambridge YLE-based + AI metadata + manual QA)
v1.0.0  (week 4-6): Tab Phòng thi MVP — Level 1 / 4 question types / AI TTS
v1.1.0  (week 7+): Level 2 + Level 3 + R&W parts
                ↓
         🚀 CWS submission khi v1.0 stable
```

Decisions locked:
- Path B (full features trước CWS submit, không ship MVP-only)
- EN data Option C (Cambridge YLE base + AI generate metadata + manual QA)
- Exam levels: **Level 1 / Level 2 / Level 3** (không dùng "Starters/Movers/Flyers" để tránh Cambridge trademark)
- Exam audio: AI TTS (Workers AI), cached vào R2

## [0.16.5] — 2026-05-02

### 🐛 Sign-out reset + Dashboard live-update + greeting personalization

**Issues sửa**

1. **Sign-out qua avatar dropdown không reset UI** — `useAuth.handleSignOut()`
   chỉ revoke OAuth token, không clear sync state, không reload Zustand.
   Hậu quả: Dashboard tiếp tục show streak/totalReviewsToday/dailyGoal cũ
   (`🔥 Chuỗi 1 ngày`, `🎯 3/10`, `⏰ 2 thẻ`, `📚 Đã gặp 2`) sau sign-out.
2. **Sign-out path "giữ data trên máy"** trong AccountSettingsModal cũng
   không gọi `reloadFromDb()` (chỉ path "xóa cache" gọi).
3. **Dashboard counters không live-update** — `dueNow`, `seen` đến từ
   `useState + useEffect([targetLang, words])`, không react Dexie change.
   Nếu `wordProgress` table được clear (sign out + clear, account delete,
   user-switch wipe), counters cũng không reset.
4. **StatsSection** cùng vấn đề — không subscribe Dexie change.
5. **Greeting hardcode "Jason 👋"** — dev leftover, không match user thật.

**Fixes**

- `useAuth.handleSignOut()` giờ:
  - `clearSyncState()` xóa localStorage flags
  - `clearActiveUserId()` clear user-switch marker
  - `signOut()` revoke OAuth
  - `reloadFromDb()` re-hydrate Zustand từ Dexie (về defaults nếu cleared)
- `AccountSettingsModal.onSignOut`: luôn `reloadFromDb()` ở cả 2 path
  (giữ data hoặc xóa). Path "giữ data" thêm `clearActiveUserId()` để
  bảo vệ user-switch detection cho lần sign-in sau.
- `Dashboard`: thêm `wpCount` vào `useEffect` deps qua `useLiveQuery` →
  Dexie thay đổi → re-fetch stats → counters update real-time.
- `StatsSection`: thêm `reviewLogTick` qua `useLiveQuery` → Stats panel
  cũng live-update.
- Dashboard greeting dùng tên thật từ Google profile (`useAuth().userInfo.name`),
  fallback "bạn" cho signed-out users.

### 📊 QC audit summary

Audit toàn codebase v0.16.4. Kết quả:
- **0 critical bugs** còn lại
- **0 race conditions** trong useEffect deps
- 4 `WORKER_URL` hardcode 5 chỗ — không bug, deferred (optional refactor)
- 47 `console.warn/error` — đều intentional, không đáng concern
- Silent `.catch(() => {})` đều best-effort metrics, không hide user-facing errors
- TabFlashcards / TabStories / TabPhonetics đã dùng `useLiveQuery` →
  auto re-render khi Dexie thay đổi → OK

## [0.16.4] — 2026-05-02

### 🐛 UX Fixes — Flashcard image rendering + rating button colors

**1. Custom flashcard image bị crop xấu** (`FlashcardImage.tsx`)

User upload portrait/landscape photo bị `object-cover` crop center. UI thấy zoom in lệch (vd: hình con sloth bị cắt mất đầu).

**Fix**: đổi `object-cover` → `object-contain`, tăng container `h-40` → `h-48`, thêm `bg-cream` để letterbox empty space không xấu. Anki fallback image giữ `object-cover` vì Anki chuẩn hóa aspect ratio.

Trade-off: Hình portrait có thể có viền cream trên/dưới. Đẹp hơn việc bị crop mất nội dung.

**2. Nút "Dễ" màu đen** (`TabFlashcards.tsx` + `tailwind.config.js`)

Easy button dùng `tint="ink"` (đen) — không match semantic "dễ = thành công = xanh". Mint đã dùng cho "Được", cần thêm color forest đậm hơn.

**Fix**:
- Thêm color tokens `forest.50` → `forest.700` (xanh lá đậm hơn mint)
- Thêm shadow `chunky-forest` cho consistency
- Easy button đổi `tint="ink"` → `tint="forest"`
- 4 buttons giờ có 4 hue rõ rệt: coral / sun / mint / forest → user nhận diện nhanh

## [0.16.3] — 2026-05-02

### 🐛 Fix — CORS chặn R2 image upload (PUT/DELETE)

`worker/src/index.ts` `Access-Control-Allow-Methods` cũ chỉ cho `POST, GET, OPTIONS`. R2 image endpoints (`/sync/images/:lang/:wordId`) dùng:
- `PUT` để upload
- `DELETE` để xóa

→ Browser CORS preflight reject upload với `Method PUT is not allowed by Access-Control-Allow-Methods in preflight response`.

**Fix**: thêm `PUT, DELETE` vào allowlist:
- Old: `POST, GET, OPTIONS`
- New: `GET, POST, PUT, DELETE, OPTIONS`

**Phải redeploy worker** để fix có hiệu lực (`cd worker && npm run deploy`).

## [0.16.2] — 2026-05-02

### 🔧 Fix — Email contact trong UI components

v0.16.1 update email trong markdown/HTML docs nhưng quên 2 file TSX:
- `UpgradeModal.tsx` — fallback message khi billing chưa setup
- `AccountSettingsModal.tsx` — Pro user support contact link

Đã fix → toàn bộ codebase + docs giờ dùng `jasonnguyenksp@gmail.com`.

## [0.16.1] — 2026-05-02

### 🔧 Docs patch — Public contact email

Update tất cả contact email public trong legal docs + landing page:
- `kspstudio@gmail.com` → `jasonnguyenksp@gmail.com`

Files updated (36 references):
- `PRIVACY_POLICY.md` — sections 5.4, 5.7, 10
- `TERMS_OF_SERVICE.md` — sections 1, 4, 6.2, 16
- `landing/index.html` — footer, FAQ
- `landing/privacy.html` + `landing/terms.html` — auto-generated
- `docs/OAUTH_VERIFICATION_GUIDE.md` — consent screen instructions
- `docs/LEMON_SQUEEZY_SETUP.md` + `docs/R2_SETUP.md`

`jasonnguyenksp@gmail.com` là email chính cho:
- Chrome Web Store developer contact
- OAuth consent screen
- GDPR/privacy requests
- Lemon Squeezy support

`dungthichvar@gmail.com` reserved for test/dev sign-in only.

## [0.16.0] — 2026-05-02

### 🔒 Critical bug fixes (audit findings)

Toàn bộ code v0.15.1 đã được audit — phát hiện 13 bugs (1 critical, 4 high,
5 medium, 3 low). Bản này fix 9 bugs nguy hiểm nhất.

**🔴 #7 (CRITICAL) — Webhook UPDATE silently fails for users who paid before
first sync.** Webhook xài UPDATE → nếu user record chưa tồn tại trong D1
(user trả tiền Pro trước khi từng sync), 0 rows affected → user vĩnh viễn
ở Free dù đã trả tiền. **Fix:** đổi sang INSERT...ON CONFLICT UPSERT, lấy
email/name từ LS payload (`user_email`, `user_name`).

**🟠 #1 — `subscription_payment_success` event không được handle.** LS gửi
event này khi gia hạn thành công. Code cũ chỉ trông chờ `subscription_updated`
→ một số config không extend `tier_expires_at` đúng. **Fix:** handle thêm
event này, treat status='active' nếu thiếu.

**🟠 #11 — Auth token không auto-refresh khi 401.** Token Google ~1h thì hết
hạn. Sau đó mọi sync/AI/billing call fail im lặng. UI vẫn show "đã đăng
nhập". **Fix:** tạo `authedFetch()` helper trong `authService` — wrap mọi
auth'd fetch, retry 1 lần với token refresh khi gặp 401. Migrate cả 3
service: `syncService`, `billingService`, `storyGenService`.

**🟠 #18 — Multi-user data isolation broken trên local Dexie.** User A
sign out (không clear cache) → User B sign in trên cùng browser → User B
thấy stories/settings/images của User A. **Fix:** thêm user-switch
detection trong `syncMigration.ts` — track active userId trong localStorage
(`lingu_active_user_id`); nếu khác Google account → wipe per-user Dexie
tables trước khi User B đọc/push.

**🟠 #19 — Settings push không filter userId.** Hệ quả của #18: User B
push settings của User A lên server account của User B → corrupt cloud
data. **Fix:** thêm userId check ở `collectLocalChanges()` cho settings
row (belt-and-suspenders sau khi #18 đã wipe).

**🟡 #2 — `subscription_cancelled` thiếu `ends_at` → downgrade ngay.**
Mất Pro period đã trả. **Fix:** nếu thiếu `ends_at`, skip update và để
existing `tier_expires_at` tự nhiên expire qua `effectiveTier()`.

**🟡 #4 — Event `order_refunded` không handle.** User refund vẫn giữ
Pro/Lifetime. **Fix:** thêm event handler downgrade về free, lookup user
qua `billing_events` history (LS không gửi custom_data ở refund event).

**🟡 #12 — `useTier` hook không refetch khi sign-in.** Nếu cached=null
trước sign-in, sau sign-in Pro badge không hiện đến khi focus event. **Fix:**
useTier subscribe vào `onAuthChange()`, auto-refresh khi auth state đổi.

**🟡 #16 — `respJson = await res.json()` throws với non-JSON response.**
Cloudflare error pages trả HTML, `JSON.parse` throw → error message lạ.
**Fix:** đọc body thành text trước, parse JSON với try/catch.

### 🌩️ R2 image storage (option 2 — migration ngắn từ Drive sang R2)

**Backend (worker)**

- **`worker/src/sync/images.ts`** — module mới handle PUT/GET/DELETE `/sync/images/:lang/:wordId`:
  - PUT: validate mime + size (5 MB cap) + per-tier quota (Free 50 MB / Pro 500 MB / Lifetime 500 MB), lưu vào R2 với httpMetadata, upsert metadata vào `custom_images` D1 table
  - GET: stream binary từ R2, set `Content-Type` từ stored httpMetadata, cache 24h
  - DELETE: parallel xóa R2 + D1 row, idempotent (404 ≈ ok)
  - `deleteAllUserImages()`: paginated prefix delete cho `{userId}/...` — gọi từ `/sync/clear` khi user xóa tài khoản
- R2 key format: `{userId}/{lang}/{wordId}` — opaque, không leak PII
- Defensive sanitization: reject `wordId` chứa `/` hoặc `..` (prevent prefix escape)
- `wrangler.toml`: thêm `[[r2_buckets]] binding = "IMAGES"`
- `handleClear()`: gọi `deleteAllUserImages` parallel với D1 cascade delete

**Frontend**

- **`src/services/r2ImageService.ts`** — module mới: `uploadImage()`, `downloadImage()`, `deleteImage()` với typed errors (`R2ImageError` kinds: auth/quota/too_large/not_found/network)
- **`src/services/imageService.ts`** rewrite — dual-backend strategy:
  - Upload mới → R2 only
  - Read order: Dexie cached blob → R2 → Drive (legacy fallback cho records pre-v0.16)
  - Delete: ưu tiên R2, fall back Drive cho legacy
- **`src/types/index.ts`** — `WordCustomImage`: thêm `r2Key?`, đổi `driveFileId` thành optional (legacy)
- **`syncService.ts`**:
  - `toCustomImageRow()`: dùng `r2Key`, fallback `drive-legacy:<fileId>` cho legacy push
  - `applyServerToLocal()`: detect `drive-legacy:` prefix, split lại đúng field

**Documentation**

- **`docs/R2_SETUP.md`** — 7-bước guide từ tạo bucket → deploy → verify → quota config → backward compat → monitoring

### ⚠️ Còn 4 bugs từ audit chưa fix (low/medium priority)

- **#10**: Account deletion không tự cancel LS subscription (documented behavior trong ToS, UX cải thiện sau)
- **#8**: `verifyGoogleToken` gọi tokeninfo mỗi request (~50-100ms latency). Perf only, cần KV cache layer
- **#13**: useTier dual-mount race (đã dedup qua `inFlight`, edge case không critical)
- **#14**: UpgradeModal `setTimeout` không clear on unmount (minor leak, idempotent refresh)

### 🚀 Deploy steps cho Jason

```bash
# 1. R2 bucket
cd worker
wrangler r2 bucket create lingua-newtab-images

# 2. Deploy worker (đã update wrangler.toml với R2 binding)
npm run deploy

# 3. Reload extension
```

## [0.15.1] — 2026-05-02

### 📜 New: Legal docs + Landing page (Chrome Web Store ship prep)

Mở đường cho OAuth verification + Chrome Web Store submission.

**Documents**

- **`PRIVACY_POLICY.md`** — rewrite hoàn toàn cho v0.15.x. Bản cũ
  (từ v0.x trước cloud sync) outdated nghiêm trọng — viết "we don't
  collect anything" trong khi v0.15.x có Google OAuth + D1 storage +
  Workers AI + Lemon Squeezy. Bản mới mô tả chính xác:
  - 4 loại data thu thập (account info, learning data, AI prompts,
    aggregate metrics) + lý do từng loại
  - 6 third-party services kèm purpose + scope cụ thể
  - GDPR rights cho user EU/UK + legal basis cho mỗi xử lý
  - Children policy (13+ general, 16+ EU/UK)
  - Bilingual VI/EN (English first vì Google reviewer đọc EN)
- **`TERMS_OF_SERVICE.md`** — mới hoàn toàn (16 điều). Cover Free/Pro
  tier rules, Lemon Squeezy refund policy, AI content disclaimer,
  IP rights, governing law (Vietnam). Bilingual VI/EN.

**Landing page (`landing/`)**

- `index.html` — homepage với hero/features/pricing/FAQ. Dùng cùng
  brand tokens với extension (coral/mint/ink, Be Vietnam Pro font,
  chunky shadow style)
- `privacy.html` + `terms.html` — auto-generated từ markdown qua
  Python `markdown` package, wrapped trong template thống nhất.
  Privacy + Terms đều cùng domain với homepage (Google requirement)
- `icon-48.png`, `icon-128.png` — copy từ extension public/

**Documentation**

- **`docs/OAUTH_VERIFICATION_GUIDE.md`** — 7-bước guide chi tiết.
  Confirmed key insight: tất cả 3 scope (`drive.appdata`,
  `userinfo.email`, `userinfo.profile`) đều **non-sensitive** →
  chỉ cần brand verification (3-5 ngày) thay vì sensitive-scope
  verification (4-6 tuần với demo video + security assessment).
  Cover từ deploy landing page → Search Console domain verify →
  consent screen update → publish app → submit verification

### 🧹 Maintenance

- Old PRIVACY_POLICY.md (v0.x era, "we collect nothing") archived
  — bản mới thay thế hoàn toàn

## [0.15.0] — 2026-05-02

### ✨ New: Tier system (Free + Pro) with Lemon Squeezy

Mở đường cho ship public lên Chrome Web Store.

**Backend (worker)**

- Migration `09_billing.sql`: `users.ls_subscription_id`, `users.ls_customer_id`
  + bảng `billing_events` (append-only audit log với webhook payload đầy đủ)
- `worker/src/billing/tier.ts`: single source of truth cho tier limits.
  Free: 3 truyện/ngày · Pro: 30/ngày · Lifetime: 30/ngày · Banned: 0.
  `effectiveTier()` tự fold expiry — không cần cron downgrade
- `worker/src/billing/handlers.ts`:
  - `POST /billing/webhook` — HMAC-SHA256 verify (Web Crypto, constant-time
    compare), handle `subscription_created`/`updated`/`cancelled`/`resumed`/
    `expired` + `order_created` (lifetime). Idempotent — retries an toàn.
    Mọi event được log vào `billing_events` kể cả khi không apply tier
  - `GET /billing/checkout-info` — trả về Lemon Squeezy checkout URL
    riêng cho mỗi user (custom_data.user_id pre-baked để webhook link
    được subscription về user)
  - `GET /billing/tier` — lookup nhẹ "what tier am I?" cho `useTier()` hook
- `/generate-story` rate limit giờ tier-aware — tự lookup tier trước
  khi check quota
- `/quota` response bổ sung `tier` field
- `POST /admin/upgrade` — endpoint admin để manually override tier
  (test Pro UI trước khi setup Lemon Squeezy hoặc fix manual refund)

**Frontend**

- `src/services/billingService.ts`: `fetchCheckoutInfo()`, `fetchTier()`,
  `openCheckout()`, `BillingError`
- `src/newtab/hooks/useTier.ts`: module-level cache + focus listener
  → tier auto-refresh khi user quay lại từ Lemon Squeezy checkout tab
- `UpgradeModal.tsx`: 3 plan cards (Pro Monthly / Pro Yearly highlighted
  best-value / Lifetime), feature comparison strip, graceful "billing
  not configured" state cho phép ship code trước khi LS ready
- Header: badge `✨ PRO` (gold pill, Pro/Lifetime) hoặc `⚡ Nâng cấp Pro`
  CTA (Free) — chỉ hiển thị sau khi tier loaded để tránh flicker
- AccountSettingsModal: section Upgrade riêng cho Free user, section
  "Bạn đang dùng Pro" với expiry date cho Pro user
- StoryGenModal: hiển thị badge tier kế bên quota, link "Nâng cấp Pro
  để có nhiều hơn →" cho Free user

**Docs**

- `docs/LEMON_SQUEEZY_SETUP.md`: 7-bước guide từ tạo store → cấu hình
  webhook → set worker secrets → test E2E với test-mode card →
  manual override admin → going live

**Defaults có thể chỉnh qua env:**

- Quota: edit `STORY_QUOTA_BY_TIER` trong `worker/src/billing/tier.ts`
- Prices: env vars `PRICE_PRO_MONTHLY` / `PRICE_PRO_YEARLY` / `PRICE_LIFETIME`
- Variant IDs: env vars `LEMON_SQUEEZY_VARIANT_*`

## [0.5.8] — 2026-04-24

### 🐛 Bug fix
- **Nút "Chậm" ở Tab Phát âm fall-back Chrome robot voice**: Code cũ gọi
  `speak(exampleWord, {rate: 0.6})` → Chrome Web Speech nam robot đọc hanzi.
  Fix: thêm `playPhonemeSlow` hook variant + `playPhonemeAudio` accept
  `speed` param, giờ nút Chậm dùng bundled Cherry MP3 với `playbackRate=0.7`.
  Giọng đồng nhất giữa Nghe và Chậm (cùng là Cherry, chỉ khác tốc độ).

### 🛠️ Umlaut fallback (pre-emptive, may or may not be needed)
- Script `gen_qwen_tts_mac.py` giờ có logic: nếu pinyin chứa `ǖǘǚǜü` →
  dùng hanzi thay pinyin cho input TTS (vì Qwen-TTS xử lý ü-codepoints
  không ổn định). Áp dụng cho cả phonemes và words.
- HSK1 ảnh hưởng: 1 từ (`zh_012 女儿 nǚ'ér`). Phoneme ảnh hưởng: 0 (vì
  pypinyin auto-convert `鱼` → `yú`, không có ü).

## [0.5.7] — 2026-04-24

### 🐛 Bug fix (critical)
- **Flashcard audio cắt ngắn, đọc sai hoàn toàn**: File `zh_006.mp3`
  (你们) chỉ có 288ms — Qwen-TTS truncate audio khi input là hanzi
  ngắn 2-3 ký tự. Test 4 strategies chứng minh pinyin input giải
  quyết triệt để: `text='nǐmen'` → 560ms đọc đúng "nǐmen", trong
  khi `text='你们'` → 720ms nhưng chỉ đọc "n".

### 🔧 Changed
- **Script `gen_qwen_tts_mac.py` giờ dùng pinyin thay hanzi**:
  - Words: extract `phonetic` field từ `hsk1.ts` (có sẵn pinyin
    với tone marks) thay vì `term` (hanzi).
  - Phonemes: auto-convert `syllable` hanzi → pinyin bằng
    `pypinyin` library. Ví dụ: 你们 → nǐmen, 妈 → mā, 波 → bō.
- **New dependency**: `pypinyin` (auto hanzi → pinyin conversion).
  Install: `uv pip install pypinyin`.

### 📦 Action required
Jason cần regenerate toàn bộ audio với input pinyin mới:
```bash
cd ~/Downloads/lingua-newtab
source .venv/bin/activate
uv pip install pypinyin
python scripts/gen_qwen_tts_mac.py --scope=all --force
```

## [0.5.6] — 2026-04-24

### 🐛 Bug fix (critical)
- **Tone neutral (`a`) fall-back Web Speech robot nam**: UI `src/data/zh/pinyin.ts`
  expect ID `zh_tone_0` nhưng script `phonemes-source.json` sinh file
  `zh_tone_neutral` → manifest không có entry matching → audioService fall-back
  sang Web Speech (giọng robot nam Chrome built-in). Fix: đồng bộ ID sang
  `zh_tone_0` trong source.
- **Syllable cho tone 0 không khớp ngữ cảnh**: Script dùng `吗` (má-question
  modal particle) nhưng UI example là `妈妈` (māma — mẹ, từ thân mật). `吗`
  không phải ví dụ thuần neutral tone trong cách dạy pinyin cơ bản. Fix:
  đổi syllable `吗` → `妈妈` trong source.

### 📦 Action required
Jason cần regenerate chỉ file `zh_tone_0.mp3`:
```bash
python scripts/gen_qwen_tts_mac.py --scope=phonemes --force
```
Hoặc chỉ riêng tone 0 bằng tay (Qwen-TTS script chưa có filter theo ID).

## [0.5.5] — 2026-04-24

### ✨ Added
- **`scripts/gen_qwen_tts_mac.py`** — audio generator dùng Qwen-TTS API
  (model `qwen3-tts-flash`, released 2026-01-22). Thay thế CosyVoice vì
  CosyVoice Singapore region gặp `ResponseTimeout` qua WebSocket API,
  còn Qwen-TTS dùng HTTP API ổn định, activate tự động cùng Model Studio
  (không cần enable service riêng).

### 📝 Notes
- Feedback Jason: Giọng `Cherry` của Qwen-TTS phát âm phoneme đơn lẻ
  (b, p, m, zh, ch...) rõ ràng, accept được cho tab Phát âm.
- Chi phí: ~$0.20/lần full generate (214 files), free credit $50 của
  Alibaba đủ xài ~250 lần.
- `gen_cosyvoice_mac.py` vẫn giữ trong `scripts/` làm reference nhưng
  không khuyến nghị dùng trên account Singapore.

## [0.5.4] — 2026-04-23

### ✨ Added
- **CosyVoice TTS integration** — script `scripts/gen_cosyvoice_mac.py`
  gọi Alibaba Cloud Model Studio API để generate audio. Chất lượng
  vượt xa Kokoro cho tiếng Trung (CER 0.81% vs ~2-3%), tone chính xác,
  giọng native-sounding. Script mirror pattern `gen_kokoro_mac.py` nên
  Jason đổi workflow chỉ 1 bước: thay script + set API key.
- **COSYVOICE_SETUP.md** — hướng dẫn 8 bước register Alibaba Cloud
  Singapore, lấy API key, generate audio, troubleshoot.
- Schema manifest.json giờ support `generator: "cosyvoice"` (vẫn
  backward-compatible với `kokoro`).

### 📝 Notes
- Feedback Jason: giọng Kokoro `zf_xiaoxiao` đọc sai nhiều. CosyVoice v2
  `longxiaochun_v2` (giọng nữ Bắc Kinh chuẩn) được đề xuất replacement.
- Chi phí CosyVoice: ~$0.06/214 file, Alibaba tặng $50 free credit khi
  register → generate thoải mái.

## [0.5.3] — 2026-04-23

### 🐛 Bug fix (UI)
- **Grid phoneme bị đẩy giãn khi detail panel dài**: Parent grid 2-cột
  `tiles | detail`, row height = max của 2 columns. Khi click phoneme như
  `b` có section "LỖI THƯỜNG GẶP" → detail panel cao hơn tiles → tiles
  column bị stretch, rows bên trong nở ra khoảng trống. Fix: thêm
  `content-start` + `auto-rows-max` cho tiles grid → rows pack từ trên
  xuống, không stretch. Click `b` vs click `m` giờ layout tiles identical.

## [0.5.2] — 2026-04-23

### 🐛 Bug fixes (UI)
- **Phoneme tile trong tab Thanh điệu cao bất thường**: Tones tab chỉ có 5
  items trong 1 grid row, CSS grid stretch row height → tile cao gấp 3
  bình thường. Fix: đặt tile height cố định `h-28` → identical across tất
  cả tabs (Âm đầu, Âm vận, Thanh điệu) và không phụ thuộc số rows.
- **Phoneme tile "nhảy" khi click**: Tile selected có `shadow-chunky-coral`
  (4px tall shadow) trong khi tile khác không có shadow → cảm giác ô
  selected "to hơn" dù width/height bằng nhau. Fix: selected dùng
  `shadow-chunky-soft` (3px, cùng thickness với hover shadow). Giờ chỉ có
  border + bg đổi màu, không đổi bất kỳ dimension nào.
- **Truncate example word text**: Thêm `truncate` class để text dài như
  "中国" không wrap xuống dòng 2, giữ tile height tuyệt đối ổn định.

## [0.5.1] — 2026-04-22

### 🐛 Bug fixes (UI)
- **Flashcard back face bị rating buttons đè lên ví dụ**: Outer container
  dùng `minHeight: 400` cứng + faces `position: absolute inset-0` → back
  face dài hơn 400px bị clip. Rating buttons ("Quên/Khó/Được/Dễ") render
  ngay dưới 400px đè lên phần ví dụ bị overflow. Fix: chuyển 2 faces sang
  CSS grid stacking cùng 1 cell → container auto-size theo face cao hơn,
  không còn clip.
- **Phoneme tile đổi size mỗi lần click**: `animate-pop` chạy keyframe
  `scale(1) → scale(1.08) → scale(1)` trên symbol mỗi khi selected đổi,
  gây cảm giác ô tăng giảm. Cộng với `transition-all` khiến `transform`
  cũng bị transition. Fix: bỏ `animate-pop`, đổi sang `transition-colors`
  để layout cố định hoàn toàn. Pulse animation chỉ chạy khi audio đang
  phát (visual feedback rõ ràng hơn).
- **Click phoneme giờ tự phát âm luôn**: Trước đây user phải click tile →
  click tiếp "Nghe" ở detail panel mới nghe được. Giờ click tile tự chọn
  + phát audio ngay. Re-click cùng tile → replay. Nút trong detail panel
  đổi tên "Nghe" → "Nghe lại".

### 📦 Không có schema/data changes
Chỉ sửa UI layer — không cần re-generate audio, không cần migration.

## [0.5.0] — 2026-04-22

### 🐛 Bug fix (critical)
- **Audio manifest schema mismatch**: `gen_kokoro_mac.py` ghi entries dạng
  `{"female": "path"}` nhưng `audioService.ts` đọc `{"normal", "slow"}` →
  100% fall-back Web Speech dù đã generate Kokoro. Web Speech vẫn phát âm
  được nên bug không bị catch thủ công. Fix: cả 2 phía thống nhất schema
  mới `{ default?, normal?, slow? }` với resolve fallback rõ ràng.

### ✨ Added
- `playPhonemeAudio(phonemeId, ...)` — giờ thử bundled MP3 theo prefix ID
  (`zh_init_*` → `initials/`, `en_vowel_*` → `vowels/`, v.v.). Trước đây
  hardcoded Web Speech vì Chirp 3 HD tone-3 flat issue; Kokoro fix vấn đề
  đó nên bundled playback khả thi.
- Tier registry `src/data/tiers.ts` — mỗi wordlist (HSK1, Oxford 500...)
  có `minLevel` metadata, foundation cho level system v0.6.
- Helpers: `getUnlockedTiers`, `getUnlockedWords`, `getNextLockedTier`.
- `src/env.d.ts` với `__APP_VERSION__` declaration.
- `CHANGELOG.md` (file này).

### 🔧 Changed
- **Version truth single source**: `package.json.version` → synced vào
  `manifest.json` qua `vite.config.ts` + inject `__APP_VERSION__` vào
  footer. Không còn lệch giữa package/manifest/UI.
- `audioService.ts` rewrite: unified `AudioManifest` schema,
  `resolveVariant()` helper, slow playback qua `playbackRate=0.7` khi chỉ
  có `default` variant.
- `gen_kokoro_mac.py` manifest output: `{default}` thay cho `{female}`,
  thêm field `generator: "kokoro"`. Auto-migrate manifest cũ sang schema
  mới khi chạy partial regen.
- `data/index.ts` slim xuống re-export từ `tiers.ts`; `wordsByLang` giờ
  derive từ tiers thay vì import trực tiếp từng file.
- README rewrite: phản ánh đúng state v0.5, thêm hướng dẫn Mac audio
  pipeline đầy đủ.
- Manifest description bỏ "Chirp 3 HD" (sai kể từ khi switch sang Kokoro).

### 🧹 Hygiene
- `package.json` 0.1.0 → 0.5.0
- `manifest.json` 0.4.0 → 0.5.0
- Footer `App.tsx` bỏ hardcode "v0.3.0", dùng `__APP_VERSION__`.

### 📦 Callers không bị phá
`wordsByLang[lang]`, `phoneticGroups`, `langLabels` giữ API cũ. Dashboard,
TabFlashcards, TabPhonetics, Header không cần sửa.
