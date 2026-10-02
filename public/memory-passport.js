// Hand-maintained exploration links, not live routes or proof of a visit.
const nextStops = {
  'jingzhou-wall': ['zhang-juzheng', '从古城地标，继续认识荆州的人物故事。'],
  'zhang-juzheng': ['jingzhou-museum', '把人物故事延伸到荆楚器物与文化。'],
  'jingzhou-museum': ['chu-chariots', '对楚文化仍然好奇？下一次可以了解车马遗址。'],
  'chu-chariots': ['jingzhou-museum', '继续从漆木器与简牍，认识荆楚文化。'],
  'guandi-temple': ['jingzhou-wall', '回到古城地标，收藏另一种荆州记忆。'],
  'guanyu-shrine': ['guandi-temple', '继续了解关公文化；关羽祠与关帝庙是不同点位。'],
  'wanshou-pagoda': ['linjiangxian-park', '从古塔文化，转向滨江生态与城市休闲。'],
  'linjiangxian-park': ['wanshou-pagoda', '从滨江景观，继续了解沙市的古塔文化。'],
  'zhanghua-temple': ['wanshou-pagoda', '以另一处沙市文化地标，延续这份好奇。'],
  'weishui': ['yan-general-cave', '继续认识松滋的山水与洞穴景观。'],
  'yan-general-cave': ['weishui', '把探索延伸到洈水的湖山生态。'],
  'honghu-wetland': ['qujiawan', '从湿地生态，继续了解洪湖的水乡文化。'],
  'qujiawan': ['honghu-wetland', '换一个视角，了解洪湖的湿地与水乡景观。'],
  'jingzhou-garden-expo': ['yingcheng-culture-park', '从园林中的楚韵，继续认识楚风文化体验。'],
  'yingcheng-culture-park': ['jingzhou-garden-expo', '继续看看园林如何表达荆楚文化。'],
  'jingzhou-fantawild': ['jingzhou-museum', '把对文化故事的兴趣，延伸到真实器物。']
};
export function buildPassport(place, places, {mood = '', kind = 'memory'} = {}) {
  const pair = nextStops[place.id] || ['jingzhou-wall', '从荆州古城地标开始，继续认识这座城市。'];
  const next = places.find(p => p.id === pair[0] && p.id !== place.id);
  return {
    kind,
    stamp: kind === 'wish' ? '向往印章' : '记忆印章',
    boundary: kind === 'wish' ? '虚拟旅拍 · 不代表真实到访' : '用户记录 · 不作到访认证',
    mood: mood.trim() || '把这一刻收藏，给下一次探索留一点期待。',
    discovery: place.verified ? place.fact : '自定义地点仅记录个人心情，暂无已核验的文化发现。',
    next: next ? {id: next.id, name: next.name, reason: pair[1]} : null
  };
}
export const memoryStorageKey = 'chengmai-memory-stamps-v1';
export function readStamps(storage) {
  try {
    const entries = JSON.parse(storage.getItem(memoryStorageKey) || '[]');
    return Array.isArray(entries) ? entries.filter(e => e && typeof e.placeId === 'string' && e.placeId.length <= 50 && ['memory', 'wish'].includes(e.kind) && /^\d{4}\.\d{2}\.\d{2}$/.test(e.date)).slice(-64).map(({placeId, kind, date}) => ({placeId, kind, date})) : [];
  } catch { return []; }
}
export function addStamp(entries, {placeId, kind, date}) {
  if (placeId === 'custom') return entries;
  return [...entries.filter(e => e.placeId !== placeId || e.kind !== kind), {placeId, kind, date}].slice(-64);
}
export function writeStamps(storage, entries) {
  try { storage.setItem(memoryStorageKey, JSON.stringify(entries)); return true; }
  catch { return false; }
}
