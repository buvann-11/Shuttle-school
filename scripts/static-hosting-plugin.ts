import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

const INLINE_SCRIPT = /<script>([\s\S]*?)<\/script>/g;

/**
 * Builds a strict Content Security Policy for the production page. Static hosts
 * like GitHub Pages can't send headers, so it is delivered as a <meta> tag. The
 * one inline script (the theme bootstrap) is allowed by its hash, not by
 * 'unsafe-inline'.
 */
export function contentSecurityPolicy(html: string): string {
  const hashes = [...html.matchAll(INLINE_SCRIPT)].map(
    ([, body = '']) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
  );
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
}

/** GitHub Pages serves 404.html for unknown paths; send visitors to the app instead. */
export function notFoundPage(base: string): string {
  const home = JSON.stringify(base);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${base}" />
    <title>Shuttle School</title>
    <script>location.replace(${home});</script>
  </head>
  <body>
    <p><a href="${base}">Go to Shuttle School</a></p>
  </body>
</html>
`;
}

/** Fonts used above the fold; preloading them stops text jumping when they arrive. */
const CRITICAL_FONTS = [
  /barlow-latin-400-normal/,
  /barlow-latin-600-normal/,
  /barlow-condensed-latin-700-normal/,
];

export function fontPreloads(files: readonly string[], base: string): string {
  return files
    .filter((f) => f.endsWith('.woff2') && CRITICAL_FONTS.some((re) => re.test(f)))
    .sort()
    .map((f) => `<link rel="preload" href="${base}${f}" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ');
}

/** Production-only hardening for static hosting: CSP, font preloads and a 404 page. */
export function staticHosting(): Plugin {
  let base = '/';
  return {
    name: 'shuttle-school:static-hosting',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const csp = contentSecurityPolicy(html);
        const preloads = fontPreloads(Object.keys(ctx.bundle ?? {}), base);
        return html
          .replace(
            '<meta charset="UTF-8" />',
            `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
          )
          .replace('</title>', `</title>\n    ${preloads}`);
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundPage(base) });
    },
  };
}
