# LinguaNewTab

> Biến mỗi tab mới thành một buổi học tiếng Trung / tiếng Anh ngắn gọn.
> Chrome extension dành cho người Việt.

## Trạng thái hiện tại — v0.5.0

- **Tab Tổng quan**: chuỗi ngày 🔥, mục tiêu, số thẻ đến hạn, chọn ngôn ngữ.
- **Tab Phát âm**: Pinyin (ZH) hoặc IPA (EN), mỗi âm có hướng dẫn so sánh tiếng Việt + audio bản ngữ (Kokoro TTS).
- **Tab Flashcard**: SRS theo thuật toán **FSRS**, 3D flip card, audio bản ngữ + chế độ chậm, hỗ trợ ảnh minh hoạ upload qua Google Drive.

### Dữ liệu có sẵn
- 🇨🇳 **HSK 1 (150 từ)** · 21 phụ âm đầu · 38 âm vận · 5 thanh điệu.
- 🇬🇧 **Oxford 500** · 24 phụ âm · 20 nguyên âm + nguyên âm đôi.

## 🚀 Dev

```bash
npm install
npm run dev          # Vite dev server với HMR
```

Sau đó:

1. Mở `chrome://extensions` → bật **Developer mode**.
2. **Load unpacked** → chọn `dist/` (sau khi `npm run build`).
3. Mở tab mới → thấy LinguaNewTab.

## 📦 Build & đóng gói

```bash
npm run build        # dist/ sẵn sàng load vào Chrome
npm run zip          # tạo lingua-newtab.zip để upload Chrome Web Store
```

Version truth nằm ở `package.json`; `vite.config.ts` sync sang `manifest.json` lúc build + inject `__APP_VERSION__` vào footer.

## 🎙️ Generate audio bản ngữ (chạy trên Mac của Jason)

Audio không bundle sẵn trong source zip — generate 1 lần rồi rebuild.

```bash
# 1. Cài uv (Python package installer hiện đại) nếu chưa có
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Setup Python env + deps
cd lingua-newtab
uv venv && source .venv/bin/activate
uv pip install kokoro-onnx soundfile numpy

# 3. Download Kokoro model (one-time, ~115MB)
python scripts/gen_kokoro_mac.py --download-model

# 4. Sample 10 file trước (nghe voice test)
python scripts/gen_kokoro_mac.py --sample

# 5. Nếu ưng voice → full generate (phonemes + HSK1 = 214 file, ~2-3MB)
python scripts/gen_kokoro_mac.py --scope=all

# 6. Rebuild extension với audio bundled
npm run build
```

Xem chi tiết ở `scripts/MAC_SETUP.md`.

**Chưa có audio tiếng Anh**: Kokoro có voice `af_*` nhưng script chưa support English pipeline — sẽ thêm ở v0.6.

## ☁️ Cloudflare Worker (Gemini proxy)

v0.5 chưa dùng tới. Khi cần AI (Storyboard ở v0.8) sẽ deploy:

```bash
cd worker
npm install
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

Sau đó cập nhật `WORKER_ENDPOINT` trong `src/services/gemini.ts`.

## 🏗️ Kiến trúc

```
src/
├── data/
│   ├── index.ts          # Re-exports — callers dùng wordsByLang[lang], phoneticGroups, langLabels
│   ├── tiers.ts          # Tier registry: HSK1, Oxford 500... foundation cho level system v0.6
│   └── zh/, en/          # HSK1, pinyin, Oxford500, IPA data files
├── services/
│   ├── db.ts             # Dexie IndexedDB (settings, wordProgress, customImages, cache)
│   ├── srs.ts            # FSRS wrapper (ts-fsrs)
│   ├── tts.ts            # Web Speech API
│   ├── audioService.ts   # Bundled MP3 resolver + phoneme lookup by ID prefix
│   ├── authService.ts    # Google OAuth (scope: drive.appdata)
│   ├── driveService.ts   # Drive appDataFolder CRUD
│   ├── imageService.ts   # Custom flashcard image sync state machine
│   └── gemini.ts         # Cloudflare Worker client (v0.8+)
├── stores/useAppStore.ts # Zustand: lang, tab, streak, settings
├── types/index.ts        # Word, Phoneme, WordProgress, Settings, WordCustomImage
├── env.d.ts              # __APP_VERSION__ declaration
└── newtab/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── index.html
    ├── components/       # Dashboard, TabNav, TabPhonetics, TabFlashcards, Flashcard,
    │                       FlashcardImage, Header, AuthButton
    └── hooks/            # useTTS, useAuth, useCustomImage
worker/                   # Cloudflare Worker template (Gemini proxy, v0.8+)
scripts/                  # Kokoro/Google/Azure TTS generators
docs/                     # Phase 3 streaming TTS architecture doc
```

### Tại sao chọn những gì

- **Vite + CRXJS**: hot reload cho extension dev, giữ MV3 spec.
- **Zustand**: state store nhỏ gọn, hợp cho extension.
- **Dexie.js**: IndexedDB API tử tế, hỗ trợ `useLiveQuery` cho realtime UI.
- **ts-fsrs**: FSRS dự đoán retention tốt hơn SM-2, open-source.
- **Kokoro TTS**: voice bản ngữ, xử lý tone 3 tiếng Trung đúng (Chirp 3 HD làm phẳng trên syllable đơn lẻ).
- **Cloudflare Worker proxy**: bảo vệ Gemini API key — extension public không bundle key được.

## 🗺️ Roadmap

Chi tiết xem thread review. Tóm tắt:

| Version | Focus | Status |
|---------|-------|--------|
| v0.5 | Hygiene + audio foundation + tier registry | ✅ **current** |
| v0.6 | XP/Level system với unlock gating | Next |
| v0.7 | HSK2 + Oxford 1000 (AI-drafted, Jason-verified) | |
| v0.8 | Storyboard MVP (Gemini text + image) | |
| v0.9 | Public soft launch Chrome Web Store | |
| v1.0 | HSK3 + Oxford 3000 full + streaming audio | |
| v1.1 | Sentence Patterns | |
| v1.2 | Idioms (成语) | |
| v2.0 | HSK4-6 + Oxford 5000 | |

## 📜 License

Internal project — Jason / DungThichVar.
