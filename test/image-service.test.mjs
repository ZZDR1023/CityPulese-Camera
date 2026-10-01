import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateStylize,parseImageResult,stylizeImage} from '../image-service.mjs';
import {createServer} from '../server.mjs';
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=';
test('style transfer requires explicit consent and inline raster data',()=>{
 assert.equal(validateStylize({image,style:'anime',consent:true}).style,'anime');
 assert.equal(validateStylize({image,style:'anime',consent:true,engine:'image2'}).engine,'image2');
 assert.equal(validateStylize({image,style:'watercolor',consent:true,engine:'image25'}).engine,'image25');
 for(const input of [{image,style:'anime'},{image,style:'toString',consent:true},{image,style:'anime',consent:true,engine:'unsupported'},{image:'https://example.com/image.png',style:'anime',consent:true},{image:'data:image/png;base64,YWJj',style:'anime',consent:true}])assert.throws(()=>validateStylize(input));
 assert.throws(()=>parseImageResult({choices:[{message:{images:[{image_url:{url:'http://127.0.0.1/private'}}]}}]}));
 assert.equal(parseImageResult({choices:[{message:{images:[{image_url:{url:image}}]}}]}),image);
});
test('sends original reference image with fixed style prompt and isolates secrets',async()=>{
 const keys=['IMAGE_BASE_URL','IMAGE_API_KEY','IMAGE_MODEL'];const old=keys.map(k=>process.env[k]);const realFetch=globalThis.fetch;
 try{
  process.env.IMAGE_BASE_URL='https://image.invalid/v1';process.env.IMAGE_API_KEY='private-key';process.env.IMAGE_MODEL='test-image-model';
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://image.invalid/v1/chat/completions');const body=JSON.parse(options.body);assert.equal(body.messages[0].content[1].image_url.url,image);assert.ok(body.messages[0].content[0].text.includes('watercolor'));assert.equal(options.headers.Authorization,'Bearer private-key');return Response.json({choices:[{message:{images:[{image_url:{url:image}}]}}]});};
  assert.equal((await stylizeImage({image,style:'watercolor',consent:true})).mode,'ai-image');
  globalThis.fetch=async()=>new Response('secret upstream details',{status:401});
  await assert.rejects(()=>stylizeImage({image,style:'anime',consent:true}),e=>e.status===502&&!e.message.includes('secret'));
 }finally{globalThis.fetch=realFetch;keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
test('HTTP stylize rejects non-consensual and cross-origin requests without calling a provider',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/api/stylize`;
 try{
  const post=(body,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  assert.equal((await post({image,style:'anime'})).status,400);
  assert.equal((await post({image,style:'anime',consent:true},{Origin:'https://evil.example'})).status,403);
  assert.equal((await post({image:'x'.repeat(6*1024*1024),style:'anime',consent:true})).status,413);
 }finally{await new Promise(r=>server.close(r));}
});
