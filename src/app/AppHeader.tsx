import { Link } from 'react-router';
import { AutoThemeIcon, LogoMark, MoonIcon, SunIcon } from '@/components/Icons';
import { updateSettings, useSettings, type Theme } from '@/lib/settings';
import styles from './AppHeader.module.css';

const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_LABEL: Record<Theme, string> = {
  system: 'Theme: match device',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

export function AppHeader() {
  const { theme } = useSettings();
  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : AutoThemeIcon;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <LogoMark />
          <span className={styles.wordmark}>Shuttle School</span>
        </Link>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => {
            updateSettings({ theme: NEXT_THEME[theme] });
          }}
          aria-label={`${THEME_LABEL[theme]}. Change theme`}
          title={THEME_LABEL[theme]}
        >
          <Icon width={20} height={20} />
        </button>
      </div>
    </header>
  );
}
