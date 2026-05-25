#!/usr/bin/env tsx
/**
 * scripts/pregen-exam-audio-en.ts — Phase B (D-17 launch-prep)
 *
 * Pre-generate Exam EN audio via ElevenLabs API direct (bypass worker)
 * and save to public/audio/exam/ as local backup. Spend ElevenLabs quota
 * before subscription expires to permanently capture premium TTS audio.
 *
 * Why direct API (not via worker /exam/audio):
 *   - Worker /exam/audio requires Google OAuth user token; this is a
 *     local admin tool not running in a logged-in browser context.
 *   - Direct call also gives us per-script char accounting we can log.
 *   - Audio is written to local disk first (backup) — worker R2 sync is
 *     a separate concern (Phase C, optional later).
 *
 * Voice + model defaults mirror the worker's generateElevenLabsTTS
 * (handlers.ts line ~435). Override via env vars if Jason changes voice.
 *
 * Usage:
 *   export ELEVENLABS_API_KEY="..."
 *   npx tsx scripts/pregen-exam-audio-en.ts                # all in budget
 *   npx tsx scripts/pregen-exam-audio-en.ts --from 1 --to 20    # subset
 *   npx tsx scripts/pregen-exam-audio-en.ts --dry-run      # plan, no API
 *   npx tsx scripts/pregen-exam-audio-en.ts --force        # regen existing
 *
 * Quota guard: stops BEFORE crossing --quota (default 65000) so we never
 * overshoot ElevenLabs monthly budget. Existing files are always skipped
 * (don't count toward budget) unless --force is set.
 *
 * Output layout: public/audio/exam/level1/p1.mp3 etc (matches audioKey
 * field in levels.ts exactly).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allLevels } from '../src/data/exam';

// ─── ESM __dirname shim ────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CLI parsing ───────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = argv.indexOf(name);
  return idx >= 0 ? argv[idx + 1] : undefined;
}
function hasFlag(name: string): boolean {
  return argv.includes(name);
}

const fromLevel = parseInt(getArg('--from') ?? '1', 10);
const toLevel = parseInt(getArg('--to') ?? '60', 10);
const quotaLimit = parseInt(getArg('--quota') ?? '65000', 10);
const delayMs = parseInt(getArg('--delay') ?? '500', 10);
const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');

// ─── ElevenLabs config ─────────────────────────────────────────────────

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'ThT5KcBeYPX3keUQqHPh'; // Dorothy
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

if (!API_KEY && !dryRun) {
  console.error('❌ ELEVENLABS_API_KEY env var required. Set with:');
  console.error('   export ELEVENLABS_API_KEY="..."');
  console.error('Or use --dry-run to plan without API calls.');
  process.exit(1);
}

// ─── Paths ─────────────────────────────────────────────────────────────

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public/audio/exam');

if (!dryRun) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Try to fetch admin-edited override script from worker D1. Returns null
 * (i.e. caller falls back to hardcoded default) if endpoint returns 404
 * or any error. Public endpoint — no auth needed.
 *
 * NOTE: levelId convention here is `lvl${N}` matching partId prefix
 * (lvl1_p1, lvl1_p2 → levelId=lvl1). If actual saveAudioScript callers
 * use a different shape, this just always returns null and we use
 * defaults — non-fatal.
 */
