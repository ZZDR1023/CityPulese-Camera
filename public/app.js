const $ = id => document.getElementById(id);
let places = [], photo = null, story = null, busy = false, photoLoading = false, uploadVersion = 0, exportUrl;
let originalPhoto = null, photoVariants = {}, activePhotoStyle = 'original', imageBusy = false, imageAvailable = false, imageController = null;
let travelScenes = [], activeTravelScene = null, activeTravelSettings = null;
let travelModels = [], travelVariants = new Map(), currentSceneImageIndex = 0;
const getActiveSceneImages = (scene) => (scene?.images?.length ? scene.images : (scene ? [{url:scene.image,title:scene.title,hint:scene.placementHint}] : []));
const currentSceneImage = () => {
  const scene = travelScenes.find(s => s.placeId === $('place').value);
  const list = getActiveSceneImages(scene);
  return list[currentSceneImageIndex]?.url || scene?.image || '';
};
const travelVariantKey = () => [$('place').value,$('travel-engine').value,$('travel-framing').value,currentSceneImage()].join('|');
const travelModelName = engine => {
  const m = travelModels.find(item => item.id === engine);
  if (m?.label) return m.label.replace(/ · .*$/, '').trim();
  if (engine === 'gemini') return '快速';
  if (engine === 'image2') return '标准';
  if (engine === 'image25') return '精细';
  return engine;
};
const travelFramingName = framing => framing==='scenic'?'风景为主':'自然合影';
const photoStyleNames = {original:'原片',anime:'动漫',watercolor:'水彩',travel:'虚拟旅拍'};
const date = new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit'}).replaceAll('/', '.');
$('paper-date').textContent = date;
const currentPlace = () => {
  if ($('place').value === 'custom') {
    const customName = ($('custom-place-input')?.value || '').trim() || '荆州';
    return {
      id: 'custom',
      name: customName,
      category: '自定义地点',
      fact: `记录于荆州「${customName}」的专属足迹与美好瞬间。`,
      verified: false,
      notice: '自定义打卡地点'
    };
  }
  return places.find(p => p.id === $('place').value);
};
function updatePhotoAspect(img) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return;
  const photoWin = document.querySelector('.photo-window');
  if (photoWin) {
    photoWin.style.setProperty('--photo-aspect', `${img.naturalWidth} / ${img.naturalHeight}`);
  }
}
function status(message, isError = false) { $('status').textContent = message; $('status').classList.toggle('error', isError); }
function buttons() {
  const locked = busy || imageBusy;
  $('generate').disabled = locked || photoLoading || !photo || !places.length;
  if ($('example')) $('example').disabled = locked || photoLoading || !photo || !places.length;
  $('save').disabled = locked || photoLoading || !story || !photo;
  for (const el of document.querySelectorAll('#mood,input,#open-camera,#travel-place,#travel-engine,#travel-framing,#style-engine')) el.disabled = locked;
  const isTravel=document.querySelector('input[name=photo-style]:checked')?.value==='travel';
  $('place').disabled = locked || isTravel;
  $('place-locked-badge').hidden = !isTravel;
  if ($('custom-place-box')) $('custom-place-box').hidden = isTravel || $('place').value !== 'custom';
  const selectedEngine = isTravel ? $('travel-engine').value : $('style-engine')?.value || 'gemini';
  const available = travelModels.some(m=>m.id===selectedEngine && m.available);
  $('stylize').disabled = locked || photoLoading || !originalPhoto || !available || !$('image-consent').checked || (isTravel && !travelScenes.some(s=>s.placeId===$('place').value));
}

