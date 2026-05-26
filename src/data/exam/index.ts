/**
 * Exam data registry. Re-exports the level catalogs + helpers.
 * English (Cambridge YLE) levels 1-60; Chinese (HSK) levels 101+ (D-23).
 */
import type { ExamLevel } from '../../types';
import { allLevels, getLevel } from './levels';
import { allLevelsZh, getLevelZh } from './zh/levels';
import type { ExamLang } from './planets';

export { allLevels, getLevel } from './levels';
export { allLevelsZh, getLevelZh } from './zh/levels';

/** Levels for a given exam language. */
export function getLevelsForLang(lang: ExamLang): ExamLevel[] {
  return lang === 'zh' ? allLevelsZh : allLevels;
}

/** Look up a level across both catalogs (English 1-60, Chinese 101+). */
export function getAnyLevel(levelNumber: number): ExamLevel | undefined {
  return levelNumber >= 101 ? getLevelZh(levelNumber) : getLevel(levelNumber);
}
