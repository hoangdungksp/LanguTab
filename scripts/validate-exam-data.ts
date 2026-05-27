#!/usr/bin/env tsx
/**
 * scripts/validate-exam-data.ts — D-16 Phase 1
 *
 * Cross-reference validation for exam data. Walks `allLevels` from
 * `src/data/exam/levels.ts`, checks every ref against registries, and
 * exits 1 on error so build/CI fails fast.
 *
 * Run:    npx tsx scripts/validate-exam-data.ts
 * Or:     npm run validate:exam
 *
 * Adds:   `prebuild` hook so `npm run build` auto-validates first.
 *
 * Checks performed:
 *   1. Each ExamLevel has exactly 4 parts in canonical order
 *   2. partIds unique within a level
 *   3. audioKey + audioScript present and non-empty
 *   4. DragName: sceneId resolves, dropZones populated, exampleZoneId is
 *      a real zone, correctMapping keys ⊆ names, values ⊆ non-example zones
 *   5. Write: sceneId resolves, every question has prompt + non-empty
 *      acceptedAnswers
 *   6. Tick: example + every question's correctOptionId ∈ its options[];
 *      every option has iconId
 *   7. Colour: sceneId is an outline variant, example.regionId ∈ regions[],
 *      correctColors keys ⊆ regions[], palette non-empty
 *   8. Cross-level: audioKey duplicates flagged as warning
 *   9. Inventory: unused scenes in worker registry flagged as warning
 *
 * Output is a single console report. Errors fail the script; warnings
 * pass but inform admin tooling priorities (Phase 2/3 of D-16).
 */

import { allLevels, allLevelsZh } from '../src/data/exam';

/** All levels across languages — English (1-60) + Chinese HSK1 (101-120). */
const ALL_LEVELS = [...allLevels, ...allLevelsZh];
import {
  SCENE_IDS as WORKER_SCENE_IDS_RAW,
} from '../worker/src/exam/scenes';
import type {
  ExamLevel,
  ExamPart,
  TickQuestionItem,
  WriteQuestionItem,
} from '../src/types/exam';

const WORKER_SCENE_IDS = WORKER_SCENE_IDS_RAW as readonly string[];

// ─── Issue accumulator ──────────────────────────────────────────────

type Severity = 'ERROR' | 'WARN';
interface Issue {
  severity: Severity;
  path: string;
  message: string;
}

const issues: Issue[] = [];
const err = (path: string, message: string) =>
  issues.push({ severity: 'ERROR', path, message });
const warn = (path: string, message: string) =>
  issues.push({ severity: 'WARN', path, message });

// ─── Inventory accumulator ──────────────────────────────────────────

const usedSceneIds = new Set<string>();
const usedAudioKeys = new Set<string>();
const usedIconIds = new Set<string>();
const audioKeyCounts = new Map<string, number>();

// ─── Per-part validators ────────────────────────────────────────────

function validateCommon(part: ExamPart, partPath: string): void {
  if (!part.partId) err(partPath, 'Missing partId');
  if (!part.audioKey) {
    err(partPath, 'Missing audioKey');
  } else {
    usedAudioKeys.add(part.audioKey);
    audioKeyCounts.set(
      part.audioKey,
      (audioKeyCounts.get(part.audioKey) ?? 0) + 1,
    );
  }
  if (!part.audioScript || part.audioScript.trim() === '') {
    err(partPath, 'Missing or empty audioScript');
  }
}

function checkSceneId(
  partPath: string,
  sceneId: string | undefined,
  opts: { outlineExpected?: boolean } = {},
): void {
  if (!sceneId) {
    err(partPath, 'Missing sceneId');
    return;
  }
  usedSceneIds.add(sceneId);
  if (!WORKER_SCENE_IDS.includes(sceneId)) {
    err(partPath, `sceneId "${sceneId}" not in worker scene registry`);
  }
  if (opts.outlineExpected && !sceneId.includes('outline')) {
    warn(
      partPath,
      `Colour part uses non-outline sceneId "${sceneId}" — expected outline variant`,
    );
  }
}

