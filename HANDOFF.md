# LinguTab Handoff

> **Mục đích**: File này là context bridge giữa các chat sessions với Claude.
> Khi mở chat mới, paste toàn bộ file này vào message đầu tiên + đảm bảo source zip + DECISIONS.md đã upload Project Knowledge.

---

**Last updated**: 2026-05-25 (D-18 Phase 3 Movers L21-L30 done + icon library expanded)
**Repo**: https://github.com/hoangdungksp/LanguTab
**Latest tag**: v1.7.7-audio-restored
**Current branch**: main (working tree has uncommitted D-18 work)
**Manifest version**: 1.7.7 (chưa bump — Jason rule "bump chậm")

---

## 🎯 Active commitment: D-18 — 60 unique levels (4 parts each)

Path A locked. Mỗi level (60 total) phải có **4 parts hoàn toàn unique** — không lặp scene, audio, questions, colors với bất kỳ level nào khác. Estimate **2-3 tháng dev content**, ~20-30 sessions, plus 3-4 ElevenLabs subscription renewals.

**Phase progress**:

| Phase | Scope | Status |
|-------|-------|--------|
| 2.1 | Starters L1-L10 Part 2 (Write) + Part 3 (Tick) | ✅ DONE |
| 2.2 | Starters L11-L20 Part 2 + Part 3 | ✅ DONE |
| 5 | Starters L1-L20 Part 1 (Drag) sceneCharacters per-level + 20 sceneId | ✅ DONE |
| 6 | Starters L1-L20 Part 4 (Colour) outline scenes per-level + 20 sceneId | ✅ DONE |
| 5b | Worker registry: 40 new scene prompts (drag + outline) | ✅ DONE (code), DEPLOY pending |
| 3 | Movers L21-L40 ALL 4 parts unique + icon library expand | ✅ DONE (code), DEPLOY pending |
| 4 | Flyers L41-L60 ALL 4 parts unique | ✅ DONE (code), DEPLOY pending |
| 7 | Asset gen 240 audio (ElevenLabs renewals) | ⏳ parallel — admin Gen audio per level |
| 8 | Admin: Sinh prompt + Upload ảnh + Gen/Regen audio + status badge | ✅ DONE |

**Progress**: 🎉 **240/240 sub-tests CONTENT unique — toàn bộ 60 level xong** (Starters 1-20 + Movers 21-40 + Flyers 41-60, 4 parts each). Còn lại: gen ảnh + audio cho từng level (thao tác admin).

---

## ✅ Đã xong trong session 2026-05-25

### D-18 Phase 3a — Movers L21-L30 (4 parts unique) + icon library

- **10 themes**: Summer camp / Music lesson / Football match / Dance class / Restaurant / Bus journey / Zoo trip / Museum tour / Fire station / Pet competition
- Mỗi level: Part 1 (drag) + 2 (write, past simple) + 3 (tick) + 4 (colour) khác nội dung hoàn toàn
- **Files changed**:
  - `src/data/exam/sceneCharacters.ts`: `MOVERS_L21..L30_CHARS` + `MOVERS_CHARS_BY_LEVEL` + `MOVERS_SCENE_IDS_BY_LEVEL`
  - `src/data/exam/levels.ts`: `makeMoverDragPart`, 10×write/tick/colour + 3 dispatcher `makeMover*ByLevel`, wire `makeLevel` (L31-L40 vẫn fallback rotation)
  - `src/data/exam/examIcons.tsx`: **+~52 icon mới** (camp/music/sport/dance/food/transport/zoo/museum/fire/pet) + **fix 13 icon broken cũ** (`car_*`, `doll_*`, `pet_*`, `apple_2/3/4`, `clock_5`) → Mover/Flyer tick rotation không còn render "?"
  - `worker/src/exam/scenes.ts`: +20 scene (10 drag `mover_lN_*` + 10 outline `mover_lN_*_outline`)
- **Self-test PASS**: frontend `tsc` 0, worker `tsc` 0, validator D-16 = 0 errors / 0 warnings / 72/72 scenes resolve, mọi iconId resolve

### D-18 Phase 2.1, 2.2, 5, 6 (Starters L1-L20)

