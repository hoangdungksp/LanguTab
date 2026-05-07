# ☁️ GOOGLE_TTS_SETUP — Chirp 3 HD cho LinguaNewTab

Voice **`cmn-CN-Chirp3-HD-Kore`** (female, state-of-the-art 2025, chất lượng cao nhất hiện tại trên market).

Mỗi phoneme/word sinh 2 phiên bản: **normal** (1.0x) + **slow** (0.7x) → extension có nút "🔊 Nghe" và "🐢 Nghe chậm".

**Setup**: ~10 phút.
**Chi phí**: **$0 forever** — Chirp 3 HD có free tier 1M chars/tháng, project dùng ~30K chars/tháng.

---

## Bước 1 — Tạo Google Cloud project mới

1. Vào https://console.cloud.google.com/
2. Header trên → click project selector bên cạnh logo Google Cloud
3. Click **NEW PROJECT** (góc phải dialog)
4. Fill:
   - **Project name**: `lingua-newtab`
   - **Organization**: để mặc định
5. Click **CREATE**
6. Chờ ~15 giây → click notification → auto-switch sang project mới
7. Verify: header project selector hiển thị `lingua-newtab`

## Bước 2 — Link billing

Text-to-Speech API yêu cầu enable billing, nhưng **không bị charge** nếu dưới free tier 1M chars/tháng.

1. Sidebar ☰ → **Billing**
2. Nếu hiện "This project has no billing account":
   - Click **LINK A BILLING ACCOUNT**
   - Chọn billing account đang dùng cho KSP Studio
   - Click **SET ACCOUNT**
3. Nếu đã link sẵn → skip

## Bước 3 — Enable Text-to-Speech API

1. Sidebar ☰ → **APIs & Services** → **Library**
2. Search `Text-to-Speech API`
3. Click **Cloud Text-to-Speech API** → click **ENABLE**
4. Chờ ~10 giây

## Bước 4 — Tạo Service Account

1. Sidebar ☰ → **IAM & Admin** → **Service Accounts**
2. Click **+ CREATE SERVICE ACCOUNT**
3. Fill:
   - **Service account name**: `lingua-newtab-tts`
   - **Description**: `TTS generation for LinguaNewTab extension`
4. Click **CREATE AND CONTINUE**
5. **Grant access** (quan trọng):
   - Dropdown **Select a role** → search `Text-to-Speech`
   - Chọn **Cloud Text-to-Speech User**
6. Click **CONTINUE** → **DONE**

## Bước 5 — Tạo JSON key

1. Click vào service account vừa tạo (`lingua-newtab-tts@...`)
2. Tab **KEYS**
3. Click **ADD KEY** → **Create new key**
4. Chọn **JSON** → **CREATE**
5. Browser tự download file `lingua-newtab-xxxxx.json`

## Bước 6 — Copy JSON key vào project

Mở Terminal:

```bash
cd ~/Downloads/lingua-newtab
mkdir -p scripts/credentials

# Move + rename cho clean
mv ~/Downloads/lingua-newtab-*.json scripts/credentials/google-tts-key.json

# Verify
ls -la scripts/credentials/google-tts-key.json
```

⚠️ **File này là credential, KHÔNG commit lên git**. Script đã add `scripts/credentials/` vào `.gitignore`.

## Bước 7 — Activate venv + install Google TTS SDK

```bash
cd ~/Downloads/lingua-newtab
source .venv/bin/activate

# Install Google Cloud TTS SDK (~30MB deps)
uv pip install google-cloud-texttospeech
```

## Bước 8 — Set credential path env var

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/scripts/credentials/google-tts-key.json"

