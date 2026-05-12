# LinguTab — Architectural Decisions Log

Mỗi entry là decision đã chốt + lý do. Claude KHÔNG re-litigate những thứ trong file này. Nếu Jason muốn thay đổi, sẽ explicit mở re-discuss.

---

## 🚨 D-0: DESTRUCTIVE OPERATIONS — RULE NGHIÊM NGẶT

**Decision**: Mọi destructive command phải qua quy trình verify trước.

**Why**: Jason đã mất TOÀN BỘ HSK1-6 CosyVoice audio do `rm` folder không recover được. Mất tiền credit + thời gian regen từ đầu.

**Quy trình bắt buộc TRƯỚC khi đề xuất destructive command**:
1. Verify Jason đã commit Git ở trạng thái sạch (hỏi xác nhận)
2. Đề xuất `bash ~/Documents/lingua-newtab/backup-audio.sh` trước
3. Giải thích RÕ file/folder nào sẽ bị xóa
4. Đợi Jason confirm "OK xóa" mới đưa lệnh

**Lệnh trong scope**: `rm -rf`, `rm -r`, `find ... -delete`, `git clean -fd`, `git reset --hard`, xóa folder qua Finder cho item lớn.

**CẤM TUYỆT ĐỐI**: `rm -rf` trên folder audio, scripts đã generate, hoặc bất kỳ asset nào tốn tiền/credit để tạo.

**Status**: LOCKED FOREVER (do nature of risk)

---

## D-1: Audio TTS Engine = Qwen-TTS Cherry

**Decision**: Production audio engine = Qwen-TTS qwen3-tts-flash, voice Cherry (Alibaba Cloud, Singapore region).

**Rejected alternatives**:
- Azure Neural TTS — voice quality OK nhưng tone 3 không đúng cho Chinese learner
- Google Chirp 3 HD — không support SSML để control pace
- Google WaveNet — fallback OK nhưng quality kém Qwen
- CosyVoice — quality cao nhưng phức tạp deploy + đắt
- Kokoro — local model, quality không đủ

**Why Qwen**:
- Tone accuracy cao nhất cho Chinese pedagogy
- Free tier rộng
- Voice Cherry consistent

**Backup engines** vẫn giữ scripts (gen_azure_mac.py, gen_google_mac.py, gen_cosyvoice_mac.py, gen_kokoro_mac.py) để fallback nếu Qwen down.

**Status**: LOCKED

---

## D-2: Audio Input Strategy = Pinyin với Tone Marks

**Decision**: Khi gọi Qwen-TTS, input là pinyin với tone marks (`nǐmen`, `bō`, `mā`), KHÔNG phải hanzi.

**Why**: 
- Qwen-TTS có bug truncate audio khi input hanzi ngắn (1-2 ký tự)
- Pinyin với tone marks cho audio đầy đủ + accurate

**Exception (umlaut fallback)**: Pinyin có ü-family (`nǚ`, `lǜ`, `nǚ'ér`) → dùng hanzi thay thế. Lý do: Qwen mis-pronounce U+01DA characters.

**Status**: LOCKED (có A/B test confirm)

---

## D-3: SRS Algorithm = FSRS (ts-fsrs)

**Decision**: Spaced repetition dùng FSRS algorithm via ts-fsrs library v4.6.

**Rejected**: SM-2 (Anki classic), custom SRS.

**Why**: FSRS có retention prediction tốt hơn SM-2 (~30% review reduction theo paper). ts-fsrs là port chính thức.

**Status**: LOCKED

---

## D-4: Storage = Dexie 4 (IndexedDB)

**Decision**: Local data storage = Dexie 4 với migration system (`syncMigration.ts`).

**Rejected**: localStorage (5MB cap), raw IndexedDB (verbose API), chrome.storage (10MB cap, không query được).

**Why**: Dexie cho async query, transaction, migration version system, react hooks.

**Schema versioning rule**: Bump version + add stores trong constructor (theo pattern v1 → v2 đã làm với customImages table).

**Status**: LOCKED

---

## D-5: State Management = Zustand 5

**Decision**: Zustand v5, không Redux/MobX/Context.

**Why**: Boilerplate ít, TypeScript inference tốt, không Provider wrapper, hook-based.

**Status**: LOCKED

---

## D-6: Image Storage = 3-tier strategy

**Decision**:
- **Tier 1 — Local cache**: Dexie blob (imageService) — instant
- **Tier 2 — Default images cloud**: Cloudflare R2 (r2ImageService) — fast CDN, $0.015/GB/month
- **Tier 3 — User uploads**: Google Drive appDataFolder (driveService) — FREE cho Jason vì user dùng storage Drive của họ

**Rejected**: Firebase Storage (cost cao khi scale, CORS phức tạp với extension), AWS S3 (overkill), local-only (mất khi uninstall).

**Status**: LOCKED

---

## D-7: AI = Gemini

**Decision**: Gemini API cho story generation + translation.

**Rejected**: OpenAI (cost), Claude API trực tiếp (rate limit).

**Why**: Free tier rộng, multimodal sẵn (cho future image gen), Jason đã có Google Cloud setup.

**Status**: LOCKED

---

## D-8: Billing = Lemon Squeezy

**Decision**: Subscription billing qua Lemon Squeezy (chưa active vì pre-launch).

**Rejected**: Stripe (tax handling phức tạp cho international solo dev).

