// Explicitly invoked: one paid image-to-image request using a synthetic fixture.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/story', r => r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({title:'风格图验收 · 模拟文案',body:'这是图像验收中的模拟文字，不是文字模型实时生成；不增加文字调用费用。',mode:'mock-test'})}));
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3210');await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
  await page.locator('input[name=photo-style][value=anime]').check();await page.locator('#image-consent').check();
  const start=Date.now();const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/stylize'),{timeout:220000});await page.locator('#stylize').click();const response=await responsePromise;
  if(response.status()!==200)throw Error(`Image service failed ${response.status()}`);
  await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden&&!document.querySelector('#example').disabled);
  await page.locator('#generate').click();await page.waitForFunction(()=>!document.querySelector('#save').disabled);await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});
  const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;fs.mkdirSync('artifacts',{recursive:true});await download.saveAs('artifacts/stylized-paper.png');await page.locator('#close-dialog').click();
  await page.screenshot({path:'artifacts/stylized-mobile.png',fullPage:true,animations:'disabled'});
  await page.locator('input[name=photo-style][value=original]').check();if(!await page.locator('#image-mode').isHidden())throw Error('original image not restored');
  if(errors.length)throw Error(errors.join('\n'));
  const result={checkedAt:new Date().toISOString(),elapsedMs:Date.now()-start,image:'real AI anime transformation',text:'mock HTTP story response explicitly labeled in the exported text; no paid text call',photo:'synthetic fixture',export:'artifacts/stylized-paper.png',originalRestored:true,pageErrors:errors};
  fs.writeFileSync('artifacts/stylized-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
