import { useCallback, useEffect, useRef, useState } from 'react';
import { sampleTimeline, timeOfPhase, type Timeline } from '@/engine/timeline';

/** Largest frame step we accept, so a backgrounded tab doesn't jump on return. */
const MAX_FRAME_MS = 50;

export interface Playback {
  /** Current animation time in ms. Mutated every frame; read it inside draw callbacks. */
  readonly timeRef: { current: number };
  playing: boolean;
  phase: number;
  /** Bumps whenever time is changed by the user, so a paused canvas knows to redraw. */
  revision: number;
  toggle: () => void;
  setPlaying: (playing: boolean) => void;
  goToPhase: (i: number) => void;
  /** Jumps to time `t` (ms) and pauses there. */
  seek: (t: number) => void;
}

interface Options {
  timeline: Timeline;
  speed: number;
  autoplay: boolean;
  /**
   * Temporarily stops the frame loop without changing `playing`, e.g. while the
   * stage is scrolled off-screen or the tab is hidden. Saves battery and CPU.
   */
  suspended?: boolean;
  /** Called once per animation frame while playing, after time has advanced. */
  onFrame?: (t: number) => void;
  /** Time to show when paused at start (e.g. a key step for reduced-motion users). */
  initialTime?: number;
}

/**
 * Drives a looping timeline with requestAnimationFrame. React state only changes
 * when the visible step changes, never per frame. Mount one per lesson (key the
 * component by lesson id) so switching lessons starts from a clean state.
 */
export function usePlayback({
  timeline,
  speed,
  autoplay,
  suspended = false,
  onFrame,
  initialTime = 0,
}: Options): Playback {
  const timeRef = useRef(initialTime);
  const [playing, setPlaying] = useState(autoplay);
  const [phase, setPhase] = useState(() => sampleTimeline(timeline, initialTime).phase);
  const [revision, setRevision] = useState(0);

  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    if (!playing || suspended) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(MAX_FRAME_MS, now - last);
      last = now;
      let t = timeRef.current + dt * speed;
      if (t > timeline.total) t = 0;
      timeRef.current = t;
      setPhase(sampleTimeline(timeline, t).phase);
      onFrameRef.current?.(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [playing, suspended, speed, timeline]);

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.min(timeline.total, Math.max(0, t));
      timeRef.current = clamped;
      setPlaying(false);
      setPhase(sampleTimeline(timeline, clamped).phase);
      setRevision((r) => r + 1);
    },
    [timeline],
  );

  const goToPhase = useCallback(
    (i: number) => {
      seek(timeOfPhase(timeline, i));
    },
    [seek, timeline],
  );

  const toggle = useCallback(() => {
    // Pressing play at the very end restarts instead of looping instantly.
    if (!playing && timeRef.current >= timeline.total - 1) timeRef.current = 0;
    setPlaying(!playing);
  }, [playing, timeline]);

  return { timeRef, playing, phase, revision, toggle, setPlaying, goToPhase, seek };
}
