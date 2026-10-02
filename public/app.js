import {openAppWithFallback} from './app-links.js';
import {buildPassport, readStamps, addStamp, writeStamps, memoryStorageKey} from './memory-passport.js';
import {paperThemes, phoenixPath, renderPaper} from './paper-renderer.js';
const $ = id => document.getElementById(id);
let inputVersion = 0, exporting = false, imageQueueWaitSeconds = 50;
let paperFormat = 'paper', paperTheme = 'classic', memoryStamps = [];
try { memoryStamps = readStamps(localStorage); } catch {}
for (const path of document.querySelectorAll('.phoenix-line')) path.setAttribute('d', phoenixPath);
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
  const locked = busy || imageBusy || exporting;
  $('generate').disabled = locked || photoLoading || !photo || !places.length;
  if ($('example')) $('example').disabled = locked || photoLoading || !photo || !places.length;
  $('save').disabled = locked || photoLoading || !story || !photo;
  for (const el of document.querySelectorAll('#mood,input,#open-camera,#travel-place,#travel-engine,#travel-framing,#style-engine,#toggle-custom-place,#cancel-custom-place,#scene-prev,#scene-next,#choose-photo-btn,#rechoose-photo-btn,#choose-next-stop,#clear-memories')) el.disabled = locked || photoLoading;
  $('collect-memory').disabled = locked || photoLoading || !story || !photo || currentPlace()?.id === 'custom';
  const isTravel=document.querySelector('input[name=photo-style]:checked')?.value==='travel';
  $('place').disabled = locked || isTravel;
  $('place-locked-badge').hidden = !isTravel;
  if ($('toggle-custom-place')) $('toggle-custom-place').hidden = isTravel;
  if ($('custom-place-box')) $('custom-place-box').hidden = isTravel || $('place').value !== 'custom';
  const selectedEngine = isTravel ? $('travel-engine').value : $('style-engine')?.value || 'gemini';
  const available = travelModels.some(m=>m.id===selectedEngine && m.available);
  $('stylize').disabled = locked || photoLoading || !originalPhoto || !available || !$('image-consent').checked || (isTravel && !travelScenes.some(s=>s.placeId===$('place').value));
}

