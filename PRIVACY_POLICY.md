# Privacy Policy — LinguaNewTab

**Effective Date**: 2 May 2026
**Last Updated**: 2 May 2026
**Contact**: jasonnguyenksp@gmail.com

> 🇻🇳 Tiếng Việt ở phía dưới · Vietnamese version below

---

## Quick Summary

LinguaNewTab is a free Chrome extension for learning Mandarin Chinese and English vocabulary. We collect the **minimum data** needed to provide cloud sync across your devices and AI-generated stories. We do not sell your data, do not use third-party advertising or tracking, and you can delete your account permanently at any time from inside the extension.

---

## 1. What we collect and why

### 1.1 Account information (when you sign in with Google)

When you click "Sign in with Google" we receive from Google:

- **Email address** — to identify your account across devices
- **Display name** — shown in the Account Settings modal
- **Avatar image URL** — shown in the Account Settings modal
- **Google account ID** (the OAuth `sub` claim) — used as the primary key in our database

We use this information solely to provide your account; we do not send marketing emails and do not share it with third parties.

### 1.2 Learning data (synced to our cloud when signed in)

If you sign in and enable cloud sync, the following data is uploaded to our Cloudflare-hosted database (Cloudflare D1, region: APAC):

- **Vocabulary progress** — which words you have learned and the spaced-repetition (FSRS) scheduling state for each word
- **Review log** — timestamps and ratings of each flashcard review (used for the streak counter and statistics)
- **AI-generated stories** — stories you created via the AI generator, including the prompt parameters and the resulting Chinese/English text
- **Settings** — daily goal, target language, and other preferences
- **Custom flashcard image metadata** — file name, size, and timestamp of any images you upload to a flashcard. **The image bytes themselves are stored in your private Google Drive `appDataFolder` (see §3.2), not on our servers**

If you do not sign in, none of the above leaves your browser.

### 1.3 Story generation prompts (transient)

When you click "Generate Story", we send your story parameters (HSK level, genre, description, sentence count) to **Cloudflare Workers AI** (Qwen 3 30B model). The generated story is returned to your browser and saved to your account. We do not retain prompt logs beyond what Cloudflare requires for billing and abuse prevention. The prompt does **not** include your name, email, or any personally identifying information.

### 1.4 Diagnostic information (aggregate only)

Our worker counts aggregate metrics for capacity planning and abuse detection: total requests per day, AI generations per day, and active-user counts. These metrics are **not** linked to individual user accounts in any user-visible report.

---

## 2. What we do NOT collect

- **Browsing history** outside the new-tab page itself
- **IP addresses** — Cloudflare may log them temporarily for routing but we do not query or retain them
- **Third-party tracking** — no Google Analytics, no Facebook Pixel, no advertising SDKs
- **Microphone or camera access**
- **Location data**
- **Contact lists**
- **Any data from other browser tabs** — the extension only runs on the new-tab page

---

## 3. Third-party services we use

### 3.1 Google OAuth (Sign-In)

We use Google's OAuth 2.0 to verify your identity. Google's privacy policy applies to the sign-in flow itself: <https://policies.google.com/privacy>.

**OAuth scopes requested:**

- `https://www.googleapis.com/auth/userinfo.email` — to get your email address
- `https://www.googleapis.com/auth/userinfo.profile` — to get your display name and avatar
- `https://www.googleapis.com/auth/drive.appdata` — to read/write a hidden, app-specific folder in your Google Drive (see §3.2)

We do **not** request access to your Gmail, Calendar, Contacts, or your full Google Drive.

### 3.2 Google Drive (custom flashcard images)

Custom images you upload for flashcards are stored in your Google Drive's **`appDataFolder`** — a hidden folder that:

- Is **only readable and writable by LinguaNewTab**
- Does **not** appear in your normal Drive UI
- Counts against your Google Drive storage quota
- Is automatically deleted when you uninstall the extension and revoke its access in your Google account settings

We never read or write any file outside this hidden folder.

### 3.3 Cloudflare (hosting + database + AI)

Our backend runs entirely on Cloudflare:

- **Cloudflare Workers** — handles all API requests
- **Cloudflare D1** — stores account information and learning data (region: APAC)
- **Cloudflare KV** — rate-limit counters
- **Cloudflare Workers AI** (Qwen 3 30B model) — generates stories from your prompts

Cloudflare's privacy policy: <https://www.cloudflare.com/privacypolicy/>.

### 3.4 Lemon Squeezy (payments, only if you upgrade to Pro)

