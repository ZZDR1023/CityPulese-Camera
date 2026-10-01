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
const currentPlace = () => places.find(p => p.id === $('place').value);
function status(message, isError = false) { $('status').textContent = message; $('status').classList.toggle('error', isError); }
function buttons() {
  const locked = busy || imageBusy;
  $('generate').disabled = locked || photoLoading || !photo || !places.length;
  if ($('example')) $('example').disabled = locked || photoLoading || !photo || !places.length;
  $('save').disabled = locked || photoLoading || !story || !photo;
  for (const el of document.querySelectorAll('#place,#mood,input,#open-camera,#travel-place,#travel-engine,#travel-framing')) el.disabled = locked;
  const isTravel=document.querySelector('input[name=photo-style]:checked')?.value==='travel';
  const available=isTravel ? travelModels.some(m=>m.id===$('travel-engine').value && m.available) : imageAvailable;
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
    originalPhoto = ready; photoVariants = {}; travelVariants.clear(); activeTravelScene = null; activeTravelSettings=null; $('travel-result-info').hidden=true; if ($('travel-credit')) $('travel-credit').hidden = true; $('travel-options').hidden = true; activePhotoStyle = 'original'; $('image-consent').checked = false; document.querySelector('input[name=photo-style][value=original]').checked = true; $('stylize-options').hidden = true; $('image-mode').hidden = true; imageStatus('当前使用原片，不上传照片。'); photo = ready; $('photo').src = preview; $('photo').hidden = false; if ($('empty-photo')) $('empty-photo').hidden = true; $('photo-label').textContent = '照片已就位 · 可重新选择'; resetStory(); status('照片已就位，写下心情，开始出片。');
  } catch (err) { if (version === uploadVersion) status(err.message || '照片无法读取，请换一张 JPG 或 PNG。', true); }
  finally { if (url) URL.revokeObjectURL(url); if (version === uploadVersion) { photoLoading = false; buttons(); } }
}
$('place').addEventListener('change', updatePlace);
$('mood').addEventListener('input', () => { $('counter').textContent = `${[...$('mood').value].length} / 100`; resetStory(); });
for (const input of document.querySelectorAll('input[name=style]')) input.addEventListener('change', resetStory);
function displayStory(result) { story = result; $('story-title').textContent = result.title; $('story-body').textContent = result.body; $('mode').textContent = result.mode === 'ai' ? 'AI 纪念文案' : '文案示例 · 非实时生成'; $('paper').classList.remove('fresh'); void $('paper').offsetWidth; $('paper').classList.add('fresh'); buttons(); }
if ($('example')) $('example').addEventListener('click', () => { if (!photo || busy || imageBusy) return; displayStory({ ...(activePhotoStyle==='travel' ? {title:'把向往装进相纸',body:'让想象先抵达心中的目的地，把一份旅行的向往留在相纸里。这是一次虚拟的相遇，也是一张写给未来旅程的邀请。愿有一天，我们能真正走近这座城。'} : currentPlace().example), mode: 'example' }); status('当前为固定离线示例，不会根据心情生成。可保存体验相纸。'); });
$('generate').addEventListener('click', async () => {
  if (busy || imageBusy || !photo) return; busy = true; buttons(); status('正在写纪念文案，约需 5–45 秒，请稍候…'); $('generate').firstElementChild.textContent = '正在生成…';
  try { const res = await fetch('/api/story', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ placeId: $('place').value, mood: $('mood').value, style: document.querySelector('input[name=style]:checked').value, photoMode: activePhotoStyle==='travel'?'travel':'photo' }), signal: AbortSignal.timeout(50000) }); const data = await res.json(); if (!res.ok) throw Error(data.error || '生成失败，请重试。'); displayStory(data); status('相纸已出片。收藏今天，也记得检查文案是否合心意。'); }
  catch (err) { status(err.name === 'TimeoutError' ? '等待超时。照片和心情已保留，可重试或体验离线示例。' : err.message || '连接失败，请重试。', true); }
  finally { busy = false; buttons(); $('generate').firstElementChild.textContent = '生成我的纪念相纸'; }
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
    canvas.height = 1472 + titleLines * 76 + bodyLines * 52 + factLines * 40 + 20;
    ctx.fillStyle = '#fffcf4'; ctx.fillRect(0,0,1200,canvas.height);
    const size = Math.min(photo.naturalWidth, photo.naturalHeight); ctx.drawImage(photo, (photo.naturalWidth-size)/2, (photo.naturalHeight-size)/2, size,size,50,50,1100,1100);
    ctx.textBaseline = 'top'; ctx.fillStyle = '#7c8575'; ctx.font = '25px sans-serif'; ctx.fillText(p.name,90,1188); ctx.textAlign = 'right'; ctx.fillText(date,1110,1188); ctx.textAlign = 'left';
    ctx.fillStyle = '#263d36'; ctx.font = '54px serif'; let y = textBlock(ctx,story.title,90,1252,1020,76)+12;
    ctx.fillStyle = '#677164'; ctx.font = '32px sans-serif'; y = textBlock(ctx,story.body,90,y,1020,52)+30;
    ctx.fillStyle = '#dfdfd0'; ctx.fillRect(90,y,1020,2); y += 28;
    ctx.fillStyle = '#a0684d'; ctx.font = '24px sans-serif'; ctx.fillText('城脉小记',90,y); y += 42;
    ctx.fillStyle = '#7c8575'; ctx.font = '25px sans-serif'; y = textBlock(ctx,p.fact,90,y,1020,40)+12;
    ctx.fillStyle = '#89917e'; ctx.font = '21px sans-serif'; if (activePhotoStyle !== 'original') ctx.fillText(imageTypeLabel(activePhotoStyle)+(activePhotoStyle==='travel' && activeTravelSettings?' · '+travelModelName(activeTravelSettings.engine)+' / '+travelFramingName(activeTravelSettings.framing):'')+' · 非原始照片',90,canvas.height-88); ctx.fillText('城脉相机 · CITY MEMORIES',90,canvas.height-55); ctx.textAlign = 'right'; ctx.fillText(story.mode === 'ai' ? 'AI 纪念文案' : '文案示例 · 非实时生成',1110,canvas.height-55);
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
function applyPhotoStyle(style) {
  const variant=style==='travel' ? travelVariants.get(travelVariantKey()) : null;
  const candidate = style === 'original' ? originalPhoto : style==='travel' ? variant?.photo : photoVariants[style];
  if (!candidate) return false;
  activeTravelScene = style==='travel' ? variant.scene : null;
  activeTravelSettings=style==='travel' ? variant.settings : null;
  $('travel-result-info').hidden=!activeTravelSettings;
  $('travel-result-info').textContent=activeTravelSettings?'当前图片：'+travelModelName(activeTravelSettings.engine)+' · '+travelFramingName(activeTravelSettings.framing):'';
  if ($('travel-credit')) $('travel-credit').hidden = true;
  photo = candidate; activePhotoStyle = style; $('photo').src = photo.src;
  $('image-mode').hidden = style === 'original';
  $('image-mode').textContent = imageTypeLabel(style);
  return true;
}
for (const input of document.querySelectorAll('input[name=photo-style]')) input.addEventListener('change', () => {
  const style=input.value; if (style==='travel' || activePhotoStyle==='travel') resetStory(); $('stylize-options').hidden=style==='original'; $('travel-options').hidden=style!=='travel'; updateScenePreview();
  if (applyPhotoStyle(style)) imageStatus(style==='original'?'已切回原片，不上传照片。':'正在使用已生成的'+photoStyleNames[style]+'风格图，可随时切回原片。');
  else imageStatus(!originalPhoto?'请先选择照片。':(style==='travel'?!travelModels.some(m=>m.id===$('travel-engine').value && m.available):!imageAvailable)?'所选图像模型尚未配置，仍可使用原片。':'勾选同意后生成'+photoStyleNames[style]+'风格图；当前相纸仍使用'+photoStyleNames[activePhotoStyle]+'。');
  const cached=style==='travel'?travelVariants.has(travelVariantKey()):!!photoVariants[style];
  $('stylize').textContent=(cached?'重新生成':'生成')+photoStyleNames[style]+'图';
  buttons();
});
$('image-consent').addEventListener('change',buttons);
$('cancel-stylize').addEventListener('click',()=>imageController?.abort());
$('stylize').addEventListener('click',async()=>{
  const style=document.querySelector('input[name=photo-style]:checked').value;
  const settings=style==='travel'?{engine:$('travel-engine').value,framing:$('travel-framing').value}:null;
  const selectedModel=travelModels.find(m=>m.id===settings?.engine);
  if (busy || imageBusy || !originalPhoto || style==='original' || !$('image-consent').checked || (style==='travel'?!selectedModel?.available:!imageAvailable)) return;
  if (style==='travel' && !travelScenes.some(s=>s.placeId===$('place').value)) {imageStatus('当前景点暂无已授权实景参考图，请主动选择其他旅拍景点，或使用原片。',true); return;}
  const version=uploadVersion,variantKey=travelVariantKey();
  imageBusy=true;buttons();$('cancel-stylize').hidden=false;
  imageController=new AbortController();const controller=imageController;
  const waitSeconds=style==='travel'?(selectedModel.timeoutSeconds || 150):150;
  const timer=setTimeout(()=>controller.abort('timeout'),(waitSeconds+10)*1000);
  imageStatus('正在生成'+(style==='travel'?travelModelName(settings.engine)+' · '+travelFramingName(settings.framing):photoStyleNames[style])+'图片，最长等待约 '+Math.ceil(waitSeconds/60)+' 分钟，原片与已有结果已保留…');
  try {
    // Resizing and re-encoding strips metadata before the opted-in upload.
    const canvas=document.createElement('canvas');
    const ratio=Math.min(1,1280/Math.max(originalPhoto.naturalWidth,originalPhoto.naturalHeight));
    canvas.width=Math.round(originalPhoto.naturalWidth*ratio);canvas.height=Math.round(originalPhoto.naturalHeight*ratio);
    canvas.getContext('2d').drawImage(originalPhoto,0,0,canvas.width,canvas.height);
    const res=await fetch(style==='travel'?'/api/travel':'/api/stylize',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({image:canvas.toDataURL('image/jpeg',.85),style,placeId:$('place').value,consent:true,sceneImage:currentSceneImage(),...(settings || {})})});
    const data=await res.json();if(!res.ok)throw Error(data.error || '风格化失败，请重试。');
    const result=new Image();result.src=data.image;await result.decode();
    if (controller.signal.aborted) throw new DOMException('Canceled','AbortError');
    if (version!==uploadVersion) return;
    if(style==='travel') {travelVariants.delete(variantKey);travelVariants.set(variantKey,{photo:result,scene:data.scene,settings:{engine:data.engine || settings.engine,framing:data.framing || settings.framing}});while(travelVariants.size>6) travelVariants.delete(travelVariants.keys().next().value);resetStory();}
    else photoVariants[style]=result;
    applyPhotoStyle(style);
    $('stylize').textContent='重新生成'+photoStyleNames[style]+'图';
    imageStatus(photoStyleNames[style]+'图片已应用。请检查人物与建筑细节；不满意可切回原片或重试。');
  } catch(err) {
    imageStatus(controller.signal.aborted ? (controller.signal.reason==='timeout'?'生成超时，原片已保留。':'已取消等待，原片已保留。上游可能已产生调用费用。') : (err.message || '生成失败，原片已保留。'),true);
  } finally {clearTimeout(timer);imageBusy=false;imageController=null;$('cancel-stylize').hidden=true;buttons();}
});

function imageTypeLabel(style) {return style==='travel'?'AI 虚拟旅拍':'AI '+photoStyleNames[style]+'风格图';}
function travelAttribution(scene) {return scene ? `景点参考：${scene.title}` : '';}

function openAppWithFallback(appScheme, webUrl) {
  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (!isMobile) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  const start = Date.now();
  window.location.href = appScheme;
  setTimeout(() => {
    if (document.hidden || Date.now() - start > 2200) return;
    window.location.href = webUrl;
  }, 1200);
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
  const xhsQuery = `荆州 ${cleanName} 打卡攻略`;
  const douyinQuery = `荆州 ${cleanName} 游玩`;
  bindExploreAction('place-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('place-explore-douyin', douyinQuery, 'douyin');
  bindExploreAction('scene-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('scene-explore-douyin', douyinQuery, 'douyin');
  if ($('place-explore-official')) {
    if (place.source?.url) { $('place-explore-official').href = place.source.url; $('place-explore-official').hidden = false; }
    else { $('place-explore-official').hidden = true; }
  }
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
