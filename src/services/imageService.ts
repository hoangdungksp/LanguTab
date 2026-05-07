/**
 * High-level image management for flashcards.
 *
 * Backend evolution (v0.16):
 *   - **New uploads** go to Cloudflare R2 via `r2ImageService`.
 *   - **Legacy reads** (records uploaded under v0.x–v0.15 to Google Drive
 *     `appDataFolder`) still resolve via `driveService` if the cached blob
 *     is missing locally. We never write to Drive anymore.
 *
 * Why dual-backend instead of a hard cutover:
 *   Existing Drive-stored images would be lost on upgrade. The cached blob
 *   in Dexie is usually still there (we cache aggressively), but if the
 *   user has cleared Chrome storage or switched devices, the only copy
 *   would be in their Drive appDataFolder. Keeping Drive as a fallback
 *   read path lets those users see their images for as long as they have
 *   the Drive scope on file. A future version can drop Drive entirely.
 *
 * Strategy:
 *   - On upload: save blob locally first (instant UI feedback), then upload
 *     to R2 in background.
 *   - On load: try Dexie cached blob → R2 download → Drive fallback (legacy)
 *   - On delete: mark locally + call R2 (or Drive for legacy records).
 *
 * Offline queue: images with syncStatus='pending_upload' or 'pending_delete'
 * are retried by syncPendingImages() — called on startup + on auth state
 * change.
 */

import type { Language, WordCustomImage } from '../types';
import {
  getCustomImage,
  putCustomImage,
  removeCustomImage,
  listPendingSyncImages,
} from './db';
import * as r2 from './r2ImageService';
import * as drive from './driveService';
import { isSignedIn } from './authService';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — matches server-side cap

/** Accepted MIME types. */
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Validate a File before accepting it for upload.
 * Throws ImageValidationError with Vietnamese message for UI display.
 */
export function validateImageFile(file: File): void {
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new ImageValidationError(
      `File phải là JPEG, PNG, WebP hoặc GIF. (Bạn chọn: ${file.type || 'không xác định'})`
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new ImageValidationError(`File quá lớn (${mb}MB). Tối đa 5MB.`);
  }
}

/**
 * Attach an image to a flashcard word.
 *
 * Flow:
 *   1. Validate file
 *   2. Save blob to Dexie with syncStatus='pending_upload' (UI shows image immediately)
 *   3. If signed in, upload to R2 and update syncStatus='synced' with r2Key
 *   4. If offline/not signed in, leave as pending — syncPendingImages() handles later
 */
export async function attachImage(
  wordId: string,
  lang: Language,
  file: File
): Promise<WordCustomImage> {
  validateImageFile(file);

  // 1. Remove any existing image for this word from cloud (best-effort)
  const existing = await getCustomImage(wordId);
  if (existing) {
    if (existing.r2Key) {
      // Best-effort delete; don't block upload
      r2.deleteImage(wordId, lang).catch((err) => {
        console.warn('[image] failed to delete old R2 object:', err);
      });
    } else if (existing.driveFileId) {
      // Legacy Drive record — clean up so we don't keep paying for it
      drive.deleteImage(existing.driveFileId).catch((err) => {
        console.warn('[image] failed to delete old drive file:', err);
      });
    }
  }

  // 2. Save local immediately
  const record: WordCustomImage = {
    wordId,
    lang,
    cachedBlob: file, // File is a Blob subclass
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date(),
    syncStatus: 'pending_upload',
  };
  await putCustomImage(record);

  // 3. Upload to R2 if signed in (fire and forget — caller can await if needed)
  if (await isSignedIn()) {
    try {
      const result = await r2.uploadImage(wordId, lang, file);
      record.r2Key = result.r2_key;
      record.syncStatus = 'synced';
      // Drop legacy driveFileId — no point keeping it once R2 has the bytes
      delete record.driveFileId;
      await putCustomImage(record);
    } catch (err) {
      console.warn('[image] R2 upload failed, queued for retry:', err);
      // Keep as pending_upload — syncPendingImages will retry
    }
  }

  return record;
}

