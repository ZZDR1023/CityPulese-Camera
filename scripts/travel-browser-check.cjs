const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
  const base=process.env.TEST_URL || 'http://127.0.0.1:3210';
  const scenes=JSON.parse(fs.readFileSync('data/travel-scenes.json'));
  const places=JSON.parse(fs.readFileSync('data/places.json'));
  const image='data:image/png;base64,'+fs.readFileSync('test/fixtures/travel-person.png').toString('base64');
  const checks=[];
  try {
    for (const viewport of [{width:1440,height:1100},{width:390,height:844}]) {
      const page=await browser.newPage({viewport}); const errors=[]; let requests=0,failNext=false;
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/api/travel',async r=>{
        requests++;const input=r.request().postDataJSON();assert.equal(input.consent,true);
        assert.ok(!input.scene && !input.compositionPrompt && !input.sourceUrl);
        const scene=scenes.find(s=>s.placeId===input.placeId);assert.ok(scene);
        if(failNext){failNext=false;return r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'模拟旅拍上游故障'})});}
        return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,mode:'ai-travel',placeId:scene.placeId,scene})});
      });
      await page.goto(base);await page.waitForFunction(()=>document.querySelector('#place').options.length===14);
      assert.equal(await page.locator('#place optgroup').count(),3);
      await page.locator('#album').setInputFiles('test/fixtures/travel-person.png');
      await page.waitForFunction(()=>!document.querySelector('#example').disabled);
      const original=await page.locator('#photo').getAttribute('src');
      await page.locator('#place').selectOption('weishui');
      await page.locator('input[name=photo-style][value=travel]').check();
      assert.equal(await page.locator('#place').inputValue(),'weishui','unsupported selection must not silently change');
      assert.equal(await page.locator('#scene-preview').isHidden(),true);
      assert.match(await page.locator('#scene-license').textContent(),/不会自动改成其他地点/);
      await page.locator('#image-consent').check();assert.equal(await page.locator('#stylize').isDisabled(),true);assert.equal(requests,0);
      for(const scene of scenes) {
        await page.locator('#travel-place').selectOption(scene.placeId);
        assert.equal(await page.locator('#place').inputValue(),scene.placeId);
        assert.equal(await page.locator('#photo').getAttribute('src'),original);
        await page.locator('#scene-preview').evaluate(el=>el.decode());
        assert.equal(await page.locator('#scene-preview').getAttribute('src'),scene.image);
        assert.ok((await page.locator('#scene-placement').textContent()).includes(scene.placementHint));
        assert.ok((await page.locator('#scene-license').textContent()).includes(scene.capturedAt));
        await page.locator('#stylize').click();
        await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden && document.querySelector('#image-mode').textContent==='AI 虚拟旅拍' && !document.querySelector('#example').disabled);
        const credit=await page.locator('#travel-credit').textContent();
        for(const text of [scene.credit,scene.license,scene.licenseUrl,scene.sourceUrl,scene.modifications]) assert.ok(credit.includes(text));
        await page.locator('#example').click();
        assert.match(await page.locator('#story-body').textContent(),/虚拟/);
        await page.locator('#save').click();await page.locator('#export-dialog').waitFor({state:'visible'});
        await page.locator('#export-image').evaluate(el=>el.decode());
        const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
        fs.mkdirSync('artifacts',{recursive:true});
        await download.saveAs(`artifacts/regression-${viewport.width}-${scene.placeId}.png`);
        const dimensions=await page.locator('#export-image').evaluate(el=>({w:el.naturalWidth,h:el.naturalHeight}));
        assert.equal(dimensions.w,1200);assert.ok(dimensions.h>1600,'dynamic-height paper includes text and attribution');
        await page.locator('#close-dialog').click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
      const other=scenes.find(s=>s.placeId!==scenes.at(-1).placeId);
      await page.locator('#place').selectOption(other.placeId);
      assert.equal(await page.locator('#photo').getAttribute('src'),original);
      assert.equal(await page.locator('#travel-credit').isHidden(),true);assert.equal(await page.locator('#save').isDisabled(),true);
      failNext=true;await page.locator('#stylize').click();await page.waitForFunction(()=>document.querySelector('#image-status').textContent.includes('模拟旅拍上游故障'));
      assert.equal(await page.locator('#photo').getAttribute('src'),original);
      await page.locator('#place').selectOption('yingcheng-panda-park');
      assert.equal(await page.locator('#stylize').isDisabled(),true);
      assert.match(await page.locator('#culture-notice').textContent(),/当前开放状态未确认/);
      await page.locator('input[name=photo-style][value=original]').check();
      for (const place of places) {
        await page.locator('#place').selectOption(place.id);
        assert.equal(await page.locator('#culture-fact').textContent(),place.fact);
        assert.equal(await page.locator('#source').getAttribute('href'),place.source.url);
        await page.locator('#example').click();assert.equal(await page.locator('#story-title').textContent(),place.example.title);
      }
      // Browser story request contract; mock only the HTTP response to avoid fees.
      let storyInput;
      await page.route('**/api/story',r=>{storyInput=r.request().postDataJSON();return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({title:'期待走近荆州',body:'让想象先抵达，再把心情收藏。',mode:'ai'})});});
      await page.locator('#place').selectOption(scenes[0].placeId);
      await page.locator('input[name=photo-style][value=travel]').check();await page.locator('#stylize').click();
      await page.waitForFunction(()=>!document.querySelector('#image-mode').hidden&&!document.querySelector('#generate').disabled);
      await page.locator('#generate').click();await page.waitForFunction(()=>document.querySelector('#mode').textContent==='AI 纪念文案');
      assert.equal(storyInput.photoMode,'travel');assert.equal(storyInput.placeId,scenes[0].placeId);
      await page.locator('#album').setInputFiles('test/fixtures/style-input.png');await page.waitForFunction(()=>!document.querySelector('#example').disabled);
      assert.equal(await page.locator('#image-consent').isChecked(),false);assert.equal(await page.locator('#image-mode').isHidden(),true);
      assert.deepEqual(errors,[]);checks.push({viewport,scenes:scenes.length,places:places.length,requests,pageErrors:errors});
      await page.screenshot({path:`artifacts/expanded-ui-${viewport.width}.png`,fullPage:true,animations:'disabled'});await page.close();
    }
    fs.writeFileSync('artifacts/expanded-browser-result.json',JSON.stringify({passed:true,checks},null,2));
    console.log('PASS: 14 places, 5 references, desktop/mobile, consent, source/date/composition, downloads, unsupported/failure recovery, travel story and photo reset');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
