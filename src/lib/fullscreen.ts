import { useCallback, useSyncExternalStore, type RefObject } from 'react';

const subscribe = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange);
  return () => {
    document.removeEventListener('fullscreenchange', onChange);
  };
};

export interface Fullscreen {
  /** False where element fullscreen isn't available (e.g. iPhone Safari). */
  supported: boolean;
  active: boolean;
  toggle: () => void;
}

/** Full-screen state for one element, kept in sync with Esc and browser UI. */
export function useFullscreen(ref: RefObject<HTMLElement | null>): Fullscreen {
  const active = useSyncExternalStore(
    subscribe,
    () => ref.current !== null && document.fullscreenElement === ref.current,
    () => false,
  );
  const supported =
    typeof document !== 'undefined' &&
    document.fullscreenEnabled &&
    typeof HTMLElement.prototype.requestFullscreen === 'function';

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const action = document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    action.catch(() => {
      // Denied (e.g. not triggered by a user gesture); nothing to recover.
    });
  }, [ref]);

  return { supported, active, toggle };
}