If you subscribe to LinguaNewTab Pro, payment is processed by **Lemon Squeezy** (Lemon Squeezy LLC, a US-based merchant of record). Lemon Squeezy collects your billing information directly — we never see your card number. We receive only:

- Your subscription status (`active`, `cancelled`, `expired`, etc.)
- Subscription / customer IDs (so we can link a webhook to the right account)
- Renewal / expiry dates

If you do not upgrade, none of your data is ever sent to Lemon Squeezy.

Lemon Squeezy's privacy policy: <https://www.lemonsqueezy.com/privacy>.

### 3.5 Bundled audio files

Native-speaker audio for HSK and Oxford 500 vocabulary is bundled with the extension at install time. No network requests are made when you tap "Listen" — the MP3 plays from your local Chrome storage.

### 3.6 No analytics or advertising

We do **not** use Google Analytics, Mixpanel, Segment, Facebook Pixel, or any other analytics, attribution, or advertising provider.

---

## 4. How long we keep your data

| Data | Retention |
|------|-----------|
| Account record | Until you delete your account, then permanently within 30 days |
| Learning progress, stories, settings | Until you delete your account, then permanently within 30 days |
| Custom flashcard images | Stored in your Google Drive — you control retention; revoking app access wipes them |
| Billing audit log (if Pro) | 7 years (legal/tax requirement) |
| Cloudflare AI request logs | Per Cloudflare's policy, typically <30 days, not linked to your account |

---

## 5. Your rights

You can exercise the following rights at any time directly inside the extension:

### 5.1 View what we have on you

Open Settings → Account & Sync. The "Cloud storage" section shows the count of every type of record we hold for you (words learned, AI stories, custom images, review log entries).

### 5.2 Export your data

Settings → Account & Sync → "Force download (lấy từ cloud)" — pulls a complete snapshot from the cloud to your local browser. From there you can use the developer tools to inspect IndexedDB if you want a raw copy.

### 5.3 Correct or update your data

Re-rate flashcards, edit/delete AI stories, or change your settings — every change syncs to the cloud automatically. To update your name or email, change them in your Google account; the next sync will pull the new values.

### 5.4 Delete your data

Settings → Account & Sync → "Xóa tài khoản & toàn bộ data". This is **permanent**:

- Your account record is deleted from our database (within 30 days, typical < 24 hours)
- All your learning data, AI stories, settings, and custom-image metadata are deleted
- Your custom-image bytes in Google Drive's appDataFolder remain — to also delete those, revoke app access at <https://myaccount.google.com/permissions>
- If you have a Pro subscription, it is **not** automatically cancelled — cancel via Lemon Squeezy email link or by emailing us first

### 5.5 Sign out without deleting

Settings → Account & Sync → "Đăng xuất". Stops syncing and signs you out of Google but leaves your data on the server so you can sign back in later. You can optionally also clear your local browser cache during sign-out.

### 5.6 Withdraw consent

Sign out as above. After sign-out, no data leaves your browser regardless of what you do in the extension.

### 5.7 EU/UK GDPR rights

If you are in the EU or UK, you additionally have the right to:

- File a complaint with your data protection authority
- Request a portable copy of your data in a structured machine-readable format (we will respond within 30 days at jasonnguyenksp@gmail.com)
- Object to processing (sign out — there is no other legal basis we rely on once you have signed out)

We process your data on the legal bases of (a) **contract** — providing the cloud-sync feature you requested by signing in; and (b) **legitimate interest** — basic abuse prevention.

---

## 6. Data security

- All API requests use HTTPS
- Account data is stored in Cloudflare D1, encrypted at rest by Cloudflare
- We do not store your Google OAuth refresh token; we hold only short-lived access tokens during request processing
- We never see your payment card information; Lemon Squeezy handles all card data
- Webhooks from Lemon Squeezy are verified using HMAC-SHA256 to prevent forgery

If we ever discover a data breach affecting your personal information, we will notify you within 72 hours via the email associated with your Google account.

---

## 7. Children

LinguaNewTab is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has signed in to LinguaNewTab, contact us at jasonnguyenksp@gmail.com and we will delete the account.

For users in the EU/UK, the minimum age for using LinguaNewTab is 16.

---

## 8. International users

LinguaNewTab is operated from Vietnam by an individual developer. By signing in you understand and agree that your data will be transferred to and processed on Cloudflare infrastructure in the Asia-Pacific region. We do not transfer your data to any country whose data-protection regime is materially weaker than the EU's or Vietnam's.

---

