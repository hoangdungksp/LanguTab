# Changelog

All notable changes to LinguTab will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version policy (Jason rule): bump chậm, mỗi version là 1 step có review. Avoid v1.7.0 → v1.7.7 in 1 day pattern.

---

## [Unreleased]

Working tree changes since v1.7.7 baseline. Will bump to v1.8.0 when D-18 Starters phase complete + tested + reviewed.

### Added — D-18 60 unique levels commitment (Path A locked)

#### Content (Sessions 2.1, 2.2, 5, 6)

- **20 unique themes** cho Starters L1-L20 across all 4 parts:
  - L1 PetShop · L2 FamilyDinner · L3 WeekendPark · L4 BirthdayParty · L5 SchoolDay
  - L6 Beach · L7 Garden · L8 ToyShop · L9 Sports · L10 Picnic
  - L11 Library · L12 Bicycle · L13 Cooking · L14 Swimming · L15 Farm
  - L16 PetsHome · L17 Sleepover · L18 GardenPlay · L19 Train · L20 Snow
- 20 Write (Part 2) templates: `makeStarterWriteV0_Pet`, `makeStarterWriteV1_Family` ... `makeStarterWriteL20_Snow` + dispatcher `makeStarterWritePart(levelNumber)`
- 20 Tick (Part 3) templates: `makeStarterTickV0_Shopping` ... `makeStarterTickL20_Snow` + dispatcher `makeStarterTickPart(levelNumber)`
- 20 SceneCharacterSet entries cho Part 1 (drag): `STARTERS_L1_CHARS` ... `STARTERS_L20_CHARS` trong `sceneCharacters.ts`
- 20 sceneIds drag mới: `starter_l1_petshop` ... `starter_l20_snow`
- 20 Colour (Part 4) templates: `makeStarterColourL1` ... `makeStarterColourL20` + dispatcher
- 20 sceneIds outline mới: `starter_l1_petshop_outline` ... `starter_l20_snow_outline`
- New helper `makeStarterDragPart(levelNumber)` in `levels.ts` looking up `STARTERS_CHARS_BY_LEVEL` registry

#### Worker registry (Session 5b)

- 40 SCENE_PROMPTS entries added to `worker/src/exam/scenes.ts` (20 drag wide cartoon + 20 outline coloring page)
- SCENE_IDS count: 12 → 52
- Frontend `SceneId` type expanded với 40 new union members
- TypeScript compile: PASS (self-tested)
- Validator (`scripts/validate-exam-data.ts`): expected PASS after apply

#### UI warnings

- `ExamScene.tsx` SceneFallback enhanced:
  - Show banner "📸 Hình chưa được tạo cho bài thi này" cho sceneId starts với `starter_l`
  - Hint: "Admin cần bấm Gen hình để tạo ảnh. Nội dung text + audio đã sẵn sàng để luyện thi"
  - Allow Jason to ship beta with content distinct mà không cần asset gen complete
- `themeFor` extended với 11 new categories: petshop, toyshop, sports, picnic, library, bicycle, cooking, swimming, sleepover, train, snow

### Added — D-13 Phase 1 (D-16 validator)

- `scripts/validate-exam-data.ts` — 484 lines static validation script
- Prebuild hook in `package.json`: validates 60 levels × 4 parts = 240 sub-tests before build
- Catches: missing sceneIds, invalid iconIds, broken region refs, vocab tier violations
- TypeScript compile parallel check

### Added — Phase B ElevenLabs audio pre-gen

- `scripts/pregen-exam-audio-en.ts` — 266 lines, ElevenLabs API direct (bypass worker)
- `scripts/count-exam-en-chars.ts` — 119 lines, char inventory for quota planning
- Quota guard: stops BEFORE crossing 65k chars
- Generated 144 MP3 files for L1-L36 Part 1-4 (63,826 chars used, 1,174 remaining)
- Output: `public/audio/exam/level${N}/p${X}.mp3`
- Voice: ElevenLabs Dorothy `ThT5KcBeYPX3keUQqHPh`, model `eleven_multilingual_v2`

### Added — D-18 LOCKED in DECISIONS.md

- D-18: 60 unique themes/levels commitment (vs commercial benchmark 3-5/book)
- 60-theme list locked (Starters/Movers/Flyers × 20 each)
- Phase plan: 20-30 sessions estimated, 2-3 months content + asset gen
- Quality bar: Cambridge YLE strict vocab tier (Pre-A1 / A1-A2 / A2-B1)
- Asset budget accepted: ElevenLabs 3-4 renewal cycles ~$60-100 USD

### Added — D-14, D-15, D-17 LOCKED in DECISIONS.md

- D-14: Sync backend = Cloudflare D1 (existing infra)
- D-15: Conflict resolution = Last-Write-Wins via updatedAt
- D-17: Pricing pre-launch all-FREE, Lemon Squeezy feature-flagged off

### Changed

