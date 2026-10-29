import {
  blendPoses,
  easeInOut,
  forwardKinematics,
  lerp,
  READY_POSE,
  resolvePose,
  SEGMENTS,
  type Vec2,
} from './pose';

const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('resolvePose', () => {
  it('fills unspecified joints from the ready stance', () => {
    expect(resolvePose({ torso: 40 })).toEqual({ ...READY_POSE, torso: 40 });
    expect(resolvePose()).toEqual(READY_POSE);
  });

  it('ignores explicitly undefined values', () => {
    expect(resolvePose({ torso: undefined })).toEqual(READY_POSE);
  });
});

describe('forwardKinematics', () => {
  const poses = [
    READY_POSE,
    resolvePose({ torso: -10, racketShoulder: 160, racketElbow: 120, wrist: 40, air: 20 }),
    resolvePose({ x: 46, racketHip: 78, racketKnee: 72, otherHip: -48, otherKnee: 8 }),
  ];

  it.each(poses)('preserves every segment length', (pose) => {
    const j = forwardKinematics(pose);
    expect(dist(j.hip, j.shoulder)).toBeCloseTo(SEGMENTS.torso);
    expect(dist(j.shoulder, j.racketElbow)).toBeCloseTo(SEGMENTS.upperArm);
    expect(dist(j.racketElbow, j.racketWrist)).toBeCloseTo(SEGMENTS.forearm);
    expect(dist(j.shoulder, j.otherElbow)).toBeCloseTo(SEGMENTS.upperArm);
    expect(dist(j.hip, j.racketKnee)).toBeCloseTo(SEGMENTS.thigh);
    expect(dist(j.racketKnee, j.racketAnkle)).toBeCloseTo(SEGMENTS.shin);
    expect(dist(j.otherKnee, j.otherAnkle)).toBeCloseTo(SEGMENTS.shin);
    expect(dist(j.racketWrist, j.racketHead)).toBeCloseTo(SEGMENTS.racket);
  });

  it('stands the lowest foot on the ground', () => {
    const j = forwardKinematics(READY_POSE);
    expect(Math.max(j.racketAnkle[1], j.otherAnkle[1])).toBeCloseTo(-SEGMENTS.groundClearance);
  });

  it('lifts the whole body by `air` and shifts it by `x`', () => {
    const ground = forwardKinematics(READY_POSE);
    const moved = forwardKinematics(resolvePose({ air: 20, x: 15 }));
    expect(moved.head[1]).toBeCloseTo(ground.head[1] - 20);
    expect(moved.head[0]).toBeCloseTo(ground.head[0] + 15);
  });

  it('puts the head above the hip when upright', () => {
    const j = forwardKinematics(resolvePose({ torso: 0 }));
    expect(j.head[0]).toBeCloseTo(j.hip[0]);
    expect(j.head[1]).toBeLessThan(j.hip[1]);
  });
});

describe('interpolation', () => {
  it('lerps', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });

  it('eases from 0 to 1 monotonically and symmetrically', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const v = easeInOut(u);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(easeInOut(1 - u)).toBeCloseTo(1 - v);
      prev = v;
    }
  });

  it('blends poses joint by joint', () => {
    const a = resolvePose({ torso: 0 });
    const b = resolvePose({ torso: 40 });
    expect(blendPoses(a, b, 0)).toEqual(a);
    expect(blendPoses(a, b, 1)).toEqual(b);
    expect(blendPoses(a, b, 0.5).torso).toBe(20);
  });
});
