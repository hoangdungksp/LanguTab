# LinguTab — Current State
Last updated: 2026-05-09
Current version: 1.7.7

## Launch Status
PRE-LAUNCH. Hold off Chrome Web Store cho đến khi:
- [ ] Phòng thi (Exam system) hoàn thành — blocker chính
- [ ] Bản tiếng Anh complete (gắn liền với Exam)

## Active Blocker — Phòng thi (Exam)

### Trạng thái
- Đã có: Exam cho TIẾNG ANH (đã wire-up, còn nhiều bug)
- Chưa có: Exam cho TIẾNG TRUNG (zero, chưa start)

### Bug chain ở mỗi level (English exam)
Root cause: Image generation không match image description, gây chuỗi lỗi:
1. AI generate image → image KHÔNG đúng mô tả
2. Audio đọc text mô tả của câu hỏi
3. Student NHÌN image (sai) + NGHE audio (đúng theo text) → mismatch
4. Student không biết chọn đáp án nào → exam không khả thi

→ Fix: đảm bảo image, audio, đáp án đều derive từ một single source of truth, hoặc thêm validation step.

### Files liên quan
- src/services/examSceneService.ts
- src/services/examAudioService.ts
- src/services/examAudioScriptService.ts
- src/services/examCalibrationService.ts
- src/services/examGradingService.ts
- src/services/examProgressService.ts
- src/data/exam/examScenes.tsx
- src/data/exam/sceneCharacters.ts
- src/newtab/components/ExamScene.tsx
- src/newtab/components/ExamSession.tsx
- src/newtab/components/ExamResultsModal.tsx
- src/newtab/components/ExamPartView.tsx
- src/newtab/components/PlanetsScreen.tsx

## Built & Working

### Core
React 18.3 + TS 5.6 + Vite 5.4 + CRXJS, Manifest V3, Dexie 4 với migration, Zustand 5, Tailwind 3.4.

### Auth & Sync
Google OAuth, multi-user sync với migration logic, FirstSyncModal, sync indicator.

### Tabs OK
- Phonetics (IPA + Pinyin, có audio)
- PinyinChart
- Flashcards (FSRS, 3D flip, custom images)
- Stories (Gemini story gen)
- Translate
- Exam (built nhưng có bug chain)

### Vocab
- Chinese: HSK1 → HSK6 (full 6 levels) — audio CosyVoice đã regenerate sau lần mất data
- English: level1 → level6 (full)

### Audio
- Production: Qwen-TTS Cherry (Chinese)
- Backup engines có script: Azure, Google, CosyVoice, Kokoro
- Strategy: pinyin với tone marks (locked)

### Image system
- Local: imageService (Dexie blob)
- Cloud default: r2ImageService (Cloudflare R2)
- User uploads: driveService (Google Drive appDataFolder)

### Billing (built, not active)
billingService + tiers.ts + useTier + UpgradeModal + Lemon Squeezy.

### Other
Onboarding, Layout Editor, Stats (recharts), Anki import/export, Admin mode, Word catalog.

## Recent History (May 2026)
- Mất toàn bộ audio HSK1-6 CosyVoice do rm folder không recoverable. Phải mua credit + regen từ đầu.
- Setup Git repo backup sau sự cố trên.
- Cleanup: xóa duplicate update.sh ở Documents (chỉ giữ ở Downloads).
- 2026-05-09: Tạo Project Claude này.

## Immediate Next Step
**Fix Phòng thi English bug chain** (image-description-audio mismatch).

Approach: review examSceneService + examAudioService logic để đảm bảo single source of truth giữa scene description, image prompt, audio script, correct answer.

Sau khi English exam stable → port sang Chinese (HSK1-6 scenes).

## Folder Structure (Mac)
- ~/Downloads/lingua-newtab/ → source code, git repo
- ~/Documents/lingua-newtab/ → backup zips (assets/audio)

Scripts one-line workflow (chi tiết ở Project Instructions):
- bash ~/Downloads/lingua-newtab/update.sh — build & reload
- bash ~/Downloads/lingua-newtab/restore-config.sh — restore .env.local
- bash ~/Documents/lingua-newtab/backup-audio.sh — backup assets

## Git
- Repo backup: ✅ ACTIVE (mandatory sau sự cố mất data)
- Workflow: commit TRƯỚC mọi refactor / schema migration / file move
- KHÔNG chạy lệnh xóa hàng loạt khi chưa verify backup
