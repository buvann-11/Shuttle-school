import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import type { Lesson } from '@/content/types';
import type { Vec2 } from '@/engine/pose';
import { drawFigureScene, drawGripScene, type Palette, type Viewport } from '@/engine/render';
import type { Timeline } from '@/engine/timeline';
import styles from './LessonStage.module.css';

export interface StageHandle {
  draw(): void;
}

interface LessonStageProps {
  ref?: Ref<StageHandle>;
  lesson: Lesson;
  timeline: Timeline;
  timeRef: { readonly current: number };
  phase: number;
  playing: boolean;
  revision: number;
  palette: Palette;
  mirror: boolean;
  ghosts: boolean;
  racketPath: boolean;
}

/** Logical drawing height; the width follows the element's aspect ratio. */
const LOGICAL_HEIGHT = 720;
const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: LOGICAL_HEIGHT };

function viewportFor(size: { w: number; h: number } | null): Viewport {
  if (!size || size.w <= 0 || size.h <= 0) return DEFAULT_VIEWPORT;
  return { width: Math.round(LOGICAL_HEIGHT * (size.w / size.h)), height: LOGICAL_HEIGHT };
}

export function LessonStage({
  ref,
  lesson,
  timeline,
  timeRef,
  phase,
  playing,
  revision,
  palette,
  mirror,
  ghosts,
  racketPath,
}: LessonStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Vec2[]>([]);
  const [cssSize, setCssSize] = useState<{ w: number; h: number } | null>(null);
  const viewport = useMemo(() => viewportFor(cssSize), [cssSize]);

  // Match the backing store to the element's size × devicePixelRatio for crisp lines.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setCssSize({ w: width, h: height });
    });
    ro.observe(canvas);
    return () => {
      ro.disconnect();
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round((cssSize?.w ?? viewport.width / 2) * dpr);
    const h = Math.round((cssSize?.h ?? viewport.height / 2) * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(w / viewport.width, 0, 0, h / viewport.height, 0, 0);
    const t = timeRef.current;
    if (lesson.kind === 'grip') {
      drawGripScene(ctx, viewport, palette, lesson, timeline, t, mirror);
    } else {
      drawFigureScene(ctx, viewport, palette, lesson, timeline, t, {
        mirror,
        ghosts,
        trail: racketPath && playing ? trailRef.current : null,
      });
    }
  }, [cssSize, viewport, timeRef, lesson, timeline, palette, mirror, ghosts, racketPath, playing]);

  useImperativeHandle(ref, () => ({ draw }), [draw]);

  // Static redraws: pausing, seeking, resizing, theme or option changes.
  useEffect(() => {
    trailRef.current = [];
    draw();
  }, [draw, revision]);

  const key = lesson.keys[phase] ?? lesson.keys[0];
  const stepText = key
    ? `Step ${phase + 1} of ${lesson.keys.length}: ${key.label}. ${key.cue}.`
    : '';
  const handedness = mirror ? 'left' : 'right';

  return (
    <figure className={styles.stage} data-kind={lesson.kind}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={`${lesson.title} demonstration (${handedness}-handed). ${stepText}`}
      />
      <figcaption className={styles.hud}>
        <div>
          <div className={styles.stepLabel}>{key?.label}</div>
          <div className={styles.cue}>{key?.cue}</div>
        </div>
        <div className={styles.stepNo}>
          Step {phase + 1} of {lesson.keys.length}
        </div>
      </figcaption>
      {lesson.kind === 'figure' && (
        <div className={styles.legend} aria-hidden="true">
          <span className={styles.swatch} style={{ background: palette.racketSide }} />
          Racket side ({handedness})
          <span
            className={styles.swatch}
            style={{ background: palette.figureFar, marginLeft: 10 }}
          />
          Other side
        </div>
      )}
    </figure>
  );
}
