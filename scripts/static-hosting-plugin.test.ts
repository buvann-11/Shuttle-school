import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, fontPreloads, notFoundPage } from './static-hosting-plugin';

describe('contentSecurityPolicy', () => {
  it('allows inline scripts only by their exact hash', () => {
    const body = 'console.log(1)';
    const csp = contentSecurityPolicy(
      `<head><script>${body}</script><script type="module" src="/a.js"></script></head>`,
    );
    const hash = createHash('sha256').update(body).digest('base64');
    expect(csp).toContain(`script-src 'self' 'sha256-${hash}'`);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).toContain("object-src 'none'");
  });

  it('works with no inline scripts', () => {
    expect(contentSecurityPolicy('<head></head>')).toContain("script-src 'self';");
  });
});

describe('notFoundPage', () => {
  it('sends visitors back to the app base path', () => {
    const html = notFoundPage('/shuttle-school/');
    expect(html).toContain('location.replace("/shuttle-school/")');
    expect(html).toContain('url=/shuttle-school/');
    expect(html).toContain('noindex');
  });
});

describe('fontPreloads', () => {
  it('preloads only the above-the-fold woff2 files, under the base path', () => {
    const html = fontPreloads(
      [
        'assets/barlow-latin-400-normal-x.woff2',
        'assets/barlow-latin-400-normal-x.woff',
        'assets/barlow-latin-500-normal-y.woff2',
        'assets/barlow-condensed-latin-700-normal-z.woff2',
        'assets/index.js',
      ],
      '/shuttle-school/',
    );
    expect(html.match(/rel="preload"/g)).toHaveLength(2);
    expect(html).toContain('href="/shuttle-school/assets/barlow-latin-400-normal-x.woff2"');
    expect(html).toContain('crossorigin');
    expect(html).not.toContain('500');
  });
});
