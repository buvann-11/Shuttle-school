import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Emits `sw.js`, a precaching service worker for every built asset, so the app
 * works fully offline after the first visit. The cache name is a hash of the
 * asset list, so each deploy replaces the previous cache.
 */
export function serviceWorker(): Plugin {
  let publicDir = '';
  return {
    name: 'shuttle-school:service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      // Skip source maps and legacy .woff fonts (every supported browser uses .woff2).
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map') && !f.endsWith('.woff'));
      const fromPublic = publicDir
        ? listFiles(publicDir).map((f) => relative(publicDir, f).split('\\').join('/'))
        : [];
      const assets = ['./', ...new Set([...built, ...fromPublic])].sort();
      const version = createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 12);

      const source = `/* Generated at build time. Do not edit. */
const CACHE = 'shuttle-school-${version}';
const ASSETS = ${JSON.stringify(assets)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shuttle-school-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Network first for the page so new deploys show up; cached shell when offline.
    event.respondWith(fetch(request).catch(() => caches.match('./')));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
