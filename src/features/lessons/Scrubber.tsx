import { useImperativeHandle, useRef, type Ref } from 'react';
import { sampleTimeline, type Timeline } from '@/engine/timeline';
import styles from './Scrubber.module.css';

export interface ScrubberHandle {
  /** Moves the thumb without a React render; called every animation frame. */
  update: (t: number) => void;
}

interface ScrubberProps {
  ref?: Ref<ScrubberHandle>;
  timeline: Timeline;
  steps: readonly { label: string }[];
  /** Time to show on first render and after user-driven changes. */
  time: number;
  onSeek: (t: number) => void;
}

/** Fine-grained frame steps for the slider, in ms. */
const STEP_MS = 10;

function describe(timeline: Timeline, steps: readonly { label: string }[], t: number): string {
  const { phase } = sampleTimeline(timeline, t);
  return `Step ${phase + 1} of ${steps.length}: ${steps[phase]?.label ?? ''}`;
}

/**
 * A timeline slider with a tick at every step. Dragging pauses playback so the
 * learner can study the motion frame by frame.
 */
export function Scrubber({ ref, timeline, steps, time, onSeek }: ScrubberProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const max = timeline.total;

  const lastText = useRef('');

  // Runs every frame, so it avoids layout work: the fill is scaled on the
  // compositor and the spoken description only changes when the step does.
  const paint = (t: number) => {
    const input = inputRef.current;
    if (!input) return;
    input.value = String(Math.round(t));
    const text = describe(timeline, steps, t);
    if (text !== lastText.current) {
      input.setAttribute('aria-valuetext', text);
      lastText.current = text;
    }
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${t / max})`;
  };

  useImperativeHandle(ref, () => ({ update: paint }));

  return (
    <div className={styles.scrubber}>
      <div className={styles.track} aria-hidden="true">
        <div ref={fillRef} className={styles.fill} style={{ transform: `scaleX(${time / max})` }} />
        {timeline.ends.map((end, i) => (
          // Ticks mirror the fixed keyframe list, so the index is a stable key.
          <span key={i} className={styles.tick} style={{ left: `${(end / max) * 100}%` }} />
        ))}
      </div>
      <input
        ref={inputRef}
        className={styles.input}
        type="range"
        min={0}
        max={Math.round(max)}
        step={STEP_MS}
        defaultValue={Math.round(time)}
        aria-label="Animation position"
        aria-valuetext={describe(timeline, steps, time)}
        onChange={(e) => {
          const t = Number(e.target.value);
          paint(t);
          onSeek(t);
        }}
      />
    </div>
  );
}