- **20 unique themes**: PetShop / FamilyDinner / WeekendPark / BirthdayParty / SchoolDay / Beach / Garden / ToyShop / Sports / Picnic / Library / Bicycle / Cooking / Swimming / Farm / PetsHome / Sleepover / GardenPlay / Train / Snow
- **Each level**: Part 1 (drag) + Part 2 (write) + Part 3 (tick) + Part 4 (colour) hoàn toàn khác nội dung
- **Files changed**:
  - `src/data/exam/levels.ts` 898 → 3245 lines (+2347 lines)
  - `src/data/exam/sceneCharacters.ts` 205 → 547 lines (+342 lines)
  - `src/newtab/components/ExamScene.tsx` 171 → 201 lines (+30 lines UI warning)
  - `worker/src/exam/scenes.ts` (+40 SceneIds + 40 SCENE_PROMPTS)

### Session 5b — Worker registry update

- Add 20 drag scene prompts: `starter_l1_petshop` → `starter_l20_snow`
- Add 20 outline scene prompts: `starter_lN_*_outline`
- Total SCENE_IDS: 12 → 52
- TypeScript compile: PASS (self-tested)
- Validator (D-16 Phase 1): expected PASS after apply

### UI warnings (when scene not yet generated)

- ExamScene.tsx SceneFallback enhanced
- Shows banner "📸 Hình chưa được tạo cho bài thi này" cho sceneId bắt đầu `starter_l`
- Hint cho user: text + audio đã sẵn để luyện thi
- themeFor extended với 11 new categories (petshop, toyshop, library, etc.)

### Other session work

- **Admin emails**: removed `dungthichvar@gmail.com` từ `adminModeService.ts` → chỉ `jasonnguyenksp@gmail.com` là admin (Profile 2 test user view)
- **ExamSession UI**: gap-3 → gap-[30px] top bar + rocket + bar fill follow elapsed time (timeProgressPct)
- **Chrome Profile setup**: alternative cho Incognito (extension new-tab override không work in Incognito without manifest `"incognito": "split"`)
- **D-18 locked** trong DECISIONS.md với 60-theme list

---

## 📋 IMMEDIATE ACTIONS Jason cần làm sau session này

Session này đổi 4 files (Starters L1-L20 ở session trước + Movers L21-L30 mới). Nếu apply qua patch zip, gồm:
```bash
# Files thay đổi tích lũy (đã self-test PASS trong source):
#   src/data/exam/sceneCharacters.ts   (Starters + Movers chars)
#   src/data/exam/levels.ts            (Starters + Movers parts)
#   src/data/exam/examIcons.tsx        (NEW: +52 icon + fix 13 broken)
#   worker/src/exam/scenes.ts          (92 scenes total: 12 base + 40 starter + 40 mover)
#   src/data/exam/examIcons.tsx        (icon library: +52 L21-30, +45 L31-40, fix 13 broken)
#   src/newtab/components/ExamPartView.tsx + src/services/examSceneService.ts (admin upload tool)
#   worker/src/exam/handlers.ts        (GET prompt + POST upload endpoints)
#   src/newtab/components/ExamScene.tsx (UI warning từ session trước)

# 1. Rebuild frontend (validator runs prebuild)
cd ~/Downloads/lingua-newtab && npm run build

# 2. Deploy worker (CRITICAL — production hiện thiếu 20 scene Movers L21-L30)
cd ~/Downloads/lingua-newtab/worker && npx wrangler deploy

# 3. Warm-all scenes (Flux gen — 20 scene Movers mới + bất kỳ scene chưa cache)
curl -sS -X POST "https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/scenes/warm-all" \
  -H "Authorization: Bearer 5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212" \
  --max-time 600 | jq

# 4. Reload extension 2 Chrome profiles, test L21-L30
```

**Expected result sau apply**:
- ✅ Validator PASS (92 sceneIds resolve)
- ✅ Build PASS
- ✅ Worker deployed với 40 scene Movers mới (L21-L40)
- ✅ L21-L40 hiển thị scene images + 4 parts mỗi level khác nhau
- ✅ Part 3 (tick) Movers hiển thị icon thật, KHÔNG còn dấu "?"

**Audio note**: 144 MP3 cached cho L1-L36 từ Phase B (Jan 2026) là content CŨ. UI hiển thị text mới nhưng Play vẫn nghe content cũ → cache miss vì hash khác → worker on-demand gen ElevenLabs nhưng quota ~1k chars còn lại không đủ → fallback Aura-2 (free, kém Dorothy). Audio chuẩn ElevenLabs cho L1-L20 chờ renew tháng sau.

---

## 🚧 Pending / chưa quyết

### Vision auto-caption (D-13 RE-FRAMING needed)

