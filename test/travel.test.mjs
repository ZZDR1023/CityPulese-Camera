import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {validateTravel,travelImage} from '../image-service.mjs';
const scenes=JSON.parse(await readFile(new URL('../data/travel-scenes.json',import.meta.url)));
const image='data:image/png;base64,'+(await readFile(new URL('./fixtures/travel-person.png',import.meta.url))).toString('base64');
test('travel uses only server-approved locations and requires consent',()=>{
 assert.equal(validateTravel({image,placeId:'jingzhou-wall',consent:true},scenes).placeId,'jingzhou-wall');
 for(const input of [{image,placeId:'jingzhou-wall'},{image,placeId:'../../.env',consent:true},{image:'https://example.com/photo',placeId:'jingzhou-wall',consent:true}])assert.throws(()=>validateTravel(input,scenes));
});
test('travel sends TWO references and returns exact chosen scene with attribution',async()=>{
 const keys=['IMAGE_BASE_URL','IMAGE_API_KEY','IMAGE_MODEL'];const old=keys.map(k=>process.env[k]);const orig=globalThis.fetch;
 try{
  process.env.IMAGE_BASE_URL='https://image.invalid/v1';process.env.IMAGE_API_KEY='test';process.env.IMAGE_MODEL='test';
  for(const scene of scenes){
   const expected='data:image/jpeg;base64,'+(await readFile(new URL('../public'+scene.image,import.meta.url))).toString('base64');
   globalThis.fetch=async(url,options)=>{const content=JSON.parse(options.body).messages[0].content;assert.equal(content.length,3);assert.equal(content[1].image_url.url,image);assert.equal(content[2].image_url.url,expected);assert.ok(content[0].text.includes(scene.title));return Response.json({choices:[{message:{images:[{image_url:{url:image}}]}}]});};
   const output=await travelImage({image,placeId:scene.placeId,consent:true},scenes);assert.equal(output.mode,'ai-travel');assert.deepEqual(output.scene,scene);
  }
 }finally{globalThis.fetch=orig;keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
