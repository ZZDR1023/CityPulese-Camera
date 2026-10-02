import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Visual checks never upload references or call a model. Optional input remains local.
const server = createServer();await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const out = new URL('../artifacts/chu-art/', import.meta.url);await mkdir(out, {recursive: true});
const input = process.env.ART_TEST_IMAGE || fileURLToPath(new URL('../test/fixtures/travel-person.png', import.meta.url));
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox']});
const results = [];
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({viewport: {width, height: 900}});const errors = [];
    page.on('pageerror', e => errors.push(e.message));page.on('console', m => {if (m.type() === 'error' && /Content Security Policy/.test(m.text())) errors.push(m.text());});
    let calls = 0;
    await page.route('**/api/story', r => {calls++;return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({title: '收藏一份古城的温柔', body: '一直期待能远远望一眼古城的轮廓，在心里描摹宾阳楼的风景。把这一纸安静的心绪好好珍藏，愿漫长岁月里，总有这样宁静辽阔的期待相伴。', mode: 'mock-test'})});});
    await page.goto(base);await page.waitForFunction(() => document.querySelector('#place').options.length > 1);
    await page.locator('#album').setInputFiles(input);await page.waitForFunction(() => !document.querySelector('#generate').disabled);
    await page.locator('#mood').fill('把这一刻收藏，给下一次探索留一点期待。');await page.locator('#generate').click();await page.waitForFunction(() => !document.querySelector('#save').disabled);
    await page.locator('input[name=paper-theme][value=chuyun]').check();
    const {headerMarkup, ensureDisplayFont} = await page.evaluate(async () => {
      const art = await import('/chu-artwork.js');await art.ensureDisplayFont();
      return {headerMarkup: true, ensureDisplayFont: document.fonts.check('46px "CityPulse Display"', '荆州 · 楚韵纪念')};
    });assert.equal(headerMarkup, true);assert.equal(ensureDisplayFont, true);
    const titleProperties = [];
    for (const format of ['paper', 'passport']) {
      await page.locator(`input[name=paper-format][value=${format}]`).check();await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const title = document.querySelector('.chu-header-svg text[font-size="46"]');
        const paper = document.querySelector('#paper');const header = document.querySelector('#edition-band');const photo = document.querySelector('.photo-window');
        const stamp = document.querySelector('#memory-stamp');const mood = document.querySelector('.passport-mood');
        return {title: title.textContent, font: getComputedStyle(title).fontFamily, size: getComputedStyle(title).fontSize,
          overflow: document.documentElement.scrollWidth > innerWidth,
          headerAbovePhoto: header.getBoundingClientRect().bottom <= photo.getBoundingClientRect().top + 6,
          stampAboveMood: stamp.getBoundingClientRect().bottom <= mood.getBoundingClientRect().top + 10,
          brickCount: paper.querySelectorAll('.chu-brick').length, corners: paper.querySelectorAll('.chu-header-svg .chu-corner').length};
      });assert.equal(metrics.overflow, false);assert.equal(metrics.brickCount, 2);assert.equal(metrics.corners, 2);assert.equal(metrics.headerAbovePhoto, true);if (format === 'passport') assert.equal(metrics.stampAboveMood, true);
      titleProperties.push({title: metrics.title, font: metrics.font, size: metrics.size});
      await page.locator('#paper').screenshot({path: fileURLToPath(new URL(`${format}-preview-${width}.png`, out)), animations: 'disabled'});
      await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state: 'visible'});await page.locator('#export-image').evaluate(el => el.decode());
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download').click()]);await download.saveAs(fileURLToPath(new URL(`${format}-export-${width}.png`, out)));await page.locator('#close-dialog').click();
    }
    assert.deepEqual(titleProperties[0], titleProperties[1]);assert.equal(calls, 1);
    const renderChecks = await page.evaluate(async () => {
      const art = await import('/chu-artwork.js');const {renderPaper} = await import('/paper-renderer.js');await art.ensureDisplayFont();
      const image = new Image();image.src = document.querySelector('#photo').src;await image.decode();
      const place = {id: 'jingzhou-wall', name: '荆州古城墙 · 宾阳楼', fact: '文化资料仅用于纪念。'};
      const passport = {kind: 'wish', stamp: '向往印章', boundary: '虚拟旅拍 · 不代表真实到访', mood: '期待'.repeat(50), discovery: '了解城市'.repeat(20), next: {name: '张居正故居', reason: '继续探索'.repeat(10)}};
      const originalFillText = CanvasRenderingContext2D.prototype.fillText;const logs = [];
      CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {logs.push({text, font: this.font, y});return originalFillText.call(this, text, x, y, ...rest);};
      let paper, documentCanvas;
      try {
        for (const format of ['paper', 'passport']) {
          const canvas = renderPaper({photo: image, place, story: {title: '长标题'.repeat(6), body: '纪念心情'.repeat(30)}, date: '2026.10.02', photoStyle: 'travel', theme: 'chuyun', format, passport});
          if (format === 'paper') paper = canvas;else documentCanvas = canvas;
        }
      } finally {CanvasRenderingContext2D.prototype.fillText = originalFillText;}
      const titles = logs.filter(l => l.text === art.chuHeaderTitle);
      const ctx = paper.getContext('2d');const photoTop = 220;
      // Verify an interior image sample equals the source render: ornament layer
      // never overlays, replaces or recolors the supplied photograph.
      const expected = document.createElement('canvas');expected.width = 1200;expected.height = paper.height;
      const h = Math.min(2200, Math.round(1040 * image.naturalHeight / image.naturalWidth));const w = Math.min(1040, Math.round(h * image.naturalWidth / image.naturalHeight));
      expected.getContext('2d').drawImage(image, (1200 - w) / 2, photoTop, w, h);
      const x = 600, y = photoTop + Math.floor(h / 2);
      return {titles, photoPixel: [...ctx.getImageData(x, y, 1, 1).data], sourcePixel: [...expected.getContext('2d').getImageData(x, y, 1, 1).data], height: documentCanvas.height,
        bottomMargin: documentCanvas.height - Math.max(...logs.filter(l => l.y > 220).map(l => l.y))};
    });assert.equal(renderChecks.titles.length, 2);assert.equal(renderChecks.titles[0].font, renderChecks.titles[1].font);assert.deepEqual(renderChecks.photoPixel, renderChecks.sourcePixel);assert.ok(renderChecks.height < 6500);assert.ok(renderChecks.bottomMargin > 100);assert.deepEqual(errors, []);
    results.push({width, titleProperties, renderChecks, pageErrors: errors, modelCalls: 0});await page.close();
  }
  await writeFile(new URL('results.json', out), JSON.stringify({passed: true, localReferenceOnly: true, results}, null, 2));console.log(JSON.stringify({passed: true, results}, null, 2));
} finally {await browser.close();server.closeAllConnections();await new Promise(r => server.close(r));}
