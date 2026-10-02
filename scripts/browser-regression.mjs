import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from '../server.mjs';

// All generation requests are intercepted. No credentials or real AI calls.
process.env.AI_BASE_URL = 'https://mock.invalid/v1';process.env.AI_API_KEY = 'mock';process.env.AI_MODEL = 'mock';
process.env.IMAGE_BASE_URL = 'https://mock.invalid/v1';process.env.IMAGE_API_KEY = 'mock';process.env.IMAGE_MODEL = 'mock';
process.env.TRAVEL_IMAGE2_API_KEY = 'mock';process.env.TRAVEL_IMAGE25_API_KEY = 'mock';
const server = createServer();await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
const output = new URL(process.env.TEST_URL ? '../artifacts/production-regression/' : '../artifacts/optimization/', import.meta.url);await mkdir(output, {recursive: true});
const places = JSON.parse(await readFile(new URL('../data/places.json', import.meta.url)));
const scenes = JSON.parse(await readFile(new URL('../data/travel-scenes.json', import.meta.url)));
const fixture = await readFile(new URL('../test/fixtures/travel-person.png', import.meta.url));
const image = 'data:image/png;base64,' + fixture.toString('base64');
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']});
const results = [];
try {
  for (const viewport of [{width: 1440, height: 1100}, {width: 390, height: 844}]) {
    const context = await browser.newContext({viewport});const page = await context.newPage();
    const errors = [];page.on('pageerror', e => errors.push(e.message));page.on('console', m => {if (m.type() === 'error' && /Content Security Policy/.test(m.text())) errors.push(m.text());});
    let storyCalls = 0, imageCalls = 0, holdStory, holdImage, failStory = false, failImage = false;
    await page.route('**/api/story', async r => {
      storyCalls++;const input = r.request().postDataJSON();
      if (holdStory) {const wait = holdStory;holdStory = null;await wait;}
      try {await r.fulfill({status: failStory ? 503 : 200, contentType: 'application/json', body: JSON.stringify(failStory ? {error: '模拟文字服务故障'} : {title: `纪念${input.placeId === 'custom' ? input.customPlace : places.find(p => p.id === input.placeId).name}`.slice(0, 20), body: '这是自动化验证用模拟文案，未调用真实模型。把心情收藏，给下一次探索留一点期待。', mode: 'ai'})});} catch {}
    });
    for (const endpoint of ['travel', 'stylize']) await page.route(`**/api/${endpoint}`, async r => {
      imageCalls++;const input = r.request().postDataJSON();assert.equal(input.consent, true);
      assert.equal(await page.locator('#scene-next').isDisabled(), true);assert.equal(await page.locator('#toggle-custom-place').isDisabled(), true);
      if (holdImage) {const wait = holdImage;holdImage = null;await wait;}
      const scene = scenes.find(s => s.placeId === input.placeId);
      try {await r.fulfill({status: failImage ? 502 : 200, contentType: 'application/json', body: JSON.stringify(failImage ? {error: '模拟图像服务故障'} : {image, mode: endpoint === 'travel' ? 'ai-travel' : 'ai-image', placeId: input.placeId, scene, sceneImage: input.sceneImage, engine: input.engine, framing: input.framing, style: input.style})});} catch {}
    });
    await page.goto(base);await page.waitForFunction(count => document.querySelector('#place').options.length === count + 1, places.length);
    assert.equal(await page.locator('#generate').isDisabled(), true);
    const load = async () => {await page.locator('#album').setInputFiles({name: 'test.png', mimeType: 'image/png', buffer: fixture});await page.waitForFunction(() => !document.querySelector('#generate').disabled);};
    const generate = async () => {await page.locator('#generate').click();await page.waitForFunction(() => !document.querySelector('#save').disabled);};
    await load();
    // Basic culture catalog and dynamically counted options.
    for (const p of places) {await page.locator('#place').selectOption(p.id);assert.equal(await page.locator('#culture-fact').textContent(), p.fact);}
    await page.locator('#place').selectOption('jingzhou-wall');
    await page.locator('#mood').fill('和朋友把快乐留在荆州');await generate();
    const save = async name => {
      await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state: 'visible'});await page.locator('#export-image').evaluate(el => el.decode());
      const size = await page.locator('#export-image').evaluate(el => ({width: el.naturalWidth, height: el.naturalHeight}));assert.equal(size.width, 1200);assert.ok(size.height > 1000 && size.height < 6500);
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download').click()]);await download.saveAs(fileURLToPath(new URL(`${name}-${viewport.width}.png`, output)));await page.locator('#close-dialog').click();return size;
    };
    const beforeFormats = storyCalls;
    const exports = [];
    for (const format of ['paper', 'passport']) for (const theme of ['classic', 'chuyun']) {
      await page.locator(`input[name=paper-format][value=${format}]`).check();await page.locator(`input[name=paper-theme][value=${theme}]`).check();
      assert.equal(await page.locator('#paper').getAttribute('data-theme'), theme);assert.equal(await page.locator('#passport-details').isHidden(), format !== 'passport');
      exports.push({format, theme, ...await save(`${format}-${theme}`)});
    }
    assert.equal(storyCalls, beforeFormats);assert.equal(imageCalls, 0);
    assert.match(await page.locator('#passport-mood').textContent(), /和朋友/);assert.match(await page.locator('#stamp-boundary').textContent(), /用户记录/);
    await page.locator('#collect-memory').click();assert.equal(await page.locator('.collected-stamp').count(), 1);await page.locator('#collect-memory').click();assert.equal(await page.locator('.collected-stamp').count(), 1);
    const stored = await page.evaluate(() => localStorage.getItem('chengmai-memory-stamps-v1'));assert.ok(!stored.includes('快乐') && !stored.includes('data:'));assert.equal(JSON.parse(stored)[0].kind, 'memory');
    await page.screenshot({path: fileURLToPath(new URL(`passport-chuyun-ui-${viewport.width}.png`, output)), fullPage: true, animations: 'disabled'});
    await page.reload();await page.waitForFunction(() => document.querySelector('#place').options.length > 1);await page.locator('input[name=paper-format][value=passport]').check();assert.equal(await page.locator('.collected-stamp').count(), 1);
    await load();
    // Storage restrictions must not block generation, collecting or exporting.
    await generate();await page.evaluate(() => {window.reviewSetItem = Storage.prototype.setItem;Storage.prototype.setItem = function() {throw Error('review: storage disabled');};});
    await page.locator('#collect-memory').click();assert.match(await page.locator('#collection-status').textContent(), /存储不可用/);
    await page.evaluate(() => Storage.prototype.setItem = window.reviewSetItem);
    // In-flight lock and defensive stale-result check (programmatic change bypasses disabled UI).
    let release;holdStory = new Promise(r => release = r);await page.locator('#generate').click();await page.waitForFunction(() => document.querySelector('#generate').textContent.includes('正在生成'));
    for (const id of ['toggle-custom-place', 'cancel-custom-place', 'scene-prev', 'scene-next', 'rechoose-photo-btn']) assert.equal(await page.locator('#' + id).isDisabled(), true, id);
    await page.evaluate(() => {const p = document.querySelector('#place');p.value = 'jingzhou-museum';p.dispatchEvent(new Event('change'));});release();await page.waitForFunction(() => document.querySelector('#status').textContent.includes('已丢弃旧文案'));assert.equal(await page.locator('#save').isDisabled(), true);
    await generate();assert.match(await page.locator('#story-title').textContent(), /博物馆/);
    // Selecting a new place invalidates the old story; custom input is still supported.
    await page.locator('#toggle-custom-place').click();await page.locator('#custom-place-input').fill('沙市洋码头');assert.equal(await page.locator('#save').isDisabled(), true);await generate();assert.match(await page.locator('#story-title').textContent(), /洋码头/);assert.equal(await page.locator('#collect-memory').isDisabled(), true);await page.locator('#cancel-custom-place').click();
    failStory = true;await page.locator('#generate').click();await page.waitForFunction(() => document.querySelector('#status').textContent.includes('模拟文字服务故障'));assert.equal(await page.locator('#photo').isVisible(), true);assert.equal(await page.locator('#example').isHidden(), true);failStory = false;
    // All background carousels and all model/framing settings; no real AI.
    await page.locator('input[name=photo-style][value=travel]').check();assert.equal(await page.locator('#stylize').isDisabled(), true);await page.locator('#image-consent').check();
    for (const scene of scenes) {
      await page.locator('#travel-place').selectOption(scene.placeId);const list = scene.images || [{url: scene.image}];
      for (let i = 0; i < list.length; i++) {assert.equal(await page.locator('#scene-preview').getAttribute('src'), list[i].url);await page.locator('#scene-next').click();}
      assert.equal(await page.locator('#scene-counter').textContent(), `1 / ${list.length}`);
    }
    await page.locator('#travel-place').selectOption('jingzhou-wall');
    for (const engine of ['gemini', 'image2', 'image25']) for (const framing of ['balanced', 'scenic']) {
      await page.locator('#travel-engine').selectOption(engine);await page.locator('#travel-framing').selectOption(framing);await page.locator('#stylize').click();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('图片已应用'));
      assert.equal(await page.locator('#image-mode').textContent(), '虚拟旅拍图');
      assert.match(await page.locator('#travel-result-info').textContent(), engine === 'gemini' ? /快速/ : engine === 'image2' ? /标准/ : /精细/);
    }
    assert.match(await page.locator('#stamp-boundary').textContent(), /不代表真实到访/);assert.equal(await page.locator('#stamp-word').textContent(), '向往');await generate();await page.locator('#collect-memory').click();assert.equal(await page.locator('.collected-stamp').count(), 2);
    await page.locator('input[name=paper-theme][value=chuyun]').check();exports.push({format: 'wish', theme: 'chuyun', ...await save('wish-chuyun')});
    const cachedCalls = imageCalls;await page.locator('#travel-engine').selectOption('gemini');await page.locator('#travel-framing').selectOption('balanced');assert.equal(imageCalls, cachedCalls);assert.match(await page.locator('#image-status').textContent(), /缓存/);
    failImage = true;await page.locator('#stylize').click();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('模拟图像服务故障'));assert.equal(await page.locator('#photo').getAttribute('src'), image);failImage = false;
    let releaseImage;holdImage = new Promise(r => releaseImage = r);await page.locator('#stylize').click();await page.locator('#cancel-stylize').click();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('已取消等待'));releaseImage();await page.waitForTimeout(100);assert.equal(await page.locator('#photo').getAttribute('src'), image);
    // Even a programmatic setting change cannot apply a late image to new settings.
    let releaseStale;holdImage = new Promise(r => releaseStale = r);await page.locator('#stylize').click();
    await page.evaluate(() => {const model = document.querySelector('#travel-engine');model.value = 'image2';model.dispatchEvent(new Event('change'));});
    releaseStale();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('已丢弃旧图片'));
    // A next-stop change from fictional travel restores the original, invalidating export.
    await page.locator('#choose-next-stop').click();assert.equal(await page.locator('#place').inputValue(), 'zhang-juzheng');assert.equal(await page.locator('input[name=photo-style][value=original]').isChecked(), true);assert.equal(await page.locator('#save').isDisabled(), true);
    // Style modes, existing photo retention on failure, and cache.
    await page.locator('input[name=photo-style][value=anime]').check();await page.locator('#stylize').click();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('图片已应用'));assert.equal(await page.locator('#photo').getAttribute('src'), image);
    await page.locator('input[name=photo-style][value=original]').check();const styleCalls = imageCalls;await page.locator('input[name=photo-style][value=anime]').check();assert.equal(imageCalls, styleCalls);
    failImage = true;await page.locator('input[name=photo-style][value=watercolor]').check();await page.locator('#stylize').click();await page.waitForFunction(() => document.querySelector('#image-status').textContent.includes('模拟图像服务故障'));assert.equal(await page.locator('#photo').getAttribute('src'), image);failImage = false;
    await load();assert.equal(await page.locator('#image-consent').isChecked(), false);assert.equal(await page.locator('#image-mode').isHidden(), true);
    await page.locator('#clear-memories').click();assert.equal(await page.locator('.collected-stamp').count(), 0);
    // Landscape/portrait export and no horizontal overflow.
    for (const [width, height] of [[1200, 800], [800, 1200]]) {
      const data = await page.evaluate(([w, h]) => {const c = document.createElement('canvas');c.width = w;c.height = h;const x = c.getContext('2d');x.fillStyle = '#61795e';x.fillRect(0, 0, w, h);x.fillStyle = '#f7ead3';x.font = '36px sans-serif';x.fillText('TEST PHOTO', 40, 60);return c.toDataURL('image/png').split(',')[1];}, [width, height]);
      await page.locator('#album').setInputFiles({name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64')});await page.waitForFunction(() => !document.querySelector('#generate').disabled);await generate();await save(`ratio-${width}`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);assert.deepEqual(errors, []);
    await page.screenshot({path: fileURLToPath(new URL(`final-ui-${viewport.width}.png`, output)), fullPage: true, animations: 'disabled'});
    results.push({viewport, places: places.length, scenes: scenes.length, storyCalls, imageCalls, exports, errors});await context.close();
  }
  // Desktop camera opens through the new chooser, releases tracks and recovers denied permission.
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}});await page.goto(base);await page.locator('#choose-photo-btn').click();await page.locator('#btn-choice-camera').click();await page.waitForFunction(() => !document.querySelector('#take-photo').disabled);await page.locator('#take-photo').click();await page.waitForFunction(() => !document.querySelector('#generate').disabled);assert.equal(await page.locator('#camera-video').evaluate(el => el.srcObject), null);
  await page.locator('#rechoose-photo-btn').click();await page.locator('#btn-choice-camera').click();await page.waitForFunction(() => !document.querySelector('#take-photo').disabled);await page.evaluate(() => window.reviewTrack = document.querySelector('#camera-video').srcObject.getTracks()[0]);await page.locator('#close-camera').click();assert.equal(await page.evaluate(() => window.reviewTrack.readyState), 'ended');
  await page.evaluate(() => navigator.mediaDevices.getUserMedia = async () => {throw new DOMException('denied', 'NotAllowedError');});await page.locator('#rechoose-photo-btn').click();await page.locator('#btn-choice-camera').click();await page.waitForFunction(() => document.querySelector('#camera-status').textContent.includes('未获得相机权限'));await page.close();
  await writeFile(new URL('results.json', output), JSON.stringify({passed: true, mockGenerationOnly: true, camera: 'passed', results}, null, 2));console.log(JSON.stringify({passed: true, mockGenerationOnly: true, camera: 'passed', results}, null, 2));
} finally {await browser.close();server.closeAllConnections();await new Promise(r => server.close(r));}
