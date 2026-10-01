import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, validateInput, parseStory } from '../server.mjs';

test('rejects unknown places, oversized mood and unsupported styles', () => {
  const valid = { placeId: 'jingzhou-wall', mood: '', style: 'poetic' };
  assert.equal(validateInput(valid).place.id, valid.placeId);
  for (const input of [null, {...valid, placeId:'injected'}, {...valid,mood:'字'.repeat(101)}, {...valid,style:'system'}]) assert.throws(() => validateInput(input));
});
test('model output must be usable bounded text', () => {
  assert.equal(parseStory('```json\n{"title":"荆州","body":"旅行纪念"}\n```').mode, 'ai');
  for (const value of ['not json','null','{}','{"title":"","body":"x"}', JSON.stringify({ title:'x',body:'字'.repeat(121) })]) assert.throws(() => parseStory(value));
});
test('HTTP contract, secrets isolation, upstream request and failure', async () => {
  const old = {base:process.env.AI_BASE_URL,key:process.env.AI_API_KEY,model:process.env.AI_MODEL};
  delete process.env.AI_API_KEY;
  const server = createServer(); await new Promise(r => server.listen(0,'127.0.0.1',r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const realFetch = globalThis.fetch;
  const post = (body,headers={}) => realFetch(base+'/api/story',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  const input = {placeId:'jingzhou-wall',mood:'和朋友来旅行',style:'casual'};
  try {
    assert.equal((await realFetch(base+'/.env')).status,404);
    assert.equal((await realFetch(base+'/api/health').then(r=>r.json())).configured,false);
    assert.equal((await post(input)).status,503);
    assert.equal((await post({...input,placeId:'wrong'})).status,400);
    assert.equal((await post(input, {Origin:'https://elsewhere.example'})).status,403);
    assert.equal((await post({...input,mood:'x'.repeat(5000)})).status,413);
    process.env.AI_BASE_URL = 'https://model.invalid/v1'; process.env.AI_API_KEY = 'test-secret'; process.env.AI_MODEL = 'test-model';
    globalThis.fetch = async (url,options) => {
      assert.equal(url,'https://model.invalid/v1/chat/completions');
      assert.equal(options.headers.Authorization,'Bearer test-secret');
      const body = JSON.parse(options.body); assert.equal(body.model,'test-model'); assert.ok(body.messages[1].content.includes(input.mood));
      const material=JSON.parse(body.messages[1].content);
      assert.match(material.context,/不是已到访的证据/);
      assert.ok(material.locationNotice);
      assert.match(body.messages[0].content,/不得推断或宣称景点当前开放/);
      assert.ok(!body.messages[1].content.includes('photo'));
      return Response.json({choices:[{message:{content:JSON.stringify({title:'一起走过荆州',body:'把和朋友一起走过的风景，留在今天的照片里。'})}}]});
    };
    const response = await post(input); assert.equal(response.status,200); assert.equal((await response.json()).mode,'ai');
    assert.equal((await post(input)).status,429);
    const publicConfig = await realFetch(base+'/api/health').then(r=>r.text()); assert.ok(!publicConfig.includes('test-secret'));
    // A fresh server avoids cooldown while exercising an upstream failure.
    const failed = createServer(); await new Promise(r=>failed.listen(0,'127.0.0.1',r));
    try { globalThis.fetch = async () => new Response('private upstream error',{status:401}); const response = await realFetch(`http://127.0.0.1:${failed.address().port}/api/story`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}); assert.equal(response.status,502); assert.ok(!(await response.text()).includes('private upstream')); }
    finally { await new Promise(r=>failed.close(r)); }
  } finally {
    globalThis.fetch = realFetch; await new Promise(r=>server.close(r));
    for (const [key,value] of Object.entries({AI_BASE_URL:old.base,AI_API_KEY:old.key,AI_MODEL:old.model})) if(value === undefined) delete process.env[key]; else process.env[key]=value;
  }
});
