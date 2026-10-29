import { act, screen } from '@testing-library/react';
import { progressStore } from '@/lib/progress';
import { settingsStore, updateSettings } from '@/lib/settings';
import { createMockContext } from '@/test/mock-canvas';
import { renderApp } from '@/test/render-app';

let mock: ReturnType<typeof createMockContext>;
let resize: ((entries: { contentRect: { width: number; height: number } }[]) => void) | null = null;

beforeEach(() => {
  progressStore.reload();
  settingsStore.reload();
  mock = createMockContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mock.ctx);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: typeof resize) {
        resize = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('lesson stage', () => {
  it('draws the scene on mount and sizes the canvas to the element', async () => {
    renderApp('/lessons/clear');
    const canvas = await screen.findByRole<HTMLCanvasElement>('img', { name: /demonstration/i });
    expect(mock.calls).toContain('fillRect');
    act(() => {
      resize?.([{ contentRect: { width: 400, height: 320 } }]);
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    expect(canvas.width).toBe(Math.round(400 * dpr));
    expect(canvas.height).toBe(Math.round(320 * dpr));
    expect(mock.calls).toContain('setTransform');
  });

  it('redraws when view options change', async () => {
    renderApp('/lessons/smash');
    await screen.findByRole('img', { name: /demonstration/i });
    const before = mock.calls.length;
    act(() => {
      updateSettings({ ghosts: true, leftHanded: true });
    });
    expect(mock.calls.length).toBeGreaterThan(before);
    expect(mock.badArgs).toEqual([]);
  });

  it('draws the grip lesson', async () => {
    renderApp('/lessons/grip');
    await screen.findByRole('img', { name: /grips demonstration/i });
    expect(mock.calls).toContain('fillText');
    expect(screen.queryByText(/racket side/i)).not.toBeInTheDocument();
  });
});
