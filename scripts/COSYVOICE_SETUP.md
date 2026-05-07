# CosyVoice API Setup (Alibaba Cloud, Singapore region)

Hướng dẫn register + generate audio cho LinguaNewTab dùng **CosyVoice v2** —
TTS made-in-China của Alibaba, chất lượng cao nhất hiện có cho tiếng Trung.

---

## Why CosyVoice (không phải Kokoro)

| | Kokoro (local) | CosyVoice (API) |
|---|---|---|
| Quality tiếng Trung | Trung bình, tone 3 sai | **SOTA** (CER 0.81%) |
| Pronunciation tự nhiên | 6/10 | **9/10** (native training) |
| Voice cloning | ❌ | ✅ (tùy chọn, v0.6+) |
| Chi phí | Miễn phí | **~$0.05 cho 214 file** (free tier vĩnh viễn) |
| Setup phức tạp | Trung bình | Nhẹ (1 API key) |
| Độ ổn định | Đôi khi crash local | Stable cloud |

## Bước 1: Register Alibaba Cloud Singapore

⚠️ **Quan trọng**: Phải là **Singapore region**, không phải Beijing.
Account Beijing cần chứng minh nhân dân TQ.

1. Mở https://www.alibabacloud.com/
2. Click **Sign Up** (góc phải trên)
3. Điền email + password → verify OTP
4. Chọn country = **Vietnam** (hoặc bất kỳ nước ngoài TQ)
5. Add credit/debit card — **không charge** nếu xài trong free tier
   - Alibaba verify card bằng authorization $1 (refund sau 1-3 ngày)
   - Thẻ Vietnamese bank thường OK

**Lưu ý**: Alibaba có thể yêu cầu identity verification (passport/CCCD).
Upload ảnh → chờ 1-24 tiếng approve.

## Bước 2: Activate Model Studio + lấy API key

1. Login → vào https://modelstudio.console.alibabacloud.com/
2. Nếu thấy prompt "Activate Model Studio" → click Activate (miễn phí)
3. Sidebar trái → **API Keys** (hoặc **API-KEY**)
4. Click **Create My API Key** → name tùy ý (ví dụ "lingua-newtab")
5. Copy API key — dạng `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Lưu key cẩn thận** — key chỉ hiện 1 lần, leak là ai cũng dùng tốn tiền bạn

**Double-check**: Ở góc trên màn hình phải ghi **Singapore** hoặc **International**.
Nếu ghi **Beijing** → switch region về Singapore trước khi tạo key.

## Bước 3: Set API key trên Mac

Mở Terminal, chạy:

```bash
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Thay `sk-xxx...` bằng key thật của Jason.

**Muốn persist** (không phải type mỗi lần mở Terminal):

```bash
echo 'export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
source ~/.zshrc
```

Verify:

```bash
echo $DASHSCOPE_API_KEY
# Phải in ra sk-xxx...
```

## Bước 4: Install Python SDK

```bash
cd ~/Downloads/lingua-newtab

# Reuse .venv cũ từ Kokoro (Python 3.10+)
source .venv/bin/activate

uv pip install dashscope
```

Nếu chưa có `.venv`:

```bash
uv venv
source .venv/bin/activate
uv pip install dashscope
```

## Bước 5: Preview voice (sample 10 file)

**Luôn sample trước** — tránh generate 214 file rồi phát hiện không ưng giọng.

```bash
python scripts/gen_cosyvoice_mac.py --sample
```

Output vào `public/audio/zh/`. Mở Finder → navigate tới folder, nghe các
file `zh_init_b.mp3`, `zh_init_zh.mp3`, `zh_001.mp3` (我), `zh_010.mp3` (不).

**Test nghe**:
- Tone 3 (ǎ, 我) có dip đúng không?
- Initial `zh`, `ch`, `sh` có retroflex (cong lưỡi) không?
- Tổng thể có giống giọng Bắc Kinh chuẩn không?

Nếu OK → Bước 6.
Nếu không OK → thử voice khác:

```bash
python scripts/gen_cosyvoice_mac.py --sample --voice longwan_v2    # nữ trung niên
python scripts/gen_cosyvoice_mac.py --sample --voice longcheng_v2  # nam tin tức
python scripts/gen_cosyvoice_mac.py --sample --voice longhua_v2    # nam trẻ
```

Full voice list: https://www.alibabacloud.com/help/en/model-studio/voice-list

## Bước 6: Full generate

```bash
python scripts/gen_cosyvoice_mac.py --scope=all
```

Script sẽ generate 214 file (~5-8 phút tùy network). Terminal in progress
cho từng file.

Muốn đổi voice từ default:

```bash
python scripts/gen_cosyvoice_mac.py --scope=all --voice longwan_v2
```

## Bước 7: Build extension với audio mới

```bash
npm run build
```

Reload extension trong Chrome: `chrome://extensions` → nút ↻ reload.

## Bước 8: Backup audio

```bash
rm -rf ~/Desktop/lingua-audio-backup
cp -r public/audio ~/Desktop/lingua-audio-backup
```

Session sau khi mình gửi source mới, Jason chỉ cần copy backup vào, không
cần gọi API lại.

---

## Chi phí thực tế

CosyVoice v2 tính $0.0003 per request (1 file = 1 request):
- 214 file × $0.0003 = **$0.06 / lần generate đầy đủ**
- Chạy 10 lần thử nghiệm khác voice = **$0.60**

Alibaba tặng free credit $50 khi register → đủ generate **~167,000 file**.
Với 214 file/lần, Jason có thể thử nghiệm 780 lần trước khi hết free.

## Troubleshoot

### `DASHSCOPE_API_KEY environment variable not set`
→ Bước 3 chưa làm, hoặc Terminal mới mở chưa source `~/.zshrc`.

### `InvalidApiKey` / `403 Forbidden`
→ Key copy sai, hoặc key là Beijing region (script dùng Singapore endpoint).
Tạo key mới trong Singapore region.

### `Empty audio returned`
→ Model/voice không khả dụng ở Singapore region. Kiểm tra voice list link ở trên,
chọn voice có cột "Singapore" = ✓.

### Generate chậm (>5s/file)
→ Network Việt Nam → Singapore có thể chậm. Thử lại vào giờ khác, hoặc
chạy từ Colab với kết nối tốt hơn.

### Chrome vẫn phát voice robot
→ Chưa reload extension, hoặc Chrome load folder cũ. Check:
```
chrome://extensions → Details → Source = /Users/jason/.../lingua-newtab/dist
```

---

## So sánh voices khuyến nghị

| Voice | Gender | Style | Best for |
|---|---|---|---|
| `longxiaochun_v2` | Female | Young, clear, Beijing | **Learners (default)** |
| `longwan_v2` | Female | Warm, middle-aged | Stories, podcasts |
| `longcheng_v2` | Male | News anchor | Formal content |
| `longhua_v2` | Male | Young, energetic | Audiobooks |

Mình đề xuất bắt đầu với `longxiaochun_v2` — giọng nữ trẻ rõ ràng nhất
cho người mới học HSK1.
