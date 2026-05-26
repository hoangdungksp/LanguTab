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
## D-18 — 60 unique levels content commitment

**Date**: 2026-05-20
**Status**: LOCKED. Path A chosen over Path C/D (rotation-based).

### Decision

Commit to writing 60 unique Cambridge YLE practice levels (20 Starters + 20 Movers + 20 Flyers), each with completely distinct content across all 4 parts (drag, write, tick, colour). No rotation, no parameter-variation tricks — each level is its own exam paper with unique narrative, questions, and answers.

### Context (data informing decision)

Commercial Cambridge YLE practice books offer 3-5 unique tests per book:
- Cambridge Pre A1 Starters 4: 3 papers
- Oxford YLE Tests Starters: 4 tests
- Hamilton House: 5 tests
- Collins Three Practice Tests: 3 tests

LinguTab target (60 unique) **vượt commercial benchmark 4x mỗi tier**. Trade-off accepted: 2-3 tháng dev content vs 1-2 tuần for Path C/D rotation approach.

### Rejected alternatives

- **Path C (5 themes rotate)**: Originally implemented in v1.8.0-dev (current state). 20 Starters had 5 variants × 4 repeats. Rejected by Jason as not matching "60 levels khác hoàn toàn" goal.
- **Path D (4-5 themes with data variations)**: User would see "Pet shop" 4 times with different names/numbers. Rejected for same reason — themes still repeat.
- **Path A reduced (30 unique)**: 10 per tier instead of 20. Rejected; Jason wants full 60.

### Implementation plan

| Phase | Scope | Sessions estimated |
|-------|-------|-------------------|
| 2.1 | Starters L1-L10 unique (Part 2 + Part 3) | DONE this session |
| 2.2 | Starters L11-L20 unique | 2-3 sessions |
| 3 | Movers L21-L40 (20 unique themes) | 4-5 sessions |
| 4 | Flyers L41-L60 (20 unique themes) | 4-5 sessions |
| 5 | Part 1 (drag) per-level unique character traits (sceneCharacters expansion) | 3-4 sessions |
| 6 | Part 4 (colour) per-level outline scenes (~25-30 new Flux scenes) | 3-4 sessions |
| 7 | Asset gen: 240 audio TTS (ElevenLabs, 3-4 months quota) | parallel |
| 8 | Icon library expansion (~30-50 new SVG icons) | 2-3 sessions |
| 9 | QA + manual fix per level | 2-3 sessions |

**Total estimate**: 20-30 dev sessions over 2-3 months. Plus 3-4 ElevenLabs subscription cycles for audio gen.

### 60-theme list (locked)

**Starters 1-20** (Pre-A1, simple present, daily life):
1. Pet shop · 2. Family dinner · 3. Weekend park · 4. Birthday party · 5. School day
6. Beach holiday · 7. Garden flowers · 8. Toy shop · 9. Sports day · 10. Picnic park
11. Library books · 12. Bicycle ride · 13. Cooking kitchen · 14. Swimming pool · 15. Farm visit
16. Pets at home · 17. Sleepover friend · 18. Garden play · 19. Train ride · 20. Snow day

**Movers 21-40** (A1-A2, past tense + comparatives):
21. Summer camp · 22. Music lesson · 23. Football match · 24. Dance class · 25. Restaurant menu
26. Bus journey · 27. Zoo trip · 28. Museum tour · 29. Fire station · 30. Pet competition
31. Tree planting · 32. Cinema visit · 33. Bakery shopping · 34. Fishing trip · 35. Garage sale
36. Hospital visit · 37. Post office · 38. Camping mountains · 39. Art exhibition · 40. New baby

**Flyers 41-60** (A2-B1, future + conditionals + abstract):
41. Science fair · 42. Charity event · 43. Volunteer shelter · 44. Food festival · 45. Eco project
46. Space exhibition · 47. Cooking competition · 48. Film making · 49. Photography class · 50. Mountain hiking
51. Sailing course · 52. Ancient museum · 53. Drama festival · 54. News reporter · 55. Job shadowing
56. Time capsule · 57. Future career · 58. Pen pals · 59. School olympics · 60. Graduation

### Quality bar

- Strict Cambridge YLE vocab tier: Starters ~280 words / Movers ~600 words / Flyers ~1000 words
- Each level audio script ~250-500 chars (longer for higher tier)
- 5 questions per Part 2/3, 5+ regions per Part 4
- Cambridge YLE format preserved: examples block, "Now listen and..." transition, numbered questions

### Risks accepted

- **Time-to-launch delayed 2-3 months** vs Path D quick ship
- **Asset cost ~$15-30** for ElevenLabs quota renewals across 3-4 cycles
- **Content writing burnout risk** mitigated by 5 levels/session pacing
- **Audio cache invalidation**: every new script = new hash = re-gen. Pre-gen Phase 2 (Jan 2026) audio scripts will be obsolete by L11-L60 ship.

---

## D-19: Phân quyền = Role-based trong D1 (bỏ ADMIN_TOKEN tĩnh)

