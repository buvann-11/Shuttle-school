import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** Files that are never needed offline. */
const SKIP = [
  /\.map$/,
  /\.woff$/,
  /^404\.html$/,
  /^og-image\.png$/,
  /^robots\.txt$/,
  /^screenshots\//,
];

/** How long a page request waits for the network before falling back to the cached app. */
const NAVIGATION_TIMEOUT_MS = 3500;

/**
 * Emits `sw.js`, a precaching service worker for every built asset, so the app
 * works fully offline after the first visit. The cache name is a hash of every
 * cached file's contents, so any change in a deploy replaces the old cache.
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
      const hash = createHash('sha256');
      const assets: string[] = [];

      for (const [name, chunk] of Object.entries(bundle)) {
        if (SKIP.some((re) => re.test(name))) continue;
        assets.push(name);
        hash.update(name).update(chunk.type === 'chunk' ? chunk.code : chunk.source);
      }
      if (publicDir) {
        for (const file of listFiles(publicDir)) {
          const name = relative(publicDir, file).split('\\').join('/');
          if (SKIP.some((re) => re.test(name))) continue;
          assets.push(name);
          hash.update(name).update(readFileSync(file));
        }
      }
      assets.sort();
      const version = hash.digest('hex').slice(0, 12);

      const source = `/* Generated at build time. Do not edit. */
const CACHE = 'shuttle-school-${version}';
const SHELL = './';
const ASSETS = ${JSON.stringify([...new Set(['./', ...assets])])};

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

// Pages: network first so new deploys show up, but give up after a few seconds on
// a weak connection (a sports hall, say) and serve the cached app instead.
function navigate(request) {
  const network = fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
    }
    return response;
  });
  const fallback = new Promise((resolve) => {
    setTimeout(() => resolve(caches.match(SHELL)), ${NAVIGATION_TIMEOUT_MS});
  });
  return Promise.race([network.catch(() => caches.match(SHELL)), fallback]).then(
    (response) => response || network,
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }
  // Assets are content-hashed, so a cached copy is always correct.
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
