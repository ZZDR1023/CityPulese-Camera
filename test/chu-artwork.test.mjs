import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from '../server.mjs';
import {headerMarkup, ornamentMarkup, postagePath, stampMarkup, stampPlaceName, chuHeaderTitle, displayFontFamily} from '../public/chu-artwork.js';

test('Chu artwork shares title/typeface across forms and uses two phoenix and two brick corners', () => {
  for (const format of ['paper', 'passport']) {
    const header = headerMarkup(format);
    assert.ok(header.includes(chuHeaderTitle));assert.ok(header.includes('font-size="46"'));
    assert.ok(header.includes('CityPulse Display, serif'));assert.ok(header.includes('scale(-1 1)'));
    assert.ok(!header.includes('image href') && !header.includes('<script'));
  }
  const art = ornamentMarkup();
  assert.ok(art.includes('chu-brick-left') && art.includes('chu-brick-right'));
  assert.ok(art.includes('chu-side-left') && art.includes('chu-side-right'));
  assert.ok(displayFontFamily.startsWith('"CityPulse Display"'));
});
test('perforated stamp is a bounded shared vector with safe text and deterministic point labels', () => {
  const path = postagePath();assert.equal(path, postagePath());assert.ok(path.endsWith(' Z'));
  const numbers = path.match(/\d+(?:\.\d+)?/g).map(Number);
  assert.ok(numbers.every(n => n >= 6 && n <= 214));assert.ok(numbers.length > 400);
  assert.equal(stampPlaceName({id: 'jingzhou-wall', name: '荆州古城墙 · 宾阳楼'}), '古城 · 宾阳楼');
  const evil = {id: 'custom', name: '<script>'};
  assert.ok(!stampMarkup('memory', evil).includes('<script>'));
  assert.ok(stampMarkup('memory', evil).includes('&lt;'));
  assert.ok(stampMarkup('wish', evil).includes('向往邮戳'));
});
test('local display font, license and artwork module are served with correct MIME', async () => {
  const bytes = await readFile(new URL('../public/fonts/citypulse-display.woff2', import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');assert.ok(bytes.length < 100000);
  const license = await readFile(new URL('../public/fonts/OFL.txt', import.meta.url), 'utf8');
  assert.match(license, /SIL OPEN FONT LICENSE Version 1.1/);assert.match(license, /Adobe/);
  const server = createServer();await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [file, type] of [['chu-artwork.js', 'text/javascript'], ['fonts/citypulse-display.woff2', 'font/woff2'], ['fonts/OFL.txt', 'text/plain']]) {
      const response = await fetch(base + '/' + file);assert.equal(response.status, 200);assert.ok(response.headers.get('content-type').startsWith(type));
    }
  } finally {await new Promise(r => server.close(r));}
});
