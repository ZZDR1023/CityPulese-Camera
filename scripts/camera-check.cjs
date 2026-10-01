const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:3210');
  await page.locator('#open-camera').waitFor({state:'visible'});
  let fileChoosers=0;page.on('filechooser',()=>fileChoosers++);
  await page.locator('#open-camera').click();
  await page.waitForFunction(()=>!document.querySelector('#take-photo').disabled);
  await page.locator('#take-photo').click();
  await page.waitForFunction(()=>!document.querySelector('#photo').hidden&&!document.querySelector('#generate').disabled);
  assert.equal(fileChoosers,0);
  assert.equal(await page.locator('#camera-video').evaluate(el=>el.srcObject),null);
  await page.locator('#open-camera').click();
  await page.waitForFunction(()=>!document.querySelector('#take-photo').disabled);
  await page.evaluate(()=>window.testTrack=document.querySelector('#camera-video').srcObject.getTracks()[0]);
  await page.locator('#close-camera').click();
  assert.equal(await page.evaluate(()=>window.testTrack.readyState),'ended');
  await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError')}});
  await page.locator('#open-camera').click();
  await page.waitForFunction(()=>document.querySelector('#camera-status').textContent.includes('未获得相机权限'));
  assert.equal(await page.locator('#take-photo').isDisabled(),true);
  await page.locator('#close-camera').click();
  // LAN HTTP is deliberately an insecure context, as on the user's phone.
  await page.goto(process.env.LAN_TEST_URL || 'http://192.168.0.108:3210');
  await page.waitForFunction(()=>document.querySelector('#place').value==='jingzhou-wall');
  assert.equal(await page.evaluate(()=>window.isSecureContext),false);
  assert.equal(await page.locator('#open-camera').isHidden(),true);
  assert.equal(await page.locator('#choose-photo').textContent(),'拍照或选择照片');
  const chooser=page.waitForEvent('filechooser');await page.locator('#choose-photo').click();await chooser;
  console.log('PASS: direct camera capture without chooser; stream release; denied permission; single native picker on LAN HTTP');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
