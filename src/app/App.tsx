import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { applyTheme, useSettings } from '@/lib/settings';
import { AppHeader } from './AppHeader';
import styles from './App.module.css';

export function AppLayout() {
  const { theme } = useSettings();
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <>
      {/* A plain #main link would clash with hash routing, so focus the target directly. */}
      <a
        className={styles.skip}
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
