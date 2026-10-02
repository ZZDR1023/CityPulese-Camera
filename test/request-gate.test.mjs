import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RequestGate, clientAddress} from '../request-gate.mjs';
import {createServer} from '../server.mjs';

const tick = () => new Promise(r => setImmediate(r));
test('bounded FIFO queue separates visitors, rejects duplicates and releases once', async () => {
  const gate = new RequestGate({concurrency: 2, maxQueue: 1, cooldownMs: 1000, maxCalls: 10});
  const a = await gate.acquire('a'), b = await gate.acquire('b');
  let started = false;
  const c = gate.acquire('c').then(release => {started = true; return release;});
  assert.deepEqual(gate.snapshot(), {active: 2, waiting: 1, concurrency: 2, maxQueue: 1});
  await assert.rejects(gate.acquire('a'), e => e.status === 429);
  await assert.rejects(gate.acquire('d'), e => e.status === 429);
  assert.equal(started, false);
  a(); const releaseC = await c; assert.equal(started, true);
  a(); assert.equal(gate.active, 2);
  b(); releaseC(); assert.equal(gate.active, 0);
  await assert.rejects(gate.acquire('a'), e => e.status === 429);
});
test('queued cancellation does not call a provider or consume a slot/budget', async () => {
  const gate = new RequestGate({concurrency: 1, cooldownMs: 0, maxCalls: 2});
  const release = await gate.acquire('a');
  const controller = new AbortController();
  const pending = gate.acquire('b', controller.signal);
  controller.abort(); await assert.rejects(pending);
  assert.equal(gate.queue.length, 0); assert.equal(gate.calls.length, 1);
  release(); const releaseB = await gate.acquire('b'); releaseB();
});
test('hourly budget stops new and queued calls and resets after its time window', async () => {
  let now = 0;
  const gate = new RequestGate({concurrency: 1, cooldownMs: 0, maxCalls: 1, windowMs: 100, now: () => now});
  const a = await gate.acquire('a');
  const pending = assert.rejects(gate.acquire('b'), e => e.status === 429 && /额度/.test(e.message));
  a(); await pending;
  await assert.rejects(gate.acquire('c'), e => e.status === 429);
  now = 100; const c = await gate.acquire('c'); c();
});
test('forwarded addresses are only honored from an explicitly trusted local proxy', () => {
  const req = {socket: {remoteAddress: '127.0.0.1'}, headers: {'x-real-ip': '192.0.2.10'}};
  assert.equal(clientAddress(req), '127.0.0.1');
  assert.equal(clientAddress(req, true), '192.0.2.10');
  assert.equal(clientAddress({...req, socket: {remoteAddress: '192.0.2.20'}}, true), '192.0.2.20');
  assert.equal(clientAddress({...req, headers: {'x-real-ip': '192.0.2.10, 192.0.2.20'}}, true), '127.0.0.1');
});
test('HTTP signed browser sessions behind the same proxy queue independently; duplicate and forged sessions do not bypass cooldown', async () => {
  const keys = ['AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL'];
  const old = keys.map(k => process.env[k]), realFetch = globalThis.fetch;
  const server = createServer({storyGate: {concurrency: 1, cooldownMs: 1000}});
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let calls = 0, providerRelease;
  try {
    process.env.AI_BASE_URL = 'https://review.invalid/v1'; process.env.AI_API_KEY = 'mock'; process.env.AI_MODEL = 'mock';
    const cookies = [];
    for (let i = 0; i < 2; i++) {
      const health = await realFetch(base + '/api/health');
      cookies.push(health.headers.get('set-cookie').split(';')[0]);
      assert.ok(health.headers.get('set-cookie').includes('HttpOnly; SameSite=Strict'));
    }
    assert.notEqual(cookies[0], cookies[1]);
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://review.invalid/v1/chat/completions');
      calls++;
      if (calls === 1) await new Promise(r => providerRelease = r);
      return Response.json({choices: [{message: {content: '{"title":"模拟文案","body":"未调用真实模型"}'}}]});
    };
    const post = cookie => realFetch(base + '/api/story', {method: 'POST', headers: {'Content-Type': 'application/json', Cookie: cookie}, body: JSON.stringify({placeId: 'jingzhou-wall', mood: '', style: 'poetic'})});
    const a = post(cookies[0]);
    while (!providerRelease) await tick();
    const duplicate = await post(cookies[0]); assert.equal(duplicate.status, 429); assert.equal(duplicate.headers.get('retry-after'), '5');
    const b = post(cookies[1]);
    let waiting = 0;
    for (let i = 0; i < 100 && !waiting; i++) {await tick(); waiting = (await realFetch(base + '/api/health').then(r => r.json())).service.stories.waiting;}
    assert.equal(waiting, 1); assert.equal(calls, 1);
    providerRelease(); assert.equal((await a).status, 200); assert.equal((await b).status, 200); assert.equal(calls, 2);
    // A forged cookie is treated as an untrusted IP caller rather than accepted.
    const forged = 'cm_session=' + 'a'.repeat(32) + '.' + '0'.repeat(64);
    assert.equal((await post(forged)).status, 200);
    assert.equal((await post('cm_session=' + 'b'.repeat(32) + '.' + '0'.repeat(64))).status, 429);
  } finally {
    globalThis.fetch = realFetch; server.closeAllConnections(); await new Promise(r => server.close(r));
    keys.forEach((k, i) => old[i] === undefined ? delete process.env[k] : process.env[k] = old[i]);
  }
});