# Verify
echo $GOOGLE_APPLICATION_CREDENTIALS
# /Users/jasonnguyen/Downloads/lingua-newtab/scripts/credentials/google-tts-key.json
```

Để permanent (optional):
```bash
echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$HOME/Downloads/lingua-newtab/scripts/credentials/google-tts-key.json\"" >> ~/.zshrc
```

## Bước 9 — Copy script Google TTS

Jason download `gen_google_mac.py` → copy vào `scripts/`:

```bash
cp ~/Downloads/gen_google_mac.py scripts/gen_google_mac.py
```

## Bước 10 — Generate 10 sample

```bash
python scripts/gen_google_mac.py --sample
```

Output mong đợi:

```
🎙️  LinguaNewTab — Google Cloud TTS Generator (Chirp 3 HD)
   Scope: phonemes
   Voice: cmn-CN-Chirp3-HD-Kore
   Speeds: normal (1.0x) + slow (0.7x)
   Output: /Users/.../public/audio/zh

🔐 Authenticating with Google Cloud...
✅ Authenticated

🎯 Sample mode: 10 phonemes × 2 speeds = 20 files

[  1/20] zh_init_b     [normal] → bō        ✓ 6.2KB
[  2/20] zh_init_b     [slow]   → bō        ✓ 8.1KB
[  3/20] zh_init_zh    [normal] → zhī       ✓ 6.8KB
[  4/20] zh_init_zh    [slow]   → zhī       ✓ 8.5KB
...
[ 17/20] zh_tone_4     [normal] → mà        ✓ 6.5KB
[ 18/20] zh_tone_4     [slow]   → mà        ✓ 8.9KB
[ 19/20] zh_tone_neutral [normal] → ma      ✓ 5.1KB
[ 20/20] zh_tone_neutral [slow]   → ma      ✓ 6.8KB

============================================================
✅ Done. Generated: 20, Skipped: 0, Failed: 0
```

## Bước 11 — Nghe 4 tones (critical test)

```bash
echo "=== Normal speed ==="
afplay public/audio/zh/tones/zh_tone_1_normal.mp3
afplay public/audio/zh/tones/zh_tone_2_normal.mp3
afplay public/audio/zh/tones/zh_tone_3_normal.mp3
afplay public/audio/zh/tones/zh_tone_4_normal.mp3

echo "=== Slow speed ==="
afplay public/audio/zh/tones/zh_tone_1_slow.mp3
afplay public/audio/zh/tones/zh_tone_2_slow.mp3
afplay public/audio/zh/tones/zh_tone_3_slow.mp3
afplay public/audio/zh/tones/zh_tone_4_slow.mp3
```

## Bước 12 — Báo mình kết quả

**Voice OK, full generate**:
```bash
python scripts/gen_google_mac.py --scope=phonemes
python scripts/gen_google_mac.py --scope=hsk1
```

**Voice chưa ưng**:
Mình thử 7 voices Mandarin khác của Chirp 3 HD:
- Female: `Leda`, `Aoede`, `Zephyr`
- Male: `Achird`, `Algieba`, `Puck`, `Charon`

---

## ⚠️ Troubleshooting

### Script báo "Could not automatically determine credentials"
Quên export `GOOGLE_APPLICATION_CREDENTIALS` hoặc Terminal mới chưa load. Chạy lại Bước 8.

### Script báo "403 Permission denied"
- Service account chưa có role `Cloud Text-to-Speech User` → IAM & Admin → Service Accounts → sửa role
- Hoặc Text-to-Speech API chưa enable → quay lại Bước 3

### Script báo "400 Invalid voice name"
Voice name phải chính xác: `cmn-CN-Chirp3-HD-Kore` (case-sensitive, đủ dấu gạch).

### Chi phí theo dõi
Console → Billing → Reports → filter by **Cloud Text-to-Speech API**. Free tier 1M WaveNet chars/month renewable. Project LinguaNewTab dùng ~30K chars/tháng nên an toàn dưới free tier.

### Rate limit
Chirp 3 HD có quota 900 requests/phút. Script có delay 0.2s giữa requests → max ~5 req/s, an toàn.
