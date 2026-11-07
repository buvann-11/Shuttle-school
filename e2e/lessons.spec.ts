import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('lessons', () => {
  test('a new learner lands on the first lesson and can work through it', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/#\/lessons\/grip$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grips');

    await page.getByRole('button', { name: /backhand thumb grip/i }).click();
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();

    await page.getByRole('button', { name: 'Mark as learned' }).click();
    await page.getByRole('button', { name: /next: ready stance/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ready stance');
  });

  test('progress survives a reload', async ({ page }) => {
    await page.goto('/#/lessons/clear');
    await page.getByRole('button', { name: 'Mark as learned' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Learned' })).toBeVisible();
    await expect(page.getByText('1 of 11 lessons learned')).toBeVisible();
  });

  test('the animation actually runs on the canvas', async ({ page }) => {
    await page.goto('/#/lessons/smash');
    const canvas = page.getByRole('img', { name: /smash demonstration/i });
    await expect(canvas).toBeVisible();
    const first = await canvas.screenshot();
    await page.waitForTimeout(400);
    const second = await canvas.screenshot();
    expect(first.equals(second)).toBe(false);
  });

  test('works offline after the first visit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'service worker check runs on Chromium');
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // let the worker take control of the page
    await context.setOffline(true);
    await page.goto('/#/lessons/drop');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drop shot');
    await context.setOffline(false);
  });
});

test.describe('player', () => {
  test('the seek bar scrubs through the stroke', async ({ page }) => {
    await page.goto('/#/lessons/clear');
    const slider = page.getByRole('slider', { name: 'Animation position' });
    const box = await slider.boundingBox();
    if (!box) throw new Error('slider not rendered');
    await page.mouse.click(box.x + box.width * 0.55, box.y + box.height / 2);
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuetext', /^Step [3-5] of 6/);
  });

  test('step buttons move one step at a time', async ({ page }) => {
    await page.goto('/#/lessons/smash');
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page.getByText('Step 2 of 6')).toBeVisible();
    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(page.getByText('Step 1 of 6')).toBeVisible();
  });
});

test.describe('production readiness', () => {
  test('loads with no console errors or security-policy violations', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(m.text());
    });
    page.on('pageerror', (e) => problems.push(e.message));
    await page.goto('/#/lessons/smash');
    await page.getByRole('button', { name: 'Next step' }).click();
    await page.getByRole('link', { name: /forehand clear/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forehand clear');
    expect(problems).toEqual([]);
  });

  test('ships a strict content security policy', async ({ page }) => {
    await page.goto('/');
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
  });

  test('has link-preview tags and a reachable preview image', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /og-image\.png$/,
    );
    const image = await request.get('/og-image.png');
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/png');
    const manifest = await request.get('/manifest.webmanifest');
    expect(((await manifest.json()) as { name: string }).name).toBe('Shuttle School');
  });

  test('the header does not jump when the install button appears', async ({ page }) => {
    await page.goto('/#/lessons/clear');
    const header = page.getByRole('banner');
    const before = await header.boundingBox();
    await page.evaluate(() => {
      const e = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: () => Promise.resolve(),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });
      window.dispatchEvent(e);
    });
    await expect(page.getByRole('button', { name: 'Install app' })).toBeVisible();
    expect((await header.boundingBox())?.height).toBe(before?.height);
  });

  test('the 404 page sends visitors to the app', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page).toHaveURL(/#\/lessons\/grip$/);
  });
});

test.describe('accessibility', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`has no axe violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/#/lessons/clear');
      await page.getByRole('button', { name: 'Pause' }).click();
      await page.getByText('View options').click();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }

  test('never scrolls sideways', async ({ page }) => {
    await page.goto('/#/lessons/clear');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the lesson list never overlaps the lesson', async ({ page }) => {
    await page.goto('/#/lessons/net-shot');
    const nav = await page.getByRole('navigation', { name: 'Lessons' }).boundingBox();
    const article = await page.getByRole('article').boundingBox();
    if (!nav || !article) throw new Error('lesson list or lesson not rendered');
    const sideBySide = nav.x + nav.width <= article.x;
    const stacked = nav.y + nav.height <= article.y;
    expect(sideBySide || stacked).toBe(true);
  });

  test('every control is at least 24px tall and primary controls 44px', async ({ page }) => {
    await page.goto('/#/lessons/clear');
    const sizes = await page.locator('main button, main a, header button').evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => ({
          name: el.textContent.trim(),
          h: el.getBoundingClientRect().height,
        })),
    );
    for (const s of sizes) expect(s.h, s.name).toBeGreaterThanOrEqual(24);
    const play = await page.getByRole('button', { name: 'Pause' }).boundingBox();
    expect(play?.height).toBeGreaterThanOrEqual(44);
  });
});
