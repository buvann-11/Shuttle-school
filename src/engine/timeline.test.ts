import { resolvePose } from './pose';
import { buildTimeline, DEFAULT_HOLD_MS, poseAt, sampleTimeline, timeOfPhase } from './timeline';

const tl = buildTimeline([0, 400, 200, 600]);

describe('buildTimeline', () => {
  it('accumulates start and end times', () => {
    expect(tl.starts).toEqual([0, 0, 400, 600]);
    expect(tl.ends).toEqual([0, 400, 600, 1200]);
    expect(tl.total).toBe(1200 + DEFAULT_HOLD_MS);
  });

  it('accepts a custom hold', () => {
    expect(buildTimeline([0, 100], 50).total).toBe(150);
  });
});

describe('sampleTimeline', () => {
  it('starts on the first step', () => {
    expect(sampleTimeline(tl, 0)).toEqual({ phase: 0, segment: null });
    expect(sampleTimeline(tl, -5).phase).toBe(0);
  });

  it('switches the visible step halfway through a transition', () => {
    expect(sampleTimeline(tl, 199).phase).toBe(0);
    expect(sampleTimeline(tl, 201).phase).toBe(1);
    expect(sampleTimeline(tl, 450)).toEqual({ phase: 1, segment: { from: 1, to: 2, u: 0.25 } });
  });

  it('holds the last step until the loop ends', () => {
    expect(sampleTimeline(tl, 1200)).toEqual({ phase: 3, segment: null });
    expect(sampleTimeline(tl, tl.total)).toEqual({ phase: 3, segment: null });
  });

  it('handles an empty timeline', () => {
    expect(sampleTimeline(buildTimeline([]), 100).phase).toBe(0);
  });
});

describe('timeOfPhase', () => {
  it('returns when a step is fully reached, wrapping out-of-range indices', () => {
    expect(timeOfPhase(tl, 2)).toBe(600);
    expect(timeOfPhase(tl, 4)).toBe(0);
    expect(timeOfPhase(tl, -1)).toBe(1200);
  });
});

describe('poseAt', () => {
  const keys = [
    { pose: resolvePose({ torso: 0 }), linear: false },
    { pose: resolvePose({ torso: 100 }), linear: true },
    { pose: resolvePose({ torso: 50 }), linear: false },
  ];
  const t2 = buildTimeline([0, 100, 100]);

  it('returns keyframe poses exactly at keyframe times', () => {
    expect(poseAt(keys, t2, 0).torso).toBe(0);
    expect(poseAt(keys, t2, 100).torso).toBe(100);
    expect(poseAt(keys, t2, 250).torso).toBe(50);
  });

  it('interpolates linearly when the target keyframe is linear', () => {
    expect(poseAt(keys, t2, 25).torso).toBeCloseTo(25);
  });

  it('eases otherwise', () => {
    expect(poseAt(keys, t2, 125).torso).toBeCloseTo(100 - 50 * 0.125);
  });

  it('throws on an empty keyframe list', () => {
    expect(() => poseAt([], t2, 0)).toThrow();
  });
});
