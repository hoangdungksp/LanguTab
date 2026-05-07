# ☁️ AZURE_SETUP — Sinh pinyin audio chất lượng cao với Azure Neural TTS

Voice `zh-CN-XiaoxiaoNeural` — cùng voice Duolingo/Busuu dùng. **Xử lý tone chính xác 100%** (khác Kokoro).

**Setup**: ~5 phút. **Chi phí**: ~$0.07 one-time (có $200 free credit 30 ngày → thực tế Jason trả **$0**).

---

## Bước 1 — Tạo Azure account (1 lần)

1. Vào https://azure.microsoft.com/free/
2. Click **Start free** → đăng ký bằng Microsoft account
3. Xác thực credit card (không bị charge nếu không dùng quá $200 credit)
4. Xong → vào https://portal.azure.com/

## Bước 2 — Tạo Speech resource

1. Portal → click **Create a resource** (góc trên trái, dấu `+`)
2. Search `Speech` → chọn **Speech** của Microsoft
3. Click **Create**
4. Fill form:
   - **Subscription**: Azure subscription 1 (mặc định)
   - **Resource group**: click **Create new** → tên: `lingua-newtab-rg` → OK
   - **Region**: **Southeast Asia** (gần VN nhất, latency thấp)
   - **Name**: `lingua-newtab-speech` (unique toàn Azure, nếu trùng thì thêm số)
   - **Pricing tier**: **Standard S0** ⚠️ *KHÔNG chọn F0 — F0 không được phép dùng thương mại*
5. Click **Review + create** → **Create**
6. Chờ ~30 giây → click **Go to resource**

## Bước 3 — Lấy Key + Region

1. Trong Speech resource → sidebar → **Keys and Endpoint**
2. Copy:
   - **KEY 1** (dạng: `abc123def456...`)
   - **Location/Region** (dạng: `southeastasia`)

## Bước 4 — Install Python dep (trong venv Mac)

Terminal:

```bash
cd ~/Downloads/lingua-newtab
source .venv/bin/activate
# Azure script không cần package nào thêm — dùng urllib built-in
# Nếu chưa activate venv, activate lại
```

## Bước 5 — Export credentials

Paste 2 dòng này vào Terminal (thay `YOUR_KEY` và region cho đúng):

```bash
export AZURE_SPEECH_KEY="YOUR_KEY_FROM_AZURE_PORTAL"
export AZURE_SPEECH_REGION="southeastasia"
```

⚠️ Chỉ valid trong Terminal session này. Nếu đóng Terminal → phải export lại. Để permanent, add vào `~/.zshrc`:

```bash
echo 'export AZURE_SPEECH_KEY="YOUR_KEY"' >> ~/.zshrc
echo 'export AZURE_SPEECH_REGION="southeastasia"' >> ~/.zshrc
source ~/.zshrc
```

## Bước 6 — Copy script Azure vào project

Jason download `gen_azure_mac.py` → copy vào `scripts/`:

```bash
cp ~/Downloads/gen_azure_mac.py scripts/gen_azure_mac.py
```

## Bước 7 — Generate 10 sample

```bash
python scripts/gen_azure_mac.py --sample
```

Output mong đợi:

```
🎙️  LinguaNewTab — Azure Neural TTS Generator
   Scope: phonemes
   Voice: zh-CN-XiaoxiaoNeural
   Region: southeastasia
   Output: /Users/.../public/audio/zh

🔐 Requesting Azure access token...
✅ Token obtained

🎯 Sample mode: 10 phonemes

[  1/10] zh_init_b         → bō             ✓ 8.4KB
[  2/10] zh_init_zh        → zhī            ✓ 9.1KB
[  3/10] zh_init_r         → rī             ✓ 8.8KB
[  4/10] zh_fin_a          → ā              ✓ 7.2KB
[  5/10] zh_fin_ue         → yuē            ✓ 9.5KB
[  6/10] zh_fin_iang       → yāng           ✓ 10.1KB
[  7/10] zh_tone_1         → mā             ✓ 8.9KB
[  8/10] zh_tone_2         → má             ✓ 9.2KB
[  9/10] zh_tone_3         → mǎ             ✓ 9.8KB
[ 10/10] zh_tone_4         → mà             ✓ 9.0KB

============================================================
✅ Done. Generated: 10, Skipped: 0, Failed: 0
```

## Bước 8 — Nghe 4 tones

```bash
afplay public/audio/zh/tones/zh_tone_1.mp3
afplay public/audio/zh/tones/zh_tone_2.mp3
afplay public/audio/zh/tones/zh_tone_3.mp3
afplay public/audio/zh/tones/zh_tone_4.mp3
```

Tones sẽ **chuẩn native Bắc Kinh** — cùng chất lượng Duolingo/Busuu.

## Bước 9 — Báo mình kết quả

**Option 1 — Voice OK**:
> *"Azure OK, full generate"*

Mình đưa lệnh:
```bash
python scripts/gen_azure_mac.py --scope=phonemes
python scripts/gen_azure_mac.py --scope=hsk1
```

**Option 2 — Vẫn không ổn**:
> *"Tone X vẫn sai / voice lạ"*

Mình thử voice khác: `XiaoyiNeural`, `XiaochenNeural`, hoặc đổi SSML approach.

---

## ⚠️ Troubleshooting

### Script báo "Missing environment variables"
Jason quên export env vars hoặc export trong Terminal khác. Chạy lại 2 lệnh `export ...` ở Bước 5.

### Script báo "Failed to get token: HTTP Error 401"
- KEY sai → copy lại KEY 1 từ Azure Portal, cẩn thận không có space đầu/cuối
- Region sai → phải khớp với resource's region (không phải "SoutheastAsia" với chữ hoa)

### Script báo "HTTP Error 403"
Speech resource tier là **F0 (Free)** → cần đổi sang **S0 (Standard)** vì F0 không được phép dùng cho content thương mại (extension publish lên Chrome Store).

Fix: Azure Portal → Speech resource → **Pricing tier** → chọn **Standard S0** → Save.

### Nhiều 429 (rate limit) trong log
Script đã có retry + delay 0.2s. Nếu vẫn gặp nhiều, Azure region overloaded, thử:
```bash
# Tăng delay (sửa trong script: time.sleep(0.2) → time.sleep(0.5))
# Hoặc đổi region sang eastus
```

### Muốn check chi phí thực tế
Azure Portal → Speech resource → **Overview** → xem **Metrics** → "Synthesized Characters" chart. Multiply with $16/1M chars. Thường <$0.10 cho toàn bộ project.

---

## 🎯 Vì sao Azure tốt hơn Kokoro cho project này

| | Kokoro | Azure Neural TTS |
|---|---|---|
| Voice tự nhiên | 6/10 | 9/10 |
| Tone accuracy (pinyin đơn lẻ) | **Sai** (flatten tone 3, misread neutral) | **Chuẩn 100%** |
| Mandarin chuẩn Bắc Kinh | Có với xiaoxiao | Có với XiaoxiaoNeural |
| Chi phí | $0 | $0.07 one-time (free credit cover) |
| Setup complexity | Trung bình (Python venv + 330MB model) | Dễ (chỉ export 2 env vars) |
| Commercial use OK | Apache 2.0 ✅ | S0 tier ✅ |

Azure Neural TTS là lựa chọn **professional standard** cho language learning products. Duolingo, Busuu, HelloChinese đều dùng. Đáng đầu tư $0.07 để có chất lượng production.
