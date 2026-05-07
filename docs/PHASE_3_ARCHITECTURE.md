# Phase 3 Architecture — Streaming TTS via Cloudflare Worker

**Status**: 📋 Planning document — NOT implemented yet
**Target trigger**: DAU > 500 OR bundled audio > 100MB OR HSK4+ content needed
**Estimated dev time**: ~16 hours (client) + ~2 hours (infrastructure setup)

---

## 1. Goals & Constraints

### Goals
1. Scale audio library from 650 bundled items → 10,000+ without bloating extension
2. Keep operational cost **$0–$10/month** up to 10K active users
3. Latency targets:
   - Tier 1 (bundled): < 50ms
   - Tier 2 (IDB cache): < 100ms
   - Tier 3 (streaming, warm cache): < 500ms
   - Tier 3 (cold, TTS generation): < 2s
4. Offline support for previously-played audio
5. Zero API credentials exposed in public extension bundle

### Non-goals
- Real-time TTS for user-generated content (future Phase 4)
- Multi-region edge replication (Cloudflare handles this automatically)
- Voice cloning / custom voices

---

## 2. High-level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                              │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  LinguaNewTab Extension                              │     │
│  │  ┌─────────────────┐    ┌──────────────────────┐    │     │
│  │  │  IndexedDB      │◄───┤  audioService.ts     │    │     │
│  │  │  (local cache)  │    │  Tier resolver       │    │     │
│  │  └─────────────────┘    └──────────┬───────────┘    │     │
│  │                                     │                │     │
│  │  ┌─────────────────────────────────▼───────────┐   │     │
│  │  │  Bundled MP3s (HSK1 + Oxford 500)           │   │     │
│  │  └──────────────────────────────────────────────┘   │     │
│  └──────────────────────────────┬───────────────────────┘     │
└─────────────────────────────────┼─────────────────────────────┘
                                  │ HTTPS + JWT auth
                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                             │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Cloudflare Worker                                   │     │
│  │  - Route: /tts?text={...}&voice={...}&speed={...}   │     │
│  │  - Verify JWT (prevent abuse)                        │     │
│  │  - Rate limit via KV                                 │     │
│  │  - Whitelist check (allowed texts only)              │     │
│  │  - Cache check → R2                                  │     │
│  └────────┬──────────────────────────┬──────────────────┘     │
│           │ cache miss               │ cache hit              │
│           ▼                          ▼                         │
│  ┌──────────────────┐      ┌─────────────────────┐           │
│  │  Google TTS call │      │  Cloudflare R2      │           │
│  │  + R2 write      │      │  (read MP3 bytes)   │           │
│  └──────────────────┘      └─────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier Resolution Logic

Extension decides audio source in priority order:

```typescript
async function getAudio(wordId: string, speed: 'normal' | 'slow'): Promise<Blob> {
  // Tier 1: Bundled MP3 (HSK1 + Oxford 500) — always offline
  const bundled = await fetchBundled(wordId, speed);
  if (bundled) return bundled;

  // Tier 2: IndexedDB local cache — offline after first play
  const cached = await audioDb.get({ wordId, speed });
  if (cached) return cached;

  // Tier 3: Cloudflare Worker — network required
  const streamed = await streamClient.fetch(wordId, speed);
  await audioDb.set({ wordId, speed, blob: streamed, lastAccessed: Date.now() });
  return streamed;
}
```

---

## 4. Security Design

Critical: public extension → anyone can extract Worker URL → Jason could be charged.

### Layer 1: JWT authentication
- Extension holds embedded public key of Jason's signing authority
- Each request includes JWT signed by Google OAuth token of logged-in user
- Worker validates:
  - JWT not expired (15 min TTL)
  - `aud` claim = LinguaNewTab extension ID
  - User signed in with Google (reuse existing Drive sync OAuth)

### Layer 2: Rate limiting (Cloudflare KV)
```typescript
const RATE_LIMITS = {
  perUser: 1000,    // requests/day per Google user
  perIP: 5000,      // requests/day per IP (anti-anonymous abuse)
  global: 100000,   // requests/day total (kill switch)
};
```

### Layer 3: Content whitelist
Worker accepts ONLY text matching HSK/Oxford wordlist:
```typescript
const whitelist = await env.WORDLIST_KV.get('allowed-texts', 'json');
if (!whitelist.has(request.text)) return 403;
```
Prevents Worker being used as free general-purpose TTS proxy.

### Layer 4: Referer / Origin check
Only accept requests from `chrome-extension://{LINGUA_EXTENSION_ID}`. Block curl/browser direct calls.

---

## 5. Cache Strategy

### Cloudflare R2 (server-side, shared across all users)