## 9. Changes to this policy

We will update this policy when we add features that change how we handle your data. When we make a material change we will:

- Update the "Last Updated" date at the top
- Show a one-time notice inside the extension on the next new-tab open
- Email all signed-in users when the change reduces your privacy (e.g. adds a new third-party recipient)

The full version history is maintained on our public GitHub repository.

---

## 10. Contact

Questions, complaints, or data requests:

- Email: **jasonnguyenksp@gmail.com**
- GitHub issues: see the extension's README

We aim to respond within 7 days for general questions and within 30 days for formal data requests.

---
---

# 🇻🇳 Chính sách Bảo mật — LinguaNewTab (Tiếng Việt)

**Ngày hiệu lực**: 2 tháng 5, 2026
**Cập nhật lần cuối**: 2 tháng 5, 2026
**Liên hệ**: jasonnguyenksp@gmail.com

## Tóm tắt nhanh

LinguaNewTab là tiện ích Chrome miễn phí để học từ vựng tiếng Trung và tiếng Anh. Chúng tôi chỉ thu thập **dữ liệu tối thiểu** cần thiết để đồng bộ tiến độ học giữa các thiết bị và sinh truyện AI. Chúng tôi không bán dữ liệu, không dùng quảng cáo hay tracking từ bên thứ ba, và bạn có thể xóa tài khoản vĩnh viễn bất cứ lúc nào ngay trong tiện ích.

## 1. Chúng tôi thu thập gì và để làm gì

### 1.1 Thông tin tài khoản (khi đăng nhập Google)

Khi bạn click "Đăng nhập Google", Google gửi cho chúng tôi:

- **Địa chỉ email** — để xác định tài khoản giữa các thiết bị
- **Tên hiển thị** — hiển thị trong Cài đặt tài khoản
- **URL ảnh đại diện** — hiển thị trong Cài đặt tài khoản
- **ID Google account** (claim `sub` của OAuth) — dùng làm primary key trong database

Chúng tôi chỉ dùng những thông tin này để cung cấp tài khoản; **không** gửi email marketing và **không** chia sẻ với bên thứ ba.

### 1.2 Dữ liệu học tập (đồng bộ lên cloud khi đăng nhập)

Nếu bạn đăng nhập và bật đồng bộ cloud, các dữ liệu sau sẽ được upload lên database Cloudflare D1 (khu vực APAC):

- **Tiến độ từ vựng** — từ nào đã học, trạng thái spaced-repetition (FSRS) cho mỗi từ
- **Lịch sử ôn tập** — timestamp và rating của mỗi lượt review
- **Truyện AI tự tạo** — truyện bạn đã sinh, kèm prompt và nội dung tiếng Trung/Anh
- **Cài đặt** — mục tiêu hằng ngày, ngôn ngữ, sở thích khác
- **Metadata ảnh flashcard custom** — tên file, kích thước, timestamp. **Bản thân file ảnh được lưu trong thư mục `appDataFolder` riêng tư của Google Drive (xem §3.2), không trên máy chủ chúng tôi**

Nếu không đăng nhập, không có dữ liệu nào rời khỏi trình duyệt.

### 1.3 Prompt sinh truyện (tạm thời)

Khi bạn click "Tạo truyện AI", chúng tôi gửi tham số (HSK level, thể loại, mô tả, số câu) đến **Cloudflare Workers AI** (model Qwen 3 30B). Truyện được sinh ra trả về trình duyệt và lưu vào tài khoản. Chúng tôi không lưu lại prompt log ngoài những gì Cloudflare yêu cầu cho billing và chống abuse. Prompt **không** chứa tên, email hoặc bất kỳ thông tin nhận dạng cá nhân nào.

### 1.4 Thông tin chẩn đoán (chỉ ở dạng tổng hợp)

Worker đếm số lượng tổng hợp để lập kế hoạch dung lượng và phát hiện abuse: tổng request/ngày, số truyện AI/ngày, số user hoạt động. Các metrics này **không** liên kết với tài khoản cụ thể trong bất kỳ báo cáo nào người dùng có thể xem.

## 2. Chúng tôi KHÔNG thu thập

- **Lịch sử duyệt web** ngoài trang new-tab
- **Địa chỉ IP** — Cloudflare có thể log tạm cho routing nhưng chúng tôi không query hoặc lưu trữ
- **Tracking từ bên thứ ba** — không Google Analytics, không Facebook Pixel, không SDK quảng cáo
- **Microphone hoặc camera**
- **Vị trí địa lý**
- **Danh bạ liên hệ**
- **Dữ liệu từ các tab trình duyệt khác** — extension chỉ chạy trên trang new-tab

