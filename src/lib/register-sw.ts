import { registerServiceWorker as register } from './pwa';

/** Registers the offline service worker in production builds only. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  register();
}
