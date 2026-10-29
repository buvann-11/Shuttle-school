import type { FigureLesson, GripLesson } from '@/content/types';
import { easeInOut, forwardKinematics, lerp, SEGMENTS, type Joints, type Vec2 } from './pose';
import { shuttleAt } from './shuttle';
import { poseAt, sampleTimeline, type Timeline } from './timeline';

/** Colours read from CSS custom properties so the canvas follows the theme. */
export interface Palette {
  court: string;
  courtShade: string;
  accent: string;
  figureNear: string;
  figureFar: string;
  racketSide: string;
  cork: string;
  skirt: string;
  skirtEdge: string;
}

export interface Viewport {
  /** Logical drawing size; the caller scales the context to the real pixel size. */
  width: number;
  height: number;
}

export interface FigureSceneOptions {
  mirror: boolean;
  ghosts: boolean;
  trail: Vec2[] | null;
}

const TRAIL_LENGTH = 34;
const FIGURE_SCALE = 1.95;
const GROUND_Y = 630;
const NET_HEIGHT = 172;
const TAU = Math.PI * 2;

/** True when the logical viewport is the narrow (phone) layout. */
export const isNarrow = (v: Viewport): boolean => v.width < 1000;

export function figureOrigin(lesson: FigureLesson, v: Viewport): Vec2 {
  const base = lesson.netX !== null ? 380 : 520;
  return [base - (isNarrow(v) ? 170 : 0), GROUND_Y];
}

