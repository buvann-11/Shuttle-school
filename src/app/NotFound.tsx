import { Link } from 'react-router';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <section className={styles.notFound} aria-labelledby="nf-title">
      <p className="eyebrow">Out of bounds</p>
      <h1 id="nf-title">We couldn&apos;t find that page</h1>
      <p>The lesson may have been renamed. Head back to the course to keep going.</p>
      <Link className={styles.link} to="/">
        Back to lessons
      </Link>
    </section>
  );
}
