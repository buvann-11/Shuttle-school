import styles from './AppFooter.module.css';

export const REPO_URL = 'https://github.com/buvann-11/Shuttle-school';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>Your progress and settings stay on this device. Nothing is sent anywhere.</p>
        <p className={styles.meta}>
          <span>Shuttle School v{__APP_VERSION__}</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