function resetStory() { story = null; $('story-title').textContent = '等一张照片，等一个故事。'; $('story-body').textContent = '把旅行中的一瞬放在这里。写下心情，让回忆有自己的声音。'; $('mode').textContent = '相纸预览'; buttons(); }
function updatePlace() {
  const p = currentPlace(); if (!p) return;
  if (activePhotoStyle==='travel' && activeTravelScene?.placeId!==p.id) applyPhotoStyle('original');
  updateScenePreview(); updateExploreLinks(p); $('paper-place').textContent = p.name; $('culture-fact').textContent = p.fact;
  $('place-notice').hidden = !p.notice; $('place-notice').textContent = p.notice || '';
  $('culture-notice').hidden = !p.notice; $('culture-notice').textContent = p.notice || '';
  $('place-availability').textContent = travelScenes.some(s=>s.placeId===p.id) ? '已支持实景虚拟旅拍，也可用原片／动漫／水彩制作相纸。' : '文化卡已接入；暂无可确认授权的旅拍背景，原片／动漫／水彩和文案可正常使用。';
  if ($('source')) $('source').hidden = true;
  resetStory();
}
$('album').addEventListener('change', async e => {
  const file = e.target.files[0]; if (file) await loadPhoto(file);
  e.target.value = '';
});
async function loadPhoto(file) {
  const version = ++uploadVersion;
  photoLoading = true; buttons();
  let url;
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') throw Error('请选择 JPG、PNG 或 WebP 等照片文件。');
    if (file.size > 20 * 1024 * 1024) throw Error('照片超过 20 MB，请选择较小的图片。');
    url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
    if (version !== uploadVersion) return;
    const ratio = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio)); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL('image/jpeg', .92); const ready = new Image(); ready.src = preview; await ready.decode();
    if (version !== uploadVersion) return;
    originalPhoto = ready; photoVariants = {}; travelVariants.clear(); activeTravelScene = null; activeTravelSettings=null; $('travel-result-info').hidden=true; if ($('travel-credit')) $('travel-credit').hidden = true; $('travel-options').hidden = true; activePhotoStyle = 'original'; $('image-consent').checked = false; document.querySelector('input[name=photo-style][value=original]').checked = true; $('stylize-options').hidden = true; $('image-mode').hidden = true; imageStatus('当前使用原片，不上传照片。'); photo = ready; updatePhotoAspect(ready); $('photo').src = preview; $('photo').hidden = false; if ($('empty-photo')) $('empty-photo').hidden = true; $('photo-label').textContent = '照片已就位 · 可重新选择'; resetStory(); status('照片已就位，写下心情，开始出片。');
  } catch (err) { if (version === uploadVersion) status(err.message || '照片无法读取，请换一张 JPG 或 PNG。', true); }
  finally { if (url) URL.revokeObjectURL(url); if (version === uploadVersion) { photoLoading = false; buttons(); } }
}
$('place').addEventListener('change', () => {
  if ($('custom-place-box')) $('custom-place-box').hidden = $('place').value !== 'custom';
  updatePlace();
});
$('custom-place-input')?.addEventListener('input', () => {
  if ($('place').value === 'custom') updatePlace();
});
$('mood').addEventListener('input', () => { $('counter').textContent = `${[...$('mood').value].length} / 100`; resetStory(); });
for (const input of document.querySelectorAll('input[name=style]')) input.addEventListener('change', resetStory);
function displayStory(result) { story = result; $('story-title').textContent = result.title; $('story-body').textContent = result.body; $('mode').textContent = result.mode === 'ai' ? 'AI 纪念文案' : '文案示例 · 非实时生成'; $('paper').classList.remove('fresh'); void $('paper').offsetWidth; $('paper').classList.add('fresh'); buttons(); }
if ($('example')) $('example').addEventListener('click', () => { if (!photo || busy || imageBusy) return; displayStory({ ...(activePhotoStyle==='travel' ? {title:'把向往装进相纸',body:'让想象先抵达心中的目的地，把一份旅行的向往留在相纸里。这是一次虚拟的相遇，也是一张写给未来旅程的邀请。愿有一天，我们能真正走近这座城。'} : currentPlace().example), mode: 'example' }); status('当前为固定离线示例，不会根据心情生成。可保存体验相纸。'); });
$('generate').addEventListener('click', async () => {
  if (busy || imageBusy || !photo) return; busy = true; buttons(); status('正在写纪念文案，约需 5–45 秒，请稍候…'); $('generate').firstElementChild.textContent = '正在生成…';
  try {
    const isCustom = $('place').value === 'custom';
    const customName = ($('custom-place-input')?.value || '').trim() || '荆州';
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        placeId: isCustom ? 'custom' : $('place').value,
        customPlace: isCustom ? customName : undefined,
        mood: $('mood').value,
        style: document.querySelector('input[name=style]:checked').value,
        photoMode: activePhotoStyle==='travel'?'travel':'photo'
      }),
      signal: AbortSignal.timeout(50000)
    });
    const data = await res.json();
    if (!res.ok) throw Error(data.error || '生成失败，请重试。');
    displayStory(data);
    status('相纸已出片。收藏今天，也记得检查文案是否合心意。');
  } catch (err) {
    status(err.name === 'TimeoutError' ? '等待超时。照片和心情已保留，可重试或体验离线示例。' : err.message || '连接失败，请重试。', true);
  } finally {
    busy = false; buttons(); $('generate').firstElementChild.textContent = '生成我的纪念相纸';
  }
});
function lines(ctx, value, maxWidth) { const output = []; for (const paragraph of value.split('\n')) { let line = ''; for (const char of paragraph) { if (ctx.measureText(line + char).width > maxWidth && line) { if ('，。！？；：、）》】”’'.includes(char)) { output.push(line + char); line = ''; } else { output.push(line); line = char; } } else line += char; } if (line || !paragraph) output.push(line); } return output; }
function textBlock(ctx, text, x, y, width, lineHeight) { for (const line of lines(ctx, text, width)) { ctx.fillText(line, x, y); y += lineHeight; } return y; }
$('save').addEventListener('click', async () => {
  if (!photo || !story || busy || imageBusy) return;
  $('save').disabled = true;
  try {
    await document.fonts.ready;
    const p = currentPlace(); const canvas = document.createElement('canvas'); canvas.width = 1200; const ctx = canvas.getContext('2d');
    ctx.font = '54px serif'; const titleLines = lines(ctx, story.title, 1020).length;
    ctx.font = '32px sans-serif'; const bodyLines = lines(ctx, story.body, 1020).length;
    ctx.font = '25px sans-serif'; const factLines = lines(ctx, p.fact, 1020).length;
    const photoAspect = photo.naturalHeight / photo.naturalWidth;
    const drawW = 1100;
    const drawH = Math.round(1100 * photoAspect);
    canvas.height = 372 + drawH + titleLines * 76 + bodyLines * 52 + factLines * 40 + 20;
    ctx.fillStyle = '#fffcf4'; ctx.fillRect(0,0,1200,canvas.height);
    ctx.drawImage(photo, 0, 0, photo.naturalWidth, photo.naturalHeight, 50, 50, drawW, drawH);
    const contentStartY = 50 + drawH + 38;
    ctx.textBaseline = 'top'; ctx.fillStyle = '#7c8575'; ctx.font = '25px sans-serif'; ctx.fillText(p.name,90,contentStartY); ctx.textAlign = 'right'; ctx.fillText(date,1110,contentStartY); ctx.textAlign = 'left';
    ctx.fillStyle = '#263d36'; ctx.font = '54px serif'; let y = textBlock(ctx,story.title,90,contentStartY + 64,1020,76)+12;
    ctx.fillStyle = '#677164'; ctx.font = '32px sans-serif'; y = textBlock(ctx,story.body,90,y,1020,52)+30;
    ctx.fillStyle = '#dfdfd0'; ctx.fillRect(90,y,1020,2); y += 28;
    ctx.fillStyle = '#a0684d'; ctx.font = '24px sans-serif'; ctx.fillText('城脉小记',90,y); y += 42;
    ctx.fillStyle = '#7c8575'; ctx.font = '25px sans-serif'; y = textBlock(ctx,p.fact,90,y,1020,40)+12;
    ctx.fillStyle = '#89917e'; ctx.font = '21px sans-serif';
    const styleDetail = activePhotoStyle === 'travel' && activeTravelSettings ? ' · ' + travelModelName(activeTravelSettings.engine) + ' / ' + travelFramingName(activeTravelSettings.framing) : (activePhotoStyle !== 'original' && activeTravelSettings ? ' · ' + travelModelName(activeTravelSettings.engine) : '');
    if (activePhotoStyle !== 'original') ctx.fillText(imageTypeLabel(activePhotoStyle, activeTravelSettings?.engine)+styleDetail+' · 非原始照片',90,canvas.height-88);
    ctx.fillText('城脉相机 · CITY MEMORIES',90,canvas.height-55); ctx.textAlign = 'right'; ctx.fillText(story.mode === 'ai' ? 'AI 纪念文案' : '文案示例 · 非实时生成',1110,canvas.height-55);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png')); if (!blob) throw Error('相纸导出失败，请重试。');
    if (exportUrl) URL.revokeObjectURL(exportUrl); exportUrl = URL.createObjectURL(blob); $('export-image').src = exportUrl; $('download').href = exportUrl; $('download').download = `城脉相机-${p.name}-${date}.png`; $('export-dialog').showModal(); status('PNG 已生成，请下载或长按预览图片保存。');
  } catch (err) { status(err.message || '无法导出，请重试。',true); } finally { buttons(); }
});
$('close-dialog').addEventListener('click', () => $('export-dialog').close());
function groupedOptions(items, valueOf, labelOf) {
  const groups = new Map();
  for (const item of items) {
    const category = item.category || places.find(p=>p.id===item.placeId)?.category || '荆州景点';
    if (!groups.has(category)) {const group=document.createElement('optgroup'); group.label=category; groups.set(category,group);}
    groups.get(category).append(new Option(labelOf(item),valueOf(item)));
  }
  return [...groups.values()];
}
try { const [placeRes, healthRes, sceneRes] = await Promise.all([fetch('/api/places'), fetch('/api/health'), fetch('/api/travel-scenes')]); if (!placeRes.ok || !healthRes.ok || !sceneRes.ok) throw Error(); places = await placeRes.json(); const health = await healthRes.json(); imageAvailable = !!health.imageConfigured; travelModels=health.travel?.models || [{id:'gemini',label:'Gemini 3.1 · 快速',available:imageAvailable,timeoutSeconds:150}]; $('travel-engine').replaceChildren(...travelModels.map(m=>{const o=new Option(m.label+(m.available?'':' · 未配置'),m.id);o.disabled=!m.available;return o;})); $('travel-engine').value=health.travel?.defaultEngine || 'gemini'; travelScenes = await sceneRes.json(); const placeholder=new Option('选择已支持实景旅拍的景点',''); placeholder.disabled=true; $('travel-place').replaceChildren(placeholder,...groupedOptions(travelScenes,s=>s.placeId,s=>s.title)); $('place').replaceChildren(...groupedOptions(places,p=>p.id,p=>p.name)); updatePlace(); status(health.configured ? '相机已准备好，先选择一张旅行照片。' : '先选择照片体验。AI 服务待配置，离线示例可用。'); }
catch { status('加载失败，请刷新页面重试。',true); }

