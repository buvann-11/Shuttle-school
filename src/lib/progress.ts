import { useSyncExternalStore } from 'react';
import type { Lesson } from '@/content/types';
import { createPersistentStore } from './persistent-store';

export interface Progress {
  learned: readonly string[];
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

export function parseProgress(raw: unknown): Progress | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const learned = (raw as { learned?: unknown }).learned;
  return isStringArray(learned) ? { learned: [...new Set(learned)] } : undefined;
}

const EMPTY: Progress = { learned: [] };

/** Picks up progress saved by the original single-file prototype. */
function migrateFromPrototype(storage: Storage): Progress | undefined {
  try {
    const raw = storage.getItem('ss.done');
    if (raw === null) return undefined;
    const ids: unknown = JSON.parse(raw);
    if (!isStringArray(ids)) return undefined;
    const renamed: Record<string, string> = {
      hserve: 'high-serve',
      lserve: 'low-serve',
      net: 'net-shot',
    };
    return { learned: ids.map((id) => renamed[id] ?? id) };
  } catch {
    return undefined;
  }
}

export const progressStore = createPersistentStore(
  'progress',
  parseProgress,
  EMPTY,
  migrateFromPrototype,
);

export function toggleLearned(progress: Progress, lessonId: string): Progress {
  const has = progress.learned.includes(lessonId);
  return {
    learned: has
      ? progress.learned.filter((id) => id !== lessonId)
      : [...progress.learned, lessonId],
  };
}

/** Only counts ids that still exist in the course (content can change). */
export function learnedCount(progress: Progress, lessons: readonly Lesson[]): number {
  const ids = new Set(progress.learned);
  return lessons.filter((l) => ids.has(l.id)).length;
}

/**
 * The next lesson to suggest: the first unlearned lesson after the current one,
 * wrapping around; if everything is learned, simply the next lesson.
 */
export function nextLesson(
  lessons: readonly Lesson[],
  currentId: string,
  progress: Progress,
): Lesson {
  const learned = new Set(progress.learned);
  const n = lessons.length;
  const start = Math.max(
    0,
    lessons.findIndex((l) => l.id === currentId),
  );
  for (let k = 1; k < n; k++) {
    const l = lessons[(start + k) % n];
    if (l && !learned.has(l.id)) return l;
  }
  const fallback = lessons[(start + 1) % n] ?? lessons[0];
  if (!fallback) throw new Error('nextLesson: course has no lessons');
  return fallback;
}

/** Where a returning learner should land: their first unlearned lesson. */
export function firstOpenLesson(lessons: readonly Lesson[], progress: Progress): Lesson {
  const learned = new Set(progress.learned);
  const l = lessons.find((x) => !learned.has(x.id)) ?? lessons[0];
  if (!l) throw new Error('firstOpenLesson: course has no lessons');
  return l;
}

export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get);
}