D-13 đã lock Gemini 2.5 Flash, NHƯNG smoke test session 2026-05-25 confirm Gemini geo-fences Cloudflare-edge IPs ("User location is not supported"). Code shipped v1.7.7 broken in production. 3 paths:
- Path 1: Llama Vision via Workers AI (free, accuracy 15-20% lower) — rewrite `semanticCheckGemini` → `semanticCheckLlamaVision`
- Path 2: External proxy (Vercel/Render) → Gemini
- Path 3: Client-side Gemini call (leak API key, không recommend)

D-16 Phase 2 (semantic check) code shipped nhưng broken cùng lý do. Cần re-frame trước khi proceed Movers/Flyers.

### CosyVoice Chinese audio regen

Chờ Jason có DashScope budget ($5-10) hoặc account mới với free tier. Scripts ready: `scripts/gen_words_cosyvoice_mac.py`.

### English audio re-gen for L1-L60

ElevenLabs quota:
- 65k chars/tháng
- 60 levels × 4 parts × ~300-500 chars/part = 80-100k chars total
- Cần **2-3 tháng renewals** để gen full 60 levels English audio
- Plus SSML pause additions (~3s between sentences) = thêm ~20k chars

### Pricing / Lemon Squeezy

Built but not active (D-8). Activate post-launch.

---

## 📋 Workflow agreements (CRITICAL — đừng quên)

### Branch strategy
- Mỗi sprint = 1 branch `sprint-X.Y-short-name`
- Bug fix = `fix/<name>`, UI = `ui/<name>`
- Sprint xong → merge main + tag

### Ship process
- Default: patch zip nhỏ (files thay đổi)
- Full source zip CHỈ khi first setup / major refactor / recovery
- Filename: `sprint-X.Y-name.zip`, `fix-<name>.zip`

### Commit conventions
```
Sprint X.Y: <ngắn gọn>
Fix: <ngắn gọn>
UI: <ngắn gọn>
Docs: <ngắn gọn>
Chore: <ngắn gọn>
Release: vX.Y.Z — <description>
```

### Self-test BEFORE shipping code (rule confirmed Jason 2026-05-25)
1. Grep verify patterns không nên tồn tại đã bị xoá
2. Run `npx tsc --noEmit` trong container nếu có TypeScript
3. Show output verify cho Jason xem TRƯỚC khi present file
4. Browser save naming `(1)` `(2)` luôn — verify file path trong workflow apply

### Handoff
- Cuối session, Claude update HANDOFF.md + present
- Đầu chat mới, Jason paste content + có source zip trong Project Knowledge
- Claude đọc HANDOFF + view source + confirm trước khi action

### Claude KHÔNG được phép
- ❌ Hướng dẫn `rm -rf lingua-newtab` (đã gây mất audio v1.7.x)
- ❌ Touch `public/audio/` hoặc `public/images/` trong bất kỳ script nào
- ❌ Push trực tiếp lên GitHub (Jason apply zip + commit)
- ❌ Bump version nhanh (KHÔNG v1.7.0 → v1.7.7 trong 1 ngày)
- ❌ Ship feature lớn không confirm với Jason trước
- ❌ Ship code không tự test (rule mới 2026-05-25 sau ExamSession.tsx bug)

---

## 💬 User preferences (Jason)

- Tiếng Việt primary, English code/comment OK
- Format **minimal**: ít bullet, ít heading lồng nhau, ít emoji decoration
- Thích **1-line bash command** chained với `&&`
- Confirm trước khi ship lớn, KHÔNG tự ý ship features
- Bug → diagnose → 1 fix targeted, không rewrite cả module
- Cần explicit warning khi action có thể destroy data
- Ghét version bump theo nhịp pháo nổ — bump chậm, mỗi version là 1 step có review

---

## 🎯 Sprint roadmap

### 🔴 Critical (block launch)
- **D-18 Phase 3b+4**: Movers L31-L40 + Flyers L41-L60 ALL 4 parts unique (9-12 sessions) — L21-L30 ✅ done
- **D-13 re-frame**: Vision caption từ Gemini → Llama Vision (Workers AI fallback)
- **Sprint 4.12 — D1 sync exam attempts** (1.5 ngày)
  - localStorage `linguanewtab.exam.progress.v1` → D1
  - Migration `13_exam_attempts.sql` (slot 12 đã dùng cho semantic_checks)
  - Track stats cho Settings → Stats section
