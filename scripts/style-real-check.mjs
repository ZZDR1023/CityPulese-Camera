import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const style=process.argv[2] || 'anime';
if (!['anime','watercolor'].includes(style)) throw Error('Unknown style');
const image='data:image/png;base64,'+(await readFile('test/fixtures/style-input.png')).toString('base64');
const start=Date.now();
const res=await fetch('http://127.0.0.1:3210/api/stylize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,style,consent:true}),signal:AbortSignal.timeout(165000)});
const data=await res.json();
if(!res.ok){console.log(JSON.stringify({status:res.status,error:data.error,elapsedMs:Date.now()-start}));process.exitCode=1;}
else {
 const match=/^data:image\/(\w+);base64,(.+)$/.exec(data.image);
 await writeFile(`artifacts/style-${style}.${match[1]}`,Buffer.from(match[2],'base64'));
 const result={style,status:res.status,elapsedMs:Date.now()-start,mode:data.mode,file:`artifacts/style-${style}.${match[1]}`,input:'synthetic illustration, not a person photo'};
 await writeFile(`artifacts/style-${style}-result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
