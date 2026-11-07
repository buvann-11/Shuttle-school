import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { serviceWorker } from './service-worker-plugin';

type Hook = (...args: unknown[]) => void;

function build(publicFiles: Record<string, string>, bundle: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), 'sw-'));
  for (const [name, content] of Object.entries(publicFiles)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  const plugin = serviceWorker();
  (plugin.configResolved as Hook)({ publicDir: dir });
  let source = '';
  const ctx = { emitFile: (f: { source: string }) => (source = f.source) };
  (plugin.generateBundle as Hook).call(ctx, {}, bundle);
  const assets = JSON.parse(/const ASSETS = (\[.*\]);/.exec(source)?.[1] ?? '[]') as string[];
  const cache = /const CACHE = '([^']+)'/.exec(source)?.[1];
  return { source, assets, cache };
}

const bundle = (code: string) => ({
  'index.html': { type: 'asset', source: '<html></html>' },
  'assets/index-abc.js': { type: 'chunk', code },
  'assets/index-abc.js.map': { type: 'asset', source: '{}' },
  'assets/font.woff': { type: 'asset', source: 'x' },
  'assets/font.woff2': { type: 'asset', source: 'x' },
  '404.html': { type: 'asset', source: '' },
});

describe('service worker plugin', () => {
  it('precaches the app shell and assets, but not maps, legacy fonts or share images', () => {
    const { assets } = build(
      {
        'manifest.webmanifest': '{}',
        'icons/a.png': 'p',
        'og-image.png': 'o',
        'screenshots/w.png': 's',
      },
      bundle('a'),
    );
    expect(assets).toEqual([
      './',
      'assets/font.woff2',
      'assets/index-abc.js',
      'icons/a.png',
      'index.html',
      'manifest.webmanifest',
    ]);
  });

  it('changes the cache name when any cached file changes, even with the same name', () => {
    const a = build({ 'manifest.webmanifest': '{"v":1}' }, bundle('a'));
    const b = build({ 'manifest.webmanifest': '{"v":2}' }, bundle('a'));
    const c = build({ 'manifest.webmanifest': '{"v":1}' }, bundle('b'));
    const again = build({ 'manifest.webmanifest': '{"v":1}' }, bundle('a'));
    expect(a.cache).toBe(again.cache);
    expect(new Set([a.cache, b.cache, c.cache]).size).toBe(3);
  });

  it('falls back to the cached app when the network is slow or offline', () => {
    const { source } = build({}, bundle('a'));
    expect(source).toContain("request.mode === 'navigate'");
    expect(source).toMatch(/setTimeout\(\(\) => resolve\(caches\.match\(SHELL\)\), \d+\)/);
  });
});