**Date**: 2026-05-26
**Status**: LOCKED (chưa implement)

**Decision**: Quyền hạn dựa trên cột `role` trong bảng D1 `users`: `user` | `editor` | `admin`.
Worker verify Google ID token → tra `role` từ D1 → cấp quyền. Bỏ hoàn toàn `ADMIN_TOKEN`
tĩnh + allowlist email hardcode trong `adminModeService`.

- `editor`: sửa nội dung exam (audio script, scene gen/upload, calibration, gen audio).
- `admin`: quyền editor + quản lý user/role.
- Endpoint `/admin/*` đổi từ "Bearer ADMIN_TOKEN" → "Bearer <google token> + role check".

**Why**: Admin hiện tại sơ sài (token tĩnh trong sessionStorage + 1 email). Không an toàn,
không phân quyền editor, và CWS submission (Sprint 5.0) yêu cầu bỏ token tĩnh.

**Rejected**: giữ ADMIN_TOKEN (không scale, lộ token = toàn quyền).

---

## D-20: Thanh toán Pro (VN) = chuyển khoản QR/MOMO auto-reconcile qua SePay/Casso

**Date**: 2026-05-26
**Status**: LOCKED (chưa implement). Bổ sung/thay D-8 cho thị trường VN.

**Decision**: Bán gói Pro giá rẻ cho user VN qua **chuyển khoản ngân hàng/MOMO bằng QR**,
tự động xác nhận bằng dịch vụ đọc biến động số dư (**SePay** hoặc **Casso**) → webhook về
worker. User chuyển khoản kèm mã trong nội dung (vd `LINGU-<userId>`) → webhook khớp mã →
set Pro trong D1.

**Why**: Không thể tự đọc tài khoản ngân hàng trực tiếp. SePay/Casso là cách "tự động nhận
tiền" chuẩn ở VN, phí thấp, nhiều app dùng. Lemon Squeezy (D-8) giữ lại cho thanh toán quốc
tế sau này (Merchant of Record xử lý VAT).

**Rejected**: chỉ Lemon Squeezy (phí cao + UX lạ với user VN); xác nhận thủ công 100% (không
scale); tự scrape sao kê (không khả thi/không an toàn).

---

## D-21: Web app companion tại lingutab.com (Cloudflare Pages)

**Date**: 2026-05-26
**Status**: LOCKED (chưa implement).

**Decision**: Mở rộng thành web app tại `lingutab.com` (Cloudflare Pages), **dùng chung worker
API + D1** với extension. Web app là nơi đặt: landing/marketing, đăng nhập, **dashboard quản
lý** (user/role D-19, học sinh online + độ tuổi, Pro users D-20), trang thanh toán.

- Extension = bề mặt học "new tab" (giữ nguyên).
- Web = quản lý + marketing + account. Code React tái dùng; tách abstraction cho phần
  chrome-specific (chrome.storage, identity, newtab override).
- Quản lý KHÔNG nhét inline trong extension nữa → chuyển sang dashboard web.

**Why**: Quản lý chuyên nghiệp (#1/#2/#3) hợp với dashboard web hơn; reach user ngoài Chrome;
landing để bán Pro.

**Kèm lưu ý PRIVACY (trẻ em)**: thu thập độ tuổi/dữ liệu trẻ em dính COPPA/GDPR-K → cần cập
nhật Privacy Policy + cân nhắc đồng ý phụ huynh TRƯỚC khi bật tính năng đăng ký tuổi.

---

## D-22: Tính năng mới (roadmap, chưa lock chi tiết)

**Date**: 2026-05-26
**Status**: AGREED in principle, chi tiết thiết kế sau.

- **300 mẫu câu tiếng Anh thông dụng**: tab duyệt + audio (admin-gen).
- **Nhật ký hằng ngày**: UI viết mỗi ngày, gợi ý từ 300 mẫu câu / ngữ pháp thông dụng, chấm
  cú pháp (cân nhắc Gemini — cần verify Gemini text từ worker chạy được; vision bị geo-fence D-13).
- Lưu nhật ký: Dexie (local) hoặc D1 (sync).

---

## D-23: Phòng thi tiếng Trung (HSK) — launch-critical theo D-12

**Date**: 2026-05-26
**Status**: AGREED, chưa làm. D-12 gate launch trên "Exam cho cả EN + ZH".

**Decision**: Xây Phòng thi tiếng Trung dùng LẠI engine 4-part hiện có (drag/write/tick/colour)
+ planets/roadmap. Khác biệt: nội dung theo HSK (1-3+), audio Qwen-TTS Cherry (D-1, pinyin tone
marks D-2), câu hỏi phù hợp hanzi/pinyin.

**Ước tính**: Engine tái dùng 100%. Bottleneck là CONTENT (giống effort English vừa rồi) +
gen audio tiếng Trung. Khởi đầu nhỏ HSK1 (~20 level) khả thi trong vài session; full 60 level
tương đương công sức English (~8-10 session content).

**Why**: D-12 yêu cầu exam EN+ZH cho launch. English content vừa xong (60/60); ZH chưa có.
