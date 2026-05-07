# Admin Calibration Tool — Sprint 4.9 (v1.4.0)

## Mục đích

Drop zones trong Phòng thi Part 1 (drag-name) hiện hardcoded 3×2 grid. AI Flux generate scenes thật → characters không nhất thiết match grid → tên kéo vào không trúng người.

Calibration tool cho admin (Jason) chỉnh chính xác từng zone match với character thật trong AI scene. Override lưu D1, public read endpoint serve cho mọi user.

## Workflow

### 1. Bật admin mode

Mở DevTools console trong New Tab page:
```js
sessionStorage.setItem('admin_token', 'PASTE_ADMIN_TOKEN_HERE');
location.reload();
```

Token là `ADMIN_TOKEN` đã set ở `worker/wrangler.toml` (cùng token dùng `/admin/exam/scenes/*`).

### 2. Vào exam cần calibrate

Phòng thi → STARTERS → click level cần fix → vào Part 1 (drag-name).

Toolbar tím **🛠️ ADMIN CALIBRATION · level1 / lvl1_p1** sẽ hiện trên top.

### 3. Drag-resize zones

- **Kéo giữa zone** → di chuyển toàn bộ zone
- **Kéo 4 góc tròn trắng** → resize từ góc đó
- Mỗi thay đổi → toolbar hiện "● Chưa lưu"
- Tooltip hover zone → coords hiện tại (x, y, width, height as 0-1)

### 4. Save

Click **"Lưu calibration"** → POST `/admin/exam/calibration/level1/lvl1_p1` → D1 batch upsert.

Response: `✓ Đã lưu 6 zones` ở toolbar.

### 5. Verify cho user thường

Tắt admin mode:
```js
sessionStorage.removeItem('admin_token');
location.reload();
```

Vào lại exam — zones giờ ở vị trí calibrated, drag-name hoạt động bình thường.

## Reset về default

Nếu calibration sai và muốn về 3×2 grid hardcoded:
```bash
curl -X DELETE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  https://lingua-newtab-worker.kspstudio.workers.dev/admin/exam/calibration/level1/lvl1_p1
```

Worker DELETE → D1 xóa overrides → frontend fallback về `levels.ts` defaults.

## D1 schema

Migration: `worker/src/db/migrations/10_drop_zone_overrides.sql`

```sql
CREATE TABLE drop_zone_overrides (
  level_id    TEXT,
  part_id     TEXT,
  zone_id     TEXT,
  x, y, width, height  REAL,  -- 0-1 fractions
  updated_at  INTEGER,
  updated_by  TEXT,
  PRIMARY KEY (level_id, part_id, zone_id)
);
```

Apply migration bằng wrangler:
```bash
cd worker
wrangler d1 execute lingua-newtab-metrics --remote \
  --file=src/db/migrations/10_drop_zone_overrides.sql
```

## API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/exam/calibration/:levelId/:partId` | Public | Frontend reads override on mount |
| POST | `/admin/exam/calibration/:levelId/:partId` | Bearer ADMIN_TOKEN | Admin save zones |
| DELETE | `/admin/exam/calibration/:levelId/:partId` | Bearer ADMIN_TOKEN | Reset to default |

POST body:
```json
{
  "zones": [
    { "zone_id": "zone_tl", "x": 0.05, "y": 0.30, "width": 0.20, "height": 0.45 },
    ...
  ]
}
```

## Caching

Frontend: `getCalibration()` has in-memory cache per (levelId, partId). After admin save, cache invalidated automatically.

D1: no caching layer — direct read on each request. ~5-10ms latency from APAC. If becomes bottleneck, add KV cache later.

## Known limitations

1. **Only Part 1 (drag-name) calibratable** — write/tick/colour parts don't use position-based UI so don't need calibration.
2. **Per-level only** — multiple levels sharing same scene don't share calibration. Admin must calibrate each level separately. Future Sprint 4.9.1: scene-level calibration with per-level overrides.
3. **No undo** — accidental drag-then-save → must manually re-calibrate or DELETE to reset to default.
4. **No preview from default** — no "compare current vs default" toggle. Add later if needed.
