# 🎙️ COLAB_GUIDE — Generate pinyin audio không cần cài gì trên máy

Hướng dẫn Jason dùng **Google Colab** (online, free, không cài Python) để generate 64 file MP3 pinyin chuẩn với Kokoro TTS voice `zf_xiaoxiao`.

**Tổng thời gian:** ~10 phút. Không cần tài khoản trả phí. Không cài gì trên máy.

---

## Bước 1 — Mở Colab

1. Vào https://colab.research.google.com/
2. Đăng nhập bằng tài khoản Google (tài khoản thường, Jason đã có)
3. File → **Upload notebook** → chọn file `kokoro-gen-audio.ipynb` từ project

> 💡 **Alternative**: Jason có thể host file này trên GitHub, sau đó mở bằng link `https://colab.research.google.com/github/...` — tiện hơn vì mỗi lần không cần upload.

## Bước 2 — Chọn GPU (quan trọng)

1. Menu bar → **Runtime** → **Change runtime type**
2. **Hardware accelerator**: chọn **T4 GPU** (free tier)
3. Click **Save**

> Nếu không có GPU cũng OK, chỉ lâu hơn ~5× (3 phút thay vì 30 giây).

## Bước 3 — Chạy Cell 1 (Install)

Click ▶️ bên trái Cell đầu tiên ("Install Kokoro").

- Lần đầu Colab sẽ hỏi "Run anyway" vì notebook từ source ngoài — click đồng ý
- Cell sẽ:
  - Install `kokoro-onnx` và `soundfile`
  - Download 2 files model (~110MB total với int8 quantized, mất ~30-60s)
  - In ra `✅ Install xong`

## Bước 4 — Chạy Cell 2 (Define phonemes)

Click ▶️. Cell này chỉ khai báo Python dictionary, chạy trong 1 giây.

Output:
```
✅ Defined 64 phonemes
   21 initials + 38 finals + 5 tones
```

## Bước 5 — Chạy Cell 3 (Test 10 samples)

Click ▶️. Cell sẽ:
- Generate 10 file WAV sample
- Hiện 10 player audio inline — Jason click ▶️ từng cái để **nghe thử giọng `zf_xiaoxiao`**

**Jason nghe và đánh giá:**
- ✅ Nếu ưng chất lượng → tiếp Bước 6
- ❌ Nếu không ưng → quay lại Cell 2, đổi `voice="zf_xiaoxiao"` thành:
  - `zf_xiaoyi` — female trẻ hơn, casual
  - `zm_yunxi` — male, bright voice
  - `zm_yunyang` — male, calm
  - Rồi re-run Cell 3 test lại

## Bước 6 — Chạy Cell 4 (Full generate)

Click ▶️. Cell sẽ:
- Generate 64 file MP3 (~1s mỗi file trên GPU T4)
- Tạo `manifest.json` mapping
- In progress từng file

Output:
```
  [ 1/64] zh_init_b                 → zh_init_b.mp3 (8.2 KB)
  [ 2/64] zh_init_p                 → zh_init_p.mp3 (7.9 KB)
  ...
✅ Done. Total: 512.3 KB (64 files)
```

## Bước 7 — Chạy Cell 5 (Download zip)

Click ▶️. Cell sẽ:
- Zip tất cả vào `lingua-audio-zh.zip`
- **Browser tự động download file về máy Jason**

## Bước 8 — Extract vào project

1. Mở zip vừa download
2. Extract toàn bộ vào thư mục `public/audio/zh/` của project
3. Structure sau khi extract:
   ```
   public/audio/zh/
   ├── manifest.json
   ├── initials/  (21 files)
   ├── finals/    (38 files)
   └── tones/     (5 files)
   ```

## Bước 9 — Báo Claude code Phase B

Nhắn Claude: *"Mình đã có audio rồi, code Phase B (runtime integration) đi"* → Claude sẽ build `audioService.ts` + update components.

---

## FAQ & Troubleshooting

**Q: Colab bảo "You cannot currently connect to a GPU"**
A: Free tier giới hạn GPU runtime ~12h/ngày. Đợi vài giờ hoặc chạy CPU (chậm hơn, vẫn chạy được).

**Q: Cell 1 download model quá chậm**
A: GitHub releases đôi khi slow. Retry bằng cách Runtime → Restart → Run Cell 1 lại.

**Q: Samples ở Cell 3 nghe bị robot/tiếng Anh đè**
A: Kokoro v1.0 dùng lang-code `cmn` cho Mandarin. Nếu vẫn lỗi, kiểm tra syllable trong PHONEMES — đôi khi tone marks Unicode bị escape. Mở raw file `phonemes-source.json` để copy chính xác.

**Q: Muốn regenerate với voice khác sau khi đã full batch**
A: Edit voice name trong Cell 4 (code `voice="zf_xiaoxiao"`), re-run Cell 4 + 5. File output sẽ overwrite.

**Q: Muốn thử voice blending (mix 2 voices)**
A: Kokoro hỗ trợ nhưng `kokoro-onnx` CLI đơn giản không có API blend. Phải dùng `kokoro` (PyTorch) — phức tạp hơn, contact Claude nếu cần.

**Q: Session Colab expire, đã generate một nửa — mất hết không?**
A: Files trong `/content/` của Colab sẽ mất khi session end. Download zip ngay khi done. Nếu expire giữa chừng, chạy lại toàn bộ (Kokoro fast, không tốn thời gian lắm).

---

## Sau khi Phase B xong

Jason có thể repeat workflow này cho:
- **150 HSK1 words**: mình sẽ gửi notebook mới với `WORDS` dict thay vì `PHONEMES`
- **500 Oxford English words**: đổi voice thành `af_sarah` (US female) hoặc `af_bella`

Chi phí: vẫn **$0** vì Kokoro free forever.
