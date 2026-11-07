import { act, renderHook } from '@testing-library/react';
import { useAfterFirstIdle, useInView, usePageVisible } from './media';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('usePageVisible', () => {
  it('follows document visibility', () => {
    let state: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state);
    const { result } = renderHook(() => usePageVisible());
    expect(result.current).toBe(true);
    act(() => {
      state = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });
});

describe('useInView', () => {
  it('reports intersection changes', () => {
    let fire: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof fire) {
          fire = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const el = document.createElement('div');
    const { result, unmount } = renderHook(() => useInView({ current: el }));
    expect(result.current).toBe(true);
    act(() => {
      fire([{ isIntersecting: false }]);
    });
    expect(result.current).toBe(false);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('assumes visible without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { result } = renderHook(() => useInView({ current: document.createElement('div') }));
    expect(result.current).toBe(true);
  });
});

describe('useAfterFirstIdle', () => {
  it('waits for an idle callback when available', () => {
    let idle: () => void = () => undefined;
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
      idle = cb;
      return 7;
    });
    vi.stubGlobal('cancelIdleCallback', cancel);
    const { result, unmount } = renderHook(() => useAfterFirstIdle());
    expect(result.current).toBe(false);
    act(() => {
      idle();
    });
    expect(result.current).toBe(true);
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('falls back to a timeout', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const { result } = renderHook(() => useAfterFirstIdle());
    expect(result.current).toBe(false);
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current).toBe(true);
  });
});
