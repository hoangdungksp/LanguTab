#!/usr/bin/env tsx
/**
 * scripts/regen-exam-audio.ts — batch-regenerate Exam audio VIA THE WORKER.
 *
 * Unlike scripts/pregen-exam-audio-en.ts (which calls ElevenLabs directly and
 * therefore has NONE of the worker's gap/marker/spelling logic), this script
 * POSTs each part's (audioKey, audioScript) to the worker's admin endpoint
 * with `force: true`. That re-runs the SAME server-side pipeline a manual
 * "♻️ Regen" button does — splitting into segments, relabeling "Question N",
 * dropping read-backs, slowing spelling, and stitching the 1s/2s/4s gaps — and
 * stores the result in R2. So after a gap/voice change (e.g. v1.8.4–v1.8.6),
 * run this once instead of clicking Regen on every part by hand.
 *
 * Auth: break-glass ADMIN_TOKEN (the worker accepts it as Bearer on
 * /admin/exam/*). Export it yourself; never paste it here.
 *
 * Usage:
 *   export ADMIN_TOKEN="..."                       # the worker secret
 *   npx tsx scripts/regen-exam-audio.ts                  # EN+ZH, parts p2,p3
 *   npx tsx scripts/regen-exam-audio.ts --lang zh        # only Chinese
 *   npx tsx scripts/regen-exam-audio.ts --from 1 --to 10 # level# range
 *   npx tsx scripts/regen-exam-audio.ts --parts all      # all 4 parts
 *   npx tsx scripts/regen-exam-audio.ts --dry-run        # list, no API calls
 *   npx tsx scripts/regen-exam-audio.ts --delay 800      # ms between calls
 *
 * Only p2/p3 changed under the gap work, so those are the default targets.
 */

import { getLevelsForLang } from '../src/data/exam/index';
import type { ExamLang } from '../src/data/exam/planets';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';
const GEN_ENDPOINT = `${WORKER_URL}/admin/exam/audio/generate`;

interface Args {
  lang: 'en' | 'zh' | 'all';
  /** Raw --parts flag: "all", "p23" (default), or an explicit list like "p3,p4,p5". */
  parts: string;
  from: number;
  to: number;
  delay: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    lang: (get('--lang') as Args['lang']) ?? 'all',
    parts: get('--parts') ?? 'p23',
    from: Number(get('--from') ?? 1),
    to: Number(get('--to') ?? 999),
    delay: Number(get('--delay') ?? 1200),
    dryRun: argv.includes('--dry-run'),
  };
}

/** Part number from an audioKey like "level21/p4.mp3" → 4 (or 0 if none). */
const partNum = (audioKey: string): number => {
  const m = audioKey.match(/\/p(\d+)\.[a-z0-9]+$/i);
  return m ? Number(m[1]) : 0;
};

/**
 * Which part numbers to regen, from the --parts flag:
 *   "all"        → every part
 *   "p23"        → p2,p3 (default; the gap parts)
 *   "p3,p4,p5"   → explicit list
 */
function allowedParts(parts: string): 'all' | Set<number> {
  if (parts === 'all') return 'all';
  const nums = parts.match(/\d+/g);
  if (nums && nums.length) return new Set(nums.map(Number));
  return new Set([2, 3]);
}

interface Target {
  lang: ExamLang;
  levelNumber: number;
  partId: string;
  audioKey: string;
  audioScript: string;
}

function collectTargets(args: Args): Target[] {
  const langs: ExamLang[] =
    args.lang === 'all' ? ['en', 'zh'] : [args.lang];
  const allow = allowedParts(args.parts);
  const targets: Target[] = [];
  for (const lang of langs) {
    for (const level of getLevelsForLang(lang)) {
      if (level.levelNumber < args.from || level.levelNumber > args.to) continue;
      for (const part of level.parts as Array<{ partId: string; audioKey?: string; audioScript?: string }>) {
        if (!part.audioKey || !part.audioScript) continue;
        if (allow !== 'all' && !allow.has(partNum(part.audioKey))) continue;
        targets.push({
          lang,
          levelNumber: level.levelNumber,
          partId: part.partId,
          audioKey: part.audioKey,
          audioScript: part.audioScript,
        });
      }
    }
  }
  return targets;
}

async function regenOne(t: Target, token: string): Promise<{ ok: boolean; provider: string; ms: number; note: string }> {
  const started = Date.now();
  try {
    const res = await fetch(GEN_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioKey: t.audioKey, audioScript: t.audioScript, force: true }),
    });
    const ms = Date.now() - started;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, provider: '-', ms, note: `HTTP ${res.status} ${body.slice(0, 120)}` };
    }
    const provider = res.headers.get('X-Audio-Provider') ?? '?';
    const cached = res.headers.get('X-Audio-Cached');
    const buf = await res.arrayBuffer();
    return { ok: true, provider, ms, note: `${(buf.byteLength / 1024).toFixed(0)}KB cached=${cached}` };
  } catch (err) {
    return { ok: false, provider: '-', ms: Date.now() - started, note: String(err).slice(0, 120) };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.ADMIN_TOKEN;
  if (!token && !args.dryRun) {
    console.error('✗ Missing ADMIN_TOKEN env var. Run:  export ADMIN_TOKEN="..."  (the worker secret)');
    process.exit(1);
  }

  const targets = collectTargets(args);
  console.log(
    `Regen plan: ${targets.length} part(s) | lang=${args.lang} parts=${args.parts} ` +
    `levels=${args.from}-${args.to} delay=${args.delay}ms${args.dryRun ? ' [DRY-RUN]' : ''}`,
  );
  if (args.dryRun) {
    for (const t of targets) console.log(`  ${t.lang} L${t.levelNumber} ${t.partId} → ${t.audioKey} (${t.audioScript.length} chars)`);
    console.log(`\nTotal: ${targets.length} part(s). No API calls made (--dry-run).`);
    return;
  }

  let ok = 0;
  const failures: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const r = await regenOne(t, token!);
    const tag = `[${i + 1}/${targets.length}] ${t.lang} L${t.levelNumber} ${t.partId}`;
    if (r.ok) {
      ok++;
      console.log(`✓ ${tag} via ${r.provider} ${r.ms}ms (${r.note})`);
    } else {
      failures.push(`${tag} — ${r.note}`);
      console.log(`✗ ${tag} ${r.ms}ms — ${r.note}`);
    }
    if (i < targets.length - 1) await sleep(args.delay);
  }

  console.log(`\nDone: ${ok}/${targets.length} ok, ${failures.length} failed.`);
  if (failures.length) {
    console.log('Failures:');
    for (const f of failures) console.log('  ' + f);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
