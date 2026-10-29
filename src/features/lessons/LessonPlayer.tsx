import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { CheckIcon, ChevronRightIcon } from '@/components/Icons';
import { ProgressBar } from '@/components/ProgressBar';
import { LESSONS } from '@/content/library';
import type { Lesson } from '@/content/types';
import { buildTimeline, timeOfPhase } from '@/engine/timeline';
import { usePrefersReducedMotion } from '@/lib/media';
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

  const timeline = useMemo(() => buildTimeline(lesson.keys.map((k) => k.duration)), [lesson]);
  const playback = usePlayback({
    timeline,
    speed: settings.speed,
    autoplay: !reducedMotion,
    initialTime: reducedMotion
      ? timeOfPhase(timeline, Math.min(REDUCED_MOTION_STEP, lesson.keys.length - 1))
      : 0,
    onFrame: () => stageRef.current?.draw(),
  });
  const { phase, playing, toggle, goToPhase } = playback;

  // Speak each step as it comes up while playing.
  useEffect(() => {
    if (playing && settings.voice) {
      const label = lesson.keys[phase]?.label;
      if (label) speak(label);
    }
  }, [phase, playing, settings.voice, lesson]);
  useEffect(() => stopSpeaking, []);

  // Keyboard: Space toggles playback, ←/→ step through.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToPhase(phase + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPhase(phase - 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [toggle, goToPhase, phase]);

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

      <LessonStage
        ref={stageRef}
        lesson={lesson}
        timeline={timeline}
        timeRef={playback.timeRef}
        phase={phase}
        playing={playing}
        revision={playback.revision}
        palette={palette}
        mirror={settings.leftHanded}
        ghosts={settings.ghosts}
        racketPath={settings.racketPath}
      />

      {/* Announces the step only when the learner moves it by hand, not on every frame. */}
      <p className="visually-hidden" aria-live="polite">
        {!playing && step ? `Step ${phase + 1}: ${step.label}. ${step.cue}.` : ''}
      </p>

      <PlayerControls
        playing={playing}
        onToggle={toggle}
        settings={settings}
        onChange={updateSettings}
        figureOptions={lesson.kind === 'figure'}
      />
      <p className={styles.hint}>
        Keyboard: <kbd>Space</kbd> play or pause · <kbd>←</kbd> <kbd>→</kbd> previous or next step
      </p>

      <StepList steps={lesson.keys} current={phase} onSelect={goToPhase} />

      <LessonNotes lesson={lesson} />

      <footer className={styles.finish}>
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
      </footer>
    </article>
  );
}
