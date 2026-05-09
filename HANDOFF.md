# LinguTab Handoff

> **Mục đích**: File này là context bridge giữa các chat sessions với Claude.
> Khi mở chat mới, paste toàn bộ file này vào message đầu tiên + link GitHub repo.
> Mình sẽ đọc + `git log` + tiếp tục mà không lặp lại sai lầm cũ.

---

**Last updated**: 2026-05-07
**Repo**: https://github.com/hoangdungksp/LanguTab
**Latest tag**: v1.7.7-audio-restored
**Current branch**: main
**Manifest version**: 1.7.7

---

## ✅ Đã xong

### Audio recovery (sau v1.7.x mishap)
- **Anki Native**: 4,333 word audio + 2,647 sentence audio + 2,273 images (HSK1-6, ~94% HSK1 coverage)
- **Pinyin chart**: ~1,500+ files từ DigMandarin (initials/finals/tones)
- **CosyVoice AI**: ❌ MẤT — chưa regen (Jason để sau)

### Infrastructure
- Git repo: github.com/hoangdungksp/LanguTab (private)
- update.sh v2 với multi-layer safeguards (~/Documents/lingua-newtab/update.sh)
- backup-audio.sh manual backup tool (~/Documents/lingua-newtab/backup-audio.sh)
- Backup snapshots trong ~/Documents/lingua-newtab/backups/ (giữ 5 gần nhất)
- Backup cũng đã copy lên Google Drive

### Bugs fixed gần đây
- Flashcard "Ví dụ 2" (Anki sentence) — Native button đã move xuống đúng chỗ (v1.7.7)
- Auto-caption Failed to fetch — fixed (v1.7.2-1.7.3)
- Worker D1 binding commented out — fixed (v1.7.3)
- Llama Vision license 5016 — auto-accept implemented (v1.7.5)

---

## 🚧 Pending decisions / chưa quyết

### Vision auto-caption strategy (parked)

Vấn đề gốc: Flux Schnell không tạo được 3×2 grid → vision describe không match. Đã thử Llama → Llava → Gemini 2.5 Flash. Gemini code đã ship ở v1.7.7 nhưng **Jason chưa test thực tế** với GEMINI_API_KEY.

4 options Jason chưa quyết:
- **A. Pragmatic**: Manual edit textarea + ship beta. Recommend cho MVP.
- **B. Workers AI SDXL**: Better composition than Flux Schnell, vẫn free tier.
- **C. DALL-E 3**: $2.40 once-off, accuracy cao nhất.
- **D. Architecture pivot**: Bỏ ý tưởng grid, dùng natural scene + calibration tool.

### CosyVoice regen
- Chờ Jason có DashScope budget ($5-10) hoặc account mới với free tier.
- Scripts đã có sẵn: `scripts/gen_words_cosyvoice_mac.py`, `scripts/gen_phoneme_examples_cosyvoice_mac.py`, `scripts/gen_qwen_tts_mac.py`.

---

## 📋 Workflow agreements (CRITICAL — đừng quên)

### Branch strategy
- Mỗi sprint = 1 branch tên `sprint-X.Y-short-name`
- Bug fix nhỏ = `fix/<name>`
- UI updates = `ui/<name>`
- Khi sprint xong → merge vào main + tag

### Ship process
- Ship **patch zip nhỏ** (chỉ files thay đổi), KHÔNG full source zip mỗi version
- Full source zip CHỈ khi: first setup, major refactor, recovery
- Filename pattern: `sprint-X.Y-name.zip`, `fix-<name>.zip`

### Commit conventions
```
Sprint X.Y: <ngắn gọn>
Fix: <ngắn gọn>
UI: <ngắn gọn>
Docs: <ngắn gọn>
Chore: <ngắn gọn>
Release: vX.Y.Z — <description>
```

### Handoff
- Cuối session, Claude update file này (`docs/HANDOFF.md`)
- Đầu chat mới, Jason paste full content vào message + link GitHub
- Claude đọc HANDOFF + `conversation_search` nếu cần + confirm trước khi action

### Mình KHÔNG được phép
- ❌ Hướng dẫn `rm -rf lingua-newtab` (đã gây mất audio v1.7.x)
- ❌ Touch `public/audio/` hoặc `public/images/` trong bất kỳ script nào
- ❌ Push trực tiếp lên GitHub (Jason apply zip + commit)
- ❌ Bump version nhanh (tránh v1.7.0 → v1.7.7 trong 1 ngày như đã làm)
- ❌ Ship feature lớn không confirm với Jason trước

