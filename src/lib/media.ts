import { useEffect, useMemo, useState, useSyncExternalStore, type RefObject } from 'react';

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined;
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  };
}

function snapshotOf(query: string) {
  return () =>
    typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useMemo(() => subscribeTo(query), [query]);
  const snapshot = useMemo(() => snapshotOf(query), [query]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)');

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
  };
};

/** False while the tab is in the background. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== 'hidden',
    () => true,
  );
}

/** Whether the element is at least partly on screen. Assumes visible where unsupported. */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry) setInView(entry.isIntersecting);
    });
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [ref]);
  return inView;
}

/**
 * Becomes true once the browser has had an idle moment after mount. Used to
 * start the animation after first paint so it never competes with page load.
 */
export function useAfterFirstIdle(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(
        () => {
          setReady(true);
        },
        { timeout: 600 },
      );
      return () => {
        window.cancelIdleCallback(id);
      };
    }
    const id = window.setTimeout(() => {
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }, []);
  return ready;
}
