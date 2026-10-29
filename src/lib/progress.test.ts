import { LESSONS } from '@/content/library';
import {
  firstOpenLesson,
  learnedCount,
  nextLesson,
  parseProgress,
  toggleLearned,
} from './progress';

const ids = LESSONS.map((l) => l.id);

describe('progress', () => {
  it('toggles a lesson on and off', () => {
    const on = toggleLearned({ learned: [] }, 'clear');
    expect(on.learned).toEqual(['clear']);
    expect(toggleLearned(on, 'clear').learned).toEqual([]);
  });

  it('counts only lessons that still exist', () => {
    expect(learnedCount({ learned: ['clear', 'retired-lesson'] }, LESSONS)).toBe(1);
  });

  it('suggests the next unlearned lesson, wrapping around', () => {
    expect(nextLesson(LESSONS, 'grip', { learned: [] }).id).toBe('ready');
    expect(nextLesson(LESSONS, 'grip', { learned: ['ready', 'split'] }).id).toBe('clear');
    const last = ids[ids.length - 1]!;
    expect(nextLesson(LESSONS, last, { learned: [] }).id).toBe('grip');
  });

  it('suggests simply the next lesson when everything is learned', () => {
    expect(nextLesson(LESSONS, 'clear', { learned: ids }).id).toBe('smash');
  });

  it('resumes at the first unlearned lesson', () => {
    expect(firstOpenLesson(LESSONS, { learned: [] }).id).toBe('grip');
    expect(firstOpenLesson(LESSONS, { learned: ['grip', 'ready'] }).id).toBe('split');
    expect(firstOpenLesson(LESSONS, { learned: ids }).id).toBe('grip');
  });

  it('parses stored progress defensively', () => {
    expect(parseProgress({ learned: ['a', 'a', 'b'] })).toEqual({ learned: ['a', 'b'] });
    expect(parseProgress({ learned: [1] })).toBeUndefined();
    expect(parseProgress(null)).toBeUndefined();
    expect(parseProgress('x')).toBeUndefined();
  });
});

describe('prototype migration', () => {
  it('imports lessons learned in the original prototype', async () => {
    localStorage.setItem('ss.done', JSON.stringify(['grip', 'hserve', 'net']));
    vi.resetModules();
    const { progressStore } = await import('./progress');
    expect(progressStore.get().learned).toEqual(['grip', 'high-serve', 'net-shot']);
  });

  it('ignores malformed prototype data', async () => {
    localStorage.setItem('ss.done', '{"oops":1}');
    vi.resetModules();
    const { progressStore } = await import('./progress');
    expect(progressStore.get().learned).toEqual([]);
  });
});