// Native file pickers may offer both camera and gallery. Only advertise a
// separate camera when we can actually open a live camera stream.
const canUseCamera = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
if ($('open-camera')) $('open-camera').hidden = true;
let cameraStream = null, cameraVersion = 0;
function stopCamera() {
  cameraVersion++;
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
  $('camera-video').srcObject = null;
  $('take-photo').disabled = true;
}
$('open-camera').addEventListener('click', async () => {
  if (busy || imageBusy || photoLoading) return;
  stopCamera(); const version = cameraVersion;
  $('camera-status').textContent = '请允许使用相机，画面仅在本机处理。';
  $('camera-dialog').showModal();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    if (version !== cameraVersion || !$('camera-dialog').open) { stream.getTracks().forEach(track => track.stop()); return; }
    cameraStream = stream; $('camera-video').srcObject = stream;
    await $('camera-video').play();
    if (version !== cameraVersion) return;
    $('camera-status').textContent = '调整好画面，拍下这一刻。';
    $('take-photo').disabled = false;
  } catch (err) {
    if (version !== cameraVersion) return;
    stopCamera();
    $('camera-status').textContent = err.name === 'NotAllowedError' ? '未获得相机权限。请允许相机权限后重试，或关闭后选择已有照片。' : '相机暂时无法打开。请关闭后选择照片，或稍后重试。';
  }
});
$('take-photo').addEventListener('click', async () => {
  const video = $('camera-video');
  if (!cameraStream || !video.videoWidth || !video.videoHeight) return;
  $('take-photo').disabled = true;
  const canvas = document.createElement('canvas');
  const ratio = Math.min(1,2000/Math.max(video.videoWidth,video.videoHeight));
  canvas.width = Math.round(video.videoWidth*ratio); canvas.height = Math.round(video.videoHeight*ratio);
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  const version = cameraVersion;
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.92));
  if (version !== cameraVersion) return;
  if (!blob) { $('camera-status').textContent = '拍摄失败，请重试。'; $('take-photo').disabled = false; return; }
  stopCamera(); $('camera-dialog').close(); await loadPhoto(blob);
});
$('close-camera').addEventListener('click', () => {stopCamera();$('camera-dialog').close();});
$('camera-dialog').addEventListener('close', stopCamera);
$('camera-dialog').addEventListener('cancel', stopCamera);
window.addEventListener('pagehide', stopCamera);
document.addEventListener('visibilitychange', () => { if (document.hidden && $('camera-dialog').open) { stopCamera(); $('camera-dialog').close(); } });