## 3. Dịch vụ bên thứ ba

### 3.1 Google OAuth (Đăng nhập)

Dùng Google OAuth 2.0 để xác minh danh tính. Chính sách bảo mật của Google áp dụng cho luồng đăng nhập: <https://policies.google.com/privacy>.

**Các OAuth scope yêu cầu:**

- `userinfo.email` — lấy email
- `userinfo.profile` — lấy tên hiển thị + ảnh đại diện
- `drive.appdata` — đọc/ghi thư mục ẩn riêng cho app trong Google Drive của bạn

Chúng tôi **không** yêu cầu Gmail, Calendar, Contacts, hoặc toàn bộ Google Drive.

### 3.2 Google Drive (ảnh flashcard custom)

Ảnh custom bạn upload cho flashcard được lưu trong **`appDataFolder`** của Google Drive — thư mục ẩn:

- **Chỉ LinguaNewTab** đọc/ghi được
- **Không** xuất hiện trong Drive UI bình thường
- Tính vào dung lượng Drive của bạn
- Tự động bị xóa khi bạn gỡ extension và thu hồi quyền truy cập trong cài đặt Google account

Chúng tôi không bao giờ đọc/ghi file nào nằm ngoài thư mục ẩn này.

### 3.3 Cloudflare (hosting + database + AI)

Backend chạy hoàn toàn trên Cloudflare:

- **Cloudflare Workers** — xử lý mọi API request
- **Cloudflare D1** — lưu thông tin tài khoản và dữ liệu học (khu vực APAC)
- **Cloudflare KV** — counter giới hạn rate limit
- **Cloudflare Workers AI** (Qwen 3 30B) — sinh truyện từ prompt

Privacy policy của Cloudflare: <https://www.cloudflare.com/privacypolicy/>.

### 3.4 Lemon Squeezy (thanh toán, chỉ khi nâng cấp Pro)

Nếu bạn đăng ký LinguaNewTab Pro, thanh toán được xử lý bởi **Lemon Squeezy** (LLC tại Mỹ, merchant of record). Lemon Squeezy thu thập thông tin thanh toán trực tiếp — chúng tôi **không bao giờ** thấy số thẻ. Chúng tôi chỉ nhận:

- Trạng thái subscription (`active`, `cancelled`, `expired`, ...)
- ID subscription / customer (để link webhook về tài khoản đúng)
- Ngày gia hạn / hết hạn

Nếu không nâng cấp, không có dữ liệu nào của bạn được gửi đến Lemon Squeezy.

Privacy policy của Lemon Squeezy: <https://www.lemonsqueezy.com/privacy>.

### 3.5 File audio bundled

Audio bản ngữ cho HSK và Oxford 500 được bundled với extension lúc cài đặt. Không có request mạng nào khi bạn tap "Nghe" — MP3 phát từ Chrome storage local.

### 3.6 Không analytics, không quảng cáo

Chúng tôi **không** dùng Google Analytics, Mixpanel, Segment, Facebook Pixel, hoặc bất kỳ provider analytics / attribution / quảng cáo nào.

## 4. Thời gian lưu trữ dữ liệu

| Dữ liệu | Thời gian lưu |
|---------|---------------|
| Hồ sơ tài khoản | Đến khi bạn xóa, sau đó vĩnh viễn xóa trong 30 ngày |
| Tiến độ học, truyện, cài đặt | Đến khi xóa tài khoản, vĩnh viễn xóa trong 30 ngày |
| Ảnh flashcard custom | Trong Google Drive của bạn — bạn kiểm soát; thu hồi quyền app sẽ xóa |
| Audit log thanh toán (nếu Pro) | 7 năm (yêu cầu pháp lý / thuế) |
| Log request AI của Cloudflare | Theo policy của Cloudflare, thường <30 ngày, không link với tài khoản |

## 5. Quyền của bạn

Bạn có thể thực hiện các quyền sau bất cứ lúc nào ngay trong extension:

### 5.1 Xem dữ liệu chúng tôi giữ về bạn

Settings → Tài khoản & Đồng bộ. Section "Dữ liệu trên cloud" hiển thị số lượng của mọi loại record (từ đã học, truyện AI, ảnh custom, review log).

### 5.2 Xuất dữ liệu

Settings → Tài khoản & Đồng bộ → "Force download (lấy từ cloud)" — kéo snapshot đầy đủ từ cloud về máy. Sau đó dùng developer tools để inspect IndexedDB nếu muốn raw copy.