async function fetchOverride(
  levelId: string,
  partId: string,
): Promise<string | null> {
  try {
    const url =
      `${WORKER_URL}/exam/audio-script/` +
      `${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = (await resp.json()) as { script?: string | null };
    return data.script ?? null;
  } catch {
    return null;
  }
}

async function callElevenLabs(text: string): Promise<Uint8Array> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      // voice_settings left default — matches worker behavior. Adjust here
      // if Jason wants different stability/similarity later.
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`ElevenLabs HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  const buf = await resp.arrayBuffer();
  return new Uint8Array(buf);
}

// ─── Plan inventory ────────────────────────────────────────────────────

interface PlanItem {
  level: number;
  partId: string;
  audioKey: string;
  scriptDefault: string;
  outputPath: string;
}

const plan: PlanItem[] = [];
for (const level of allLevels) {
  if (level.levelNumber < fromLevel || level.levelNumber > toLevel) continue;
  for (const part of level.parts) {
    plan.push({
      level: level.levelNumber,
      partId: part.partId,
      audioKey: part.audioKey,
      scriptDefault: part.audioScript,
      outputPath: path.join(OUTPUT_DIR, part.audioKey),
    });
  }
}

// ─── Header ────────────────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Pre-generate Exam EN Audio via ElevenLabs');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Range:        level ${fromLevel} → ${toLevel}  (${plan.length} parts)`);
console.log(`  Output dir:   ${path.relative(process.cwd(), OUTPUT_DIR)}`);
console.log(`  Voice:        ${VOICE_ID}`);
console.log(`  Model:        ${MODEL_ID}`);
console.log(`  Quota cap:    ${quotaLimit.toLocaleString()} chars`);
console.log(`  Delay:        ${delayMs}ms between calls`);
console.log(`  Mode:         ${dryRun ? 'DRY-RUN (no API calls)' : 'LIVE'}`);
console.log(`  Force regen:  ${force ? 'YES (overwrite existing)' : 'NO (skip existing)'}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// ─── Main loop ─────────────────────────────────────────────────────────

let totalCharsUsed = 0;
let generated = 0;
let skipped = 0;
let failed = 0;
let quotaHit = false;

const startedAt = Date.now();

for (const item of plan) {
  // Skip existing unless --force
  if (!force && fs.existsSync(item.outputPath)) {
    skipped++;
    continue;
  }

  // Fetch effective script
  const override = await fetchOverride(`lvl${item.level}`, item.partId);
  const script = override ?? item.scriptDefault;
  const chars = script.length;

  // Quota guard — stop BEFORE crossing
  if (totalCharsUsed + chars > quotaLimit) {
    quotaHit = true;
    console.log(
      `⏸  Quota stop: next part needs ${chars} chars but only ` +
      `${quotaLimit - totalCharsUsed} remain. Halting at ` +
      `level ${item.level} ${item.partId}.`,
    );
    break;
  }

  if (dryRun) {
    console.log(
      `  [dry] level ${String(item.level).padStart(2)} ${item.partId.padEnd(12)}` +
      `  ${String(chars).padStart(4)} chars   (cum: ${totalCharsUsed + chars})`,
    );
    totalCharsUsed += chars;
    generated++;
    continue;
  }

  // Live API call
  try {
    const audioBytes = await callElevenLabs(script);
    fs.mkdirSync(path.dirname(item.outputPath), { recursive: true });
    fs.writeFileSync(item.outputPath, audioBytes);
    generated++;
    totalCharsUsed += chars;
    const kb = (audioBytes.byteLength / 1024).toFixed(1);
    console.log(
      `✓ level ${String(item.level).padStart(2)} ${item.partId.padEnd(12)}` +
      `  ${String(chars).padStart(4)} chars  ${kb.padStart(5)}KB` +
      `  cum:${totalCharsUsed}/${quotaLimit}`,
    );
  } catch (err) {
    failed++;
    console.error(
      `✗ level ${item.level} ${item.partId}: ` +
      `${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Rate-limit delay (avoid hammering ElevenLabs)
  if (!dryRun && delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

// ─── Summary ───────────────────────────────────────────────────────────

const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
const remaining = quotaLimit - totalCharsUsed;

console.log('');
console.log('───────────────────────────────────────────────────────────');
console.log(`  Generated:        ${generated}`);
console.log(`  Skipped (exists): ${skipped}`);
console.log(`  Failed:           ${failed}`);
console.log(`  Chars used:       ${totalCharsUsed.toLocaleString()}`);
console.log(`  Chars remaining:  ${remaining.toLocaleString()}`);
console.log(`  Quota hit:        ${quotaHit ? 'YES — resume with new month' : 'no'}`);
console.log(`  Elapsed:          ${elapsedSec}s`);
console.log('───────────────────────────────────────────────────────────');

if (failed > 0) {
  console.log('\n⚠ Some parts failed. Re-run to retry (existing files will be skipped).');
  process.exit(1);
}
