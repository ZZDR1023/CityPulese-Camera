const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),args:['--no-sandbox']});
 const out=require('path').resolve('artifacts'); fs.mkdirSync(out,{recursive:true});
 const results=[];
 for(const viewport of [{width:1440,height:1100},{width:390,height:844}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3210'); await page.waitForFunction(()=>document.querySelector('#place').options[0].value==='jingzhou-wall');
  if(!await page.locator('#generate').isDisabled())throw Error('generation must need photo');
  for(const dimensions of [[1200,800],[800,1200]]){
   const data=await page.evaluate(([w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#61795e';x.fillRect(0,0,w,h);x.fillStyle='#e1d2a6';x.fillRect(w*.2,h*.2,w*.6,h*.6);x.font='36px sans-serif';x.fillStyle='#223d34';x.fillText('TEST PHOTO',w*.25,h*.5);return c.toDataURL('image/png').split(',')[1]},dimensions);
   await page.locator('#album').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
   await page.waitForFunction(()=>!document.querySelector('#example').disabled);
   await page.locator('#example').click();await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});
   const img=await page.locator('#export-image').evaluate(async el=>{await el.decode();return {w:el.naturalWidth,h:el.naturalHeight}});if(img.w!==1200||img.h<1500)throw Error('invalid export');
   const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;await download.saveAs(`${out}/export-${viewport.width}-${dimensions[0]}.png`);
   await page.locator('#close-dialog').click();
  }
  const places=await page.request.get((process.env.TEST_URL || 'http://127.0.0.1:3210')+'/api/places').then(r=>r.json());
  for (const place of places) { await page.locator('#place').selectOption(place.id); if (await page.locator('#paper-place').textContent()!==place.name) throw Error('place did not update'); if (await page.locator('#culture-fact').textContent()!==place.fact) throw Error('culture card did not update'); await page.locator('#example').click(); if (await page.locator('#story-title').textContent()!==place.example.title) throw Error('wrong example'); }
  await page.locator('#place').selectOption('jingzhou-wall');
  await page.locator('#mood').fill('第一次和朋友来荆州');if(!await page.locator('#save').isDisabled())throw Error('stale story can export');
  await page.route('**/api/story', route => route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'测试模拟：AI 暂不可用，照片已保留。'})}));
  await page.locator('#generate').click();await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
  if(await page.locator('#photo').isHidden())throw Error('photo lost after failure');
  await page.locator('#example').click();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('horizontal overflow');
  await page.screenshot({path:`${out}/preview-${viewport.width}.png`,fullPage:true,animations:'disabled'});
  if(errors.length)throw Error(errors.join('\n'));
  results.push({viewport,landscape:'passed',portrait:'passed',pngDownload:'passed',simulatedAPIFailure:'passed',staleExport:'passed',horizontalOverflow:false,pageErrors:errors});await page.close();
 }
 fs.writeFileSync(`${out}/ui-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