```
lingua-audio-cache/
├── zh/
│   ├── chirp3hd-kore/
│   │   ├── normal/
│   │   │   ├── {hash}.mp3     ← hash of text for cache key
│   │   └── slow/
└── en/
    └── chirp3hd-leda/
```

**Key insight**: First user to request a word generates it → all subsequent users get free cached copy.

**R2 pricing**:
- Storage: $0.015/GB/month
- Egress: **FREE** (unlike S3)
- Operations: $0.36/1M Class A, $0.036/1M Class B reads

**HSK1-6 full cache**: ~120MB = **$0.002/month** storage.

### Extension IndexedDB (client-side, per user)

```typescript
// audioCache.ts using Dexie
export const audioDb = new Dexie('lingua-audio');
audioDb.version(1).stores({
  audioBlobs: 'wordId+speed, lang, lastAccessed, sizeBytes',
});

// LRU eviction when > 50MB
const MAX_CACHE_BYTES = 50 * 1024 * 1024;
async function evictOldest() {
  const all = await audioDb.audioBlobs.toArray();
  const total = all.reduce((s, b) => s + b.sizeBytes, 0);
  if (total > MAX_CACHE_BYTES) {
    const sorted = all.sort((a, b) => a.lastAccessed - b.lastAccessed);
    const toEvict = sorted.slice(0, 100);
    await audioDb.audioBlobs.bulkDelete(toEvict.map(i => [i.wordId, i.speed]));
  }
}
```

50MB ≈ 4,000 MP3 files cached locally per user.

---

## 6. Cloudflare Worker Implementation Sketch

```typescript
// worker.ts
import { verify as verifyJwt } from '@tsndr/cloudflare-worker-jwt';

const ALLOWED_VOICES = new Set([
  'cmn-CN-Chirp3-HD-Kore',
  'en-US-Chirp3-HD-Leda',
]);

interface Env {
  GOOGLE_TTS_KEY: string;         // service account JSON base64
  JWT_SECRET: string;
  AUDIO_BUCKET: R2Bucket;
  RATE_KV: KVNamespace;
  WORDLIST_KV: KVNamespace;
  EXTENSION_ID: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      // 1. Origin check
      const origin = req.headers.get('Origin') || '';
      if (origin !== `chrome-extension://${env.EXTENSION_ID}`) {
        return new Response('Forbidden', { status: 403 });
      }

      // 2. Parse request
      const url = new URL(req.url);
      const text = url.searchParams.get('text');
      const voice = url.searchParams.get('voice');
      const speed = (url.searchParams.get('speed') || 'normal') as 'normal' | 'slow';

      if (!text || !voice || !ALLOWED_VOICES.has(voice)) {
        return new Response('Bad Request', { status: 400 });
      }

      // 3. Content whitelist
      const whitelistJson = await env.WORDLIST_KV.get('allowed-texts', { type: 'json' });
      if (!Array.isArray(whitelistJson) || !whitelistJson.includes(text)) {
        return new Response('Text not in dictionary', { status: 403 });
      }

      // 4. JWT verify
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/, '');
      const jwtResult = await verifyJwt(token, env.JWT_SECRET);
      if (!jwtResult || !jwtResult.payload.sub) {
        return new Response('Unauthorized', { status: 401 });
      }

      // 5. Rate limit
      const userId = jwtResult.payload.sub as string;
      const today = new Date().toISOString().slice(0, 10);
      const userKey = `rate:user:${userId}:${today}`;
      const countStr = await env.RATE_KV.get(userKey);
      const count = parseInt(countStr || '0');
      if (count >= 1000) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      await env.RATE_KV.put(userKey, String(count + 1), { expirationTtl: 86400 });

      // 6. Cache lookup
      const cacheKey = `${voice}/${speed}/${encodeURIComponent(text)}.mp3`;
      const cached = await env.AUDIO_BUCKET.get(cacheKey);
      if (cached) {
        return new Response(cached.body, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }

      // 7. Cache miss → generate via Google TTS
      const mp3Bytes = await callGoogleTTS(text, voice, speed, env.GOOGLE_TTS_KEY);

      // 8. Async R2 write (don't block response)
      env.AUDIO_BUCKET.put(cacheKey, mp3Bytes, {
        httpMetadata: { contentType: 'audio/mpeg' },
      }).catch(err => console.error('R2 write failed:', err));

      return new Response(mp3Bytes, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response('Internal error', { status: 500 });
    }
  },
};