---

## 💬 User preferences (Jason)

- Tiếng Việt là primary language, English code/comment OK
- Format **minimal**: ít bullet, ít heading lồng nhau, ít emoji decoration
- Thích **1-line bash command** thay vì hướng dẫn từng bước (ví dụ Bước 1, Bước 2 dài)
- Confirm trước khi ship lớn, KHÔNG tự ý ship features
- Bug → diagnose → 1 fix targeted, không rewrite cả module
- Cần explicit warning khi action có thể destroy data
- Ghét version bump theo nhịp pháo nổ — bump chậm, mỗi version là 1 step có review

---

## 🎯 Sprint roadmap

### 🔴 Critical (block launch)
- **Sprint 4.12 — D1 sync exam attempts** (1.5 ngày)
  - Hiện tại progress ở localStorage `linguanewtab.exam.progress.v1`
  - Cần migration `12_exam_attempts.sql` + endpoint POST/GET sync
  - Track stats cho Settings → Stats section
- **Sprint 4.13 — Sound effects** (1 ngày)
  - CC0 sources: freesound.org, mixkit.co, pixabay
  - Effects: correct ✓, wrong ✗, level complete 🎉, button click, drag pickup/drop
- **Sprint 5.0 — CWS submission** (1 ngày + Google review 4-6 weeks)
  - OAuth verification
  - Privacy policy + Terms
  - Screenshots, demo video
  - Replace static ADMIN_TOKEN → Google ID token verification

### 🟡 Quan trọng (sau Critical)
- Vision auto-caption strategy decision (4 options A/B/C/D)
- CosyVoice regen
- Phòng thi: attempt history, audio speed 0.5/1/1.5x
- UI updates Jason đã đề cập (chưa specify)

### 🟢 Nice-to-have (post-launch)
- 60 levels → 200 levels (Movers + Flyers)
- i18n exam content (Vi)
- Offline PWA, mobile app
- Teacher dashboard
- CI/CD GitHub Actions

---

## 🔑 Critical secrets / config (đã ship trong source)

- **Worker URL**: `https://lingua-newtab-worker.kspstudio.workers.dev`
- **OAuth Client ID**: `138440772678-72fno6lo0dgtrk3fdfok9466n93fh861.apps.googleusercontent.com`
- **Admin Token** (sẽ replace ở Sprint 5.0): `5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212`
- **D1 ID**: `9729612b-2b94-4ad0-a708-2dfda0a379db`
- **R2 bucket**: `lingua-newtab-images`
- **KV namespace**: `af60b12941fe4176addf7c707b780301`
- **Cache version (worker)**: `v4`

### Worker secrets (set qua wrangler secret put)
- `ADMIN_TOKEN` — đã set
- `GEMINI_API_KEY` — Jason chưa set, optional cho vision auto-caption

---

## 📚 Critical local files (đừng quên)

```
~/Documents/lingua-newtab/update.sh         # v2 với safeguards
~/Documents/lingua-newtab/backup-audio.sh   # manual backup tool
~/Documents/lingua-newtab/backups/          # 5 backups gần nhất
~/Downloads/lingua-newtab/                  # working directory
```

---

## 🆘 Recovery cheatsheet

### Mất audio
```bash
# Restore từ backup gần nhất
bash ~/Documents/lingua-newtab/backup-audio.sh --restore audio-images-YYYYMMDD_HHMMSS.tar.gz
```

### Sai code
```bash
cd ~/Downloads/lingua-newtab
git checkout v1.7.7-audio-restored   # rollback về tag baseline
```

### Update gặp issue
```bash
# update.sh v2 tự snapshot public/ trước. Restore:
cd ~/Downloads/lingua-newtab
rm -rf public && mv public.snap.YYYYMMDD_HHMMSS public
```

---

## 📝 Recent activity log (last 5)

- 2026-05-07 — Tag `v1.7.7-audio-restored` baseline
- 2026-05-07 — backup-audio.sh tool created + first snapshot taken
- 2026-05-07 — update.sh v2 deployed với multi-layer safeguards
- 2026-05-07 — Git repo initialized + push to GitHub
- 2026-05-07 — Pinyin chart re-downloaded từ DigMandarin

---

> Khi đọc file này, mình (Claude) sẽ:
> 1. Confirm với Jason mình hiểu context đúng
> 2. Hỏi rõ Jason muốn làm gì tiếp theo
> 3. KHÔNG tự ý ship code/run command nguy hiểm
> 4. Update file này ở cuối session