- **Sprint 4.13 — Sound effects** (1 ngày)
  - CC0 sources: freesound.org, mixkit.co, pixabay
  - Effects: correct ✓, wrong ✗, level complete 🎉, button click, drag pickup/drop
- **Sprint 5.0 — CWS submission** (1 ngày + Google review 4-6 weeks)
  - OAuth verification, Privacy policy + Terms, Screenshots, demo video
  - Replace static ADMIN_TOKEN → Google ID token verification

### 🟡 Quan trọng (sau Critical)
- Audio re-gen 60 levels x 4 parts SSML pauses (3-4 tháng ElevenLabs)
- CosyVoice Chinese regen (waiting DashScope budget)
- Phòng thi: attempt history, audio speed 0.5/1/1.5x
- Icon library expansion (~30-50 SVG mới cho Part 3)

### 🟢 Nice-to-have (post-launch)
- i18n exam content (Vi)
- Offline PWA, mobile app
- Teacher dashboard
- CI/CD GitHub Actions

---

## 🔑 Critical secrets / config

- **Worker URL**: `https://lingua-newtab-worker.kspstudio.workers.dev`
- **OAuth Client ID**: `138440772678-72fno6lo0dgtrk3fdfok9466n93fh861.apps.googleusercontent.com`
- **Admin Token**: `5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212`
- **D1 ID**: `9729612b-2b94-4ad0-a708-2dfda0a379db`
- **R2 bucket**: `lingua-newtab-images`
- **KV namespace**: `af60b12941fe4176addf7c707b780301`
- **Cache version**: `v4`

### Worker secrets (set qua wrangler secret put)
- `ADMIN_TOKEN` — set
- `GEMINI_API_KEY` — set (broken: geo-fence)
- `ELEVENLABS_API_KEY` — set
- `RESEND_*` — set

### Admin emails (current)
- `jasonnguyenksp@gmail.com` (ONLY admin)
- Removed: `dungthichvar@gmail.com` (used Profile 2 for user testing)

---

## 📚 Critical local files

```
~/Documents/lingua-newtab/update.sh         # v2 với safeguards
~/Documents/lingua-newtab/backup-audio.sh   # manual backup
~/Documents/lingua-newtab/backups/          # 5 backups gần nhất
~/Downloads/lingua-newtab/                  # working directory
~/Downloads/lingua-newtab/scripts/
  ├── validate-exam-data.ts                 # D-16 Phase 1 (prebuild hook)
  ├── pregen-exam-audio-en.ts               # Phase B ElevenLabs direct
  ├── count-exam-en-chars.ts                # Inventory tool
  └── gen_*_mac.py                          # CosyVoice/Qwen/Azure/Google scripts
```

---

## 🆘 Recovery cheatsheet

### Mất audio
```bash
bash ~/Documents/lingua-newtab/backup-audio.sh --restore audio-images-YYYYMMDD_HHMMSS.tar.gz
```

### Sai code (rollback)
```bash
cd ~/Downloads/lingua-newtab
git checkout v1.7.7-audio-restored   # baseline
```

### Update gặp issue
```bash
cd ~/Downloads/lingua-newtab
rm -rf public && mv public.snap.YYYYMMDD_HHMMSS public   # restore public snapshot
```

---

## 📝 Recent activity log (last 10)

