import { useSyncExternalStore } from 'react';
import { createPersistentStore } from './persistent-store';

export const SPEEDS = [0.25, 0.5, 1] as const;
export type Speed = (typeof SPEEDS)[number];

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export interface Settings {
  theme: Theme;
  leftHanded: boolean;
  speed: Speed;
  racketPath: boolean;
  ghosts: boolean;
  voice: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  leftHanded: false,
  speed: 0.5,
  racketPath: true,
  ghosts: false,
  voice: false,
};

const oneOf = <T>(allowed: readonly T[], v: unknown, fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Field-by-field: one bad value resets that field only, not the whole object. */
export function parseSettings(raw: unknown): Settings | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    theme: oneOf(THEMES, r.theme, d.theme),
    leftHanded: bool(r.leftHanded, d.leftHanded),
    speed: oneOf(SPEEDS, r.speed, d.speed),
    racketPath: bool(r.racketPath, d.racketPath),
    ghosts: bool(r.ghosts, d.ghosts),
    voice: bool(r.voice, d.voice),
  };
}

export const settingsStore = createPersistentStore('settings', parseSettings, DEFAULT_SETTINGS);

export function updateSettings(patch: Partial<Settings>): void {
  settingsStore.set((s) => ({ ...s, ...patch }));
}

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
}

/** Mirrors the theme choice onto <html data-theme>, which the CSS tokens key off. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}