- `adminModeService.ts`: removed `dungthichvar@gmail.com` from `ADMIN_EMAILS` — only `jasonnguyenksp@gmail.com` is admin (Profile 2 testing as regular user)
- `ExamSession.tsx`:
  - `gap-3` → `gap-[30px]` for top bar 30px spacing
  - Added `timeProgressPct = (elapsedSec / timeLimitSec) * 100`
  - Rocket position + bar fill width follow elapsed time (not question progress)
  - Removed unused `progressPct` declaration

### Fixed

- Self-test workflow improvements (rule confirmed 2026-05-25):
  - Always `tsc --noEmit` before present file
  - Verify removed code patterns via grep
  - Browser save `(1)` `(2)` naming workaround in apply commands

### Deprecated / Known broken

- **D-13 Gemini Vision auto-caption**: Gemini API geo-fences Cloudflare-edge IPs near Vietnam ("User location is not supported"). Code shipped v1.7.7 but never worked from worker. Needs re-frame to Llama Vision or external proxy.
- **D-16 Phase 2 semantic check**: Same Gemini geo-fence issue. Code shipped (migration 12, `worker/src/exam/semanticCheck.ts`, route patched) but smoke test fail. Needs same re-frame as D-13.

### Note for production deploy

⚠️ Production worker hiện KHÔNG có 40 new SCENE_PROMPTS. Sau apply local code, MUST deploy worker:

```bash
cd ~/Downloads/lingua-newtab/worker && npx wrangler deploy
```

Sau deploy, warm-all triggers Flux gen 40 new scenes (~7-8 phút).

---

## [1.7.7] - 2026-05-07 — Audio recovery baseline

### Added

- `update.sh` v2 với multi-layer safeguards (Git pre-flight, public/ snapshot, zip pre-inspection, post-flight size check)
- `backup-audio.sh` manual backup tool (5 retention slots)
- Anki Native audio restore: 4,333 word + 2,647 sentence + 2,273 images (HSK1-6, ~94% HSK1 coverage)
- DigMandarin pinyin chart: ~1,500+ files
- Git repo initialized + pushed to github.com/hoangdungksp/LanguTab (private)

### Changed

- Flashcard "Ví dụ 2" (Anki sentence): Native button moved to correct location

### Fixed

- Auto-caption "Failed to fetch" error
- Worker D1 binding commented out — restored
- Llama Vision license 5016 — auto-accept implemented

### Lost (unrecoverable, deferred)

- ~700MB CosyVoice HSK1-6 AI audio (chưa regen, chờ DashScope budget)

---

## [1.7.x] - 2026-05-06 → 2026-05-07 — Vision auto-caption iteration

### Added

- Llama Vision integration for exam scene captioning (v1.7.0-1.7.5)
- Llava Vision fallback (v1.7.6)
- Gemini 2.5 Flash Vision as primary (v1.7.7) — **later discovered broken due to geo-fence**

### Lost

- v1.7.x mishap: accidental `rm -rf` on public/ folder wiped ~700MB audio assets
- Triggered creation of D-0 (destructive operations rule) and safety infrastructure

---

## [1.6.x] - 2026-04 → 2026-05 — Admin tooling foundations

### Added

- Admin token provisioning by email (Sprint 4.9.5.1)
- `examAudioScriptService` — admin can override Cambridge YLE audio scripts per (levelId, partId) via D1
- `examCalibrationService` — admin can drag/calibrate zones for Part 1 + Part 4
- Migration 11: `exam_audio_scripts` table

---

## [1.5.0] - 2026-03 → 2026-04 — Exam system + multi-user sync

### Added

- Cambridge YLE Exam system (Phòng thi): 60 levels × 4 parts (drag, write, tick, colour)
- Scene character registry `sceneCharacters.ts` (6 base drag scenes)
- 12 scene IDs across drag, write, and colour categories
- Multi-user infrastructure: D1 + R2 hybrid storage (Sprint 4.7-4.9)
- Sync endpoints `/sync/pull` `/sync/push` `/sync/upload-all` `/sync/download-all` `/sync/clear` `/sync/status`
- Dexie schema v5 với userId indexes
- Anki-style manual sync (not background auto)
- Last-write-wins conflict resolution

### Changed

- Hybrid Anki + AI audio strategy (Anki Native primary, CosyVoice AI fallback)

---

## [1.0.0] - 2026-01 — Public release prep starts

### Added

- Flashcard system với FSRS (ts-fsrs)
- HSK1-6 vocabulary import
- Cambridge YLE Exam preview (3 papers)
- Story generator (Gemini API)
- Pinyin Chart (DigMandarin sourced)

---

## [0.1.0] - 2025 — Initial extension

### Added

- Chrome Manifest V3 new-tab override
- React 18 + TypeScript + Vite + CRXJS plugin
- Tailwind CSS styling
- Google OAuth integration
- Basic flashcard UI

---

[Unreleased]: https://github.com/hoangdungksp/LanguTab/compare/v1.7.7-audio-restored...HEAD
[1.7.7]: https://github.com/hoangdungksp/LanguTab/releases/tag/v1.7.7-audio-restored