async function callGoogleTTS(
  text: string,
  voice: string,
  speed: 'normal' | 'slow',
  keyBase64: string,
): Promise<ArrayBuffer> {
  // ... implementation using Google TTS REST API with service account auth
  // See: https://cloud.google.com/text-to-speech/docs/reference/rest
  throw new Error('Not implemented');
}
```

---

## 7. Cost Analysis

### Scenario A: 1,000 active users, HSK1-6 available

Assumptions:
- Each user: 200 audio plays/day (20 words × 10 repeats)
- 10% are new (non-cached): 20 unique requests/user/day
- After 1 month, cache hit rate reaches ~95%

| Service | Usage | Cost |
|---|---|---|
| Google TTS (Chirp 3 HD) | 300K chars/month | **$0** (under 1M free tier) |
| Cloudflare Worker | 600K req/month | **$0** (under 10M free tier) |
| Cloudflare R2 storage | 120MB | **$0.002** |
| Cloudflare R2 ops | 600K reads | **$0.02** |
| Cloudflare KV reads | 1.2M | **$0.60** (first 100K free) |
| **TOTAL** | | **~$0.62/month** |

### Scenario B: 10,000 active users

| Service | Usage | Cost |
|---|---|---|
| Google TTS | 300K chars/month | **$0** |
| Worker | 6M req/month | **$0** (under 10M free) |
| KV reads | 12M | **~$6** |
| R2 ops | 6M reads | **~$0.22** |
| **TOTAL** | | **~$7/month** |

### Scenario C: 100,000 users (viral success)

| Service | Cost |
|---|---|
| Google TTS (3M chars) | ~$32 |
| Worker (60M req) | ~$5 |
| KV (120M reads) | ~$60 |
| R2 ops | ~$2 |
| **TOTAL** | **~$100/month** = $0.001/user |

---

## 8. Extension-side Changes Needed

1. **`audioService.ts` refactor** — implement tier resolver
2. **`audioStreamClient.ts`** (new) — Worker fetch with JWT retry/timeout
3. **`audioDb.ts`** (new) — Dexie schema for blob cache
4. **JWT signing logic** — integrate with Chrome Identity API OAuth token
5. **Settings UI additions**:
   - Cache size display ("Đã lưu 12MB audio offline")
   - "Xoá cache audio" button
6. **Offline indicator** — icon when offline + word not cached
7. **Error states** — "Không thể phát audio, thử lại sau" on Worker failure

**Estimate**: ~12-16 hours client-side dev.

---

## 9. Infrastructure Setup Steps

When Phase 3 is triggered, Jason needs:

1. **Cloudflare account** (free tier)
2. **Install Wrangler CLI**: `npm install -g wrangler`
3. **Init Worker project**: `wrangler init lingua-tts-worker`
4. **Create R2 bucket**: `wrangler r2 bucket create lingua-audio-cache`
5. **Create KV namespaces**:
   - `wrangler kv:namespace create RATE_KV`
   - `wrangler kv:namespace create WORDLIST_KV`
6. **Upload whitelist to KV**:
   - Generate JSON array of allowed texts from HSK data
   - `wrangler kv:key put --binding=WORDLIST_KV allowed-texts "$(cat whitelist.json)"`
7. **Set secrets**:
   - `wrangler secret put GOOGLE_TTS_KEY` (service account JSON base64-encoded)
   - `wrangler secret put JWT_SECRET`
   - `wrangler secret put EXTENSION_ID`
8. **Deploy**: `wrangler deploy`
9. **Worker URL**: `https://lingua-tts-worker.{account}.workers.dev`

**Estimate**: ~2 hours infrastructure setup.

---

## 10. Phase 3 Activation Triggers

Don't implement Phase 3 until ONE of these triggers hit:

- [ ] Bundled audio > 100MB (Chrome Web Store limit ~200MB)
- [ ] DAU (daily active users) > 500
- [ ] User requests HSK4+ content (feature request via feedback)
- [ ] Jason wants user-generated flashcards with auto-TTS

Until then, Phase 1 (bundled HSK1 + Oxford 500) is sufficient.

---

## 11. Open Questions / TODOs

1. **JWT signing strategy**: Need to decide between:
   - (a) Sign client-side with embedded private key (security risk)
   - (b) Use Google OAuth ID token directly (simpler, relies on Google as auth authority)
   - (c) Backend endpoint that exchanges Google token for custom JWT (extra hop)

   Recommendation: **Option (b)** — verify Google ID token in Worker using Google's JWKS.

2. **Cache invalidation**: When Jason regenerates audio with new voice, how to invalidate old R2 cache?
   - Option: include voice version in cache key path
   - Example: `zh/chirp3hd-kore-v2/normal/...` → full cache flush on version bump

3. **Cost monitoring**: Set up Cloudflare Workers Analytics + Google Cloud billing alerts at $5, $20, $50.

4. **Graceful degradation**: If Worker is down, extension should fall back to Web Speech API (keep existing fallback in `tts.ts`).

---

*Last updated: 2026-04-22 during LinguaNewTab v0.3.0 development.*
