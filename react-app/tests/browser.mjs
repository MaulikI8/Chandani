import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { createServer as createViteServer } from 'vite';

// Use an installed Chrome/Chromium. No browser downloads or remote services are needed.
const moduleName = process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE_PATH)).href : 'playwright-core';
const { chromium } = await import(moduleName);
const executablePath = process.env.CHROMIUM_PATH ?? ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
const development = process.env.CHANDANI_BROWSER_MODE === 'development';
const output = resolve(development ? 'test-results/browser-development' : 'test-results/browser');
await mkdir(output, { recursive: true });
const report = { mode: development ? 'development' : 'production', checks: [], responsive: [], visual: [], preservedRegions: [], consoleErrors: [] };
let vite;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const reference = pathname.startsWith('/reference/');
    if (!reference && vite) { vite.middlewares(request, response); return; }
    const base = resolve(reference ? '../source' : 'dist');
    let file = resolve(base, `.${reference ? pathname.slice('/reference'.length) : pathname}`);
    if (file !== base && !file.startsWith(base + sep)) { response.writeHead(403).end(); return; }
    if (!extname(file) || (!reference && ['index.html', 'atelier.html'].some(name => file.endsWith(name)))) file = resolve(base, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { response.writeHead(404).end(); }
});
let browser;
const check = async (name, fn) => { await fn(); report.checks.push(name); console.log(`PASS ${name}`); };
const visible = async locator => { await locator.waitFor({ state: 'visible', timeout: 5000 }); };
const click = (page, name) => (name === 'Try the room' ? page.locator('.try-room-launch') : page.getByRole('button', { name, exact: true })).click();
const choose = (dialog, label) => dialog.getByRole('button', { name: label, exact: true }).click();
async function imagesReady(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => {
      image.loading = 'eager';
      return image.complete ? Promise.resolve() : new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); });
    }));
  });
  const broken = await page.locator('img[src]').evaluateAll(images => images.filter(image => {
    const src = image.getAttribute('src');
    return src && src.trim() !== '' && (!image.complete || image.naturalWidth === 0);
  }).map(image => image.currentSrc || image.src));
  assert.deepEqual(broken, [], 'Every photograph must load successfully');
}
async function noOverflow(page, width, name) {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth,
    dialogs: [...document.querySelectorAll('dialog[open]')].map(el => ({ width: el.clientWidth, scroll: el.scrollWidth })) }));
  assert.ok(size.document <= size.viewport + 1, `${name} overflows at ${width}: ${JSON.stringify(size)}`);
  for (const d of size.dialogs) assert.ok(d.scroll <= d.width + 1, `${name} dialog overflows at ${width}`);
  report.responsive.push({ page: name, width, horizontalOverflow: false });
}
function difference(before, after) {
  const a = PNG.sync.read(before), b = PNG.sync.read(after);
  const widthDiff = Math.abs(a.width - b.width);
  const heightDiff = Math.abs(a.height - b.height);
  if (widthDiff > 2 || heightDiff > 2) return { ratio: 1, dimensionsMatch: false, before: [a.width, a.height], after: [b.width, b.height] };
  const minW = Math.min(a.width, b.width), minH = Math.min(a.height, b.height);
  let changed = 0;
  for (let y = 0; y < minH; y++) {
    for (let x = 0; x < minW; x++) {
      const pA = (y * a.width + x) * 4, pB = (y * b.width + x) * 4;
      if (Math.max(...[0, 1, 2].map(i => Math.abs(a.data[pA + i] - b.data[pB + i]))) > 12) changed++;
    }
  }
  return { ratio: changed / (minW * minH), dimensionsMatch: true, before: [a.width, a.height], after: [b.width, b.height] };
}

