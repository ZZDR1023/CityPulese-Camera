import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {travelImage,travelSettings,travelOptions,travelTimeoutMs,parseEditResult,buildTravelPrompt} from '../image-service.mjs';
import {createServer} from '../server.mjs';
import {buildTravelLayout,travelLayoutSpec} from '../travel-layout.mjs';
const scenes=JSON.parse(await readFile(new URL('../data/travel-scenes.json',import.meta.url)));
const bytes=await readFile(new URL('./fixtures/travel-person.png',import.meta.url));
const image='data:image/png;base64,'+bytes.toString('base64');
const keys=['IMAGE_BASE_URL','IMAGE_API_KEY','IMAGE_MODEL','TRAVEL_IMAGE2_BASE_URL','TRAVEL_IMAGE2_API_KEY','TRAVEL_IMAGE25_BASE_URL','TRAVEL_IMAGE25_API_KEY','TRAVEL_DEFAULT_ENGINE'];

test('travel accepts only enumerated models/framing and exposes no credentials',()=>{
  assert.deepEqual(travelSettings({}),{engine:'gemini',framing:'balanced'});
  assert.equal(travelTimeoutMs({engine:'image25'}),240000);
  for(const input of [{engine:'../../key'},{engine:'toString'},{framing:'toString'},{framing:'prompt injection'}])assert.throws(()=>travelSettings(input));
  const prompt=buildTravelPrompt(scenes[0],'scenic');
  for(const text of ['28-38%','white balance','contact shadow','same lens','Do not turn illustrations','no orange skin'])assert.ok(prompt.includes(text),text);
  assert.ok(!JSON.stringify(travelOptions()).includes('API_KEY'));
  assert.throws(()=>parseEditResult({data:[{url:'https://private.example/image'}]}));
  assert.throws(()=>parseEditResult({data:[{b64_json:'YWJj'}]}));
  assert.equal(parseEditResult({data:[{b64_json:bytes.toString('base64')}]}),image);
});

test('layout is a bounded server-generated PNG with smaller scenic placement',()=>{
  const balanced=travelLayoutSpec(scenes[0],'balanced'),scenic=travelLayoutSpec(scenes[0],'scenic');
  assert.ok(scenic.height<balanced.height && scenic.groundY<balanced.groundY);
  const guide=buildTravelLayout(scenes[0],'scenic');
  assert.match(guide,/^data:image\/png;base64,/);
  const raw=Buffer.from(guide.split(',')[1],'base64');
  assert.equal(raw.readUInt32BE(16),512);assert.equal(raw.readUInt32BE(20),512);assert.ok(raw.length<10000);
  assert.equal(guide,buildTravelLayout(scenes[0],'scenic'));
});

test('both image edit engines send actual ordered raster references with their own keys and no automatic retry',async()=>{
  const old=keys.map(k=>process.env[k]),orig=globalThis.fetch;
  try {
    process.env.IMAGE_BASE_URL='https://chat.invalid/v1';process.env.IMAGE_API_KEY='gemini-private';process.env.IMAGE_MODEL='test';
    process.env.TRAVEL_IMAGE2_BASE_URL='https://edits.invalid/v1';process.env.TRAVEL_IMAGE2_API_KEY='image2-private';
    process.env.TRAVEL_IMAGE25_BASE_URL='https://edits25.invalid/v1';process.env.TRAVEL_IMAGE25_API_KEY='image25-private';
    for(const [engine,model,base] of [['image2','gpt-image-2','https://edits.invalid/v1'],['image25','gpt-image-2.5-sunburst','https://edits25.invalid/v1']]) {
      globalThis.fetch=async(url,options)=>{
        assert.equal(url,base+'/images/edits');assert.equal(options.headers.Authorization,`Bearer ${engine}-private`);
        assert.equal(options.headers['Content-Type'],undefined,'fetch supplies multipart boundary');
        assert.ok(options.body instanceof FormData);assert.equal(options.body.get('model'),model);
        assert.equal(options.body.get('response_format'),'b64_json');assert.equal(options.body.get('n'),'1');
        assert.match(options.body.get('prompt'),/42-52%/);assert.ok(options.body.get('prompt').includes(scenes[0].harmonyPrompt));
        const files=options.body.getAll('image[]');assert.equal(files.length,2);assert.equal(files[0].type,'image/png');assert.equal(files[1].type,'image/jpeg');
        assert.deepEqual(Buffer.from(await files[0].arrayBuffer()),bytes);
        assert.deepEqual(Buffer.from(await files[1].arrayBuffer()),await readFile(new URL('../public'+scenes[0].image,import.meta.url)));
        return Response.json({data:[{b64_json:bytes.toString('base64')}]});
      };
      const output=await travelImage({image,placeId:scenes[0].placeId,consent:true,engine,framing:'balanced'},scenes);
      assert.equal(output.engine,engine);assert.equal(output.framing,'balanced');assert.equal(output.image,image);
    }
    for(const engine of ['gemini','image2','image25']) {
      globalThis.fetch=async(url,options)=>{
        if(engine==='gemini') {
          const content=JSON.parse(options.body).messages[0].content;
          assert.equal(content.length,4);assert.ok(content[0].text.includes('THREE'));
          assert.equal(content[1].image_url.url,image);
          assert.equal(content[3].image_url.url,buildTravelLayout(scenes[0],'scenic'));
          return Response.json({choices:[{message:{images:[{image_url:{url:image}}]}}]});
        }
        const files=options.body.getAll('image[]');assert.equal(files.length,3);
        assert.equal(files[2].name,'layout.png');assert.equal(files[2].type,'image/png');
        assert.deepEqual(Buffer.from(await files[2].arrayBuffer()),Buffer.from(buildTravelLayout(scenes[0],'scenic').split(',')[1],'base64'));
        assert.ok(options.body.get('prompt').includes('COMPOSITION GUIDE ONLY'));
        return Response.json({data:[{b64_json:bytes.toString('base64')}]});
      };
      const output=await travelImage({image,placeId:scenes[0].placeId,consent:true,engine,framing:'scenic'},scenes);
      assert.equal(output.layoutGuided,true);assert.equal(output.framing,'scenic');assert.equal(output.engine,engine);
    }
    let calls=0;globalThis.fetch=async()=>{calls++;return new Response('private provider error',{status:502});};
    await assert.rejects(()=>travelImage({image,placeId:scenes[0].placeId,consent:true,engine:'image25'},scenes),e=>e.status===502&&!e.message.includes('private')&&e.message.includes('不会自动重试'));
    assert.equal(calls,1);
    delete process.env.TRAVEL_IMAGE2_API_KEY;
    await assert.rejects(()=>travelImage({image,placeId:scenes[0].placeId,consent:true,engine:'image2'},scenes),e=>e.status===503);
    assert.equal(calls,1);
    const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
    try {
      const real=orig;const base=`http://127.0.0.1:${server.address().port}`;
      const health=await real(base+'/api/health').then(r=>r.text());
      for(const secret of ['gemini-private','image2-private','image25-private'])assert.ok(!health.includes(secret));
      assert.equal(JSON.parse(health).travel.models.find(m=>m.id==='image2').available,false);
      const response=await real(base+'/api/travel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,placeId:scenes[0].placeId,consent:true,engine:'https://evil.invalid'})});assert.equal(response.status,400);
    } finally {await new Promise(r=>server.close(r));}
  } finally {globalThis.fetch=orig;keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
