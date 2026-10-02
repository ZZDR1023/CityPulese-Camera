import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';

test('default story budget allows 240 calls and rejects the 241st; environment override is honored', async () => {
  const keys = ['AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL', 'STORY_MAX_CALLS_PER_HOUR'];
  const old = keys.map(k => process.env[k]), realFetch = globalThis.fetch;
  try {
    process.env.AI_BASE_URL = 'https://mock-story.invalid/v1';
    process.env.AI_API_KEY = 'mock';process.env.AI_MODEL = 'mock';
    for (const [limit, expected] of [[undefined, 240], ['240', 240], ['2', 2]]) {
      if (limit === undefined) delete process.env.STORY_MAX_CALLS_PER_HOUR;
      else process.env.STORY_MAX_CALLS_PER_HOUR = limit;
      let calls = 0;
      globalThis.fetch = async url => {
        assert.equal(url, 'https://mock-story.invalid/v1/chat/completions');
        calls++;
        return Response.json({choices: [{message: {content: '{"title":"模拟文案","body":"未调用真实模型"}'}}]});
      };
      const server = createServer({storyGate: {cooldownMs: 0}});
      await new Promise(r => server.listen(0, '127.0.0.1', r));
      try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const post = () => realFetch(base + '/api/story', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({placeId: 'jingzhou-wall', mood: '', style: 'poetic'})});
        for (let i = 0; i < expected; i++) {
          const response = await post();
          assert.equal(response.status, 200, `call ${i + 1} with limit ${limit}`);
          await response.json();
        }
        const rejected = await post();
        assert.equal(rejected.status, 429);
        assert.match((await rejected.json()).error, /额度/);
        assert.equal(calls, expected, 'over-budget calls must not reach provider');
      } finally {
        server.closeAllConnections();await new Promise(r => server.close(r));
      }
    }
  } finally {
    globalThis.fetch = realFetch;
    keys.forEach((k, i) => old[i] === undefined ? delete process.env[k] : process.env[k] = old[i]);
  }
});
