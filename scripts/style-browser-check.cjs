const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const image='data:image/png;base64,'+fs.readFileSync('test/fixtures/style-input.png').toString('base64');let requests=0;
  await page.route('**/api/stylize',async route=>{requests++;const body=route.request().postDataJSON();assert.equal(body.consent,true);assert.ok(body.image.startsWith('data:image/jpeg;'));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,style:body.style,mode:'ai-image'})});});
  await page.goto('http://127.0.0.1:3210');await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
  const original=await page.locator('#photo').getAttribute('src');
  await page.locator('input[name=photo-style][value=anime]').check();assert.equal(await page.locator('#stylize').isDisabled(),true);assert.equal(requests,0);
  await page.locator('#image-consent').check();await page.locator('#stylize').click();await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden);
  assert.equal(requests,1);assert.equal(await page.locator('#photo').getAttribute('src'),image);
  await page.locator('#example').click();await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});await page.locator('#export-image').evaluate(el=>el.decode());await page.locator('#close-dialog').click();
  await page.locator('input[name=photo-style][value=original]').check();assert.equal(await page.locator('#photo').getAttribute('src'),original);assert.equal(await page.locator('#image-mode').isHidden(),true);
  await page.locator('input[name=photo-style][value=anime]').check();assert.equal(requests,1);assert.equal(await page.locator('#photo').getAttribute('src'),image);
  await page.unroute('**/api/stylize');await page.route('**/api/stylize',r=>r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'模拟风格化失败'})}));
  await page.locator('input[name=photo-style][value=watercolor]').check();await page.locator('#stylize').click();await page.waitForFunction(()=>document.querySelector('#image-status').classList.contains('error'));assert.equal(await page.locator('#photo').getAttribute('src'),image);
  await page.locator('input[name=photo-style][value=original]').check();assert.equal(await page.locator('#photo').getAttribute('src'),original);
  await page.unroute('**/api/stylize');
  await page.route('**/api/stylize',async r=>{await new Promise(resolve=>setTimeout(resolve,1500));try{await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,style:'watercolor',mode:'ai-image'})});}catch{}});
  await page.locator('input[name=photo-style][value=watercolor]').check();await page.locator('#stylize').click();await page.locator('#cancel-stylize').click();
  await page.waitForFunction(()=>document.querySelector('#image-status').textContent.includes('已取消等待'));
  assert.equal(await page.locator('#photo').getAttribute('src'),original);
  await page.waitForTimeout(1600);assert.equal(await page.locator('#photo').getAttribute('src'),original);
  await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#image-consent').checked);assert.equal(await page.locator('#image-mode').isHidden(),true);
  await page.locator('input[name=photo-style][value=anime]').check();assert.equal(await page.locator('#stylize').isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  await page.screenshot({path:'artifacts/style-ui-mobile.png',fullPage:true,animations:'disabled'});
  console.log('PASS consent gate, reference upload, generated image application/export, original recovery, cached switch, failure retention, cancellation discards late result, reset on new photo, mobile layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