function resetStory() { inputVersion++; story = null; $('story-title').textContent = '等一张照片，等一个故事。'; $('story-body').textContent = '把旅行中的一瞬放在这里。写下心情，让回忆有自己的声音。'; $('mode').textContent = '相纸预览'; updateMemoryPreview(); buttons(); }
function updatePlace() {
  const p = currentPlace(); if (!p) return;
  const isCustom = $('place').value === 'custom';
  if ($('custom-place-box')) $('custom-place-box').hidden = isCustom ? false : true;
  if ($('toggle-custom-place')) $('toggle-custom-place').textContent = isCustom ? '✓ 已开启自定义地点' : '✏️ 自定义输入地点';
  if (activePhotoStyle==='travel' && activeTravelScene?.placeId!==p.id) applyPhotoStyle('original');
  updateScenePreview(); updateExploreLinks(p); $('paper-place').textContent = p.name; $('culture-fact').textContent = p.fact;
  $('place-notice').hidden = !p.notice; $('place-notice').textContent = p.notice || '';
  $('culture-notice').hidden = !p.notice; $('culture-notice').textContent = p.notice || '';
  $('place-availability').textContent = travelScenes.some(s=>s.placeId===p.id) ? '已支持实景虚拟旅拍，也可用原片／动漫／水彩制作相纸。' : (isCustom ? '已启用自定义打卡地，AI 将为你量身定制专属纪念文案。' : '文化卡已接入；暂无可确认授权的旅拍背景，原片／动漫／水彩和文案可正常使用。');
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
    originalPhoto = ready; photoVariants = {}; travelVariants.clear(); activeTravelScene = null; activeTravelSettings=null; $('travel-result-info').hidden=true; if ($('travel-credit')) $('travel-credit').hidden = true; $('travel-options').hidden = true; activePhotoStyle = 'original'; $('image-consent').checked = false; document.querySelector('input[name=photo-style][value=original]').checked = true; $('stylize-options').hidden = true; $('image-mode').hidden = true; imageStatus('当前使用原片，不上传照片。'); photo = ready; updatePhotoAspect(ready); $('photo').src = preview; $('photo').hidden = false; if ($('empty-photo')) $('empty-photo').hidden = true; if ($('upload-placeholder')) $('upload-placeholder').hidden = true; if ($('upload-preview')) $('upload-preview').hidden = false; if ($('upload-thumb')) $('upload-thumb').src = preview; resetStory(); status('照片已就位，写下心情，开始出片。');
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
$('toggle-custom-place')?.addEventListener('click', () => {
  if (busy || imageBusy || exporting || photoLoading) return;
  $('place').value = 'custom';
  if ($('custom-place-box')) $('custom-place-box').hidden = false;
  $('custom-place-input')?.focus();
  updatePlace();
});
$('cancel-custom-place')?.addEventListener('click', () => {
  if (busy || imageBusy || exporting || photoLoading) return;
  $('place').value = places[0]?.id || '';
  if ($('custom-place-box')) $('custom-place-box').hidden = true;
  updatePlace();
});
$('mood').addEventListener('input', () => { $('counter').textContent = `${[...$('mood').value].length} / 100`; resetStory(); });
for (const input of document.querySelectorAll('input[name=style]')) input.addEventListener('change', resetStory);
function displayStory(result) {
  story = result;
  $('story-title').textContent = result.title;
  $('story-body').textContent = result.body;
  if ($('mode')) $('mode').textContent = '';
  $('paper').classList.remove('fresh');
  void $('paper').offsetWidth;
  $('paper').classList.add('fresh');
  updateMemoryPreview();
  buttons();
}
if ($('example')) $('example').addEventListener('click', () => { if (!photo || busy || imageBusy) return; displayStory({ ...(activePhotoStyle==='travel' ? {title:'把向往装进相纸',body:'让想象先抵达心中的目的地，把一份旅行的向往留在相纸里。这是一次虚拟的相遇，也是一张写给未来旅程的邀请。愿有一天，我们能真正走近这座城。'} : currentPlace().example), mode: 'example' }); status('当前为固定离线示例，不会根据心情生成。可保存体验相纸。'); });
$('generate').addEventListener('click', async () => {
  if (busy || imageBusy || exporting || !photo) return;
  const version = inputVersion, snapshot = JSON.stringify(storyInput());
  busy = true; buttons(); status('正在写纪念文案，多人体验时会自动等待空位，请稍候…'); $('generate').firstElementChild.textContent = '正在生成…';
  try {
    const res = await fetch('/api/story', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: snapshot, signal: AbortSignal.timeout(95000)
    });
    const data = await res.json();
    if (!res.ok) throw Error(data.error || '生成失败，请重试。');
    if (version !== inputVersion || snapshot !== JSON.stringify(storyInput())) {
      status('输入已改变，已丢弃旧文案。请按当前地点重新生成。');
      return;
    }
    displayStory(data);
    status('相纸已出片。收藏今天，也记得检查文案是否合心意。');
  } catch (err) {
    status(err.name === 'TimeoutError' ? '等待超时。照片和心情已保留，可重试或体验离线示例。' : err.message || '连接失败，请重试。', true);
  } finally {
    busy = false; updateMemoryPreview(); buttons();
  }
});
function storyInput() {
  const custom = $('place').value === 'custom';
  return {placeId: $('place').value, customPlace: custom ? ($('custom-place-input').value.trim() || '荆州') : undefined, mood: $('mood').value, style: document.querySelector('input[name=style]:checked').value, photoMode: activePhotoStyle === 'travel' ? 'travel' : 'photo', uploadVersion};
}
function currentPassport() {
  const place = currentPlace();
  return place ? buildPassport(place, places, {mood: $('mood').value, kind: activePhotoStyle === 'travel' ? 'wish' : 'memory'}) : null;
}
function updateMemoryPreview() {
  const passport = currentPassport();
  $('paper').dataset.theme = paperTheme;
  $('paper').dataset.format = paperFormat;
  const isPassport = paperFormat === 'passport';
  $('edition-band').hidden = !isPassport && paperTheme !== 'chuyun';
  $('edition-title').textContent = isPassport ? '荆州 · 城市记忆护照' : '荆州限定 · 楚韵纪念';
  $('passport-details').hidden = !isPassport;
  $('memory-collection').hidden = !isPassport;
  const culture = $('culture-card');
  if (isPassport) $('passport-details').insertBefore(culture, $('next-stop'));
  else $('travel-credit').before(culture);
  $('culture-heading').textContent = isPassport ? '这一站的文化发现' : '城脉小记';
  $('save').textContent = isPassport ? '↓ 保存记忆护照' : '↓ 保存相纸';
  if (!busy) $('generate').firstElementChild.textContent = isPassport ? '生成我的记忆护照' : '生成我的纪念相纸';
  $('export-title').textContent = isPassport ? '你的城市记忆护照已出片' : '你的相纸已出片';
  if (!passport) return;
  if (isPassport) $('culture-fact').textContent = passport.discovery;
  else $('culture-fact').textContent = currentPlace().fact;
  $('stamp-word').textContent = passport.kind === 'wish' ? '向往' : '记忆';
  $('memory-stamp').dataset.kind = passport.kind;
  $('stamp-title').textContent = passport.stamp;
  $('stamp-boundary').textContent = passport.boundary;
  $('passport-mood').textContent = passport.mood;
  $('next-stop').hidden = !passport.next;
  if (passport.next) {
    $('next-stop-name').textContent = passport.next.name;
    $('next-stop-reason').textContent = passport.next.reason;
    $('next-stop-map').href = 'https://uri.amap.com/search?keyword=' + encodeURIComponent(passport.next.name) + '&city=' + encodeURIComponent('荆州') + '&src=citypulse-camera';
  }
  renderCollection();
}
function renderCollection() {
  const valid = memoryStamps.filter(e => places.some(p => p.id === e.placeId));
  $('collected-stamps').replaceChildren(...valid.map(entry => {
    const chip = document.createElement('span'); chip.className = 'collected-stamp';
    chip.dataset.kind = entry.kind;
    chip.textContent = `${entry.kind === 'wish' ? '向往' : '记忆'} · ${places.find(p => p.id === entry.placeId).name}`;
    return chip;
  }));
  $('clear-memories').hidden = !valid.length;
  $('collection-status').textContent = valid.length ? `已收藏 ${valid.length} 枚印章。仅本机保存点位、类型和日期，不保存照片或心情。` : '只在本机保存点位、印章类型和日期，不保存照片或心情。';
}
for (const input of document.querySelectorAll('input[name=paper-format],input[name=paper-theme]')) input.addEventListener('change', () => {
  paperFormat = document.querySelector('input[name=paper-format]:checked').value;
  paperTheme = document.querySelector('input[name=paper-theme]:checked').value;
  updateMemoryPreview(); buttons();
});
$('collect-memory').addEventListener('click', () => {
  if (!story || !photo || busy || imageBusy || exporting || currentPlace().id === 'custom') return;
  memoryStamps = addStamp(memoryStamps, {placeId: currentPlace().id, kind: currentPassport().kind, date});
  let persisted = false; try { persisted = writeStamps(localStorage, memoryStamps); } catch {}
  renderCollection();
  if (!persisted) $('collection-status').textContent = '本机存储不可用，印章暂存在本页，关闭页面后不保留。';
});
$('clear-memories').addEventListener('click', () => {
  if (busy || imageBusy || exporting) return;
  memoryStamps = []; let cleared = true;
  try { localStorage.removeItem(memoryStorageKey); } catch { cleared = false; }
  renderCollection();
  if (!cleared) $('collection-status').textContent = '本页印章已清空，但浏览器阻止了存储清理；请在浏览器设置中清除本网站数据。';
});
$('choose-next-stop').addEventListener('click', () => {
  if (busy || imageBusy || exporting || photoLoading) return;
  const next = currentPassport()?.next; if (!next) return;
  if (document.querySelector('input[name=photo-style]:checked').value === 'travel' || activePhotoStyle === 'travel') {
    applyPhotoStyle('original');
    document.querySelector('input[name=photo-style][value=original]').checked = true;
    $('travel-options').hidden = true; $('stylize-options').hidden = true;
  }
  $('place').value = next.id; updatePlace();
  status('已选择下一站，仅作探索与纪念；地点选择不代表到访。');
  $('place').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center'});
});
$('save').addEventListener('click', async () => {
  if (!photo || !story || busy || imageBusy || exporting) return;
  const p = currentPlace(), snapshot = {photo, place: p, story, date, photoStyle: activePhotoStyle, theme: paperTheme, format: paperFormat, passport: currentPassport()};
  exporting = true; buttons();
  try {
    await document.fonts.ready;
    const canvas = renderPaper(snapshot);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png')); if (!blob) throw Error('相纸导出失败，请重试。');
    if (exportUrl) URL.revokeObjectURL(exportUrl); exportUrl = URL.createObjectURL(blob); $('export-image').src = exportUrl; $('download').href = exportUrl; $('download').download = `城脉相机-${snapshot.format === 'passport' ? '记忆护照-' : ''}${paperThemes[snapshot.theme].name}-${p.name}-${date}.png`; $('export-dialog').showModal(); status('PNG 已生成，请下载或长按预览图片保存。');
  } catch (err) { status(err.message || '无法导出，请重试。',true); } finally { exporting = false; buttons(); }
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
try {
  const [placeRes, healthRes, sceneRes] = await Promise.all([fetch('/api/places'), fetch('/api/health'), fetch('/api/travel-scenes')]);
  if (!placeRes.ok || !healthRes.ok || !sceneRes.ok) throw Error();
  places = await placeRes.json();
  const health = await healthRes.json();
  imageAvailable = !!health.imageConfigured;
  imageQueueWaitSeconds = health.service?.imageQueueWaitSeconds || 50;
  travelModels = health.travel?.models || [{id:'gemini',label:'Gemini 3.1 · 快速',available:imageAvailable,timeoutSeconds:150}];
  $('travel-engine').replaceChildren(...travelModels.map(m=>{const o=new Option(m.label+(m.available?'':' · 未配置'),m.id);o.disabled=!m.available;return o;}));
  $('travel-engine').value=health.travel?.defaultEngine || 'gemini';
  if ($('style-engine')) {
    $('style-engine').replaceChildren(...travelModels.map(m=>{const o=new Option(m.label+(m.available?'':' · 未配置'),m.id);o.disabled=!m.available;return o;}));
    $('style-engine').value=health.travel?.defaultEngine || 'gemini';
  }
  travelScenes = await sceneRes.json();
  const placeholder=new Option('选择已支持实景旅拍的景点',''); placeholder.disabled=true;
  $('travel-place').replaceChildren(placeholder,...groupedOptions(travelScenes,s=>s.placeId,s=>s.title));
  const customGroup = document.createElement('optgroup');
  customGroup.label = '更多地点';
  customGroup.append(new Option('✏️ 自定义地点（输入其它荆州地点）…', 'custom'));
  $('place').replaceChildren(...groupedOptions(places,p=>p.id,p=>p.name), customGroup);
  updatePlace();
  status(health.configured ? '相机已准备好，先选择一张旅行照片。' : '先选择照片体验。AI 服务待配置，离线示例可用。');
}
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
  if (busy || imageBusy || exporting || photoLoading) return;
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
  updateMemoryPreview();
  return true;
}
for (const input of document.querySelectorAll('input[name=photo-style]')) input.addEventListener('change', () => {
  const style=input.value;
  if (style==='travel' || activePhotoStyle==='travel') resetStory();
  const isTravel = style === 'travel';
  const isStylize = style === 'anime' || style === 'watercolor';
  $('stylize-options').hidden = style === 'original';
  $('travel-options').hidden = !isTravel;
  if ($('style-engine-box')) $('style-engine-box').hidden = !isStylize;
  updateScenePreview();
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
  if (busy || imageBusy || exporting || !originalPhoto || style==='original' || !$('image-consent').checked || !selectedModel?.available) return;
  if (isTravel && !travelScenes.some(s=>s.placeId===$('place').value)) {imageStatus('当前景点暂无已授权实景参考图，请主动选择其他旅拍景点，或使用原片。',true); return;}
  const version=uploadVersion, requestVersion=inputVersion, variantKey=isTravel?travelVariantKey():styleVariantKey(style);
  const requestPlace = $('place').value, requestScene = currentSceneImage();
  imageBusy=true;buttons();$('cancel-stylize').hidden=false;
  imageController=new AbortController();const controller=imageController;
  const waitSeconds=selectedModel.timeoutSeconds || (settings.engine === 'gemini' ? 150 : 240);
  const timer=setTimeout(()=>controller.abort('timeout'),(waitSeconds+imageQueueWaitSeconds+10)*1000);
  imageStatus('正在生成'+(isTravel?travelModelName(settings.engine)+' · '+travelFramingName(settings.framing):photoStyleNames[style]+' · '+travelModelName(settings.engine))+'图片，最长等待约 '+Math.ceil(waitSeconds/60)+' 分钟；多人体验时自动排队（最多 '+imageQueueWaitSeconds+' 秒），原片与已有结果已保留…');
  try {
    // Resizing and re-encoding strips metadata before the opted-in upload.
    const canvas=document.createElement('canvas');
    const ratio=Math.min(1,1280/Math.max(originalPhoto.naturalWidth,originalPhoto.naturalHeight));
    canvas.width=Math.round(originalPhoto.naturalWidth*ratio);canvas.height=Math.round(originalPhoto.naturalHeight*ratio);
    canvas.getContext('2d').drawImage(originalPhoto,0,0,canvas.width,canvas.height);
    const res=await fetch(isTravel?'/api/travel':'/api/stylize',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({image:canvas.toDataURL('image/jpeg',.85),style,engine:settings.engine,placeId:requestPlace,consent:true,sceneImage:requestScene,...(settings || {})})});
    const data=await res.json();if(!res.ok)throw Error(data.error || '风格化失败，请重试。');
    const result=new Image();result.src=data.image;await result.decode();
    if (controller.signal.aborted) throw new DOMException('Canceled','AbortError');
    if (version!==uploadVersion || requestVersion!==inputVersion || requestPlace!==$('place').value || style!==document.querySelector('input[name=photo-style]:checked').value || variantKey!==(isTravel?travelVariantKey():styleVariantKey(style)) || (isTravel && requestScene!==currentSceneImage())) {
      imageStatus('输入已改变，已丢弃旧图片，请按当前设置重新生成。'); return;
    }
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

function imageTypeLabel(style) {
  if (style === 'anime') return '动漫风格图';
  if (style === 'watercolor') return '水彩风格图';
  if (style === 'travel') return '虚拟旅拍图';
  return '';
}
function travelAttribution(scene) {return scene ? `景点参考：${scene.title}` : '';}

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

function getAmapTarget(name) {
  if (!name) return '荆州';
  const parts = name.split(/[·'’\-\/]/).map(s => s.trim()).filter(Boolean);
  let target = parts.length > 1 ? parts[1] : parts[0];
  if (!target.includes('荆州')) target = '荆州 ' + target;
  return target;
}

function updateExploreLinks(place) {
  if (!place) return;
  const parts = place.name.split(/[·'’\-\/]/).map(s => s.trim()).filter(Boolean);
  const cleanTarget = parts.length > 1 ? parts[1] : parts[0];
  const searchPlace = place.id === 'custom' ? cleanTarget : `荆州 ${cleanTarget}`;
  const xhsQuery = `${searchPlace} 打卡攻略`;
  const douyinQuery = `${searchPlace} 游玩`;
  bindExploreAction('place-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('place-explore-douyin', douyinQuery, 'douyin');
  bindExploreAction('scene-explore-xhs', xhsQuery, 'xhs');
  bindExploreAction('scene-explore-douyin', douyinQuery, 'douyin');
  
  // 高德地图：仅在虚拟旅拍区域提供导航，02打卡地不提供导航
  const scene = travelScenes.find(s => s.placeId === place.id);
  const amapTarget = getAmapTarget(scene?.title || place.name);
  bindExploreAction('scene-explore-amap', amapTarget, 'amap');
}
function setSceneImageIndex(idx) {
  if (busy || imageBusy || exporting) return;
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
const handlePickPhoto = () => {
  if (busy || imageBusy || exporting || photoLoading) return;
  if (isMobileDevice() || !canUseCamera) {
    $('album').click();
  } else {
    $('photo-choice-dialog')?.showModal();
  }
};
$('choose-photo-btn')?.addEventListener('click', handlePickPhoto);
$('rechoose-photo-btn')?.addEventListener('click', handlePickPhoto);
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
