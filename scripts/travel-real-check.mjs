import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const start=Date.now();const placeId=process.argv[2] || 'jingzhou-wall';
const image='data:image/png;base64,'+(await readFile('test/fixtures/travel-person.png')).toString('base64');
const res=await fetch('http://127.0.0.1:3210/api/travel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,placeId,consent:true}),signal:AbortSignal.timeout(165000)});
const data=await res.json();
if(!res.ok){console.log({status:res.status,error:data.error});process.exitCode=1;}
else{
 const match=/^data:image\/(\w+);base64,(.+)$/.exec(data.image);const file=`artifacts/travel-${placeId}.${match[1]}`;
 await writeFile(file,Buffer.from(match[2],'base64'));
 const result={status:res.status,elapsedMs:Date.now()-start,mode:data.mode,placeId,scene:data.scene,file,input:'synthetic cropped person illustration, not a real tourist'};
 await writeFile(`artifacts/travel-${placeId}-result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