- 2026-05-27 — v1.8.3: gap 5s→3s; marker câu hỏi đổi "One."→"Question 1." / "一。"→"第一题。" (worker relabel khi câu kế là "?", phân biệt marker vs đáp án số). EN gap dùng ElevenLabs PCM (khớp read + giọng nhất quán). Bump version mỗi thay đổi (kể cả worker) để Jason có tín hiệu.
- 2026-05-27 — Pause 5s + slow spelling, Part 2 & 3 (EN+ZH): worker tách script theo TỪNG CÂU (sau . ? / 。？), giữ phần intro liền (tới "Now listen/现在听"), TTS từng đoạn → nối + 5s PCM silence → 1 WAV. Spelling "B-U-D-D-Y"→"B, U, D, D, Y" (đọc chậm). zh=Qwen, en=Aura-2 PCM. CHỈ p2/p3, fallback an toàn. Admin phải Regen + reload extension để nghe. (worker-only)
- 2026-05-27 — v1.8.0 (version_name hiện trong chrome://extensions để biết đã đổi code). Chinese TTS: worker route audioKey `zh/` → Qwen-TTS (nếu có DASHSCOPE_API_KEY) → fallback MeloTTS lang='zh' (free). Audio ZH vẫn admin-gen (D-19). Set Qwen: `wrangler secret put DASHSCOPE_API_KEY`
- 2026-05-27 — D-23 PILOT: Phòng thi tiếng Trung HSK1 (20 level L101-120). Exam đa ngôn ngữ theo targetLang; planets HSK1/2/3; dùng lại ảnh English (no worker deploy). Part 2 hanzi+pinyin. Audio ZH chưa wired (cần Qwen-TTS). Frontend-only
- 2026-05-27 — D-19 IMPLEMENTED: role-based auth (D1 users.role user/editor/admin). Migration 13 applied (Jason=admin), worker /exam/me + role check on /admin/exam/*, frontend gate theo role + mọi call admin dùng authedFetch (google token). ADMIN_TOKEN bỏ khỏi bundle (break-glass server-side). Admin mở khóa exam content qua role, không qua secret hardcode
- 2026-05-26 — Phase 4b: Flyers L51-L60 (4 parts unique, B1) + examIcons +20 icon → D-18 CONTENT XONG 60/60. UI: admin mở khóa mọi planet; roadmap SVG + level node đổi màu theo planet (green/blue/purple); back-nav fix (do unlock)
- 2026-05-26 — Phase 4a: Flyers L41-L50 (4 parts unique, B1) + examIcons +32 icon (science/charity/space/film/photo...); 20 scene prompts. tsc 0/0, validator 0 err, 112/112 scenes
- 2026-05-26 — Read-only assets cho user: /exam/audio → chỉ đọc R2 (miss=404), thêm /admin/exam/audio/generate + nút 🎙️ Gen audio. Ảnh & text vốn đã read-only. ⚠️ level chưa pre-gen audio sẽ 404 tới khi admin Gen
- 2026-05-26 — Fix ảnh upload bị mất khi mở lại: worker dùng ETag + must-revalidate (bỏ immutable) cho /exam/scene; client cache:no-cache. Fix ảnh upload không refresh ngay (cache-busting). 3 nút save có spinner + "Đã lưu". Top bar +mb-10. Skeleton "Đang tạo"→"Đang tải"
- 2026-05-25 — Phase 3b: Movers L31-L40 (4 parts unique) + examIcons +45 icon (tree/cinema/bakery/fishing/garage/hospital/post/mountain/art/baby); 20 scene prompts. Phase 3 (L21-L40) HOÀN TẤT. tsc 0/0, validator 0 err, 92/92 scenes
- 2026-05-25 — Admin tool: nút Sinh prompt + Upload + Lưu/Update ảnh scene (ExamPartView). Worker GET /scenes/:id/prompt + POST /scenes/:id/upload (R2 overwrite). Giải pháp D-13: admin gen ảnh ngoài → upload khớp audio
- 2026-05-25 — Audio Part 1 polish: viết lại buildDragNameAudioScript — mở đầu mô tả cảnh (scene.setting) + 3 kiểu câu xoay vòng thay cho "wearing..." lặp 5 lần. Áp dụng cả 60 level
- 2026-05-25 — Phase 3a: Movers L21-L30 (4 parts unique) + examIcons +52 icon, fix 13 broken; 20 scene prompts; tsc + validator PASS
- 2026-05-25 — Session 5b: 40 scene prompts added to worker/src/exam/scenes.ts
- 2026-05-25 — Session 2.4: Starters Part 1+4 per-level unique (sceneCharacters + colour functions)
- 2026-05-25 — Session 2.2: Starters L11-L20 Part 2+3 unique
- 2026-05-25 — Session 2.1: Starters L1-L10 Part 2+3 unique
- 2026-05-25 — D-18 locked: 60 unique levels commitment
- 2026-05-25 — Admin emails: removed dungthichvar (Profile 2 testing)
- 2026-05-25 — ExamSession UI: gap-30px + rocket follow time
- 2026-05-25 — Phase B audio: pregen 144 MP3 for L1-L36 (63,826 chars used)
- 2026-05-25 — D-16 Phase 1 validator shipped (prebuild hook)
- 2026-05-25 — Backup audio v20260525_001604.tar.gz (433MB) created

---

> Khi đọc file này, Claude sẽ:
> 1. Confirm với Jason mình hiểu context đúng
> 2. Hỏi rõ Jason muốn làm gì tiếp theo
> 3. KHÔNG tự ý ship code/run command nguy hiểm
> 4. Self-test code TRƯỚC khi present file (rule mới)
> 5. Update HANDOFF.md ở cuối session
