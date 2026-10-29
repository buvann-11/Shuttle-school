import { resolvePose } from '@/engine/pose';
import rawLibrary from './lessons.json';
import type { LibrarySource } from './schema';
import type { Lesson } from './types';

/**
 * Resolves pose overrides into full poses. The JSON is validated against
 * `librarySchema` in the test suite (and so in CI before every build), which
 * keeps the validator out of the shipped bundle.
 */
export function buildLibrary(source: LibrarySource): Lesson[] {
  return source.lessons.map((l, i): Lesson => {
    const base = {
      id: l.id,
      number: i + 1,
      level: l.level,
      title: l.title,
      summary: l.summary,
      points: l.points,
      mistakes: l.mistakes,
      drill: l.drill,
    };
    if (l.kind === 'grip') return { ...base, kind: 'grip', keys: l.keys };
    return {
      ...base,
      kind: 'figure',
      keys: l.keys.map((k) => ({
        label: k.label,
        cue: k.cue,
        duration: k.duration,
        linear: k.linear ?? false,
        pose: resolvePose(k.pose),
      })),
      shuttle: l.shuttle ?? null,
      netX: l.netX ?? null,
    };
  });
}

export const LESSONS: readonly Lesson[] = buildLibrary(rawLibrary as LibrarySource);

export function findLesson(id: string | undefined): Lesson | undefined {
  return id === undefined ? undefined : LESSONS.find((l) => l.id === id);
}
