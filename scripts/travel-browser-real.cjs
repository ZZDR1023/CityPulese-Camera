// Explicitly invoked: one paid two-reference travel composition request using a synthetic fixture.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const placeId=process.argv[2] || 'jingzhou-museum',engine=process.argv[3] || 'gemini',framing=process.argv[4] || 'balanced';
  const inputFile=process.env.TRAVEL_TEST_IMAGE || 'test/fixtures/travel-person.png';
  if(!['gemini','image2','image25'].includes(engine) || !['balanced','scenic'].includes(framing))throw Error('Unsupported travel settings');
  const scene=JSON.parse(fs.readFileSync('data/travel-scenes.json')).find(s=>s.placeId===placeId);
  if(!scene)throw Error('Unknown approved scene');
  await page.route('**/api/story', r => r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({title:'虚拟旅拍验收 · 模拟文案',body:'这是虚拟旅拍验收中的模拟文字，不是文字模型实时生成；合成图片不代表真实到访。',mode:'mock-test'})}));
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3210');await page.locator('#album').setInputFiles(inputFile);await page.waitForFunction(()=>!document.querySelector('#example').disabled);
  await page.locator('input[name=photo-style][value=travel]').check();await page.locator('#travel-place').selectOption(placeId);await page.locator('#travel-engine').selectOption(engine);await page.locator('#travel-framing').selectOption(framing);await page.locator('#image-consent').check();
  const start=Date.now();const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/travel'),{timeout:engine==='gemini'?220000:310000});await page.locator('#stylize').click();const response=await responsePromise;
  if(response.status()!==200)throw Error(`Image service failed ${response.status()}`);
  const generated=await response.json();
  if(generated.engine!==engine || generated.framing!==framing)throw Error('Returned settings do not match selected request');
  const match=/^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(generated.image);
  if(!match)throw Error('No inline output image');
  fs.mkdirSync('artifacts/harmony',{recursive:true});
  const imageFile=`artifacts/harmony/browser-${placeId}-${engine}-${framing}.${match[1]}`;
  fs.writeFileSync(imageFile,Buffer.from(match[2],'base64'));
  await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden&&!document.querySelector('#example').disabled);
  await page.locator('#generate').click();await page.waitForFunction(()=>!document.querySelector('#save').disabled);await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});
  const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;fs.mkdirSync('artifacts',{recursive:true});const exportFile=`artifacts/harmony/travel-${placeId}-${engine}-${framing}-paper.png`;await download.saveAs(exportFile);await page.locator('#close-dialog').click();
  await page.screenshot({path:`artifacts/harmony/travel-${placeId}-${engine}-${framing}-mobile.png`,fullPage:true,animations:'disabled'});
  await page.locator('input[name=photo-style][value=original]').check();if(!await page.locator('#image-mode').isHidden())throw Error('original image not restored');
  if(errors.length)throw Error(errors.join('\n'));
  const result={checkedAt:new Date().toISOString(),elapsedMs:Date.now()-start,image:'real AI virtual travel',placeId,engine,framing,layoutGuided:generated.layoutGuided,scene,text:'mock HTTP story response explicitly labeled in the exported text; no paid text call',photo:inputFile,imageFile,export:exportFile,originalRestored:true,pageErrors:errors};
  fs.writeFileSync(`artifacts/harmony/travel-${placeId}-${engine}-${framing}-browser-result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
