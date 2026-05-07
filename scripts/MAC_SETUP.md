# 🍎 MAC_SETUP — Generate pinyin audio trên Mac

Hướng dẫn chạy script Kokoro TTS local trên Mac để sinh 64 file MP3 pinyin (21 initials + 38 finals + 5 tones) với voice `zf_xiaoxiao`.

**Tổng thời gian setup**: ~10 phút (one-time). Generate: ~1-3 phút.

---

## Bước 1 — Kiểm tra Python

Mở **Terminal** (Cmd+Space → "Terminal"):

```bash
python3 --version
```

Cần **3.9 trở lên**. Mac từ macOS 12 (Monterey) trở lên có sẵn Python 3.9+.

Nếu version cũ hoặc chưa có: install từ https://www.python.org/downloads/ hoặc `brew install python@3.12`.

## Bước 2 — Install `uv` (modern Python package installer)

`uv` nhanh hơn `pip` ~10-100 lần, quản lý venv tự động:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Restart Terminal hoặc `source ~/.zshrc`. Check:

```bash
uv --version
# Should print: uv 0.x.x
```

## Bước 3 — Install `ffmpeg` (cho MP3 encoding)

Script dùng ffmpeg để convert WAV → MP3 (tiết kiệm dung lượng ~70%):

```bash
# Nếu chưa có Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install ffmpeg
brew install ffmpeg
```

Check: `ffmpeg -version` — phải in ra phiên bản.

## Bước 4 — Setup virtualenv + deps cho project

```bash
cd /path/to/lingua-newtab

# Tạo venv (thư mục .venv/)
uv venv --python 3.12

# Activate venv
source .venv/bin/activate
# Prompt sẽ có (.venv) ở đầu

# Install Kokoro + deps
uv pip install kokoro-onnx soundfile numpy
```

`kokoro-onnx` là phiên bản ONNX lightweight của Kokoro, không cần PyTorch nặng. Total deps ~200MB.

## Bước 5 — Download Kokoro model (one-time, ~114MB)

```bash
python scripts/gen_kokoro_mac.py --download-model
```

Files sẽ được tải về `scripts/models/` (không commit vào git — đã add vào `.gitignore`).

- `kokoro-v1.0.onnx` (88MB) — model int8 quantized
- `voices-v1.0.bin` (26MB) — 26 voice style vectors bao gồm `zf_xiaoxiao`

## Bước 6 — Generate 10 sample trước để nghe voice

```bash
python scripts/gen_kokoro_mac.py --sample
```

Output (~30 giây trên Mac M1, ~1 phút trên Intel Mac):

```
🎙️  LinguaNewTab — Kokoro TTS Audio Generator
   Voice: zf_xiaoxiao
   Output: /path/to/lingua-newtab/public/audio/zh

✅ Models already downloaded
🔧 Loading Kokoro model...
✅ Kokoro ready

🎯 Sample mode: generating 10 phonemes

[  1/10] zh_init_b                  → bō     ✓ 4.2KB
[  2/10] zh_init_zh                 → zhī    ✓ 4.8KB
[  3/10] zh_init_r                  → rī     ✓ 4.5KB
[  4/10] zh_fin_a                   → ā      ✓ 3.9KB
[  5/10] zh_fin_ue                  → yuē    ✓ 4.6KB
[  6/10] zh_fin_iang                → yāng   ✓ 5.1KB
[  7/10] zh_tone_1                  → mā     ✓ 4.3KB
[  8/10] zh_tone_2                  → má     ✓ 4.4KB
[  9/10] zh_tone_3                  → mǎ     ✓ 4.6KB
[ 10/10] zh_tone_4                  → mà     ✓ 4.3KB

============================================================
✅ Done. Generated: 10, Skipped: 0, Failed: 0

🎧 Sample files ở public/audio/zh/. Mở folder đó và nghe.
```

Mở folder và nghe:

```bash
open public/audio/zh/initials/
# Hoặc: QuickLook bằng cách chọn file + Space
```

## Bước 7 — Jason verification

Nghe 10 file sample. Đánh giá:

- **Voice có tự nhiên không?** (không robot như Web Speech API cũ)
- **Pronunciation có chuẩn không?** (Bắc Kinh, không mang accent Đài Loan/Cantonese)
- **4 tones có nghe rõ khác biệt không?** (quan trọng nhất cho học viên)

### Nếu ưng → Generate full batch

```bash
python scripts/gen_kokoro_mac.py
```

64 phonemes, output ~400KB total, chạy ~2-3 phút.

### Nếu KHÔNG ưng → Thử voice khác

```bash
# 4 voice female khác
python scripts/gen_kokoro_mac.py --sample --voice zf_xiaoyi      # younger
python scripts/gen_kokoro_mac.py --sample --voice zf_xiaoni      # warm
python scripts/gen_kokoro_mac.py --sample --voice zf_xiaobei     # ⚠️ native reviewer nói sound "regional"

# 4 voice male
python scripts/gen_kokoro_mac.py --sample --voice zm_yunxi       # bright
python scripts/gen_kokoro_mac.py --sample --voice zm_yunjian     # deep
```

Voice blending (mix 2 voices) nếu muốn personalize:

```bash
# Cần sửa script để pass voice blend — báo mình nếu Jason muốn
```

## Bước 8 — Báo mình xong Phase A

Khi Jason đã có 64 file MP3 trong `public/audio/zh/`, nhắn mình:

> *"Audio OK rồi, code Phase B đi"*

Mình sẽ:
- `src/services/audioService.ts` — load/play/cache logic
- Update `TabPhonetics.tsx` — click phoneme → play audio
- Update `Flashcard.tsx` TTS button
- Graceful fallback về Web Speech API nếu file không tồn tại (dev mode trước khi Jason generate xong)

---

## ⚠️ Troubleshooting

### "ModuleNotFoundError: No module named 'kokoro_onnx'"
Jason quên activate venv. Chạy: `source .venv/bin/activate` rồi thử lại.

### "ffmpeg: command not found"
`brew install ffmpeg`. Nếu brew chưa có, xem Bước 3.

### Download model cực chậm
Mac dùng network VN có thể download GitHub releases chậm. Dùng VPN hoặc:
```bash
# Download thủ công bằng wget/curl với tăng timeout
cd scripts/models
curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
curl -L -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

### Voice sample nghe lạ
Voice `zf_xiaoxiao` trong Kokoro khác với Azure `XiaoxiaoNeural` — đây là 2 voice khác nhau dù cùng tên "Xiaoxiao". Kokoro được native reviewer xác nhận là standard Mandarin, nhưng không emotional expressive như Azure paid tier. Nếu quá lạ: đổi voice (Bước 7) hoặc cân nhắc Azure S0 paid (~$0.10).

### Mac M1/M2 chậm vs Intel
Apple Silicon actually NHANH hơn Intel Mac ~3× cho Kokoro (Neural Engine + unified memory). Nếu M1/M2 chạy chậm, có thể do emulation x86 — đảm bảo Python native ARM64:
```bash
python -c "import platform; print(platform.machine())"
# Expect: arm64 (không phải x86_64)
```

---

## Bonus — Alternative: chạy trên Colab (nếu không muốn setup Mac)

Jason có thể dùng `scripts/kokoro-gen-audio.ipynb` trên Google Colab — xem `scripts/COLAB_GUIDE.md`. Không cần cài gì trên Mac, chạy free trên Colab GPU T4.
