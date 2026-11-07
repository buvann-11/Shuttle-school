import { useSyncExternalStore } from 'react';

/** Chrome/Edge/Android only; not in the standard DOM typings. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  /** A newer version took over in the background; a reload shows it. */
  updateReady: boolean;
  /** Set when the browser offers to install the app. */
  installPrompt: BeforeInstallPromptEvent | null;
}

let state: PwaState = { updateReady: false, installPrompt: null };
const listeners = new Set<() => void>();

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => {
    l();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePwa(): PwaState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function dismissUpdate(): void {
  setState({ updateReady: false });
}

/** Shows the browser's install dialog. Resolves true if the user installed. */
export async function promptInstall(): Promise<boolean> {
  const event = state.installPrompt;
  if (!event) return false;
  setState({ installPrompt: null }); // the event can only be used once
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}

/** Listens for install offers. Safe to call more than once. */
export function watchInstallPrompt(target: Window = window): () => void {
  const onPrompt = (e: Event) => {
    e.preventDefault(); // keep the browser's mini-infobar away; we show our own button
    setState({ installPrompt: e as BeforeInstallPromptEvent });
  };
  const onInstalled = () => {
    setState({ installPrompt: null });
  };
  target.addEventListener('beforeinstallprompt', onPrompt);
  target.addEventListener('appinstalled', onInstalled);
  return () => {
    target.removeEventListener('beforeinstallprompt', onPrompt);
    target.removeEventListener('appinstalled', onInstalled);
  };
}

/**
 * Registers the offline service worker and reports when a new deploy has
 * taken over, so the UI can offer a reload. Production builds only.
 */
export function registerServiceWorker(
  container: ServiceWorkerContainer | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.serviceWorker,
  url = `${import.meta.env.BASE_URL}sw.js`,
): void {
  if (!container) return;
  // A page that already had a worker is being upgraded, not installed fresh.
  const hadController = container.controller !== null;
  container.addEventListener('controllerchange', () => {
    if (hadController) setState({ updateReady: true });
  });
  const register = () => {
    container.register(url).catch((err: unknown) => {
      console.warn('Service worker registration failed', err);
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** Test helper. */
export function resetPwaState(): void {
  state = { updateReady: false, installPrompt: null };
}
