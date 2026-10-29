import rawLibrary from './lessons.json';
import { buildLibrary, findLesson, LESSONS } from './library';
import { librarySchema, type LibrarySource } from './schema';
import { POSE_KEYS } from '@/engine/pose';

const clone = (): LibrarySource => structuredClone(rawLibrary) as LibrarySource;
const firstFigure = (lib: LibrarySource) => {
  const l = lib.lessons.find((x) => x.kind === 'figure');
  if (l?.kind !== 'figure') throw new Error('fixture has no figure lesson');
  return l;
};

describe('lesson content', () => {
  it('passes schema validation', () => {
    const result = librarySchema.safeParse(rawLibrary);
    expect(result.success, JSON.stringify(result.error?.issues, null, 2)).toBe(true);
  });

  it('has 11 lessons with unique ids, numbered in order', () => {
    expect(LESSONS).toHaveLength(11);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    expect(LESSONS.map((l) => l.number)).toEqual(LESSONS.map((_, i) => i + 1));
  });

  it('resolves every figure keyframe into a complete pose', () => {
    for (const lesson of LESSONS) {
      if (lesson.kind !== 'figure') continue;
      for (const key of lesson.keys) {
        for (const k of POSE_KEYS)
          expect(Number.isFinite(key.pose[k]), `${lesson.id}.${k}`).toBe(true);
      }
    }
  });

  it('gives every lesson coaching content', () => {
    for (const l of LESSONS) {
      expect(l.points.length).toBeGreaterThanOrEqual(2);
      expect(l.mistakes.length).toBeGreaterThanOrEqual(2);
      expect(l.drill.length).toBeGreaterThan(10);
    }
  });

  it('finds lessons by id', () => {
    expect(findLesson('clear')?.title).toBe('Forehand clear');
    expect(findLesson('nope')).toBeUndefined();
    expect(findLesson(undefined)).toBeUndefined();
  });

  it('builds the same library from a fresh copy of the source', () => {
    expect(buildLibrary(clone())).toEqual(LESSONS);
  });
});

describe('lesson schema rejects bad content', () => {
  it('rejects duplicate ids', () => {
    const lib = clone();
    const [a, b] = lib.lessons;
    if (a && b) b.id = a.id;
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });

  it('rejects a first keyframe with a non-zero duration', () => {
    const lib = clone();
    const key = firstFigure(lib).keys[0];
    if (key) key.duration = 100;
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });

  it('rejects a later keyframe with zero duration', () => {
    const lib = clone();
    const key = firstFigure(lib).keys[1];
    if (key) key.duration = 0;
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });

  it('rejects unknown joint names', () => {
    const lib = clone();
    const key = firstFigure(lib).keys[0];
    if (key) (key.pose as Record<string, number>).elbw = 10;
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });

  it('rejects a shuttle contact keyframe that does not exist', () => {
    const lib = clone();
    const lesson = lib.lessons.find((l) => l.kind === 'figure' && l.shuttle);
    if (lesson?.kind === 'figure' && lesson.shuttle) lesson.shuttle.contactKey = 99;
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });

  it('rejects non-kebab-case ids', () => {
    const lib = clone();
    const l = lib.lessons[0];
    if (l) l.id = 'Forehand Clear';
    expect(librarySchema.safeParse(lib).success).toBe(false);
  });
});