function imageStatus(message, isError = false) {
  $('image-status').textContent = message;
  $('image-status').classList.toggle('error',isError);
}
function styleVariantKey(style) {
  const eng = $('style-engine')?.value || 'gemini';
  return `${style}|${eng}`;
}
function applyPhotoStyle(style) {
  const isTravel = style === 'travel';
  const travelVar = isTravel ? travelVariants.get(travelVariantKey()) : null;
  const styleKey = styleVariantKey(style);
  const styleVar = (!isTravel && style !== 'original') ? (photoVariants[styleKey] || photoVariants[style]) : null;
  const candidate = style === 'original' ? originalPhoto : isTravel ? travelVar?.photo : (styleVar?.photo || styleVar);
  if (!candidate) return false;
  activeTravelScene = isTravel ? travelVar.scene : null;
  activeTravelSettings = isTravel ? travelVar.settings : (styleVar?.settings || null);
  $('travel-result-info').hidden = !isTravel || !activeTravelSettings;
  $('travel-result-info').textContent = (isTravel && activeTravelSettings) ? '当前图片：'+travelModelName(activeTravelSettings.engine)+' · '+travelFramingName(activeTravelSettings.framing) : '';
  if ($('travel-credit')) $('travel-credit').hidden = true;
  photo = candidate; activePhotoStyle = style;
  updatePhotoAspect(candidate);
  $('photo').src = photo.src;
  $('image-mode').hidden = style === 'original';
  $('image-mode').textContent = imageTypeLabel(style, activeTravelSettings?.engine);
  return true;
}
for (const input of document.querySelectorAll('input[name=photo-style]')) input.addEventListener('change', () => {
  const style=input.value; if (style==='travel' || activePhotoStyle==='travel') resetStory(); $('stylize-options').hidden=style==='original'; $('travel-options').hidden=style!=='travel'; updateScenePreview();
  if (applyPhotoStyle(style)) imageStatus(style==='original'?'已切回原片，不上传照片。':'正在使用已生成的'+photoStyleNames[style]+'风格图，可随时切回原片。');
  else imageStatus(!originalPhoto?'请先选择照片。':(style==='travel'?!travelModels.some(m=>m.id===$('travel-engine').value && m.available):!travelModels.some(m=>m.id===($('style-engine')?.value||'gemini') && m.available))?'所选图像模型尚未配置，仍可使用原片。':'勾选同意后生成'+photoStyleNames[style]+'风格图；当前相纸仍使用'+photoStyleNames[activePhotoStyle]+'。');
  const cached=style==='travel'?travelVariants.has(travelVariantKey()):Boolean(photoVariants[styleVariantKey(style)] || photoVariants[style]);
  $('stylize').textContent=(cached?'重新生成':'生成')+photoStyleNames[style]+'图';
  buttons();
});
$('image-consent').addEventListener('change',buttons);
$('cancel-stylize').addEventListener('click',()=>imageController?.abort());
$('stylize').addEventListener('click',async()=>{
  const style=document.querySelector('input[name=photo-style]:checked').value;
  const isTravel = style === 'travel';
  const settings = isTravel ? {engine:$('travel-engine').value,framing:$('travel-framing').value} : {engine:$('style-engine')?.value || 'gemini'};
  const selectedModel=travelModels.find(m=>m.id===settings?.engine);
  if (busy || imageBusy || !originalPhoto || style==='original' || !$('image-consent').checked || !selectedModel?.available) return;
  if (isTravel && !travelScenes.some(s=>s.placeId===$('place').value)) {imageStatus('当前景点暂无已授权实景参考图，请主动选择其他旅拍景点，或使用原片。',true); return;}
  const version=uploadVersion,variantKey=isTravel?travelVariantKey():styleVariantKey(style);
  imageBusy=true;buttons();$('cancel-stylize').hidden=false;
  imageController=new AbortController();const controller=imageController;
  const waitSeconds=selectedModel.timeoutSeconds || (settings.engine === 'gemini' ? 150 : 240);
  const timer=setTimeout(()=>controller.abort('timeout'),(waitSeconds+10)*1000);
  imageStatus('正在生成'+(isTravel?travelModelName(settings.engine)+' · '+travelFramingName(settings.framing):photoStyleNames[style]+' · '+travelModelName(settings.engine))+'图片，最长等待约 '+Math.ceil(waitSeconds/60)+' 分钟，原片与已有结果已保留…');
  try {
    // Resizing and re-encoding strips metadata before the opted-in upload.
    const canvas=document.createElement('canvas');
    const ratio=Math.min(1,1280/Math.max(originalPhoto.naturalWidth,originalPhoto.naturalHeight));
    canvas.width=Math.round(originalPhoto.naturalWidth*ratio);canvas.height=Math.round(originalPhoto.naturalHeight*ratio);
    canvas.getContext('2d').drawImage(originalPhoto,0,0,canvas.width,canvas.height);
    const res=await fetch(isTravel?'/api/travel':'/api/stylize',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({image:canvas.toDataURL('image/jpeg',.85),style,engine:settings.engine,placeId:$('place').value,consent:true,sceneImage:currentSceneImage(),...(settings || {})})});
    const data=await res.json();if(!res.ok)throw Error(data.error || '风格化失败，请重试。');
    const result=new Image();result.src=data.image;await result.decode();
    if (controller.signal.aborted) throw new DOMException('Canceled','AbortError');
    if (version!==uploadVersion) return;
    if(isTravel) {
      travelVariants.delete(variantKey);
      travelVariants.set(variantKey,{photo:result,scene:data.scene,settings:{engine:data.engine || settings.engine,framing:data.framing || settings.framing}});
      while(travelVariants.size>6) travelVariants.delete(travelVariants.keys().next().value);
      resetStory();
    } else {
      photoVariants[variantKey]={photo:result,settings:{engine:data.engine || settings.engine}};
      photoVariants[style]={photo:result,settings:{engine:data.engine || settings.engine}};
    }
    applyPhotoStyle(style);
    $('stylize').textContent='重新生成'+photoStyleNames[style]+'图';
    imageStatus(photoStyleNames[style]+'图片已应用。请检查人物与细节；不满意可随时切回原片或切换模式重试。');
  } catch(err) {
    imageStatus(controller.signal.aborted ? (controller.signal.reason==='timeout'?'生成超时，原片已保留。':'已取消等待，原片已保留。上游可能已产生调用费用。') : (err.message || '生成失败，原片已保留。'),true);
  } finally {clearTimeout(timer);imageBusy=false;imageController=null;$('cancel-stylize').hidden=true;buttons();}
});