**Why**: Lemon Squeezy = Merchant of Record, tự handle VAT/tax cho user EU/UK/AU.

**Status**: LOCKED. Activate post-launch.

---

## D-9: Build = Vite 5.4 + CRXJS + Manifest V3

**Decision**: Build chain = Vite + @crxjs/vite-plugin v2.0.0-beta.28.

**Why**: HMR cho extension dev, modern build, MV3 required cho Chrome Web Store.

**Status**: LOCKED (đã production-ready)

---

## D-10: Dual Folder Structure (Mac)

**Decision**:
- `~/Downloads/lingua-newtab/` = SOURCE CODE (git repo)
- `~/Documents/lingua-newtab/` = BACKUP DESTINATION (zip backups)

**Why**: Safety pattern sau sự cố mất audio. Source folder có thể nuke + rebuild; assets backup ở folder khác để survive.

**Status**: LOCKED

---

## D-11: Git Backup MANDATORY

**Decision**: Mọi refactor / schema migration / file move PHẢI commit Git trước.

**Why**: Sau sự cố mất data, không có Git nghĩa là không có recovery path.

**Workflow**:
1. Trước session dài: `git status` clean, latest commit pushed
2. Sau mỗi feature/fix: commit ngay
3. Trước destructive operation: backup-audio.sh + commit

**Status**: LOCKED FOREVER

---

## D-12: Launch Gating

**Decision**: KHÔNG ship Chrome Web Store cho đến khi:
- Phòng thi (Exam system) hoàn thành cho cả EN + ZH
- Bản tiếng Anh complete

**Why**: Jason muốn user trải nghiệm hoàn chỉnh launch day, không "early access" version thiếu feature.

**Claude rule**: Nếu Jason hỏi về Chrome Web Store submission flow / OAuth verification / store listing — chỉ chuẩn bị docs, KHÔNG submit. Nhắc lại gating criteria.

**Status**: LOCKED until criteria met.

---

## D-13: Vision Auto-Caption — PARKED, chờ Jason quyết

**Vấn đề gốc**: Flux Schnell không tạo được 3×2 grid → vision describe không match. Đã thử Llama → Llava → Gemini 2.5 Flash. Gemini code đã ship ở v1.7.7 nhưng Jason chưa test thực tế với GEMINI_API_KEY.

**4 options chưa quyết**:

- **A. Pragmatic** (recommend cho MVP): Manual edit textarea + ship beta
- **B. Workers AI SDXL**: Better composition than Flux Schnell, vẫn free tier
- **C. DALL-E 3**: $2.40 once-off, accuracy cao nhất
- **D. Architecture pivot**: Bỏ ý tưởng grid, dùng natural scene + calibration tool

**Status**: PARKED. Jason cần test Gemini caption với API key trước, rồi mới quyết.

**Claude rule**: KHÔNG tự ý ship Option B/C/D. Nếu task touch vision pipeline, hỏi Jason đã quyết option nào chưa.

---

## D-14: Sync Backend = Cloudflare D1

**Decision**: Multi-user sync backend = Cloudflare D1 (SQLite-on-edge).

**Why**:
- Worker đã chạy ở Cloudflare → D1 cùng platform, zero extra deploy/auth wiring
- SQL native, schema migrations đơn giản (file-based ở `worker/src/db/migrations/`)
- Free tier đủ cho pre-launch + early users
- Đã wire-up production từ Sprint 4.7+ (drop_zone_overrides, exam_audio_scripts, users, sync state, billing)

**Rejected**:
- Firebase Firestore — cùng concerns như Firebase Storage tại D-6 (CORS phức tạp với extension origin, cost scale-up)
- Supabase — extra platform để maintain + auth bridge, không tận dụng Worker đã có

**Status**: LOCKED. D1 ID = `9729612b-2b94-4ad0-a708-2dfda0a379db`. Migrations hiện tại 01_users → 11_exam_audio_scripts. Sprint 4.12 sẽ thêm `12_exam_attempts.sql`.

---

## D-15: Multi-user Sync Conflict Resolution = Last-Write-Wins

**Decision**: Conflict resolution strategy cho multi-user sync = Last-Write-Wins (LWW), Anki-style.

**Why**:
- LinguTab là personal learning tool — single user across multiple devices, không phải collab realtime
- Risk thực tế của conflict thấp: 1 user khó edit cùng card từ 2 device cùng lúc
- LWW đơn giản, dễ debug, dễ test
- Anki dùng LWW từ ngày đầu, proven tại scale lớn hơn LinguTab nhiều

**Rejected**:
- CRDT — overkill, schema complexity tăng đáng kể cho payoff không rõ
- Operational Transforms — cần persistent operation log, không phù hợp model offline-first

**Mitigation cho conflict edge case**:
- First-time sync popup cho phép user chọn upload-all hoặc download-all (4 scenarios trong syncService)
- Force one-way sync option cho restore scenario

**Status**: LOCKED. Implementation ở `src/services/syncService.ts`. Worker side tại `worker/src/sync/handlers.ts`.

---

## Decisions Pending (chưa chốt — chat sau sẽ resolve)

- [ ] Exam image-description-audio mismatch fix approach (single source of truth vs validation step)
- [ ] Pricing tier breakdown (free vs paid feature gating)

**Khi resolve những item này** → move xuống section LOCKED ở trên + update STATE.md.
