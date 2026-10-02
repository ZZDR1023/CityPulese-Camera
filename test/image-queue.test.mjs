import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=';
test('HTTP image requests queue across sessions; disconnect removes queued photo without starting a model', async () => {
  const keys = ['IMAGE_BASE_URL', 'IMAGE_API_KEY', 'IMAGE_MODEL'];const old = keys.map(k => process.env[k]);const realFetch = globalThis.fetch;
  const server = createServer({imageGate: {concurrency: 1, cooldownMs: 0}});await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let calls = 0, finish;
  try {
    process.env.IMAGE_BASE_URL = 'https://mock-image.invalid/v1';process.env.IMAGE_API_KEY = 'mock';process.env.IMAGE_MODEL = 'mock';
    const cookies = [];
    for (let i = 0; i < 3; i++) cookies.push((await realFetch(base + '/api/health')).headers.get('set-cookie').split(';')[0]);
    globalThis.fetch = async () => {
      calls++;if (calls === 1) await new Promise(r => finish = r);
      return Response.json({choices: [{message: {images: [{image_url: {url: image}}]}}]});
    };
    const post = (cookie, signal) => realFetch(base + '/api/stylize', {method: 'POST', signal, headers: {'Content-Type': 'application/json', Cookie: cookie}, body: JSON.stringify({image, consent: true, style: 'anime'})});
    const wait = async predicate => {for (let i = 0; i < 100; i++) {if (await predicate()) return;await new Promise(r => setTimeout(r, 5));}throw Error('queue state not reached');};
    const a = post(cookies[0]);await wait(() => !!finish);
    const aborted = new AbortController();
    const canceled = post(cookies[1], aborted.signal);const expectedCancel = assert.rejects(canceled);
    await wait(async () => (await realFetch(base + '/api/health').then(r => r.json())).service.images.waiting === 1);
    aborted.abort();await expectedCancel;
    await wait(async () => (await realFetch(base + '/api/health').then(r => r.json())).service.images.waiting === 0);
    const c = post(cookies[2]);await wait(async () => (await realFetch(base + '/api/health').then(r => r.json())).service.images.waiting === 1);
    assert.equal(calls, 1);finish();assert.equal((await a).status, 200);assert.equal((await c).status, 200);assert.equal(calls, 2);
    const state = (await realFetch(base + '/api/health').then(r => r.json())).service.images;
    assert.equal(state.active, 0);assert.equal(state.waiting, 0);
  } finally {
    finish?.();globalThis.fetch = realFetch;server.closeAllConnections();await new Promise(r => server.close(r));
    keys.forEach((k, i) => old[i] === undefined ? delete process.env[k] : process.env[k] = old[i]);
  }
});