function imageTypeLabel(style, engine) {
  if (style==='travel') return 'AI 虚拟旅拍';
  const eng = engine || $('style-engine')?.value;
  return 'AI '+photoStyleNames[style]+'风格图' + (eng ? ' · ' + travelModelName(eng) : '');
}
function travelAttribution(scene) {return scene ? `景点参考：${scene.title}` : '';}

function openAppWithFallback(appScheme, webUrl) {
  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (!isMobile) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  let appLaunched = false;
  let timer = null;
  const cancelFallback = () => {
    appLaunched = true;
    if (timer) { clearTimeout(timer); timer = null; }
    window.removeEventListener('pagehide', cancelFallback);
    window.removeEventListener('blur', cancelFallback);
    document.removeEventListener('visibilitychange', onVisChange);
  };
  const onVisChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') cancelFallback();
  };
  window.addEventListener('pagehide', cancelFallback, { once: true });
  window.addEventListener('blur', cancelFallback, { once: true });
  document.addEventListener('visibilitychange', onVisChange);
  window.location.href = appScheme;
  timer = setTimeout(() => {
    cancelFallback();
    if (!appLaunched && !document.hidden && document.visibilityState === 'visible') {
      window.location.href = webUrl;
    }
  }, 2800);
}

function bindExploreAction(id, query, appType) {
  const el = $(id);
  if (!el) return;
  const encoded = encodeURIComponent(query);
  let appScheme = '', webUrl = '';
  if (appType === 'xhs') {
    appScheme = `xhsdiscover://search/result?keyword=${encoded}`;
    webUrl = `https://www.xiaohongshu.com/search_result?keyword=${encoded}`;
  } else if (appType === 'douyin') {
    appScheme = `snssdk1128://search?keyword=${encoded}`;
    webUrl = `https://www.douyin.com/search/${encoded}`;
  } else if (appType === 'amap') {
    appScheme = `amapuri://route/plan/?sourceApplication=citypulse-camera&dname=${encoded}&dev=0&t=0`;
    webUrl = `https://uri.amap.com/navigation?to=${encoded}&mode=car&src=citypulse-camera`;
  }
  el.href = webUrl;
  el.onclick = (e) => {
    e.preventDefault();
    openAppWithFallback(appScheme, webUrl);
  };
}

