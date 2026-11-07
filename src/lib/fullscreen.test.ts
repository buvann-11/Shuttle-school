import { act, renderHook } from '@testing-library/react';
import { useFullscreen } from './fullscreen';

describe('useFullscreen', () => {
  let current: Element | null = null;
  const el = document.createElement('div');

  beforeEach(() => {
    current = null;
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => current,
    });
    HTMLElement.prototype.requestFullscreen = vi.fn(function (this: Element) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- records which element went full screen
      current = this;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    document.exitFullscreen = vi.fn(() => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
  });

  it('enters and leaves full screen for its element', () => {
    const { result } = renderHook(() => useFullscreen({ current: el }));
    expect(result.current.supported).toBe(true);
    expect(result.current.active).toBe(false);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.active).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.active).toBe(false);
  });

  it('swallows a refused request', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn(() => Promise.reject(new Error('denied')));
    const { result } = renderHook(() => useFullscreen({ current: el }));
    act(() => {
      result.current.toggle();
    });
    await Promise.resolve();
    expect(result.current.active).toBe(false);
  });

  it('is unsupported when the browser disallows it, and ignores a missing element', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    const { result } = renderHook(() => useFullscreen({ current: null }));
    expect(result.current.supported).toBe(false);
    expect(() => {
      result.current.toggle();
    }).not.toThrow();
  });
});