function polyline(
  ctx: CanvasRenderingContext2D,
  pts: readonly Vec2[],
  color: string,
  width: number,
) {
  const [first, ...rest] = pts;
  if (!first) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (const p of rest) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, v: Viewport, pal: Palette) {
  ctx.fillStyle = pal.court;
  ctx.fillRect(0, 0, v.width, v.height);
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, 'rgba(0,0,0,.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.width, GROUND_Y);
  ctx.fillStyle = pal.courtShade;
  ctx.fillRect(0, GROUND_Y, v.width, v.height - GROUND_Y);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillRect(0, GROUND_Y - 1, v.width, 3);
  // Height markers: the figure is ~1.8 m tall, so 111 figure units ≈ 1 m.
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = '13px "IBM Plex Mono", ui-monospace, monospace';
  for (let m = 1; m <= 2; m++) {
    const y = GROUND_Y - m * 111 * FIGURE_SCALE;
    if (y < 20) continue;
    ctx.fillRect(0, y, 14, 1.5);
    ctx.fillText(`${m} m`, 18, y + 4);
  }
}

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  j: Joints,
  pal: Palette,
  { alpha = 1, lineWidth = 8 }: { alpha?: number; lineWidth?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Far limbs first so the near (racket) side overlaps them.
  polyline(ctx, [j.hip, j.otherKnee, j.otherAnkle, j.otherToe], pal.figureFar, lineWidth);
  polyline(ctx, [j.shoulder, j.otherElbow, j.otherWrist], pal.figureFar, lineWidth - 1);
  polyline(ctx, [j.hip, j.shoulder, j.neck], pal.figureNear, lineWidth + 3);
  ctx.fillStyle = pal.figureNear;
  ctx.beginPath();
  ctx.arc(j.head[0], j.head[1], SEGMENTS.head, 0, TAU);
  ctx.fill();
  polyline(ctx, [j.hip, j.racketKnee, j.racketAnkle, j.racketToe], pal.racketSide, lineWidth);

  // Racket: shaft, oval head, a few strings.
  polyline(ctx, [j.racketButt, j.racketThroat], pal.accent, 3);
  const ang = Math.atan2(j.racketHead[1] - j.racketThroat[1], j.racketHead[0] - j.racketThroat[0]);
  const cx = (j.racketThroat[0] + j.racketHead[0]) / 2 + Math.cos(ang) * 6;
  const cy = (j.racketThroat[1] + j.racketHead[1]) / 2 + Math.sin(ang) * 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 10, 0, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.35;
  ctx.lineWidth = 1;
  for (let i = -10; i <= 10; i += 5) {
    const h = Math.sqrt(Math.max(0, 1 - (i / 15) ** 2)) * 10;
    ctx.beginPath();
    ctx.moveTo(i, -h);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  ctx.restore();

  polyline(ctx, [j.shoulder, j.racketElbow, j.racketWrist], pal.racketSide, lineWidth - 1);
  ctx.fillStyle = pal.racketSide;
  ctx.beginPath();
  ctx.arc(j.racketWrist[0], j.racketWrist[1], 4.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawShuttle(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  angle: number,
  pal: Palette,
  scale = 1,
) {
  ctx.save();
  ctx.translate(pos[0], pos[1]);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = pal.skirt;
  ctx.strokeStyle = pal.skirtEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(-15, -8);
  ctx.lineTo(-15, 8);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pal.cork;
  ctx.beginPath();
  ctx.arc(1, 0, 4.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawNet(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(x - 3, -NET_HEIGHT, 6, NET_HEIGHT - 76);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 4, -NET_HEIGHT - 3, 8, 6);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.fillRect(x - 1.5, -NET_HEIGHT, 3, NET_HEIGHT);
}

function drawTrail(ctx: CanvasRenderingContext2D, trail: readonly Vec2[], color: string) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    if (!a || !b) continue;
    const k = i / trail.length;
    ctx.globalAlpha = k * 0.55;
    ctx.lineWidth = 2 + 5 * k;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFigureScene(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  pal: Palette,
  lesson: FigureLesson,
  tl: Timeline,
  t: number,
  opts: FigureSceneOptions,
): void {
  drawBackdrop(ctx, v, pal);
  ctx.save();
  if (opts.mirror) {
    ctx.translate(v.width, 0);
    ctx.scale(-1, 1);
  }
  const [ox, oy] = figureOrigin(lesson, v);
  ctx.translate(ox, oy);
  ctx.scale(FIGURE_SCALE, FIGURE_SCALE);

  if (lesson.netX !== null) drawNet(ctx, lesson.netX);
  if (opts.ghosts) {
    for (const k of lesson.keys)
      drawFigure(ctx, forwardKinematics(k.pose), pal, { alpha: 0.16, lineWidth: 7 });
  }

  const joints = forwardKinematics(poseAt(lesson.keys, tl, t));
  if (opts.trail) {
    opts.trail.push(joints.racketHead);
    if (opts.trail.length > TRAIL_LENGTH) opts.trail.shift();
    drawTrail(ctx, opts.trail, pal.accent);
  }
  drawFigure(ctx, joints, pal);

  const sh = shuttleAt(lesson, tl, t);
  if (sh) {
    if (sh.impact > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(0.6 * sh.impact).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sh.contactPoint[0], sh.contactPoint[1], 26 * (1.4 - sh.impact), 0, TAU);
      ctx.fill();
    }
    drawShuttle(ctx, sh.position, sh.angle, pal, 1.05);
  }
  ctx.restore();
}

/** How far the hand has turned from forehand (0) to backhand (1) at time t. */
export function gripTurnAt(lesson: GripLesson, tl: Timeline, t: number): number {
  const target = (i: number) => (lesson.keys[i]?.grip === 'backhand' ? 1 : 0);
  const s = sampleTimeline(tl, t);
  if (!s.segment) return target(s.phase);
  return lerp(target(s.segment.from), target(s.segment.to), easeInOut(s.segment.u));
}

/** Octagonal racket handle seen from the butt cap, with thumb and V markers. */
export function drawGripScene(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  pal: Palette,
  lesson: GripLesson,
  tl: Timeline,
  t: number,
  mirror: boolean,
): void {
  const DEG = Math.PI / 180;
  const ink = '#0d2a20';
  ctx.fillStyle = pal.court;
  ctx.fillRect(0, 0, v.width, v.height);

  const mix = gripTurnAt(lesson, tl, t);
  const cx = v.width * 0.5;
  const cy = v.height * 0.54;
  const R = 190;
  const m = mirror ? -1 : 1;

  const corners: Vec2[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 + 22.5) * DEG;
    corners.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.86]);
  }
  const path = (offset: Vec2) => {
    ctx.beginPath();
    corners.forEach((p, i) => {
      const x = p[0] + offset[0];
      const y = p[1] + offset[1];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  path([8, 10]);
  ctx.fill();
  ctx.fillStyle = '#f4f7f5';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  path([0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(13,42,32,.25)';
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R * 1.25);
  ctx.lineTo(cx, cy + R * 1.25);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = ink;
  ctx.font = '600 22px "IBM Plex Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 8; i++) {
    const a = (-90 + i * 45) * DEG;
    ctx.fillText(String(i + 1), cx + Math.cos(a) * R * 0.72 * m, cy + Math.sin(a) * R * 0.62);
  }

  const at = (deg: number, rr: number): Vec2 => {
    const a = deg * DEG;
    return [cx + Math.cos(a) * R * rr * m, cy + Math.sin(a) * R * rr * 0.86];
  };
  const V = at(lerp(-135, -175, mix), 1.08);
  const TH = at(lerp(150, 180, mix), 1.07);

  const va = Math.atan2(V[1] - cy, V[0] - cx);
  ctx.beginPath();
  ctx.moveTo(V[0], V[1]);
  ctx.lineTo(V[0] + Math.cos(va + 0.45) * 46, V[1] + Math.sin(va + 0.45) * 46);
  ctx.moveTo(V[0], V[1]);
  ctx.lineTo(V[0] + Math.cos(va - 0.45) * 46, V[1] + Math.sin(va - 0.45) * 46);
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.save();
  ctx.translate(TH[0], TH[1]);
  ctx.rotate(Math.atan2(TH[1] - cy, TH[0] - cx) + Math.PI / 2);
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 44 * (1 + mix * 0.25), 20, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.font = '600 20px Barlow, system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  const label = (p: Vec2, text: string, dx: number) => {
    ctx.textAlign = dx < 0 ? 'right' : 'left';
    ctx.fillText(text, p[0] + dx, p[1]);
  };
  const side = Math.cos(va) < 0 ? -1 : 1;
  label([V[0] + 30 * m * Math.sign(Math.cos(va)), V[1] - 40], 'V of thumb + index', m * side * 10);
  label(
    [TH[0], TH[1] + 78],
    mix > 0.5 ? 'Thumb pad flat on wide bevel' : 'Thumb wraps around',
    m * -10,
  );

  ctx.textAlign = 'center';
  ctx.font = '500 18px Barlow, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillText(`Handle seen from the end · ${mirror ? 'left' : 'right'} hand`, cx, v.height - 26);
  ctx.fillText('dashed line = racket face edge', cx, cy - R * 1.25 - 16);
  ctx.textBaseline = 'alphabetic';
}
