# Cloudflare R2 Setup — LinguaNewTab v0.16.0

R2 setup for the custom-flashcard-image storage migration introduced in
v0.16.0. Total time: ~5 minutes.

> **What changes:** New flashcard images are stored in Cloudflare R2 under
> the same Cloudflare account as the rest of the backend instead of in
> Google Drive. Existing Drive-uploaded images continue to read via a
> read-only fallback path (no migration needed).

---

## 1. Create the R2 bucket

```bash
cd worker
wrangler r2 bucket create lingua-newtab-images
```

You should see:

```
✅ Created bucket lingua-newtab-images
```

The bucket name in `wrangler.toml` is hardcoded as `lingua-newtab-images`;
if you need a different name (e.g. existing bucket conflict), edit both
`wrangler.toml` and the line `bucket_name = "lingua-newtab-images"`.

> Buckets are free up to 10 GB storage / 1M Class A ops / 10M Class B ops
> per month. LinguTab usage is tiny — well under free tier for the
> foreseeable future.

---

## 2. Verify the binding

```bash
wrangler r2 bucket list
```

Should include `lingua-newtab-images`.

---

## 3. Deploy the worker

```bash
cd worker
npm run deploy
```

The deploy reads `wrangler.toml` and wires the `IMAGES` binding to your
bucket automatically. Verify by hitting the worker:

```bash
curl -X PUT \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: image/png" \
  --data-binary @/path/to/test.png \
  https://lingua-newtab-worker.kspstudio.workers.dev/sync/images/zh/zh_001
```

Expected response:

```json
{
  "ok": true,
  "r2_key": "<userId>/zh/zh_001",
  "size_bytes": 12345,
  "mime_type": "image/png",
  "used_bytes": 12345,
  "quota_bytes": 52428800
}
```

If you see `R2 not configured`, the binding didn't take — check
`wrangler.toml` and re-deploy.

---

## 4. Per-tier storage quotas

Defined in `worker/src/sync/images.ts`:

| Tier     | Quota |
|----------|-------|
| Free     | 50 MB |
| Pro      | 500 MB |
| Lifetime | 500 MB |
| Banned   | 0 |

Each individual file is capped at 5 MB (matches the client-side
`validateImageFile` check). Both checks happen on the server — clients
that try to bypass the JS validation get rejected at the worker.

To change quotas, edit `STORAGE_QUOTA_BY_TIER` in
`worker/src/sync/images.ts` and redeploy. Existing images are not
affected by quota reductions — they remain accessible; only new uploads
fail when the user is over the new cap.

---

## 5. Account-deletion cleanup

When a user clicks "Xóa tài khoản & toàn bộ data" in Account Settings,
the `/sync/clear` endpoint:

1. `DELETE FROM users WHERE id = ?` — cascades to all per-user D1 tables
2. `deleteAllUserImages(env, userId)` — paginated R2 prefix delete
   (`{userId}/...`)

Both run in parallel. R2 cleanup errors are logged but don't fail the
account-deletion response — the few KB of orphan storage is acceptable
vs. blocking the user's primary action.

If for some reason orphan R2 keys accumulate, you can manually clean:

```bash
wrangler r2 object list lingua-newtab-images --prefix=<userId>/
wrangler r2 object delete lingua-newtab-images <key1> <key2> ...
```

---

## 6. Backward compatibility (Drive fallback)

Records uploaded under v0.x–v0.15 carry a `driveFileId` instead of an
`r2Key`. The frontend resolution order is:

1. Local cached blob (Dexie) — fastest, no network
2. R2 download via `/sync/images/...` — current backend
3. Drive download via `driveService` — legacy fallback

Dexie cache hit rate is high in practice, so most legacy records keep
working forever without ever hitting Drive again.

To force-migrate everyone off Drive (and eventually drop the
`drive.appdata` scope):

- A future version can ship a one-time UI that walks every legacy
  `driveFileId` record, downloads from Drive, uploads to R2, then drops
  the scope from `manifest.json`.
- For now, the scope stays on the manifest so legacy users don't lose
  access.

---

## 7. Monitoring R2 usage

R2 usage is visible in the Cloudflare dashboard:

```
Cloudflare Dashboard → R2 → lingua-newtab-images → Overview
```

Shows storage size, Class A/B ops, and egress. The `/sync/status`
endpoint also returns per-user usage:

```json
{
  "user": { "tier": "free", "tier_expires_at": null },
  "counts": {
    "custom_images": 12,
    "custom_images_bytes": 4521687
  }
}
```

These come from `SUM(size_bytes)` over `custom_images` so they always
match what's actually in R2 (D1 metadata is the source of truth for the
upload/delete bookkeeping).
