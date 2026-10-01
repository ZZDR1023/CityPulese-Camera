const {chromium}=require('playwright');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 const scenes=JSON.parse(fs.readFileSync('data/travel-scenes.json'));
 const image='data:image/png;base64,'+fs.readFileSync('test/fixtures/travel-person.png').toString('base64');
 const base=process.env.TEST_URL || 'http://127.0.0.1:3210';const results=[];
 try {
  for(const viewport of [{width:1440,height:1100},{width:390,height:844}]) {
   const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));let calls=0,failNext=false,holdNext=false;
   await page.route('**/api/travel',async r=>{
    calls++;const input=r.request().postDataJSON();assert.ok(['gemini','image2','image25'].includes(input.engine));assert.ok(['balanced','scenic'].includes(input.framing));assert.equal(input.consent,true);
    const scene=scenes.find(s=>s.placeId===input.placeId);assert.ok(scene);
    assert.equal(await page.locator('#travel-engine').isDisabled(),true);assert.equal(await page.locator('#travel-framing').isDisabled(),true);
    if(failNext){failNext=false;return r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'模拟模型暂不可用，不自动重试'})});}
    if(holdNext){holdNext=false;await new Promise(resolve=>setTimeout(resolve,1200));}
    try{await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,mode:'ai-travel',scene,placeId:scene.placeId,engine:input.engine,framing:input.framing})});}catch{}
   });
   await page.goto(base);await page.waitForFunction(()=>document.querySelector('#travel-engine').options.length===3);
   await page.locator('#album').setInputFiles('test/fixtures/travel-person.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
   await page.locator('input[name=photo-style][value=travel]').check();await page.locator('#travel-place').selectOption('guandi-temple');await page.locator('#image-consent').check();
   const generate=async(engine,framing)=>{
    await page.locator('#travel-engine').selectOption(engine);await page.locator('#travel-framing').selectOption(framing);
    await page.locator('#stylize').click();await page.waitForFunction(()=>document.querySelector('#cancel-stylize').hidden && !document.querySelector('#travel-result-info').hidden);
    await page.waitForFunction(()=>!document.querySelector('#example').disabled);
    assert.ok((await page.locator('#travel-result-info').textContent()).includes(engine==='image25'?'image2.5':engine==='gemini'?'Gemini':'image2'));
   };
   for(const engine of ['gemini','image2','image25'])await generate(engine,'balanced');
   assert.equal(calls,3);
   await page.locator('#travel-engine').selectOption('gemini');assert.equal(calls,3);assert.match(await page.locator('#image-status').textContent(),/缓存/);
   await page.locator('#travel-framing').selectOption('scenic');assert.match(await page.locator('#travel-result-info').textContent(),/自然合影/);assert.match(await page.locator('#image-status').textContent(),/当前照片保持不变/);
   await generate('gemini','scenic');assert.equal(calls,4);assert.match(await page.locator('#travel-result-info').textContent(),/风景为主/);
   await page.locator('#example').click();await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});await page.locator('#export-image').evaluate(el=>el.decode());await page.locator('#close-dialog').click();
   await page.locator('#travel-framing').selectOption('balanced');assert.equal(calls,4);assert.equal(await page.locator('#save').isDisabled(),true);assert.match(await page.locator('#travel-result-info').textContent(),/自然合影/);
   await page.locator('#travel-engine').selectOption('image25');await page.locator('#travel-framing').selectOption('scenic');failNext=true;
   await page.locator('#stylize').click();await page.waitForFunction(()=>document.querySelector('#image-status').textContent.includes('模拟模型暂不可用'));
   assert.equal(calls,5);assert.match(await page.locator('#travel-result-info').textContent(),/image2.5.*自然合影/);
   assert.equal(await page.locator('#photo').getAttribute('src'),image);
   holdNext=true;await page.locator('#stylize').click();await page.locator('#cancel-stylize').click();await page.waitForFunction(()=>document.querySelector('#image-status').textContent.includes('已取消等待'));
   await page.waitForTimeout(1500);assert.equal(calls,6);assert.match(await page.locator('#travel-result-info').textContent(),/自然合影/);
   await page.locator('#travel-framing').selectOption('balanced');assert.equal(calls,6);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`artifacts/harmony/controls-${viewport.width}.png`,fullPage:true,animations:'disabled'});
   await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
   assert.equal(await page.locator('#travel-result-info').isHidden(),true);assert.equal(await page.locator('#image-consent').isChecked(),false);
   await page.locator('input[name=photo-style][value=travel]').check();assert.equal(await page.locator('#stylize').isDisabled(),true);assert.deepEqual(errors,[]);
   results.push({viewport,calls,pageErrors:errors});await page.close();
  }
  fs.writeFileSync('artifacts/harmony/browser-result.json',JSON.stringify({passed:true,results},null,2));console.log('PASS three travel engines, framing, controls lock, cache isolation, unchanged pending preview, failure/cancel retention, export, photo reset, desktop/mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
