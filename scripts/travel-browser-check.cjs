const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const scenes=JSON.parse(fs.readFileSync('data/travel-scenes.json'));const image='data:image/png;base64,'+fs.readFileSync('test/fixtures/travel-person.png').toString('base64');let requests=0;
 await page.route('**/api/travel',r=>{requests++;const input=r.request().postDataJSON();assert.equal(input.consent,true);const scene=scenes.find(s=>s.placeId===input.placeId);return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,mode:'ai-travel',placeId:scene.placeId,scene})});});
 await page.goto('http://127.0.0.1:3210');await page.locator('#album').setInputFiles('test/fixtures/travel-person.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
 const original=await page.locator('#photo').getAttribute('src');await page.locator('input[name=photo-style][value=travel]').check();assert.equal(requests,0);assert.equal(await page.locator('#stylize').isDisabled(),true);
 await page.locator('#image-consent').check();
 for(const scene of scenes){
  await page.locator('#travel-place').selectOption(scene.placeId);assert.equal(await page.locator('#place').inputValue(),scene.placeId);
  await page.locator('#stylize').click();await page.waitForFunction(()=>document.querySelector('#image-mode').textContent==='AI 虚拟旅拍'&&!document.querySelector('#example').disabled);
  assert.ok((await page.locator('#travel-credit').textContent()).includes(scene.credit));
  await page.locator('#example').click();await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});await page.locator('#export-image').evaluate(el=>el.decode());await page.locator('#close-dialog').click();
 }
 await page.locator('#place').selectOption('jingzhou-wall');assert.equal(await page.locator('#photo').getAttribute('src'),original);assert.equal(await page.locator('#travel-credit').isHidden(),true);assert.equal(await page.locator('#save').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS travel consent, two scene choices, generated image, attribution, export, invalidation on place change, mobile layout');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
