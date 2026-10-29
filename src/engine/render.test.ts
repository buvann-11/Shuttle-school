import { LESSONS } from '@/content/library';
import { createMockContext } from '@/test/mock-canvas';
import type { Vec2 } from './pose';
import {
  drawFigureScene,
  drawGripScene,
  figureOrigin,
  gripTurnAt,
  isNarrow,
  type Palette,
} from './render';
import { buildTimeline } from './timeline';

const palette: Palette = {
  court: '#1f6a53',
  courtShade: '#1a5c48',
  accent: '#d14a22',
  figureNear: '#fff',
  figureFar: '#999',
  racketSide: '#fcb',
  cork: '#fff',
  skirt: '#eee',
  skirtEdge: '#222',
};
const wide = { width: 1280, height: 720 };
const narrow = { width: 900, height: 720 };

describe('scene rendering', () => {
  // Render every lesson across its whole loop with every option combination.
  it.each(LESSONS.map((l) => [l.id, l] as const))(
    'draws %s at every frame without bad values',
    (_id, lesson) => {
      const tl = buildTimeline(lesson.keys.map((k) => k.duration));
      for (const viewport of [wide, narrow]) {
        for (const mirror of [false, true]) {
          const { ctx, calls, badArgs } = createMockContext();
          const trail: Vec2[] = [];
          for (let t = 0; t <= tl.total; t += 16) {
            if (lesson.kind === 'grip')
              drawGripScene(ctx, viewport, palette, lesson, tl, t, mirror);
            else
              drawFigureScene(ctx, viewport, palette, lesson, tl, t, {
                mirror,
                ghosts: mirror,
                trail,
              });
          }
          expect(badArgs).toEqual([]);
          expect(calls.length).toBeGreaterThan(0);
          if (lesson.kind === 'figure') expect(trail.length).toBeLessThanOrEqual(34);
        }
      }
    },
  );

  it('balances every save() with a restore()', () => {
    const lesson = LESSONS.find((l) => l.id === 'smash');
    if (lesson?.kind !== 'figure') throw new Error('fixture');
    const { ctx, calls } = createMockContext();
    drawFigureScene(
      ctx,
      wide,
      palette,
      lesson,
      buildTimeline(lesson.keys.map((k) => k.duration)),
      1500,
      {
        mirror: true,
        ghosts: true,
        trail: [],
      },
    );
    expect(calls.filter((c) => c === 'save').length).toBe(
      calls.filter((c) => c === 'restore').length,
    );
  });
});

describe('layout helpers', () => {
  it('detects the narrow layout', () => {
    expect(isNarrow(narrow)).toBe(true);
    expect(isNarrow(wide)).toBe(false);
  });

  it('places net lessons further left to leave room for the net', () => {
    const net = LESSONS.find((l) => l.id === 'net-shot');
    const clear = LESSONS.find((l) => l.id === 'clear');
    if (net?.kind !== 'figure' || clear?.kind !== 'figure') throw new Error('fixture');
    expect(figureOrigin(net, wide)[0]).toBeLessThan(figureOrigin(clear, wide)[0]);
    expect(figureOrigin(clear, narrow)[0]).toBeLessThan(figureOrigin(clear, wide)[0]);
  });

  it('turns the grip from forehand to backhand and back', () => {
    const grip = LESSONS.find((l) => l.kind === 'grip');
    if (grip?.kind !== 'grip') throw new Error('fixture');
    const tl = buildTimeline(grip.keys.map((k) => k.duration));
    expect(gripTurnAt(grip, tl, 0)).toBe(0);
    expect(gripTurnAt(grip, tl, tl.ends[1]!)).toBe(1);
    expect(gripTurnAt(grip, tl, tl.ends[1]! / 2)).toBeCloseTo(0.5);
    expect(gripTurnAt(grip, tl, tl.total)).toBe(0);
  });
});
