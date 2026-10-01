// Explicitly invoked: one paid image-to-image request using a synthetic fixture.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3210');await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
  await page.locator('input[name=photo-style][value=anime]').check();await page.locator('#image-consent').check();
  const start=Date.now();const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/stylize'),{timeout:165000});await page.locator('#stylize').click();const response=await responsePromise;
  if(response.status()!==200)throw Error(`Image service failed ${response.status()}`);
  await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden&&!document.querySelector('#example').disabled);
  await page.locator('#example').click();await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});
  const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;fs.mkdirSync('artifacts',{recursive:true});await download.saveAs('artifacts/stylized-paper.png');await page.locator('#close-dialog').click();
  await page.screenshot({path:'artifacts/stylized-mobile.png',fullPage:true,animations:'disabled'});
  await page.locator('input[name=photo-style][value=original]').check();if(!await page.locator('#image-mode').isHidden())throw Error('original image not restored');
  if(errors.length)throw Error(errors.join('\n'));
  const result={checkedAt:new Date().toISOString(),elapsedMs:Date.now()-start,image:'real AI anime transformation',text:'explicitly labeled offline example',photo:'synthetic fixture',export:'artifacts/stylized-paper.png',originalRestored:true,pageErrors:errors};
  fs.writeFileSync('artifacts/stylized-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
