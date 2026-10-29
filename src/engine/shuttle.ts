import type { FigureLesson } from '@/content/types';
import { forwardKinematics, type Vec2 } from './pose';
import type { Timeline } from './timeline';

export interface ShuttleState {
  position: Vec2;
  /** Heading in radians, so the cork leads. */
  angle: number;
  /** 1 at the moment of contact, fading to 0 shortly after. */
  impact: number;
  contactPoint: Vec2;
}

const IMPACT_FADE = 0.12;

/** A straight path with a parabolic bulge `arc` (negative = upward). */
function arcPoint(a: Vec2, b: Vec2, arc: number, u: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + arc * 4 * u * (1 - u)];
}

function heading(a: Vec2, b: Vec2): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0] || 1e-6);
}

/** Where the shuttle is at time `t`, or `null` when it is off-screen. */
export function shuttleAt(lesson: FigureLesson, tl: Timeline, t: number): ShuttleState | null {
  const s = lesson.shuttle;
  if (!s) return null;
  const contactKey = lesson.keys[s.contactKey];
  if (!contactKey) return null;
  const contactTime = tl.ends[s.contactKey] ?? 0;
  const contactPoint = forwardKinematics(contactKey.pose).racketHead;

  if (t >= contactTime - s.inDuration && t < contactTime) {
    const u = (t - (contactTime - s.inDuration)) / s.inDuration;
    const start: Vec2 = [contactPoint[0] + s.from[0], contactPoint[1] + s.from[1]];
    const a = arcPoint(start, contactPoint, s.arcIn, u);
    const b = arcPoint(start, contactPoint, s.arcIn, Math.min(1, u + 0.02));
    return { position: a, angle: heading(a, b), impact: 0, contactPoint };
  }
  if (t >= contactTime && t < contactTime + s.outDuration) {
    const u = (t - contactTime) / s.outDuration;
    const end: Vec2 = [contactPoint[0] + s.to[0], contactPoint[1] + s.to[1]];
    const a = arcPoint(contactPoint, end, s.arcOut, u);
    const b = arcPoint(contactPoint, end, s.arcOut, Math.min(1, u + 0.02));
    const impact = u < IMPACT_FADE ? 1 - u / IMPACT_FADE : 0;
    return { position: a, angle: heading(a, b), impact, contactPoint };
  }
  return null;
}
