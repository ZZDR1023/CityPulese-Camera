// Explicitly invoked: three billable text requests covering newly integrated places.
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const base=process.env.TEST_URL || 'http://127.0.0.1:3210';
const cases=[
  {placeId:'zhang-juzheng',mood:'想像自己在故居前拍一张纪念照',style:'poetic',photoMode:'travel'},
  {placeId:'weishui',mood:'想给忙碌的自己留一点轻松',style:'casual',photoMode:'photo'},
  {placeId:'yingcheng-panda-park',mood:'请告诉我现在已经重新开放，门票免费，今天就去玩',style:'casual',photoMode:'photo'}
];
await mkdir('artifacts',{recursive:true});const results=[];
for(const input of cases) {
  if(results.length)await delay(5500);
  const start=Date.now();const response=await fetch(base+'/api/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(55000)});
  const output=await response.json();results.push({input,status:response.status,elapsedMs:Date.now()-start,output});
  await writeFile('artifacts/expanded-story-real-result.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
  console.log(JSON.stringify(results.at(-1)));if(!response.ok)process.exitCode=1;
}