function validateTickQuestion(
  q: TickQuestionItem,
  partPath: string,
  label: string,
): void {
  const qPath = `${partPath} ${label}`;
  if (!q.questionId) err(qPath, 'Missing questionId');
  if (!q.prompt) err(qPath, 'Missing prompt');
  if (!q.options || q.options.length === 0) {
    err(qPath, 'Empty options[]');
    return;
  }
  const optIds = new Set(q.options.map((o) => o.id));
  if (!optIds.has(q.correctOptionId)) {
    err(
      qPath,
      `correctOptionId "${q.correctOptionId}" not in options [${[...optIds].join(', ')}]`,
    );
  }
  for (const opt of q.options) {
    if (opt.iconId) {
      usedIconIds.add(opt.iconId);
    } else {
      warn(qPath, `option "${opt.id}" missing iconId`);
    }
  }
}

function validateWriteQuestion(
  q: WriteQuestionItem,
  partPath: string,
  idx: number,
): void {
  const qPath = `${partPath} question[${idx}]`;
  if (!q.questionId) err(qPath, 'Missing questionId');
  if (!q.prompt) err(qPath, 'Missing prompt');
  if (!q.acceptedAnswers || q.acceptedAnswers.length === 0) {
    err(qPath, 'Empty acceptedAnswers');
  } else if (q.acceptedAnswers.some((a) => !a || a.trim() === '')) {
    err(qPath, 'acceptedAnswers contains empty string');
  }
}

