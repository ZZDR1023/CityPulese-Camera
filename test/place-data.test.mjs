import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer,validateInput} from '../server.mjs';
import {validateImage,buildTravelPrompt} from '../image-service.mjs';

const places=JSON.parse(await readFile(new URL('../data/places.json',import.meta.url)));
const scenes=JSON.parse(await readFile(new URL('../data/travel-scenes.json',import.meta.url)));

test('all expanded places have unique IDs, verified sources, categories and usable examples',()=>{
  assert.equal(places.length,14);
  assert.equal(new Set(places.map(p=>p.id)).size,places.length);
  const expected=['jingzhou-wall','jingzhou-museum','chu-chariots','zhang-juzheng','guandi-temple','wanshou-pagoda','weishui','yan-general-cave','honghu-wetland','qujiawan','jingzhou-garden-expo','jingzhou-fantawild','yingcheng-culture-park','yingcheng-panda-park'];
  for (const id of expected) assert.ok(places.some(p=>p.id===id),id);
  for (const p of places) {
    assert.ok(['历史人文','自然生态','主题休闲'].includes(p.category));
    assert.equal(p.verified,true);
    assert.ok(p.fact && p.source.title && p.source.excerpt && p.source.checkedAt);
    assert.match(p.source.url,/^https?:\/\//);
    assert.ok([...p.example.title].length<=20 && [...p.example.body].length<=120);
    assert.deepEqual(validateInput({placeId:p.id,mood:'',style:'poetic'}).place,p);
  }
  assert.match(places.find(p=>p.id==='yingcheng-panda-park').notice,/当前开放状态未确认/);
  assert.ok(!scenes.some(s=>s.placeId==='yingcheng-panda-park'));
});

test('approved scenes link to places, JPEGs, attribution and scene-specific standing guidance',async()=>{
  assert.equal(scenes.length,5);
  assert.equal(new Set(scenes.map(s=>s.placeId)).size,scenes.length);
  for (const s of scenes) {
    assert.ok(places.some(p=>p.id===s.placeId));
    assert.match(s.image,/^\/scenes\/[a-z0-9-]+\.jpg$/);
    for (const field of ['credit','license','licenseUrl','sourceUrl','modifications','capturedAt','placementHint','compositionPrompt','harmonyPrompt']) assert.ok(typeof s[field]==='string' && s[field].length>0,field);
    assert.match(s.license,/^CC BY(?:-SA)? [34]\.0$/);
    assert.ok(new URL(s.licenseUrl).hostname==='creativecommons.org');
    assert.ok(new URL(s.sourceUrl).hostname==='commons.wikimedia.org');
    assert.ok(s.subjectPlacement.centerX>0 && s.subjectPlacement.centerX<1);
    assert.ok(s.subjectPlacement.scenicGroundY<s.subjectPlacement.balancedGroundY);
    const bytes=await readFile(new URL('../public'+s.image,import.meta.url));
    validateImage('data:image/jpeg;base64,'+bytes.toString('base64'));
    assert.ok(bytes.length<1024*1024,'reference is bounded');
    const prompt=buildTravelPrompt(s);
    assert.ok(prompt.includes(s.compositionPrompt));
    assert.ok(prompt.includes('square') && prompt.includes('off-center') && prompt.includes('foot contact'));
  }
});

test('catalog and every approved reference are reachable; private and arbitrary files stay blocked',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await fetch(base+'/api/places').then(r=>r.json()),places);
    assert.deepEqual(await fetch(base+'/api/travel-scenes').then(r=>r.json()),scenes);
    for(const scene of scenes) {
      const res=await fetch(base+scene.image);
      assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/jpeg');
      assert.ok((await res.arrayBuffer()).byteLength>1000);
    }
    for(const path of ['/.env','/.env.example','/HANDOFF.md','/data/places.json','/scenes/not-approved.jpg','/scenes/ATTRIBUTION.md','/artifacts/travel-paper.png']) assert.equal((await fetch(base+path)).status,404);
  } finally {await new Promise(r=>server.close(r));}
});
