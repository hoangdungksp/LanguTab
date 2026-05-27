/**
 * Exam level catalog — reused from the extension's shared data (src/data/exam)
 * so the web management UI lists the exact same levels/parts. Type-only icon
 * imports there mean this does NOT pull the SVG icon runtime into the bundle.
 */
import { getLevelsForLang } from '../../src/data/exam';

export interface CatPart {
  partId: string;
  type: string;
  audioKey: string;
  audioScript: string;
  sceneId?: string;
}
export interface CatLevel {
  levelNumber: number;
  title: string;
  parts: CatPart[];
}

export function levelsFor(lang: 'en' | 'zh'): CatLevel[] {
  return getLevelsForLang(lang).map((l) => ({
    levelNumber: l.levelNumber,
    title: l.title,
    parts: l.parts.map((p) => ({
      partId: p.partId,
      type: p.type,
      audioKey: p.audioKey,
      audioScript: p.audioScript,
      sceneId: 'sceneId' in p ? (p as { sceneId: string }).sceneId : undefined,
    })),
  }));
}

/** Worker levelId convention for script overrides (matches the extension). */
export const levelIdOf = (levelNumber: number) => `level${levelNumber}`;

const PART_LABEL: Record<string, string> = {
  listening_drag_name: 'Kéo tên',
  listening_write: 'Viết',
  listening_match: 'Nối tranh',
  listening_tick: 'Chọn tranh',
  listening_colour: 'Tô màu',
};
export const partLabel = (t: string) => PART_LABEL[t] ?? t;
