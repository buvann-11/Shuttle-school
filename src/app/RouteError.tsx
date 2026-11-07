import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import styles from './NotFound.module.css';

/** Shown instead of a blank screen if anything throws while rendering. */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <main className={styles.notFound} aria-labelledby="err-title">
      <p className="eyebrow">Let</p>
      <h1 id="err-title">Something went wrong</h1>
      <p>
        Sorry, this page hit a problem. Your progress is safe. Reloading usually fixes it; if not,
        head back to the lessons.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload
        </button>
        <Link className={styles.secondary} to="/">
          Back to lessons
        </Link>
      </div>
      {detail && (
        <details className={styles.detail}>
          <summary>Technical details</summary>
          <code>{detail}</code>
        </details>
      )}
    </main>
  );
}