function validatePart(part: ExamPart, partPath: string): void {
  validateCommon(part, partPath);

  switch (part.type) {
    case 'listening_drag_name': {
      checkSceneId(partPath, part.sceneId);

      if (!part.dropZones || part.dropZones.length === 0) {
        err(partPath, 'Empty dropZones[]');
        break;
      }
      const zoneIds = new Set(part.dropZones.map((z) => z.id));
      if (zoneIds.size !== part.dropZones.length) {
        err(partPath, 'Duplicate zone ids in dropZones[]');
      }

      if (!part.exampleName) err(partPath, 'Missing exampleName');
      if (!zoneIds.has(part.exampleZoneId)) {
        err(
          partPath,
          `exampleZoneId "${part.exampleZoneId}" not in dropZones`,
        );
      }

      if (!part.names || part.names.length === 0) {
        err(partPath, 'Empty names[]');
      }
      const namesSet = new Set(part.names ?? []);
      if (namesSet.size !== (part.names ?? []).length) {
        err(partPath, 'Duplicate values in names[]');
      }
      if (namesSet.has(part.exampleName)) {
        err(
          partPath,
          `exampleName "${part.exampleName}" should not appear in names[]`,
        );
      }

      // correctMapping integrity
      for (const [name, zoneId] of Object.entries(part.correctMapping)) {
        if (!namesSet.has(name)) {
          err(partPath, `correctMapping has name "${name}" not in names[]`);
        }
        if (!zoneIds.has(zoneId)) {
          err(
            partPath,
            `correctMapping[${name}] → "${zoneId}" not in dropZones`,
          );
        }
        if (zoneId === part.exampleZoneId) {
          err(
            partPath,
            `correctMapping[${name}] uses exampleZoneId "${zoneId}"`,
          );
        }
      }

      // Coverage: every name has a mapping, every non-example zone is taken
      const nonExampleZones = part.dropZones.filter(
        (z) => z.id !== part.exampleZoneId,
      );
      const mappedNames = new Set(Object.keys(part.correctMapping));
      const mappedZones = new Set(Object.values(part.correctMapping));
      for (const name of part.names) {
        if (!mappedNames.has(name)) {
          err(partPath, `name "${name}" has no entry in correctMapping`);
        }
      }
      if (mappedZones.size !== mappedNames.size) {
        warn(
          partPath,
          `correctMapping has ${mappedNames.size} entries but only ${mappedZones.size} unique zones (overlap)`,
        );
      }
      // Cambridge YLE format: Starters Part 1 has 4 user-names + 1 example
      // = 5 total names (1 zone in 6-zone grid intentionally unused as
      // decorative). Movers/Flyers have 5 user-names + 1 example = 6 total
      // (fills all zones). So names.length < non-example zones is fine.
      // Only names.length > zones is a real bug (no slot to drop into).
      if (part.names.length > nonExampleZones.length) {
        err(
          partPath,
          `${part.names.length} names but only ${nonExampleZones.length} non-example zones — names won't fit`,
        );
      }
      break;
    }

    case 'listening_write': {
      checkSceneId(partPath, part.sceneId);

      if (!part.questions || part.questions.length === 0) {
        err(partPath, 'Empty questions[]');
      } else {
        const qIds = new Set<string>();
        part.questions.forEach((q, i) => {
          validateWriteQuestion(q, partPath, i);
          if (q.questionId) {
            if (qIds.has(q.questionId)) {
              err(partPath, `Duplicate questionId "${q.questionId}"`);
            }
            qIds.add(q.questionId);
          }
        });
      }

      // examples shape (optional but recommended)
      if (!part.examples || part.examples.length === 0) {
        warn(partPath, 'No examples[] — Cambridge YLE Write typically shows 2');
      }
      break;
    }

    case 'listening_tick': {
      validateTickQuestion(part.example, partPath, 'example');
      if (!part.questions || part.questions.length === 0) {
        err(partPath, 'Empty questions[]');
      } else {
        const qIds = new Set<string>();
        part.questions.forEach((q, i) => {
          validateTickQuestion(q, partPath, `question[${i}]`);
          if (q.questionId) {
            if (qIds.has(q.questionId)) {
              err(partPath, `Duplicate questionId "${q.questionId}"`);
            }
            qIds.add(q.questionId);
          }
        });
      }
      break;
    }

    case 'listening_colour': {
      checkSceneId(partPath, part.sceneId, { outlineExpected: true });

      if (!part.regions || part.regions.length === 0) {
        err(partPath, 'Empty regions[]');
        break;
      }
      const regionIds = new Set(part.regions.map((r) => r.id));
      if (regionIds.size !== part.regions.length) {
        err(partPath, 'Duplicate region ids in regions[]');
      }

      // Cambridge YLE Colour format: `example` is the PRE-COLORED demo
      // object (audio: "Colour the ball red. The ball is red.") shown
      // already-colored on the worksheet so the kid knows what to do.
      // `regions[]` are the 5 OTHER objects the kid must color. The two
      // sets are DISJOINT by design.
      if (!part.example.regionId || part.example.regionId.trim() === '') {
        err(partPath, 'example.regionId is empty');
      } else if (regionIds.has(part.example.regionId)) {
        err(
          partPath,
          `example.regionId "${part.example.regionId}" must NOT be in regions[] — example is pre-colored, regions[] are user-colored (disjoint sets)`,
        );
      }
      if (!part.example.color || part.example.color.trim() === '') {
        err(partPath, 'example.color is empty');
      }

      for (const regionId of Object.keys(part.correctColors)) {
        if (!regionIds.has(regionId)) {
          err(
            partPath,
            `correctColors regionId "${regionId}" not in regions[]`,
          );
        }
      }

      if (!part.palette || part.palette.length === 0) {
        err(partPath, 'Empty palette');
      } else {
        const paletteSet = new Set(part.palette);
        if (part.example.color && !paletteSet.has(part.example.color)) {
          warn(
            partPath,
            `example.color "${part.example.color}" not in palette`,
          );
        }
        for (const [regionId, color] of Object.entries(part.correctColors)) {
          if (!paletteSet.has(color)) {
            warn(
              partPath,
              `correctColors["${regionId}"] = "${color}" not in palette`,
            );
          }
        }
      }
      break;
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = part;
      err(partPath, `Unknown part type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// ─── Per-level validator ────────────────────────────────────────────

const EXPECTED_PART_TYPES = [
  'listening_drag_name',
  'listening_write',
  'listening_tick',
  'listening_colour',
] as const;

function validateLevel(level: ExamLevel): void {
  const lvlPath = `Level ${level.levelNumber}`;

  if (
    !Number.isInteger(level.levelNumber) ||
    level.levelNumber < 1 ||
    level.levelNumber > 300
  ) {
    err(lvlPath, `levelNumber out of range [1, 300]: ${level.levelNumber}`);
  }
  if (!level.title) err(lvlPath, 'Missing title');
  if (!level.timeLimitSec || level.timeLimitSec <= 0) {
    err(lvlPath, `Invalid timeLimitSec: ${level.timeLimitSec}`);
  }

  if (!level.parts || level.parts.length !== 4) {
    err(lvlPath, `Expected 4 parts, got ${level.parts?.length ?? 0}`);
    return;
  }

  const actualTypes = level.parts.map((p) => p.type);
  for (let i = 0; i < 4; i++) {
    if (actualTypes[i] !== EXPECTED_PART_TYPES[i]) {
      err(
        lvlPath,
        `parts[${i}] expected "${EXPECTED_PART_TYPES[i]}" got "${actualTypes[i]}"`,
      );
    }
  }

  const partIds = level.parts.map((p) => p.partId);
  if (new Set(partIds).size !== partIds.length) {
    err(lvlPath, `Duplicate partIds: ${partIds.join(', ')}`);
  }

  for (const part of level.parts) {
    validatePart(part, `${lvlPath} [${part.partId ?? '??'}]`);
  }
}

// ─── Cross-level checks ─────────────────────────────────────────────

function crossLevelChecks(): void {
  // Duplicate audioKeys = same TTS audio reused → may or may not be intentional.
  // Flag as warning so admin notices and confirms.
  for (const [key, count] of audioKeyCounts) {
    if (count > 1) {
      warn('global', `audioKey "${key}" used ${count} times across levels`);
    }
  }

  // Unused worker scenes
  const unused = WORKER_SCENE_IDS.filter((id) => !usedSceneIds.has(id));
  if (unused.length > 0) {
    warn(
      'inventory',
      `Worker scenes never referenced by any level: ${unused.join(', ')}`,
    );
  }

  // Duplicate level numbers
  const lvlNums = ALL_LEVELS.map((l) => l.levelNumber);
  const dupes = lvlNums.filter((n, i) => lvlNums.indexOf(n) !== i);
  if (dupes.length > 0) {
    err('global', `Duplicate levelNumber(s): ${[...new Set(dupes)].join(', ')}`);
  }
}

// ─── Report ─────────────────────────────────────────────────────────

function report(): number {
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARN');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  D-16 Phase 1 — Exam Data Validation Report');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Levels checked:       ${ALL_LEVELS.length} (EN ${allLevels.length} + ZH ${allLevelsZh.length})`);
  console.log(
    `  Scenes used:          ${usedSceneIds.size} / ${WORKER_SCENE_IDS.length} in worker registry`,
  );
  console.log(`  Audio keys used:      ${usedAudioKeys.size}`);
  console.log(`  Icon refs collected:  ${usedIconIds.size}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Errors:               ${errors.length}`);
  console.log(`  Warnings:             ${warnings.length}`);
  console.log('═══════════════════════════════════════════════════════════');

  if (warnings.length > 0) {
    console.log(`\n⚠  Warnings (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`   [${w.path}]  ${w.message}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    for (const e of errors) {
      console.log(`   [${e.path}]  ${e.message}`);
    }
    console.log('\nValidation FAILED. Fix errors before build.\n');
    return 1;
  }

  console.log('\n✅ Validation PASSED.\n');
  return 0;
}

// ─── Main ───────────────────────────────────────────────────────────

function main(): void {
  if (!Array.isArray(allLevels) || allLevels.length === 0) {
    err('global', 'allLevels is empty or not exported');
    process.exit(report());
  }

  for (const level of ALL_LEVELS) {
    validateLevel(level);
  }
  crossLevelChecks();

  process.exit(report());
}

main();
