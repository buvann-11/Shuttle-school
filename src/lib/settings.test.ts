import { applyTheme, DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('keeps valid values', () => {
    const s = { ...DEFAULT_SETTINGS, theme: 'dark', speed: 1, leftHanded: true };
    expect(parseSettings(s)).toEqual(s);
  });

  it('resets only the fields that are invalid', () => {
    expect(parseSettings({ theme: 'neon', speed: 3, leftHanded: true })).toEqual({
      ...DEFAULT_SETTINGS,
      leftHanded: true,
    });
  });

  it('rejects non-objects', () => {
    expect(parseSettings(null)).toBeUndefined();
    expect(parseSettings(4)).toBeUndefined();
  });
});

describe('applyTheme', () => {
  it('sets and clears data-theme', () => {
    const el = document.createElement('html');
    applyTheme('dark', el);
    expect(el.dataset.theme).toBe('dark');
    applyTheme('system', el);
    expect(el.dataset.theme).toBeUndefined();
  });
});
