#!/usr/bin/env tsx
/**
 * scripts/count-exam-en-chars.ts
 *
 * Inventory tool: count total characters across all exam audio scripts
 * so we can sanity-check ElevenLabs quota before batch pre-gen.
 *
 * Output:
 *   - Total chars across all 60 levels × 4 parts
 *   - Remaining quota after batch (vs Jason's 65k cap)
 *   - Cumulative breakdown by 10s (so Jason knows where to cut off if tight)
 *   - Top 10 longest scripts (these are first to trim if over quota)
 *
 * Run: npx tsx scripts/count-exam-en-chars.ts
 *
 * NOTE: Counts the DEFAULT audioScript from levels.ts only. Admin D1
 * overrides (exam_audio_scripts table) are NOT included since they're
 * remote. If overrides differ significantly, batch pre-gen will use the
 * EFFECTIVE script (default + override) and char count may shift.
 */

import { allLevels } from '../src/data/exam';

const ELEVENLABS_QUOTA = 65_000;

interface PartStat {
  level: number;
  partNumber: 1 | 2 | 3 | 4;
  partId: string;
  chars: number;
}

const stats: PartStat[] = [];

for (const level of allLevels) {
  level.parts.forEach((part, idx) => {
    stats.push({
      level: level.levelNumber,
      partNumber: (idx + 1) as 1 | 2 | 3 | 4,
      partId: part.partId,
      chars: part.audioScript.length,
    });
  });
}

const totalChars = stats.reduce((a, p) => a + p.chars, 0);
const totalParts = stats.length;
const totalLevels = allLevels.length;
const avgPerLevel = Math.round(totalChars / totalLevels);
const avgPerPart = Math.round(totalChars / totalParts);
const remaining = ELEVENLABS_QUOTA - totalChars;
const overBudget = remaining < 0;

const fmt = (n: number) => n.toLocaleString('en-US');
const pad = (s: string, n: number) => s.padEnd(n);

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Exam EN Audio Script Inventory (Phase A)');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Levels:                  ${totalLevels}`);
console.log(`  Parts (Cambridge × 4):   ${totalParts}`);
console.log(`  Total chars:             ${fmt(totalChars)}`);
console.log(`  Avg per level:           ${fmt(avgPerLevel)}`);
console.log(`  Avg per part:            ${fmt(avgPerPart)}`);
console.log('───────────────────────────────────────────────────────────');
console.log(`  ElevenLabs quota:        ${fmt(ELEVENLABS_QUOTA)}`);
console.log(
  `  Remaining after batch:   ${fmt(Math.abs(remaining))}` +
  `${overBudget ? '  ⚠ OVER BUDGET' : '  ✓'}`,
);
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Cumulative by level — so Jason can decide cut-off if tight
console.log('Cumulative by level (where to cut if over budget):');
let cum = 0;
for (const level of allLevels) {
  const partsChars = level.parts.reduce((a, p) => a + p.audioScript.length, 0);
  cum += partsChars;
  // Show every 10 levels + show line where we'd hit quota
  const shouldShow =
    level.levelNumber % 10 === 0 ||
    level.levelNumber === 1 ||
    (cum > ELEVENLABS_QUOTA && cum - partsChars <= ELEVENLABS_QUOTA);
  if (shouldShow) {
    const marker =
      cum > ELEVENLABS_QUOTA && cum - partsChars <= ELEVENLABS_QUOTA
        ? '  ← quota crossed here'
        : '';
    console.log(`  Through level ${pad(String(level.levelNumber), 3)}: ${fmt(cum).padStart(7)} chars${marker}`);
  }
}
console.log('');

// Top 10 longest — first candidates for trimming if over budget
console.log('Top 10 longest audio scripts (trim candidates):');
const sortedByLen = [...stats].sort((a, b) => b.chars - a.chars).slice(0, 10);
for (const s of sortedByLen) {
  console.log(
    `  Level ${pad(String(s.level), 3)} Part ${s.partNumber}  [${pad(s.partId, 12)}]  ${fmt(s.chars).padStart(5)} chars`,
  );
}
console.log('');

// Distribution by part type — Cambridge YLE Part 1/2/3/4 have different shapes
console.log('Per part-type avg (drag name / write / tick / colour):');
const byPart = [1, 2, 3, 4].map((n) => {
  const parts = stats.filter((s) => s.partNumber === n);
  const sum = parts.reduce((a, p) => a + p.chars, 0);
  return { n, count: parts.length, sum, avg: Math.round(sum / parts.length) };
});
const partLabels = ['drag-name', 'write    ', 'tick     ', 'colour   '];
for (const b of byPart) {
  console.log(
    `  Part ${b.n} (${partLabels[b.n - 1]}): ${fmt(b.sum).padStart(6)} chars total, avg ${fmt(b.avg).padStart(4)}/part`,
  );
}
console.log('');
