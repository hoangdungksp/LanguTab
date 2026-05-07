/**
 * Google Drive v3 client for flashcard image storage.
 *
 * Scope: `drive.appdata` — we can ONLY read/write files inside the hidden
 * `appDataFolder` created for this extension. We have zero access to the
 * user's other Drive content, and vice versa.
 *
 * Every file we upload carries `appProperties: { wordId }` so we can
 * look it up later by Word ID even without Dexie (enables cross-device sync).
 *
 * All requests auto-retry once on 401 via authService.refreshToken().
 */

import { getAuthToken, refreshToken } from './authService';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const APP_DATA_FOLDER = 'appDataFolder';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // bytes returned as string by API
  createdTime?: string;
  modifiedTime?: string;
  appProperties?: Record<string, string>;
}

export interface QuotaInfo {
  usedBytes: number;
  /** Total quota in bytes, or 0 for unlimited (rare, some Workspace accounts) */
  limitBytes: number;
}

/** Fetch with Authorization header + one automatic 401 retry via token refresh. */
async function authedFetch(
  url: string,
  init: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const token = await getAuthToken(false);
  if (!token) {
    throw new Error('Not signed in — call getAuthToken(true) first to prompt.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 && !isRetry) {
    // Token likely expired. Refresh once, then retry the original request.
    const fresh = await refreshToken();
    if (!fresh) throw new Error('Token refresh failed');
    return authedFetch(url, init, true);
  }

  return res;
}

/**
 * Upload an image blob to Drive appDataFolder.
 *
 * @param blob     image binary (JPEG/PNG/WebP...)
 * @param fileName display name shown in Drive (not visible to user since hidden folder,
 *                 but useful for debugging via Drive API)
 * @param wordId   stored as appProperties.wordId — enables cross-device lookup
 * @returns Drive file ID
 */
export async function uploadImage(
  blob: Blob,
  fileName: string,
  wordId: string
): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    parents: [APP_DATA_FOLDER],
    appProperties: { wordId },
  };

  // Build multipart/related body manually.
  // Drive's multipart upload requires two parts: JSON metadata + binary media.
  const boundary = 'lingua_newtab_' + Math.random().toString(36).slice(2);
  const crlf = '\r\n';

  const metadataPart =
    `--${boundary}${crlf}` +
    `Content-Type: application/json; charset=UTF-8${crlf}${crlf}` +
    JSON.stringify(metadata) +
    crlf;

  const mediaPartHeader =
    `--${boundary}${crlf}` +
    `Content-Type: ${blob.type || 'application/octet-stream'}${crlf}${crlf}`;

  const closeDelim = `${crlf}--${boundary}--`;

  // Concatenate text + binary into a single Blob. Order matters.
  const body = new Blob(
    [metadataPart, mediaPartHeader, blob, closeDelim],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await authedFetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,size,appProperties`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${err}`);
  }

  return (await res.json()) as DriveFile;
}

/** Download image binary by file ID. */
export async function downloadImage(fileId: string): Promise<Blob> {
  const res = await authedFetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
  if (!res.ok) {
    throw new Error(`Drive download failed (${res.status})`);
  }
  return res.blob();
}

/** Delete a file. 404 is treated as success (already gone). */
export async function deleteImage(fileId: string): Promise<void> {
  const res = await authedFetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Drive delete failed (${res.status})`);
  }
}

/** List all files in appDataFolder (our extension's private images). */
export async function listImages(): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    spaces: APP_DATA_FOLDER,
    fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,appProperties)',
    pageSize: '1000',
  });
  const res = await authedFetch(`${DRIVE_API}/files?${params}`);
  if (!res.ok) {
    throw new Error(`Drive list failed (${res.status})`);
  }
  const json = (await res.json()) as { files?: DriveFile[] };
  return json.files ?? [];
}

/**
 * Find the file ID associated with a word ID (via appProperties).
 * Returns null if no image uploaded for that word.
 */
export async function findFileForWord(wordId: string): Promise<string | null> {
  // Drive search query syntax — escape single quotes in the value just in case
  const safeWordId = wordId.replace(/'/g, "\\'");
  const q = `appProperties has { key='wordId' and value='${safeWordId}' }`;

  const params = new URLSearchParams({
    spaces: APP_DATA_FOLDER,
    q,
    fields: 'files(id)',
    pageSize: '1',
  });

  const res = await authedFetch(`${DRIVE_API}/files?${params}`);
  if (!res.ok) return null;
  const json = (await res.json()) as { files?: { id: string }[] };
  return json.files?.[0]?.id ?? null;
}

/** Get the user's total Drive quota (helpful before uploading large files). */
export async function getQuotaInfo(): Promise<QuotaInfo | null> {
  const res = await authedFetch(`${DRIVE_API}/about?fields=storageQuota`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    storageQuota?: { usage?: string; usageInDrive?: string; limit?: string };
  };
  const q = json.storageQuota;
  if (!q) return null;
  return {
    usedBytes: Number(q.usageInDrive ?? q.usage ?? 0),
    limitBytes: Number(q.limit ?? 0),
  };
}
