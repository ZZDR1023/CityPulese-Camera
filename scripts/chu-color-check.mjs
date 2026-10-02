// Reproduce browser auto-dark (not merely prefers-color-scheme) and protect
// the color-authored souvenir. All model routes are mocked; zero paid calls.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from '../server.mjs';
const out = new URL(process.env.TEST_URL ? '../artifacts/chu-refinement/public-colors/' : '../artifacts/chu-refinement/colors/', import.meta.url);
await mkdir(out, {recursive: true});
const server = process.env.TEST_URL ? null : createServer();
if (server) await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
const baseline = new Map(), exports = new Map(), results = [];
async function comparePreview(page, actual, expected) {
  // Font/photo antialiasing can vary with the screenshot's subpixel scroll origin.
  // Compare pixels with a tight tolerance, not compressed PNG bytes.
  return page.evaluate(async ([a, b]) => {
    const pixels = async source => {
      const img = new Image();img.src = 'data:image/png;base64,' + source;await img.decode();
      const canvas = document.createElement('canvas');canvas.width = img.naturalWidth;canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');ctx.drawImage(img, 0, 0);
      return {w: canvas.width, h: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data};
    };
    const x = await pixels(a), y = await pixels(b);
    if (x.w !== y.w || x.h !== y.h) return {sameSize: false};
    let total = 0, changed = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      let max = 0;
      for (let c = 0; c < 3; c++) {const delta = Math.abs(x.data[i + c] - y.data[i + c]);total += delta;max = Math.max(max, delta);}
      if (max > 32) changed++;
    }
    return {sameSize: true, meanChannelDifference: total / (x.w * x.h * 3), changedPixelRatio: changed / (x.w * x.h)};
  }, [actual.toString('base64'), expected.toString('base64')]);
}
try {
  for (const mode of ['light', 'dark-preference', 'forced-dark']) {
    const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', ...(process.env.ART_TEST_HTTP1 === '1' ? ['--disable-http2', '--disable-quic'] : []), ...(mode === 'forced-dark' ? ['--enable-features=WebContentsForceDark', '--force-dark-mode'] : [])]});
    try {
      for (const width of [320, 390, 1440]) {
        const page = await browser.newPage({viewport: {width, height: 1000}, deviceScaleFactor: 2, colorScheme: mode === 'light' ? 'light' : 'dark', reducedMotion: 'reduce'});
        page.setDefaultTimeout(process.env.TEST_URL ? 90000 : 30000);
        const errors = [];let mockedCalls = 0;
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => {if (m.type() === 'error' && /Content Security Policy/.test(m.text())) errors.push(m.text());});
        await page.route('**/api/story', route => {
          mockedCalls++;
          return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({title: '收藏这一刻的楚韵', body: '此文案仅用于本地颜色回归；没有发送照片或调用真实模型。', mode: 'mock-test'})});
        });
        await page.route('**/api/stylize', route => route.abort());
        await page.route('**/api/travel', route => route.abort());
        // The public page may still be loading a large, unrelated scene image.
        // Wait for the module/controls we exercise, not window.load for all media.
        await page.goto(base, {waitUntil: 'domcontentloaded', timeout: process.env.TEST_URL ? 90000 : 30000});
        await page.waitForFunction(() => document.querySelector('#place').options.length > 1);
        await page.locator('#album').setInputFiles(fileURLToPath(new URL('../test/fixtures/travel-person.png', import.meta.url)));
        await page.waitForFunction(() => !document.querySelector('#generate').disabled);
        await page.locator('#generate').click();await page.waitForFunction(() => !document.querySelector('#save').disabled);
        await page.locator('input[name=paper-theme][value=chuyun]').check();
        await page.evaluate(async () => {
          const art = await import('/chu-artwork.js');await art.ensureDisplayFont();
          document.querySelector('#paper').style.transform = 'none';
        });
        const metrics = await page.evaluate(() => ({rootScheme: getComputedStyle(document.documentElement).colorScheme,
          paperScheme: getComputedStyle(document.querySelector('#paper')).colorScheme,
          forcedColorAdjust: getComputedStyle(document.querySelector('#paper')).forcedColorAdjust,
          overflow: document.documentElement.scrollWidth > innerWidth}));
        assert.ok(metrics.rootScheme.includes('only') && metrics.rootScheme.includes('light'));
        assert.ok(metrics.paperScheme.includes('only'));assert.equal(metrics.forcedColorAdjust, 'none');assert.equal(metrics.overflow, false);
        for (const format of ['paper', 'passport']) {
          await page.locator(`input[name=paper-format][value=${format}]`).check();await page.evaluate(() => document.fonts.ready);
          const path = name => fileURLToPath(new URL(`${mode}-${width}-${format}-${name}.png`, out));
          for (const [name, selector] of [['header', '.chu-header-svg'], ['castle', '.chu-brick-left'], ['paper', '#paper']]) {
            const png = await page.locator(selector).screenshot({path: path(name), animations: 'disabled'});
            const key = `${width}/${format}/${name}`;
            if (mode === 'light') baseline.set(key, png);
            else {
              const diff = await comparePreview(page, png, baseline.get(key));
              // Full-page system serif glyph rasterization can differ between
              // browser processes; keep the artwork crops on the strict threshold.
              const maxMean = name === 'paper' ? 1.25 : .25, maxChanged = name === 'paper' ? .015 : .002;
              assert.ok(diff.sameSize && diff.meanChannelDifference < maxMean && diff.changedPixelRatio < maxChanged,
                `${mode} changed printed colors/layout: ${key}: ${JSON.stringify(diff)}`);
            }
          }
          await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state: 'visible'});
          const data = await page.locator('#export-image').evaluate(async img => {
            await img.decode();return {width: img.naturalWidth, height: img.naturalHeight};
          });
          const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download').click()]);
          await download.saveAs(path('export'));const png = await readFile(path('export'));
          const key = `${width}/${format}`;
          if (mode === 'light') exports.set(key, png);
          else {
            const diff = await comparePreview(page, png, exports.get(key));
            assert.ok(diff.sameSize && diff.meanChannelDifference < .25 && diff.changedPixelRatio < .002,
              `${mode} changed exported PNG: ${key}: ${JSON.stringify(diff)}`);
          }
          assert.equal(data.width, 1200);await page.locator('#close-dialog').click();
        }
        // Toggle back to classic and Chu; neither action should call a provider.
        await page.locator('input[name=paper-theme][value=classic]').check();
        assert.equal(await page.locator('.chu-header-svg').count(), 0);
        await page.locator('input[name=paper-theme][value=chuyun]').check();
        assert.equal(await page.locator('.chu-corner').count(), 2);
        assert.equal(mockedCalls, 1);assert.deepEqual(errors, []);
        results.push({mode, width, metrics, stablePreviewAndExportColorsAcrossColorModes: true, mockedStoryCalls: mockedCalls, realModelCalls: 0, errors});
        console.log(`PASS ${mode} / ${width}px / paper + passport`);
        await page.close();
      }
    } finally {await browser.close();}
  }
  await writeFile(new URL('results.json', out), JSON.stringify({passed: true, testUrl: base, http1Only: process.env.ART_TEST_HTTP1 === '1', results}, null, 2));
  console.log(JSON.stringify({passed: true, results}, null, 2));
} finally {if (server) {server.closeAllConnections();await new Promise(r => server.close(r));}}
