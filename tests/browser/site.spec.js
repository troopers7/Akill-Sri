import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const routes = ['home', 'projects', 'project-detail', 'services', 'temple-design', 'about', 'process', 'insights', 'contact', 'start-project'];

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all routes render without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1')).toHaveCount(1);
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        heading: document.querySelector('main h1').getBoundingClientRect().top,
        header: document.querySelector('header').getBoundingClientRect().bottom
      }));
      expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width + 1);
      expect(dimensions.heading, route).toBeGreaterThanOrEqual(dimensions.header);
    }
    expect(errors).toEqual([]);
  });
}

test('search retains focus; case study survives reload and browser back', async ({ page }) => {
  await page.goto('/#projects');
  const search = page.locator('#project-search-input');
  await search.fill('no-such-project');
  await expect(search).toBeFocused();
  await expect(page.locator('#projects-empty')).toBeVisible();
  await page.locator('#btn-reset-filters').click();
  await expect(search).toHaveValue('');
  const card = page.locator('.project-card:visible').nth(1);
  const title = await card.locator('h3').innerText();
  await card.click();
  await expect(page).toHaveURL(/project-detail\?id=/);
  await expect(page.locator('main h1')).toHaveText(title);
  await page.reload();
  await expect(page.locator('main h1')).toHaveText(title);
  await page.goBack();
  await expect(search).toBeVisible();
});

test('mobile menu and article dialog support keyboard dismissal and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#home');
  const toggle = page.locator('#mobile-menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('.mobile-nav-link[data-page="insights"]').click();
  const article = page.locator('.insight-card').first();
  await article.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#modal-close-insight')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#insight-reader-modal a')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(article).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/overlay-open/);
});

for (const width of [390, 1440]) {
  test(`planner preserves details, validates and exports at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#start-project');
    const next = () => page.locator('#wizard-form button[type="submit"]').click();
    await next();
    await next();
    await expect(page.locator('#wizard-error')).toContainText('land dimensions');
    await page.locator('#wizard-acreage').fill('3 acres');
    await page.locator('#wizard-prev').click();
    await next();
    await expect(page.locator('#wizard-acreage')).toHaveValue('3 acres');
    await page.evaluate(() => { location.hash = 'about'; });
    await expect(page.locator('.about-hero-grid')).toBeVisible();
    await page.evaluate(() => { location.hash = 'start-project'; });
    await expect(page.locator('#wizard-acreage')).toHaveValue('3 acres');
    await next();
    await page.locator('#wizard-deity').fill('Lord Shiva');
    await next();
    await page.locator('#wizard-footprint').selectOption({ index: 2 });
    await page.locator('[data-choice="stone"]').nth(1).click();
    await expect(page.locator('#wizard-footprint')).toHaveValue(/15,000 – 40,000/);
    await next();
    await page.locator('[data-choice="services"][aria-pressed="true"]').click();
    await next();
    await expect(page.locator('#wizard-error')).toContainText('at least one');
    await page.locator('[data-choice="services"]').first().click();
    await next();
    await page.locator('#wizard-patronName').fill('Akil Kumar');
    await page.locator('#wizard-email').fill('akil@example.com');
    await page.locator('#wizard-phone').fill('123');
    await next();
    await expect(page.locator('#wizard-error')).toContainText('phone');
    await page.locator('#wizard-phone').fill('+91 98765 43210');
    await page.locator('#wizard-notes').fill('Courtyard & carved lotus details.');
    await page.locator('#reference-file').setInputFiles({
      name: 'survey.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Sample reference')
    });
    await expect(page.locator('#wizard-patronName')).toHaveValue('Akil Kumar');
    await next();
    await expect(page.locator('.confirmation-card')).toContainText('Prepared locally');
    await expect(page.locator('.brief-review')).toContainText('3 acres');
    await expect(page.locator('.brief-review')).toContainText('survey.pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download-brief').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sri-akil-project-brief.txt');
    const text = await readFile(await download.path(), 'utf8');
    expect(text).toContain('Not submitted to the studio.');
    expect(text).toContain('Courtyard & carved lotus details.');
    await page.locator('#edit-brief').click();
    await expect(page.locator('#wizard-patronName')).toHaveValue('Akil Kumar');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('anatomy and process selection preserve keyboard focus', async ({ page }) => {
  await page.goto('/#temple-design');
  const pin = page.locator('[data-anatomy-pin]').first();
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(pin).toBeFocused();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#process');
  const stage = page.locator('[data-step-btn]').nth(2);
  await stage.click();
  await expect(stage).toBeFocused();
  await expect(stage).toHaveAttribute('aria-pressed', 'true');
});

test('contact page validates inputs and submits inquiry', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.locator('main h1')).toHaveText(/Connect with Our Master Architects/);
  await page.locator('#btn-submit-contact').click();
  await expect(page.locator('#contact-feedback')).toBeVisible();
  await expect(page.locator('#contact-feedback')).toHaveClass(/error/);

  await page.locator('#contact-name').fill('Sundar Raman');
  await page.locator('#contact-email').fill('sundar@example.com');
  await page.locator('#contact-phone').fill('+91 98400 12345');
  await page.locator('#contact-message').fill('Seeking Agama advisory for a monolithic Krishna granite Vimana on a 5-acre property.');
  await page.locator('#btn-submit-contact').click();

  await expect(page.locator('#contact-feedback')).toBeVisible();
  await expect(page.locator('#contact-feedback')).toHaveClass(/success/);
  await expect(page.locator('#contact-feedback')).toContainText('AKIL-INQ-');
});