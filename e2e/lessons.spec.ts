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