/**
 * Get image blob for a word. Returns null if no image attached.
 * Resolution order:
 *   1. Dexie cached blob (fastest, no network)
 *   2. R2 (current backend)
 *   3. Drive appDataFolder (legacy, read-only fallback for pre-v0.16 records)
 */
export async function getImageBlob(wordId: string): Promise<Blob | null> {
  const record = await getCustomImage(wordId);
  if (!record) return null;

  // Don't serve images that are pending deletion
  if (record.syncStatus === 'pending_delete') return null;

  if (record.cachedBlob) return record.cachedBlob;

  // Cache miss — try cloud sources in order. Both require sign-in.
  if (!(await isSignedIn())) return null;

  // Prefer R2 (current backend)
  if (record.r2Key) {
    try {
      const blob = await r2.downloadImage(record.wordId, record.lang);
      if (blob) {
        record.cachedBlob = blob;
        await putCustomImage(record);
        return blob;
      }
    } catch (err) {
      console.warn('[image] R2 download failed:', err);
      // Don't return — fall through to Drive fallback
    }
  }

  // Legacy fallback — Drive (only if record was uploaded pre-v0.16)
  if (record.driveFileId) {
    try {
      const blob = await drive.downloadImage(record.driveFileId);
      record.cachedBlob = blob;
      await putCustomImage(record);
      return blob;
    } catch (err) {
      console.warn('[image] Drive fallback download failed:', err);
    }
  }

  return null;
}

/**
 * Remove the image attached to a word (local + cloud).
 * If offline, marks as pending_delete and drops from cloud on next sync.
 */
export async function detachImage(wordId: string): Promise<void> {
  const record = await getCustomImage(wordId);
  if (!record) return;

  if (await isSignedIn()) {
    let cloudDeleted = false;
    if (record.r2Key) {
      try {
        await r2.deleteImage(record.wordId, record.lang);
        cloudDeleted = true;
      } catch (err) {
        console.warn('[image] R2 delete failed, marking pending:', err);
      }
    } else if (record.driveFileId) {
      try {
        await drive.deleteImage(record.driveFileId);
        cloudDeleted = true;
      } catch (err) {
        console.warn('[image] Drive delete failed, marking pending:', err);
      }
    } else {
      // No cloud copy ever existed (was pending_upload only) — local
      // delete is sufficient.
      cloudDeleted = true;
    }

    if (cloudDeleted) {
      await removeCustomImage(wordId);
      return;
    }
  }

  // Offline or delete failed — mark for retry
  await putCustomImage({
    ...record,
    syncStatus: 'pending_delete',
    cachedBlob: undefined, // drop cache
  });
}

/**
 * Process queued upload/delete operations.
 * Call on app startup (after auth check) and on auth state change.
 */
export async function syncPendingImages(): Promise<{
  uploaded: number;
  deleted: number;
  failed: number;
}> {
  if (!(await isSignedIn())) {
    return { uploaded: 0, deleted: 0, failed: 0 };
  }

  const pending = await listPendingSyncImages();
  let uploaded = 0;
  let deleted = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      if (record.syncStatus === 'pending_upload' && record.cachedBlob) {
        const result = await r2.uploadImage(
          record.wordId,
          record.lang,
          record.cachedBlob,
        );
        await putCustomImage({
          ...record,
          r2Key: result.r2_key,
          driveFileId: undefined,
          syncStatus: 'synced',
        });
        uploaded++;
      } else if (record.syncStatus === 'pending_delete') {
        if (record.r2Key) {
          await r2.deleteImage(record.wordId, record.lang);
        } else if (record.driveFileId) {
          await drive.deleteImage(record.driveFileId);
        }
        await removeCustomImage(record.wordId);
        deleted++;
      }
    } catch (err) {
      console.warn(`[image] sync failed for ${record.wordId}:`, err);
      failed++;
    }
  }

  if (uploaded + deleted > 0) {
    console.info(`[image] Synced: ${uploaded} uploaded, ${deleted} deleted`);
  }
  return { uploaded, deleted, failed };
}
