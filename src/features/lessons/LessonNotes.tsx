import type { Lesson } from '@/content/types';
import styles from './LessonNotes.module.css';

export function LessonNotes({ lesson }: { lesson: Lesson }) {
  return (
    <div className={styles.notes}>
      <section className={styles.card} aria-labelledby="do-heading">
        <h2 id="do-heading" className={styles.title}>
          <span className={styles.dot} data-tone="good" aria-hidden="true" />
          Do this
        </h2>
        <ul className={styles.list}>
          {lesson.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <section className={styles.card} aria-labelledby="avoid-heading">
        <h2 id="avoid-heading" className={styles.title}>
          <span className={styles.dot} data-tone="bad" aria-hidden="true" />
          Avoid this
        </h2>
        <ul className={styles.list}>
          {lesson.mistakes.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <section className={styles.card} aria-labelledby="drill-heading">
        <h2 id="drill-heading" className={styles.title}>
          <span className={styles.dot} data-tone="accent" aria-hidden="true" />
          Drill
        </h2>
        <p>{lesson.drill}</p>
      </section>
    </div>
  );
}
