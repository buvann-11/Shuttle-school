import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { CheckIcon, ChevronRightIcon } from '@/components/Icons';
import { ProgressBar } from '@/components/ProgressBar';
import { LESSONS } from '@/content/library';
import type { Lesson } from '@/content/types';
import { buildTimeline, timeOfPhase } from '@/engine/timeline';
import { useFullscreen } from '@/lib/fullscreen';
import { useAfterFirstIdle, useInView, usePageVisible, usePrefersReducedMotion } from '@/lib/media';
import {
  learnedCount,
  nextLesson,
  progressStore,
  toggleLearned,
  useProgress,
} from '@/lib/progress';
import { updateSettings, useSettings } from '@/lib/settings';
import { speak, stopSpeaking } from '@/lib/speech';
import { LessonNotes } from './LessonNotes';
import { LessonStage, type StageHandle } from './LessonStage';
import { PlayerControls } from './PlayerControls';
import { Scrubber, type ScrubberHandle } from './Scrubber';
import { StepList } from './StepList';
import { usePalette } from './usePalette';
import { usePlayback } from './usePlayback';
import styles from './LessonPlayer.module.css';

/** For reduced-motion users we open paused on a representative step (the contact, usually). */
const REDUCED_MOTION_STEP = 3;

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  return (
    /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(el.tagName) ||
    (el as HTMLElement).isContentEditable
  );
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const settings = useSettings();
  const progress = useProgress();
  const palette = usePalette();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<StageHandle>(null);
  const scrubberRef = useRef<ScrubberHandle>(null);
  const theaterRef = useRef<HTMLDivElement>(null);

  // Only animate when someone can see it, and never before the page has settled.
  const pageVisible = usePageVisible();
  const inView = useInView(theaterRef);
  const settled = useAfterFirstIdle();
  const fullscreen = useFullscreen(theaterRef);

  const timeline = useMemo(() => buildTimeline(lesson.keys.map((k) => k.duration)), [lesson]);
  const initialTime = reducedMotion
    ? timeOfPhase(timeline, Math.min(REDUCED_MOTION_STEP, lesson.keys.length - 1))
    : 0;
  const playback = usePlayback({
    timeline,
    speed: settings.speed,
    autoplay: !reducedMotion,
    suspended: !pageVisible || !inView || !settled,
    initialTime,
    onFrame: (t) => {
      stageRef.current?.draw();
      scrubberRef.current?.update(t);
    },
  });
  const { phase, playing, toggle, goToPhase, seek, revision, timeRef } = playback;

  // Keep the slider in step after taps, key presses and seeks.
  useEffect(() => {
    scrubberRef.current?.update(timeRef.current);
  }, [revision, timeRef]);

  // Speak each step as it comes up while playing.
  useEffect(() => {
    if (playing && settings.voice) {
      const label = lesson.keys[phase]?.label;
      if (label) speak(label);
    }
  }, [phase, playing, settings.voice, lesson]);
  useEffect(() => stopSpeaking, []);

  // Keyboard: Space/K play or pause, ←/→ step through, F full screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'k') toggle();
      else if (key === 'arrowright') goToPhase(phase + 1);
      else if (key === 'arrowleft') goToPhase(phase - 1);
      else if (key === 'f' && fullscreen.supported) fullscreen.toggle();
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [toggle, goToPhase, phase, fullscreen]);

  const learned = progress.learned.includes(lesson.id);
  const done = learnedCount(progress, LESSONS);
  const total = LESSONS.length;
  const next = nextLesson(LESSONS, lesson.id, progress);
  const step = lesson.keys[phase];

  return (
    <article className={styles.player} aria-labelledby="lesson-title">
      <div className={styles.progress}>
        <span>
          {done === total ? `All ${total} lessons learned` : `${done} of ${total} lessons learned`}
        </span>
        <div className={styles.progressBar}>
          <ProgressBar value={done} max={total} label="Lessons learned" />
        </div>
      </div>

      <header className={styles.header}>
        <p className="eyebrow">
          Lesson {lesson.number} of {total} · {lesson.level}
        </p>
        <h1 id="lesson-title" className={styles.title}>
          {lesson.title}
        </h1>
        <p className={styles.summary}>{lesson.summary}</p>
      </header>

      {/* The "theater" is what goes full screen: the stage plus its controls. */}
      <div ref={theaterRef} className={styles.theater} data-fullscreen={fullscreen.active}>
        <LessonStage
          ref={stageRef}
          lesson={lesson}
          timeline={timeline}
          timeRef={timeRef}
          phase={phase}
          playing={playing}
          revision={revision}
          palette={palette}
          mirror={settings.leftHanded}
          ghosts={settings.ghosts}
          racketPath={settings.racketPath}
        />
        <Scrubber
          ref={scrubberRef}
          timeline={timeline}
          steps={lesson.keys}
          time={initialTime}
          onSeek={seek}
        />
        <PlayerControls
          playing={playing}
          onToggle={toggle}
          onPrevStep={() => {
            goToPhase(phase - 1);
          }}
          onNextStep={() => {
            goToPhase(phase + 1);
          }}
          settings={settings}
          onChange={updateSettings}
          figureOptions={lesson.kind === 'figure'}
          fullscreen={fullscreen.supported ? fullscreen : undefined}
        />
      </div>

      {/* Announces the step only when the learner moves it by hand, not on every frame. */}
      <p className="visually-hidden" aria-live="polite">
        {!playing && step ? `Step ${phase + 1}: ${step.label}. ${step.cue}.` : ''}
      </p>

      <p className={styles.hint}>
        Keyboard: <kbd>Space</kbd> play or pause · <kbd>←</kbd> <kbd>→</kbd> previous or next step
        {fullscreen.supported && (
          <>
            {' '}
            · <kbd>F</kbd> full screen
          </>
        )}
      </p>

      <StepList steps={lesson.keys} current={phase} onSelect={goToPhase} />

      <LessonNotes lesson={lesson} />

      <div className={styles.finish}>
        <Button
          aria-pressed={learned}
          onClick={() => {
            progressStore.set((p) => toggleLearned(p, lesson.id));
          }}
          icon={
            <span className={styles.tick} data-on={learned} aria-hidden="true">
              {learned && <CheckIcon width={12} height={12} strokeWidth={3} />}
            </span>
          }
        >
          {learned ? 'Learned' : 'Mark as learned'}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            void navigate(`/lessons/${next.id}`);
          }}
        >
          Next: {next.title}
          <ChevronRightIcon />
        </Button>
      </div>
    </article>
  );
}
