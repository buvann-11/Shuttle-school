import { findLesson } from '@/content/library';
import type { FigureLesson } from '@/content/types';
import { forwardKinematics } from './pose';
import { shuttleAt } from './shuttle';
import { buildTimeline } from './timeline';

const clear = findLesson('clear') as FigureLesson;
const tl = buildTimeline(clear.keys.map((k) => k.duration));
const s = clear.shuttle!;
const contactTime = tl.ends[s.contactKey]!;
const contactPoint = forwardKinematics(clear.keys[s.contactKey]!.pose).racketHead;

describe('shuttleAt', () => {
  it('is hidden before it comes in and after it leaves', () => {
    expect(shuttleAt(clear, tl, contactTime - s.inDuration - 1)).toBeNull();
    expect(shuttleAt(clear, tl, contactTime + s.outDuration + 1)).toBeNull();
  });

  it('starts at the offset given in the content', () => {
    const st = shuttleAt(clear, tl, contactTime - s.inDuration)!;
    expect(st.position[0]).toBeCloseTo(contactPoint[0] + s.from[0]);
    expect(st.position[1]).toBeCloseTo(contactPoint[1] + s.from[1]);
    expect(st.impact).toBe(0);
  });

  it('meets the racket head at contact, with a full impact flash', () => {
    const st = shuttleAt(clear, tl, contactTime)!;
    expect(st.position[0]).toBeCloseTo(contactPoint[0]);
    expect(st.position[1]).toBeCloseTo(contactPoint[1]);
    expect(st.impact).toBe(1);
  });

  it('fades the impact flash after contact', () => {
    expect(shuttleAt(clear, tl, contactTime + s.outDuration * 0.5)!.impact).toBe(0);
  });

  it('returns null for lessons without a shuttle', () => {
    const ready = findLesson('ready') as FigureLesson;
    expect(shuttleAt(ready, buildTimeline(ready.keys.map((k) => k.duration)), 100)).toBeNull();
  });
});
