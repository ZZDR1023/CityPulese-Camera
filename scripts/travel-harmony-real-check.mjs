// Explicit paid comparison. Uses an AI-generated fictional person, never a tourist photo.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const base=process.env.TEST_URL || 'http://127.0.0.1:3210';
const engines=process.argv.slice(2).length?process.argv.slice(2):['gemini','image2','image25'];
if(engines.some(e=>!['gemini','image2','image25'].includes(e)))throw Error('Unsupported comparison engine');
await mkdir('artifacts/harmony',{recursive:true});
const inputFile='artifacts/harmony/synthetic-realistic-person.jpg';
const bytes=await readFile(inputFile);const type=bytes[0]===137?'png':'jpeg';
const image=`data:image/${type};base64,`+bytes.toString('base64');const results=[];
for(const engine of engines) {
 if(results.length)await delay(11000);
 const start=Date.now();const input={image,placeId:'guandi-temple',consent:true,engine,framing:'balanced'};
 try {
  const response=await fetch(base+'/api/travel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(engine==='gemini'?165000:255000)});
  const data=await response.json();const result={engine,status:response.status,elapsedMs:Date.now()-start,person:'AI-generated fictional adult reference',input:inputFile,placeId:input.placeId,framing:input.framing};
  if(response.ok){const match=/^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(data.image);if(!match)throw Error('No inline raster image');result.file=`artifacts/harmony/balanced-${engine}.${match[1]}`;await writeFile(result.file,Buffer.from(match[2],'base64'));result.returnedEngine=data.engine;result.returnedFraming=data.framing;}
  else {result.error=data.error;process.exitCode=1;}
  results.push(result);console.log(JSON.stringify(result));
 }catch(e){results.push({engine,error:e.name,message:e.message,elapsedMs:Date.now()-start});process.exitCode=1;console.log(results.at(-1));}
 await writeFile('artifacts/harmony/comparison-results.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
}
