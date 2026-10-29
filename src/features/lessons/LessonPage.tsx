import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router';
import { findLesson, LESSONS } from '@/content/library';
import { firstOpenLesson, progressStore, useProgress } from '@/lib/progress';
import { NotFound } from '@/app/NotFound';
import { LessonList } from './LessonList';
import { LessonPlayer } from './LessonPlayer';
import styles from './LessonPage.module.css';

export function LessonPage() {
  const { lessonId } = useParams();
  const progress = useProgress();
  const lesson = findLesson(lessonId);

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} · Shuttle School`;
  }, [lesson]);

  if (!lesson) return <NotFound />;

  return (
    <div className={styles.layout}>
      <LessonList lessons={LESSONS} learned={new Set(progress.learned)} />
      {/* Keyed so each lesson gets fresh playback state. */}
      <LessonPlayer key={lesson.id} lesson={lesson} />
    </div>
  );
}

/** `/` sends returning learners to the first lesson they haven't learned yet. */
export function ResumeRedirect() {
  const lesson = firstOpenLesson(LESSONS, progressStore.get());
  return <Navigate to={`/lessons/${lesson.id}`} replace />;
}
