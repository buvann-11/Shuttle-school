import { act, renderHook } from '@testing-library/react';
import {
  promptInstall,
  registerServiceWorker,
  resetPwaState,
  usePwa,
  watchInstallPrompt,
  type BeforeInstallPromptEvent,
} from './pwa';

function installEvent(outcome: 'accepted' | 'dismissed') {
  const e = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
  Object.assign(e, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  });
  return e;
}

class FakeContainer extends EventTarget {
  controller: object | null;
  register = vi.fn(() => Promise.resolve({}));
  constructor(controller: object | null) {
    super();
    this.controller = controller;
  }
}

beforeEach(() => {
  resetPwaState();
});

describe('install prompt', () => {
  it('captures the browser offer and shows it through usePwa', async () => {
    const stop = watchInstallPrompt();
    const { result } = renderHook(() => usePwa());
    expect(result.current.installPrompt).toBeNull();

    const e = installEvent('accepted');
    act(() => {
      window.dispatchEvent(e);
    });
    expect(e.defaultPrevented).toBe(true);
    expect(result.current.installPrompt).toBe(e);

    let accepted = false;
    await act(async () => {
      accepted = await promptInstall();
    });
    expect(e.prompt).toHaveBeenCalled();
    expect(accepted).toBe(true);
    expect(result.current.installPrompt).toBeNull();
    stop();
  });

  it('reports a dismissed prompt and does nothing without an offer', async () => {
    const stop = watchInstallPrompt();
    window.dispatchEvent(installEvent('dismissed'));
    expect(await promptInstall()).toBe(false);
    expect(await promptInstall()).toBe(false);
    stop();
  });

  it('forgets the offer once the app is installed', () => {
    const stop = watchInstallPrompt();
    const { result } = renderHook(() => usePwa());
    act(() => {
      window.dispatchEvent(installEvent('accepted'));
    });
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current.installPrompt).toBeNull();
    stop();
  });
});

describe('registerServiceWorker', () => {
  it('registers the worker once the page has loaded', () => {
    const c = new FakeContainer(null);
    registerServiceWorker(c as unknown as ServiceWorkerContainer, '/sw.js');
    // jsdom documents are already "complete".
    expect(c.register).toHaveBeenCalledWith('/sw.js');
  });

  it('flags an update when a new worker replaces an existing one', () => {
    const c = new FakeContainer({});
    const { result } = renderHook(() => usePwa());
    registerServiceWorker(c as unknown as ServiceWorkerContainer, '/sw.js');
    act(() => {
      c.dispatchEvent(new Event('controllerchange'));
    });
    expect(result.current.updateReady).toBe(true);
  });

  it('does not flag an update on a first install', () => {
    const c = new FakeContainer(null);
    const { result } = renderHook(() => usePwa());
    registerServiceWorker(c as unknown as ServiceWorkerContainer, '/sw.js');
    act(() => {
      c.dispatchEvent(new Event('controllerchange'));
    });
    expect(result.current.updateReady).toBe(false);
  });

  it('logs and carries on if registration fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const c = new FakeContainer(null);
    c.register.mockImplementation(() => Promise.reject(new Error('blocked')));
    registerServiceWorker(c as unknown as ServiceWorkerContainer, '/sw.js');
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does nothing where service workers are unsupported', () => {
    expect(() => {
      registerServiceWorker(undefined);
    }).not.toThrow();
  });
});