try {
  if (development) vite = await createViteServer({ server: { middlewareMode: true, ws: false, hmr: false } });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.consoleErrors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await page.goto(origin);

  await check('One warm room toolbar, working light controls, crossfades and live reduced-motion preference', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await imagesReady(page);
    assert.equal(await page.locator('.glass-surface').count(), 0);
    await page.locator('#categories').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#categories')).opacity === '1');
    await page.locator('.desktop-nav').getByRole('button', { name: 'Try the room', exact: true }).click();
    const dialog = page.locator('#tryRoom');
    const toolbar = dialog.locator('.glass-surface');
    assert.equal(await toolbar.count(), 1);
    await page.waitForFunction(() => !document.querySelector('#tryRoom input[type=range]')?.disabled);
    await toolbar.getByRole('button', { name: 'Evening', exact: true }).click();
    assert.equal(await dialog.locator('.try-stage').getAttribute('data-light'), 'evening');
    await dialog.locator('.try-stage').screenshot({ path: resolve(output, 'room-glass-evening.png'), animations: 'disabled' });
    await toolbar.getByRole('button', { name: 'Day', exact: true }).click();
    await dialog.locator('.try-stage').screenshot({ path: resolve(output, 'room-glass-day.png'), animations: 'disabled' });
    for (const name of ['Dining room', 'Bedroom', 'Kitchen']) await choose(dialog, name);
    await page.waitForFunction(() => {
      const frame = document.querySelector('.try-frame');
      return !frame.querySelector('input').disabled && frame.querySelectorAll('img').length === 2 &&
        [...frame.querySelectorAll('img')].every(img => img.complete && getComputedStyle(img).opacity === '1');
    });
    assert.equal(await dialog.locator('.try-frame img[aria-hidden=true]').count(), 0, 'Outgoing images must be removed');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => {
      const surface = document.querySelector('.glass-surface');
      return surface.classList.contains('glass-surface--fallback') && getComputedStyle(surface).backdropFilter === 'none';
    });
    await choose(dialog, 'Living room');
    await page.waitForFunction(() => !document.querySelector('#tryRoom input[type=range]')?.disabled);
    assert.ok(await dialog.locator('.try-frame img').evaluateAll(imgs => imgs.every(img => getComputedStyle(img).opacity === '1')));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.glass-surface').count(), 0);
    await page.goto(origin);
  });

  await check('Direct navigation entry, non-drag comparison controls and contextual screen-reader labels', async () => {
    const entry = page.locator('.desktop-nav').getByRole('button', { name: 'Try the room', exact: true });
    await entry.click();
    const dialog = page.getByRole('dialog', { name: 'See what a piece changes.' });
    await visible(dialog);
    const slider = dialog.getByRole('slider', { name: 'Compare with sofa and without sofa' });
    await page.waitForFunction(() => !document.querySelector('#tryRoom input[type=range]')?.disabled);
    assert.match(await slider.getAttribute('aria-valuetext'), /with sofa.*without sofa/);
    await choose(dialog, 'Show less: With sofa'); assert.equal(await slider.inputValue(), '62');
    await choose(dialog, 'Show more: With sofa'); assert.equal(await slider.inputValue(), '72');
    await slider.focus(); await page.keyboard.press('Home'); assert.equal(await slider.inputValue(), '0');
    assert.equal(await slider.getAttribute('aria-valuetext'), 'Without sofa');
    await page.keyboard.press('End'); assert.equal(await slider.inputValue(), '100');
    assert.ok(await dialog.getByRole('button', { name: 'Show more: With sofa', exact: true }).isDisabled());
    await choose(dialog, 'Kitchen');
    assert.equal(await dialog.getByRole('slider').getAttribute('aria-label'), 'Compare kitchen concept and before the design');
    await page.keyboard.press('Escape');
    assert.ok(await entry.evaluate(el => el === document.activeElement));
  });

  await check('Hero, all four room scenes and numbered hotspots', async () => {
    await click(page, 'Explore this room');
    await visible(page.locator('.scene.exploring'));
    for (const [label, id, count] of [['01 Living room', 'living', 3], ['02 Kitchen', 'kitchen', 3], ['03 Bedroom', 'bedroom', 3], ['04 Dining', 'dining', 2]]) {
      await page.locator('.room-tabs').getByRole('button', { name: label, exact: true }).click();
      await page.waitForFunction((expectedId) => new URL(window.location.href).searchParams.get('room') === expectedId, id);
      await page.waitForFunction((c) => document.querySelectorAll('.hotspot').length === c, count);
      assert.equal(new URL(page.url()).searchParams.get('room'), id);
      assert.equal(await page.locator('.hotspot').count(), count);
      for (const [idx, button] of (await page.locator('.hotspot').all()).entries()) {
        await button.click();
        await page.waitForFunction((i) => document.querySelectorAll('.hotspot')[i]?.getAttribute('aria-pressed') === 'true', idx);
        assert.equal(await button.getAttribute('aria-pressed'), 'true');
      }
    }
    await page.getByRole('button', { name: 'Return to introduction' }).click();
    assert.ok(await page.getByRole('button', { name: 'Explore this room' }).evaluate(el => el === document.activeElement));
  });
  await check('Category filtering, search and empty search results', async () => {
    await page.locator('.category').filter({ hasText: 'Carpets' }).click();
    await page.waitForFunction(() => document.querySelectorAll('#productGrid .product-card').length === 3);
    assert.equal(await page.locator('#productGrid .product-card').count(), 3);
    await click(page, 'Search the collection');
    const input = page.getByRole('searchbox'); await input.fill('not-a-product');
    await visible(page.getByText('No matches yet.', { exact: false }));
    await input.fill('SOFA');
    await page.waitForFunction(() => document.querySelectorAll('.search-row').length === 1);
    assert.equal(await page.locator('.search-row').count(), 1);
    await input.fill('kitchen'); await visible(page.getByRole('button', { name: 'Explore kitchen design' }));
    await page.keyboard.press('Escape');
    assert.ok(await page.getByRole('button', { name: 'Search the collection' }).evaluate(el => el === document.activeElement));
  });
  const cases = [
    ['sofa', 'Haven / Sofa', 'living', 'Sofa'], ['chalk', 'Frame / Chalk', 'living', 'Carpet'],
    ['dining-table', 'Arc / Dining table', 'dining', 'Dining table'], ['bed', 'Rest / Upholstered bed', 'bedroom', 'Bed'],
    ['clay', 'Frame / Clay', 'living', 'Carpet'], ['ink', 'Frame / Ink', 'living', 'Carpet'],
    ['side-table', 'Plinth / Side table', 'living', 'Side table'], ['dining-chair', 'Line / Dining chair', 'dining', 'Dining chairs'],
    ['lamp', 'Halo / Table light', 'bedroom', 'Table light'], ['wardrobe', 'Form / Wardrobe', 'bedroom', 'Wardrobe'],
  ];
  await check('All ten product detail entries, comparison images, keyboard and focus restoration', async () => {
    for (const [id, name, , label] of cases) {
      await page.goto(`${origin}/?product=${id}`);
      await visible(page.locator('#drawer').getByRole('heading', { name, exact: true }));
      const materials = page.locator('#drawer').getByRole('button', { name: 'Materials & finish' });
      await materials.click();
      assert.equal(await materials.getAttribute('aria-expanded'), 'true');
      await visible(page.locator('#drawer').getByRole('region', { name: 'Materials & finish' }));
      await materials.click();
      await click(page, 'Try in the room');
      const dialog = page.locator('#tryRoom'); await visible(dialog);
      await visible(dialog.getByRole('heading', { name, exact: true }));
      assert.equal(await dialog.locator('.try-items').getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
      const slider = dialog.getByRole('slider'); await slider.waitFor();
      await page.waitForFunction(() => !document.querySelector('#tryRoom input[type=range]')?.disabled);
      assert.ok(await dialog.locator('.try-frame > img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0)));
      await choose(dialog, 'With piece'); assert.equal(await slider.inputValue(), '100');
      await choose(dialog, 'Without piece'); assert.equal(await slider.inputValue(), '0');
      await choose(dialog, 'Compare'); const previous = Number(await slider.inputValue());
      await slider.focus(); await page.keyboard.press('ArrowRight'); assert.equal(Number(await slider.inputValue()), previous + 1);
      await page.keyboard.press('Escape'); await visible(page.locator('#drawer'));
      assert.ok(await page.getByRole('button', { name: 'Try in the room' }).evaluate(el => el === document.activeElement));
      await page.keyboard.press('Escape');
    }
  });
  await check('Pointer comparison, lighting, reset, expanded Escape and focus containment', async () => {
    await page.goto(origin); await click(page, 'Try the room');
    const dialog = page.locator('#tryRoom'); const slider = dialog.getByRole('slider');
    await page.waitForFunction(() => !document.querySelector('#tryRoom input[type=range]')?.disabled);
    const box = await slider.boundingBox(); const initial = Number(await slider.inputValue());
    await page.mouse.move(box.x + box.width * initial / 100, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * .3, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
    assert.ok(Math.abs(Number(await slider.inputValue()) - initial) > 10);
    await choose(dialog, 'Evening'); assert.equal(await dialog.locator('.try-stage').getAttribute('data-light'), 'evening');
    await choose(dialog, 'Reset view'); assert.equal(await slider.inputValue(), '72');
    await dialog.getByRole('button', { name: 'Expand room comparison' }).click();
    assert.match(await dialog.getAttribute('class'), /try-room-expanded/);
    for (let n = 0; n < 12; n++) {
      await page.keyboard.press('Tab');
      assert.ok(await dialog.locator('.try-stage').evaluate(el => el.contains(document.activeElement)), 'Expanded Tab order stays in the visible comparison');
    }
    await page.keyboard.press('Escape'); await visible(dialog);
    assert.doesNotMatch(await dialog.getAttribute('class'), /try-room-expanded/);
    for (let n = 0; n < 30; n++) {
      await page.keyboard.press('Tab');
      assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)));
    }
    await page.keyboard.press('Escape');
  });
  await check('Kitchen before/after and kitchen enquiry details', async () => {
    await click(page, 'Try the room'); const dialog = page.locator('#tryRoom');
    await choose(dialog, 'Kitchen'); await choose(dialog, 'Before design'); assert.equal(await dialog.getByRole('slider').inputValue(), '0');
    await choose(dialog, 'With design'); assert.equal(await dialog.getByRole('slider').inputValue(), '100');
    await choose(dialog, 'Discuss your kitchen');
    await page.getByLabel('Layout you have in mind').selectOption('Kitchen with an island');
    await page.getByLabel('Room dimensions').fill('4 m × 3 m');
    await click(page, 'Prepare my enquiry');
    assert.match(await page.getByLabel('YOUR MESSAGE').inputValue(), /Kitchen design[\s\S]*Kitchen with an island[\s\S]*4 m × 3 m/);
    await click(page, 'Edit details'); assert.equal(await page.getByLabel('Room dimensions').inputValue(), '4 m × 3 m');
    await page.keyboard.press('Escape');
  });
  await check('Shortlist persists between routes and reload; product and shortlist drafts retain details', async () => {
    await page.goto(`${origin}/?product=sofa`); await page.locator('#drawer').getByRole('button', { name: 'Save Haven / Sofa to shortlist' }).click(); await page.keyboard.press('Escape');
    await page.goto(`${origin}/carpet-studio?rug=ink`); await page.locator('.studio-foot').getByRole('button', { name: 'Save Frame / Ink to shortlist' }).click(); await page.reload();
    await click(page, 'Open shortlist'); assert.equal(await page.locator('.shortlist-row').count(), 2);
    await page.locator('#drawer').getByRole('button', { name: 'Remove Haven / Sofa', exact: true }).click();
    assert.equal(await page.locator('.shortlist-row').count(), 1);
    await page.locator('#drawer').getByRole('button', { name: 'Undo removal', exact: true }).click();
    assert.equal(await page.locator('.shortlist-row').count(), 2);
    await click(page, 'Enquire about your selection'); await click(page, 'Prepare my enquiry');
    assert.match(await page.getByLabel('YOUR MESSAGE').inputValue(), /Haven \/ Sofa[\s\S]*Frame \/ Ink/);
    await page.keyboard.press('Escape'); await page.goto(`${origin}/?product=wardrobe`);
    await click(page, 'Try in the room'); await page.locator('#tryRoom').getByRole('button', { name: 'Enquire about this piece' }).click();
    await click(page, 'Prepare my enquiry'); assert.match(await page.getByLabel('YOUR MESSAGE').inputValue(), /Form \/ Wardrobe.*Warm walnut tone/);
    await page.keyboard.press('Escape');
  });
  await check('Carpet studio colours, keyboard, day/evening, expand/reset and legacy routes', async () => {
    await page.goto(`${origin}/atelier.html?rug=ink`); await visible(page.locator('.rug-studio'));
    assert.equal(new URL(page.url()).pathname, '/carpet-studio');
    for (const colour of ['Clay', 'Chalk', 'Ink']) { await click(page, colour); assert.equal(new URL(page.url()).searchParams.get('rug'), colour.toLowerCase()); }
    const slider = page.getByRole('slider'); await page.waitForFunction(() => !document.querySelector('#comparison input[type=range]')?.disabled); await slider.focus(); await page.keyboard.press('ArrowLeft'); assert.equal(await slider.inputValue(), '64');
    await click(page, 'Evening'); assert.equal(await page.locator('#comparison').getAttribute('data-light'), 'evening');
    await page.getByRole('button', { name: 'Expand room comparison' }).click(); await visible(page.getByRole('dialog', { name: 'Expanded carpet comparison' }));
    await page.keyboard.press('Escape'); await click(page, 'Reset'); assert.equal(await slider.inputValue(), '65');
    assert.equal(new URL(page.url()).searchParams.get('rug'), 'clay');
  });
  await check('Configuration colours and bare floor preserve other slots; save and restore survives reload', async () => {
    await page.goto(origin); await click(page, 'Try the room'); await page.getByText('Keep your room selections', { exact: true }).click();
    const select = page.getByRole('combobox', { name: 'Carpet selection for living' });
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('chandani-room-configuration-v1')));
    await select.selectOption('ink');
    const changed = await page.evaluate(() => JSON.parse(localStorage.getItem('chandani-room-configuration-v1')));
    assert.equal(changed.rooms.living.sofa, before.rooms.living.sofa); assert.deepEqual(changed.rooms.bedroom, before.rooms.bedroom);
    await click(page, 'Save room selections'); await select.selectOption('bare');
    assert.match(await page.locator('.configuration-preview img').getAttribute('src'), /room-empty/);
    await click(page, 'Restore saved selections'); assert.equal(await select.inputValue(), 'ink');
    await page.reload(); await click(page, 'Try the room'); await page.getByText('Keep your room selections', { exact: true }).click();
    assert.equal(await page.getByRole('combobox', { name: 'Carpet selection for living' }).inputValue(), 'ink');
    await page.keyboard.press('Escape');
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(origin); await imagesReady(page);
    await noOverflow(page, width, 'home');
    await click(page, 'Try the room'); await imagesReady(page); await noOverflow(page, width, 'try-room');
    const frameBox = await page.locator('#tryRoom .try-frame').boundingBox();
    const glassBox = await page.locator('#tryRoom .glass-surface').boundingBox();
    if (width <= 760) assert.ok(glassBox.y >= frameBox.y + frameBox.height - 1, 'Narrow room toolbar must leave the divider unobstructed');
    else assert.ok(glassBox.y >= frameBox.y && glassBox.y + glassBox.height <= frameBox.y + frameBox.height, 'Desktop room toolbar floats over the photograph');
    for (const button of await page.locator('#tryRoom button').all()) {
      if (!(await button.isVisible())) continue;
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, `Room control smaller than 44px at ${width}: ${await button.textContent()}`);
    }
    const expanded = page.locator('#tryRoom').getByRole('button', { name: 'Expand room comparison', exact: true });
    await expanded.click(); await noOverflow(page, width, 'expanded-try-room');
    await visible(page.locator('#tryRoom').getByRole('group', { name: 'Adjust comparison' }));
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    if (width <= 768) { await click(page, 'Open menu'); await page.locator('.mobile-nav').getByRole('button', { name: 'Try the room' }).click(); await visible(page.locator('#tryRoom')); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); }
    await page.goto(`${origin}/carpet-studio`); await imagesReady(page); await noOverflow(page, width, 'carpet-studio');
    // Separate pristine context for visual comparisons, so saved badges do not affect the reference.
    const visualContext = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const visualPage = await visualContext.newPage();
    for (const [name, referenceUrl, reactUrl] of [['home', '/reference/index.html', '/'], ['studio', '/reference/atelier.html', '/carpet-studio']]) {
      const buffers = [];
      const regions = name === 'home' ? ['.scene-photo', '.hero-copy', '.categories', '.collection', '.kitchen-section', '.planning', '.contact', '.footer'] : ['.studio-heading', '.comparison-image', '.studio-collection', '.footer'];
      const referenceRegions = new Map();
      for (const [version, path] of [['reference', referenceUrl], ['react', reactUrl]]) {
        await visualPage.goto(origin + path); await imagesReady(visualPage);
        buffers.push(await visualPage.screenshot({ path: resolve(output, `${name}-${width}-${version}.png`), fullPage: true, animations: 'disabled' }));
        // Keep sticky navigation out of cropped content screenshots. Full-page
        // screenshots above retain the actual navigation and new controls.
        await visualPage.addStyleTag({ content: '.header { position: relative !important; }' });
        for (const selector of regions) {
          const capture = await visualPage.locator(selector).screenshot({ animations: 'disabled' });
          if (version === 'reference') referenceRegions.set(selector, capture);
          else report.preservedRegions.push({ page: name, width, selector, ...difference(referenceRegions.get(selector), capture) });
        }
      }
      report.visual.push({ page: name, width, review: 'Review the new navigation entry, larger launcher and comparison controls; these intentionally differ from the prototype.', ...difference(...buffers) });
    }
    await visualContext.close();
  }
  assert.deepEqual(report.consoleErrors, [], 'Application console errors');
  for (const region of report.preservedRegions) assert.ok(region.dimensionsMatch && region.ratio < .20, `Unchanged region needs visual review: ${JSON.stringify(region)}`);
  report.status = 'passed';
  console.log('PASS All visual comparison and preserved region checks passed!');
} catch (error) {
  report.status = 'failed-or-environment-blocked'; report.error = String(error); process.exitCode = 1;
  console.error(error);
} finally {
  await browser?.close(); server.close();
  await vite?.close();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
