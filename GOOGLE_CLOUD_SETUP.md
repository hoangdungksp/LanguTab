# Google Cloud Console — OAuth setup cho LinguaNewTab

Hướng dẫn này giúp Jason lấy **OAuth Client ID** để paste vào `manifest.json`. Tổng thời gian: ~10 phút. Làm 1 lần là xong, client ID dùng mãi mãi.

## Bước 0 — Load extension một lần để lấy Extension ID

Trước khi setup GCP, mình cần Extension ID để đăng ký OAuth.

1. Mở Chrome → `chrome://extensions/`
2. Bật **Developer mode** (góc phải trên)
3. Click **Load unpacked** → chọn thư mục `dist/` sau khi đã build
4. Copy **Extension ID** hiển thị dưới tên extension (chuỗi 32 ký tự chữ thường, ví dụ: `abcdefghijklmnopqrstuvwxyzabcdef`)

> ⚠️ **Extension ID sẽ thay đổi mỗi lần bạn load lại từ thư mục khác.** Để cố định, có 2 cách:
> - **Cách dễ**: giữ nguyên thư mục `dist/`, mỗi lần build đè lên chứ đừng xoá rồi load lại từ chỗ khác.
> - **Cách pro**: thêm trường `key` vào `manifest.json` (sẽ hướng dẫn ở Bước 4 nếu cần).

## Bước 1 — Tạo Google Cloud project

1. Vào https://console.cloud.google.com/
2. Click dropdown project ở top bar → **New Project**
3. Tên: `LinguaNewTab` (hoặc tên nào Jason thích)
4. Click **Create**, đợi 10-20s, chọn project vừa tạo

## Bước 2 — Enable Google Drive API

1. Sidebar → **APIs & Services** → **Library**
2. Search `Google Drive API` → click vào kết quả đầu tiên
3. Click **Enable** → đợi 5s

## Bước 3 — Cấu hình OAuth consent screen

1. Sidebar → **APIs & Services** → **OAuth consent screen**
2. Chọn **User Type: External** → **Create**
3. Điền:
   - **App name**: `LinguaNewTab`
   - **User support email**: email của Jason
   - **Developer contact**: email của Jason
4. Click **Save and Continue**
5. Trang **Scopes**: click **Add or Remove Scopes** → search `drive.appdata` → check ô `https://www.googleapis.com/auth/drive.appdata` → **Update** → **Save and Continue**
6. Trang **Test users**: click **Add Users** → nhập email Google cá nhân của Jason → **Save and Continue**

> 💡 Trong Testing mode, chỉ có emails trong danh sách Test users mới dùng được extension. Khi nào muốn mở public thì publish app ra Production (không bắt buộc cho dev mode).

## Bước 4 — Tạo OAuth Client ID

1. Sidebar → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. **Application type**: `Chrome extension`
4. **Name**: `LinguaNewTab Extension`
5. **Item ID**: paste Extension ID đã copy ở Bước 0
6. Click **Create**
7. Một dialog sẽ hiện Client ID dạng `123456789-abcdef.apps.googleusercontent.com` → **copy đoạn này**

## Bước 5 — Paste Client ID vào manifest.json

Mở file `manifest.json` trong thư mục project và thay:

```json
"client_id": "REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com",
```

thành Client ID đã copy:

```json
"client_id": "123456789-abcdef.apps.googleusercontent.com",
```

## Bước 6 — Rebuild + reload extension

```bash
cd /path/to/lingua-newtab
npm run build
```

Sau đó vào `chrome://extensions/` → click nút reload ⟳ trên extension. Extension ID **phải giữ nguyên** — nếu đổi thì quay lại Bước 4 update lại.

## Bước 7 — Test

Mở tab mới. Sau khi Phase 2 UI xong (session sau), sẽ có nút "Đăng nhập Google" — click sẽ hiện popup consent quen thuộc của Google. Chọn account test, click Allow. Xong.

---

## Troubleshooting

**"bad client id: xxx"** khi gọi `getAuthToken`:
- Extension ID hiện tại không khớp với Item ID đã đăng ký. Vào `chrome://extensions` check lại, update trong GCP Credentials.

**"Access blocked: This app's request is invalid"**:
- Scope `drive.appdata` chưa được add vào OAuth consent screen. Quay lại Bước 3.5.

**"This app isn't verified"** khi consent:
- Bình thường trong dev mode. Click **Advanced** → **Go to LinguaNewTab (unsafe)**. Hoặc: vào Bước 3 add email Jason vào Test users.

**Extension ID thay đổi sau mỗi lần load**:
- Giải pháp pro: publish extension ra Chrome Web Store (miễn phí sau khi trả $5 registration) → ID sẽ cố định vĩnh viễn.
- Giải pháp quick: thêm field `key` (public key của extension) vào `manifest.json`. Tạo bằng cách package extension một lần (`chrome://extensions` → Pack extension) rồi lấy key từ `.pem` file, convert sang base64. Hỏi mình nếu cần hướng dẫn chi tiết.