function updateExploreLinks(place) {
  if (!place) return;
  const cleanName = place.name.split('·')[0].trim();
  const searchPlace = place.id === 'custom' ? cleanName : `荆州 ${cleanName}`;
  const xhsQuery = `${searchPlace} 打卡攻略`;
  const douyinQuery = `${searchPlace} 游玩`;
  const amapQuery = searchPlace;
  bindExploreAction('place-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('place-explore-douyin', douyinQuery, 'douyin');
  bindExploreAction('place-explore-amap', amapQuery, 'amap');
  bindExploreAction('scene-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('scene-explore-douyin', douyinQuery, 'douyin');
  bindExploreAction('scene-explore-amap', amapQuery, 'amap');
}
function setSceneImageIndex(idx) {
  const scene = travelScenes.find(s=>s.placeId===$('place').value);
  if (!scene) return;
  const list = getActiveSceneImages(scene);
  if (!list.length) return;
  if (idx < 0) idx = list.length - 1;
  if (idx >= list.length) idx = 0;
  currentSceneImageIndex = idx;
  const cur = list[idx];
  $('scene-preview').src = cur.url;
  $('scene-preview').alt = (cur.title || scene.title) + '实景参考图';
  if ($('scene-counter')) $('scene-counter').textContent = `${idx + 1} / ${list.length}`;
  if ($('scene-photo-title')) $('scene-photo-title').textContent = cur.title || scene.title;
  if ($('scene-placement')) $('scene-placement').textContent = '构图建议：' + (cur.hint || scene.placementHint);
  const style = document.querySelector('input[name=photo-style]:checked')?.value;
  if (style === 'travel') {
    const cached = travelVariants.has(travelVariantKey());
    if (cached) { applyPhotoStyle('travel'); resetStory(); imageStatus('已切换到本页缓存的 '+travelModelName($('travel-engine').value)+' / '+travelFramingName($('travel-framing').value)+' 旅拍图。'); }
    $('stylize').textContent = (cached ? '重新生成' : '生成') + '虚拟旅拍图';
  }
}
function updateScenePreview() {
  const scene=travelScenes.find(s=>s.placeId===$('place').value);
  $('scene-preview').hidden=!scene; if ($('scene-source')) $('scene-source').hidden=!scene; $('scene-placement').hidden=!scene;
  if (scene) {
    $('travel-place').value=scene.placeId;
    currentSceneImageIndex = 0;
    setSceneImageIndex(0);
  } else {
    $('travel-place').value=''; $('scene-preview').removeAttribute('src');
    if ($('scene-photo-title')) $('scene-photo-title').textContent='';
  }
  if ($('scene-license')) $('scene-license').textContent = scene ? '历史实景（'+scene.capturedAt+'），不代表当前景观。' : '此景点暂无可确认授权的实景参考图，不会自动改成其他地点。可在上方主动换旅拍景点，或切回原片继续制作。';
  const style=document.querySelector('input[name=photo-style]:checked')?.value;
  if (style && style!=='original') $('stylize').textContent=((style==='travel'?travelVariants.has(travelVariantKey()):photoVariants[style])?'重新生成':'生成')+photoStyleNames[style]+'图';
  updateTravelModelNotice();
}
function updateTravelModelNotice() {
  const model=travelModels.find(m=>m.id===$('travel-engine').value);
  const eng=$('travel-engine').value;
  const speedNotice = eng==='gemini' ? '【快速模式】生成迅速，约20–40秒，推荐优先试出构图。' : eng==='image2' ? '【标准模式】画面质感与光影平衡度更佳。' : '【精细模式】细节融合与真实质感深度增强。';
  $('travel-model-notice').textContent=(model?.available ? speedNotice : '此模式尚未配置。')+' '+($('travel-framing').value==='scenic'?'小人物大背景，保留壮丽风貌。':'人景均衡比例合影。');
}
for(const id of ['travel-engine','travel-framing']) $(id).addEventListener('change',()=>{
  updateTravelModelNotice();
  if(document.querySelector('input[name=photo-style]:checked')?.value!=='travel') {buttons();return;}
  const cached=travelVariants.has(travelVariantKey());
  if(cached) {applyPhotoStyle('travel');resetStory();imageStatus('已切换到本页缓存的 '+travelModelName($('travel-engine').value)+' / '+travelFramingName($('travel-framing').value)+' 图片，不再次调用。');}
  else imageStatus('已更改待生成设置；当前照片保持不变，点击生成后才调用。'+(activeTravelSettings?'当前图片仍为 '+travelModelName(activeTravelSettings.engine)+' / '+travelFramingName(activeTravelSettings.framing)+'。':''));
  $('stylize').textContent=(cached?'重新生成':'生成')+'虚拟旅拍图';buttons();
});
function updateStyleModelNotice() {
  const eng = $('style-engine')?.value || 'gemini';
  const notice = eng === 'gemini' ? '【快速模式】生成迅速，约 20–40 秒，推荐优先体验。' : eng === 'image2' ? '【标准模式】画面质感与光影平衡度更佳。' : '【精细模式】细节融合、人物面容与艺术笔触深度增强。';
  if ($('style-model-notice')) $('style-model-notice').textContent = notice;
}
$('style-engine')?.addEventListener('change', () => {
  updateStyleModelNotice();
  const style = document.querySelector('input[name=photo-style]:checked')?.value;
  if (!style || style === 'original' || style === 'travel') { buttons(); return; }
  const key = styleVariantKey(style);
  const cached = Boolean(photoVariants[key]);
  if (cached) {
    applyPhotoStyle(style);
    resetStory();
    imageStatus('已切换到本页缓存的 '+photoStyleNames[style]+' · '+travelModelName($('style-engine').value)+' 风格图。');
  } else {
    imageStatus('已切换待生成模式：'+travelModelName($('style-engine').value)+'，点击下方按钮开始生成。');
  }
  $('stylize').textContent = (cached ? '重新生成' : '生成') + photoStyleNames[style] + '图';
  buttons();
});
$('travel-place').addEventListener('change',()=>{ $('place').value=$('travel-place').value; updatePlace(); imageStatus('已切换旅拍景点，请重新生成，当前保留原片或已有风格图。'); buttons(); });
$('scene-prev')?.addEventListener('click', () => setSceneImageIndex(currentSceneImageIndex - 1));
$('scene-next')?.addEventListener('click', () => setSceneImageIndex(currentSceneImageIndex + 1));

const isMobileDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
$('choose-photo-btn')?.addEventListener('click', () => {
  if (busy || imageBusy || photoLoading) return;
  if (isMobileDevice() || !canUseCamera) {
    $('album').click();
  } else {
    $('photo-choice-dialog')?.showModal();
  }
});
$('btn-choice-album')?.addEventListener('click', () => {
  $('photo-choice-dialog')?.close();
  $('album').click();
});
$('btn-choice-camera')?.addEventListener('click', () => {
  $('photo-choice-dialog')?.close();
  $('open-camera').click();
});
$('close-choice-dialog')?.addEventListener('click', () => {
  $('photo-choice-dialog')?.close();
});

// Background music 《荆州谣》 controller
const bgAudio = $('bg-audio');
const musicBtn = $('music-btn');
const musicDisk = $('music-disk');
const musicPlayIcon = $('music-play-icon');
let isMusicPlaying = false;

if (musicBtn && bgAudio) {
  musicBtn.addEventListener('click', async () => {
    if (isMusicPlaying) {
      bgAudio.pause();
      isMusicPlaying = false;
      musicDisk.classList.remove('playing');
      musicDisk.classList.add('paused');
      musicPlayIcon.textContent = '▶';
      musicPlayIcon.classList.remove('playing');
      musicBtn.setAttribute('aria-label', '播放音乐《荆州谣》');
    } else {
      try {
        await bgAudio.play();
        isMusicPlaying = true;
        musicDisk.classList.remove('paused');
        musicDisk.classList.add('playing');
        musicPlayIcon.textContent = '⏸';
        musicPlayIcon.classList.add('playing');
        musicBtn.setAttribute('aria-label', '暂停音乐《荆州谣》');
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    }
  });

  bgAudio.addEventListener('ended', () => {
    isMusicPlaying = false;
    musicDisk.classList.remove('playing', 'paused');
    musicPlayIcon.textContent = '▶';
    musicPlayIcon.classList.remove('playing');
    musicBtn.setAttribute('aria-label', '播放音乐《荆州谣》');
  });
}
