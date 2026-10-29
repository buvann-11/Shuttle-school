import { useMemo } from 'react';
import type { Palette } from '@/engine/render';
import { usePrefersDark } from '@/lib/media';
import { useSettings } from '@/lib/settings';

const FALLBACK: Palette = {
  court: '#1f6a53',
  courtShade: '#1a5c48',
  accent: '#bf4019',
  figureNear: '#f4f7f5',
  figureFar: 'rgba(244,247,245,.45)',
  racketSide: '#ffc9b3',
  cork: '#ffffff',
  skirt: '#f2efe6',
  skirtEdge: '#2a2a2a',
};

export function readPalette(root: HTMLElement = document.documentElement): Palette {
  const cs = getComputedStyle(root);
  const v = (name: string, fallback: string) => cs.getPropertyValue(`--${name}`).trim() || fallback;
  return {
    court: v('court', FALLBACK.court),
    courtShade: v('court-shade', FALLBACK.courtShade),
    accent: v('accent', FALLBACK.accent),
    figureNear: v('figure-near', FALLBACK.figureNear),
    figureFar: v('figure-far', FALLBACK.figureFar),
    racketSide: v('racket-side', FALLBACK.racketSide),
    cork: v('cork', FALLBACK.cork),
    skirt: v('skirt', FALLBACK.skirt),
    skirtEdge: v('skirt-edge', FALLBACK.skirtEdge),
  };
}

/** Canvas colours for the current theme; recomputed when the theme changes. */
export function usePalette(): Palette {
  const { theme } = useSettings();
  const prefersDark = usePrefersDark();
  // theme/prefersDark are the cache keys: the CSS variables change with them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readPalette(), [theme, prefersDark]);
}
