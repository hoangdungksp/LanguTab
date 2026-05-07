# 🛠️ Cách unzip code không bị mất client_id

Mỗi lần Jason unzip version mới, có 2 file LOCAL config Jason đã setup mà KHÔNG được override:

1. **`manifest.json`** — chứa `client_id` của OAuth (Google Cloud Console)
2. **`worker/wrangler.toml`** — chứa KV namespace `id`

## ✅ Workflow đúng

```bash
cd ~/Downloads/lingua-newtab

# 1. Backup 2 file local config
cp manifest.json /tmp/lingu-manifest.bak
cp worker/wrangler.toml /tmp/lingu-wrangler.bak

# 2. Unzip đè
unzip -o ~/Downloads/lingua-newtab-source-vX_Y_Z.zip

# 3. Restore config
cp /tmp/lingu-manifest.bak manifest.json
cp /tmp/lingu-wrangler.bak worker/wrangler.toml

# 4. Build + reload
npm install && npm run build
```

## 🆘 Nếu lỡ override mất

### Mất `client_id` (manifest.json)
1. Mở Chrome → chrome://extensions/ → LinguTab → Details → copy Extension ID
2. Vào Google Cloud Console → Credentials → tìm OAuth client cũ
3. Copy Client ID → paste vào manifest.json:
   ```json
   "client_id": "<client_id-thật>.apps.googleusercontent.com"
   ```

### Mất KV id (wrangler.toml)
```bash
cd worker
npx wrangler kv:namespace list
# Tìm namespace tên "RATE_LIMITER" → copy id
```
Paste vào wrangler.toml:
```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "<id-thật>"
```
