// Explicitly invoked: makes one real model request and exports its result.
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3210');
    await page.waitForFunction(()=>!document.querySelector('#place').disabled);
    const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=800;const x=c.getContext('2d');x.fillStyle='#567259';x.fillRect(0,0,1000,800);x.fillStyle='#ded6b0';x.font='42px sans-serif';x.fillText('TEST PHOTO · 测试图片',200,400);return c.toDataURL('image/png').split(',')[1]});
    await page.locator('#album').setInputFiles({name:'test-photo.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
    await page.waitForFunction(()=>!document.querySelector('#generate').disabled);
    await page.locator('#place').selectOption('jingzhou-museum');
    await page.locator('#mood').fill('想和孩子一起了解荆楚文化，充满期待');
    const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/story'),{timeout:100000});
    const started=Date.now();await page.locator('#generate').click();const response=await responsePromise;
    if(response.status()!==200)throw Error(`AI request failed: ${response.status()}`);
    await page.waitForFunction(()=>!document.querySelector('#save').disabled);
    const output=await response.json();await page.locator('#save').click();
    const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;
    fs.mkdirSync('artifacts',{recursive:true});await download.saveAs('artifacts/real-ai-paper.png');await page.locator('#close-dialog').click();
    await page.screenshot({path:'artifacts/real-ai-mobile.png',fullPage:true,animations:'disabled'});
    if(errors.length)throw Error(errors.join('\n'));
    const result={checkedAt:new Date().toISOString(),mode:'real-ai',viewport:'390x844 browser emulation, not a physical phone',photo:'synthetic test image',elapsedMs:Date.now()-started,output,png:'artifacts/real-ai-paper.png',pageErrors:errors};
    fs.writeFileSync('artifacts/real-ai-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
