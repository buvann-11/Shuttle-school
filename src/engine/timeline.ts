import { blendPoses, easeInOut, type Pose } from './pose';

/** Pause after the last keyframe before the loop restarts (ms). */
export const DEFAULT_HOLD_MS = 700;

export interface Timeline {
  /** Time (ms) at which each keyframe's transition begins. */
  readonly starts: readonly number[];
  /** Time (ms) at which each keyframe is fully reached. */
  readonly ends: readonly number[];
  /** Loop length including the final hold. */
  readonly total: number;
}

export interface Sample {
  /** The keyframe the learner should be told about right now. */
  phase: number;
  /** Keyframe being moved toward, or `null` while holding a keyframe. */
  segment: { from: number; to: number; u: number } | null;
}

export function buildTimeline(durations: readonly number[], holdMs = DEFAULT_HOLD_MS): Timeline {
  const starts: number[] = [];
  const ends: number[] = [];
  let t = 0;
  for (const d of durations) {
    starts.push(t);
    t += d;
    ends.push(t);
  }
  return { starts, ends, total: t + holdMs };
}

/**
 * Samples the timeline at time `t`. The phase flips to the next keyframe halfway
 * through a transition, which matches when the pose visibly reads as that step.
 */
export function sampleTimeline(tl: Timeline, t: number): Sample {
  const n = tl.starts.length;
  if (n === 0) return { phase: 0, segment: null };
  if (t <= 0) return { phase: 0, segment: null };
  for (let i = 1; i < n; i++) {
    const start = tl.starts[i] ?? 0;
    const end = tl.ends[i] ?? 0;
    if (t < end) {
      const u = Math.min(1, Math.max(0, (t - start) / (end - start)));
      return { phase: u > 0.5 ? i : i - 1, segment: { from: i - 1, to: i, u } };
    }
  }
  return { phase: n - 1, segment: null };
}

interface PosedKeyframe {
  pose: Pose;
  linear: boolean;
}

export function poseAt(keys: readonly PosedKeyframe[], tl: Timeline, t: number): Pose {
  const s = sampleTimeline(tl, t);
  const first = keys[0];
  if (!first) throw new Error('poseAt: lesson has no keyframes');
  if (!s.segment) return (keys[s.phase] ?? first).pose;
  const a = keys[s.segment.from] ?? first;
  const b = keys[s.segment.to] ?? first;
  const eased = b.linear ? s.segment.u : easeInOut(s.segment.u);
  return blendPoses(a.pose, b.pose, eased);
}

/** Time at which keyframe `i` is fully reached (used to pause on a step). */
export function timeOfPhase(tl: Timeline, i: number): number {
  const n = tl.ends.length;
  const idx = ((i % n) + n) % n;
  return tl.ends[idx] ?? 0;
}
