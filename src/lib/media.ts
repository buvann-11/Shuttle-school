import { useMemo, useSyncExternalStore } from 'react';

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