### 5.3 Sửa hoặc cập nhật

Tự re-rate flashcard, edit/xóa truyện AI, hoặc đổi cài đặt — mọi thay đổi sync lên cloud tự động. Để cập nhật tên/email, đổi trong Google account; sync tới sẽ tự kéo về.

### 5.4 Xóa dữ liệu

Settings → Tài khoản & Đồng bộ → "Xóa tài khoản & toàn bộ data". **Vĩnh viễn:**

- Hồ sơ tài khoản bị xóa trong DB (trong 30 ngày, thường <24h)
- Mọi dữ liệu học, truyện AI, cài đặt, metadata ảnh — xóa
- Bytes ảnh trong appDataFolder vẫn còn — để xóa, thu hồi quyền app tại <https://myaccount.google.com/permissions>
- Nếu có Pro, **không** tự cancel — cancel qua link email Lemon Squeezy hoặc email cho chúng tôi trước

### 5.5 Đăng xuất không xóa

Settings → Tài khoản & Đồng bộ → "Đăng xuất". Dừng sync, đăng xuất Google, dữ liệu vẫn còn trên server để đăng nhập lại sau. Có thể chọn xóa cache local kèm theo.

### 5.6 Rút lại đồng ý

Đăng xuất như trên. Sau khi đăng xuất, không có dữ liệu nào rời khỏi trình duyệt.

### 5.7 Quyền GDPR cho EU/UK

Người dùng EU/UK còn có quyền:

- Khiếu nại với cơ quan bảo vệ dữ liệu của quốc gia
- Yêu cầu bản sao dữ liệu ở định dạng máy đọc được (chúng tôi phản hồi trong 30 ngày qua jasonnguyenksp@gmail.com)
- Phản đối xử lý (đăng xuất — không có cơ sở pháp lý nào khác sau khi đăng xuất)

Chúng tôi xử lý dữ liệu trên cơ sở pháp lý: (a) **hợp đồng** — cung cấp tính năng cloud sync khi bạn đăng nhập; (b) **lợi ích chính đáng** — chống abuse cơ bản.

## 6. Bảo mật dữ liệu

- Mọi API request dùng HTTPS
- Dữ liệu tài khoản lưu trong Cloudflare D1, mã hóa khi nghỉ
- Không lưu refresh token Google OAuth; chỉ giữ access token ngắn hạn trong lúc xử lý request
- Không bao giờ thấy thông tin thẻ thanh toán; Lemon Squeezy xử lý mọi data thẻ
- Webhook từ Lemon Squeezy được verify HMAC-SHA256 chống giả mạo

Nếu phát hiện vi phạm dữ liệu ảnh hưởng thông tin cá nhân của bạn, sẽ thông báo trong 72h qua email Google.

## 7. Trẻ em

LinguaNewTab không hướng đến trẻ dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ dưới 13. Nếu là phụ huynh và tin con mình đã đăng nhập, liên hệ jasonnguyenksp@gmail.com để xóa tài khoản.

Người dùng EU/UK: tuổi tối thiểu là 16.

## 8. Người dùng quốc tế

LinguaNewTab được vận hành từ Việt Nam bởi cá nhân lập trình viên. Khi đăng nhập bạn hiểu và đồng ý dữ liệu sẽ được chuyển và xử lý trên hạ tầng Cloudflare khu vực Châu Á - Thái Bình Dương. Chúng tôi không chuyển dữ liệu đến bất kỳ quốc gia nào có chế độ bảo vệ dữ liệu yếu hơn EU hoặc Việt Nam.

## 9. Thay đổi chính sách

Cập nhật policy khi thêm tính năng thay đổi cách xử lý dữ liệu. Khi có thay đổi quan trọng:

- Cập nhật ngày "Last Updated" ở đầu trang
- Hiển thị thông báo 1 lần trong extension lần mở new-tab tiếp theo
- Email mọi user đã đăng nhập khi thay đổi giảm quyền riêng tư (ví dụ thêm bên thứ ba mới)

Lịch sử phiên bản đầy đủ trên GitHub repo công khai.

## 10. Liên hệ

Câu hỏi, khiếu nại, hoặc yêu cầu dữ liệu:

- Email: **jasonnguyenksp@gmail.com**
- GitHub issues: xem README của extension

Chúng tôi cố gắng phản hồi trong 7 ngày cho câu hỏi chung, 30 ngày cho yêu cầu dữ liệu chính thức.
