/**
 * Side-view stick-figure kinematics.
 *
 * The figure faces +x (toward the net). Angles are in degrees and measured from
 * "straight down", positive toward the net. Units are abstract "figure units":
 * a standing figure is roughly 180 units tall.
 */

export type Vec2 = readonly [number, number];

export const POSE_KEYS = [
  'x',
  'air',
  'torso',
  'racketShoulder',
  'racketElbow',
  'wrist',
  'otherShoulder',
  'otherElbow',
  'racketHip',
  'racketKnee',
  'otherHip',
  'otherKnee',
] as const;

export type PoseKey = (typeof POSE_KEYS)[number];
export type Pose = Readonly<Record<PoseKey, number>>;

/** The neutral ready stance every keyframe is defined relative to. */
export const READY_POSE: Pose = {
  x: 0,
  air: 0,
  torso: 14,
  racketShoulder: 30,
  racketElbow: 70,
  wrist: 30,
  otherShoulder: 20,
  otherElbow: 50,
  racketHip: 24,
  racketKnee: 42,
  otherHip: -14,
  otherKnee: 22,
};

export const SEGMENTS = {
  torso: 70,
  neck: 10,
  head: 12,
  upperArm: 33,
  forearm: 30,
  thigh: 45,
  shin: 45,
  foot: 15,
  racket: 64,
  racketHeadOffset: 22,
  buttCap: 6,
  groundClearance: 4,
} as const;

export interface Joints {
  hip: Vec2;
  shoulder: Vec2;
  neck: Vec2;
  head: Vec2;
  racketElbow: Vec2;
  racketWrist: Vec2;
  otherElbow: Vec2;
  otherWrist: Vec2;
  racketKnee: Vec2;
  racketAnkle: Vec2;
  racketToe: Vec2;
  otherKnee: Vec2;
  otherAnkle: Vec2;
  otherToe: Vec2;
  racketButt: Vec2;
  racketThroat: Vec2;
  racketHead: Vec2;
  /** Absolute racket angle in degrees (from straight down). */
  racketAngle: number;
}

const DEG = Math.PI / 180;

const dirDown = (deg: number): Vec2 => [Math.sin(deg * DEG), Math.cos(deg * DEG)];
const add = (p: Vec2, v: Vec2, s: number): Vec2 => [p[0] + v[0] * s, p[1] + v[1] * s];

export type PoseOverrides = { readonly [K in PoseKey]?: number | undefined };

/** Fills any joint the keyframe doesn't mention from the ready stance. */
export function resolvePose(overrides: PoseOverrides = {}): Pose {
  const out = { ...READY_POSE } as Record<PoseKey, number>;
  for (const key of POSE_KEYS) {
    const v = overrides[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}

/**
 * Forward kinematics. Returns joint positions with the ground at y = 0
 * (y grows downward, so the figure has negative y values).
 */
export function forwardKinematics(p: Pose): Joints {
  const S = SEGMENTS;
  const hip: Vec2 = [0, 0];
  const torsoDir: Vec2 = [Math.sin(p.torso * DEG), -Math.cos(p.torso * DEG)];
  const shoulder = add(hip, torsoDir, S.torso);
  const neck = add(shoulder, torsoDir, S.neck);
  const head = add(shoulder, torsoDir, S.neck + S.head);

  const arm = (shoulderAngle: number, elbowAngle: number) => {
    const elbow = add(shoulder, dirDown(shoulderAngle + p.torso), S.upperArm);
    const forearmAngle = shoulderAngle + p.torso + elbowAngle;
    const wrist = add(elbow, dirDown(forearmAngle), S.forearm);
    return { elbow, wrist, forearmAngle };
  };
  const racketArm = arm(p.racketShoulder, p.racketElbow);
  const otherArm = arm(p.otherShoulder, p.otherElbow);

  const racketAngle = racketArm.forearmAngle + p.wrist;
  const racketDir = dirDown(racketAngle);
  const racketButt = add(racketArm.wrist, racketDir, -S.buttCap);
  const racketHead = add(racketArm.wrist, racketDir, S.racket);
  const racketThroat = add(racketArm.wrist, racketDir, S.racket - S.racketHeadOffset);

  const leg = (hipAngle: number, kneeAngle: number) => {
    const knee = add(hip, dirDown(hipAngle), S.thigh);
    const ankle = add(knee, dirDown(hipAngle - kneeAngle), S.shin);
    const toe: Vec2 = [ankle[0] + S.foot, ankle[1] + 2];
    return { knee, ankle, toe };
  };
  const racketLeg = leg(p.racketHip, p.racketKnee);
  const otherLeg = leg(p.otherHip, p.otherKnee);

  const lowest = Math.max(racketLeg.ankle[1], otherLeg.ankle[1]) + S.groundClearance;
  const dx = p.x;
  const dy = -lowest - p.air;
  const t = (v: Vec2): Vec2 => [v[0] + dx, v[1] + dy];

  return {
    hip: t(hip),
    shoulder: t(shoulder),
    neck: t(neck),
    head: t(head),
    racketElbow: t(racketArm.elbow),
    racketWrist: t(racketArm.wrist),
    otherElbow: t(otherArm.elbow),
    otherWrist: t(otherArm.wrist),
    racketKnee: t(racketLeg.knee),
    racketAnkle: t(racketLeg.ankle),
    racketToe: t(racketLeg.toe),
    otherKnee: t(otherLeg.knee),
    otherAnkle: t(otherLeg.ankle),
    otherToe: t(otherLeg.toe),
    racketButt: t(racketButt),
    racketThroat: t(racketThroat),
    racketHead: t(racketHead),
    racketAngle,
  };
}

export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** Quadratic ease-in-out on [0, 1]. */
export const easeInOut = (u: number): number =>
  u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

export function blendPoses(a: Pose, b: Pose, u: number): Pose {
  const out = {} as Record<PoseKey, number>;
  for (const key of POSE_KEYS) out[key] = lerp(a[key], b[key], u);
  return out;
}
