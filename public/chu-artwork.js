// Original scalable ornaments. References inform visual direction only; no
// source photograph, watermark or model-generated lettering is embedded.
export const displayFontFamily = '"CityPulse Display", "Noto Serif CJK SC", "Songti SC", serif';
export const chuHeaderTitle = '荆州 · 楚韵纪念';
export const chuFormatLabel = format => format === 'passport' ? '城市记忆护照' : '经典纪念相纸';
export const chuColors = {gold: '#dcb96f', lightGold: '#f2d693', darkGold: '#8e6b36', red: '#762e2b', black: '#201b18'};

// A feathered phoenix, long scrolling tail and botanical curls, within 260x190.
const phoenixShapes = [
  {d: 'M 39 135 C 47 126 52 115 62 107 C 71 100 85 99 94 90 C 105 79 97 61 110 51 C 119 44 130 48 134 55 L 148 60 L 134 64 C 136 77 131 89 122 102 C 108 121 89 131 70 130 C 63 140 53 145 45 145 L 54 136 M 70 130 L 79 142 L 88 142 M 66 131 L 65 143 L 58 146', width: 2.3},
  {d: 'M 78 109 C 48 103 38 91 31 72 C 26 56 27 40 22 26 C 48 42 69 56 78 76 C 84 89 91 93 100 96 C 94 105 86 108 78 109 Z', width: 2.2},
  {d: 'M 27 34 C 39 70 53 87 85 100 M 30 42 C 48 53 65 66 73 80 M 34 57 C 43 61 54 73 62 86 M 38 74 C 48 78 57 85 61 92 M 51 93 C 64 104 72 107 85 107 M 39 48 C 41 64 48 77 57 85 M 57 60 C 57 71 65 81 70 86 M 73 79 C 71 90 79 98 86 100', width: 1.35},
  {d: 'M 116 48 C 113 39 122 32 131 36 C 120 37 121 41 128 46 M 124 47 C 134 40 142 44 142 47 M 118 58 Q 123 55 126 59', width: 1.7},
  {d: 'M 111 85 C 100 108 82 117 64 117 M 108 99 C 100 124 82 135 57 129 M 90 121 C 90 137 81 151 68 155 M 65 116 C 42 112 18 123 17 143 C 16 158 27 166 41 160 C 53 155 49 144 41 143 C 32 142 30 149 34 154 M 71 126 C 79 161 103 173 126 161 C 144 151 138 134 126 136 C 115 138 119 149 125 147 M 67 136 C 54 167 30 177 17 165 M 83 139 C 100 161 122 168 146 152', width: 1.85},
  {d: 'M 138 82 C 162 76 162 52 179 47 C 192 43 201 49 198 59 C 195 69 185 68 183 61 C 181 53 190 53 191 58 M 143 94 C 156 89 169 71 177 62 M 157 85 C 172 87 179 77 175 70 M 167 68 C 162 55 170 37 185 30 C 201 22 226 28 229 40 C 233 52 218 57 212 48 C 208 42 214 35 219 39 M 186 29 C 193 43 207 45 220 33 M 149 95 C 174 108 208 95 225 76 M 160 102 C 174 114 193 113 205 102 M 200 91 C 213 90 220 84 226 74', width: 1.65},
  {d: 'M 147 82 C 160 62 142 55 146 44 C 148 35 158 37 158 43 C 158 49 151 49 151 45 M 208 76 C 224 64 238 63 243 68 M 223 64 C 233 55 231 47 226 43 M 137 113 C 145 126 155 128 164 121 C 173 114 168 105 160 108 C 154 110 158 116 161 113', width: 1.5},
  {d: 'M 47 30 Q 54 31 58 37 Q 49 39 47 30 Z M 89 35 Q 92 27 99 26 Q 99 34 89 35 Z M 205 17 Q 212 17 216 22 Q 206 25 205 17 Z M 236 93 Q 233 102 223 101 Q 225 94 236 93 Z', width: 1.2, fill: true}
];
const brickShapes = [
  {d: 'M 10 96 V 20 H 32 V 10 H 54 V 20 H 76 V 10 H 98 V 20 H 120 V 10 H 142 V 20 H 164 V 96 Z', width: 2},
  {d: 'M 10 37 H 164 M 10 55 H 164 M 10 73 H 164 M 10 91 H 164 M 34 20 V 37 M 84 20 V 37 M 134 20 V 37 M 58 37 V 55 M 108 37 V 55 M 158 37 V 55 M 34 55 V 73 M 84 55 V 73 M 134 55 V 73 M 58 73 V 91 M 108 73 V 91 M 158 73 V 91', width: 1.15},
  {d: 'M 69 96 V 74 C 69 54 103 54 103 74 V 96', width: 1.8}
];
const sideWavePath = 'M -18 34 C 4 -4 38 -4 76 32 M -18 42 C 4 4 38 4 76 40 M -18 50 C 4 12 38 12 76 48 M -18 58 C 4 20 38 20 76 56 M -18 66 C 4 28 38 28 76 64 M -18 74 C 4 36 38 36 76 72 M -22 92 C 6 54 36 54 80 92 M -22 100 C 6 62 36 62 80 100 M -22 108 C 6 70 36 70 80 108 M -22 116 C 6 78 36 78 80 116';
const bottomWavePath = 'M -30 104 Q 36 -68 102 104 M -22 104 Q 36 -48 94 104 M -14 104 Q 36 -28 86 104 M -6 104 Q 36 -8 78 104 M 2 104 Q 36 12 70 104 M 10 104 Q 36 32 62 104 M 18 104 Q 36 52 54 104';
const shapesSvg = (shapes, color) => shapes.map(s => `<path d="${s.d}" fill="${s.fill ? color : 'none'}" stroke="${color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
export function phoenixSvg() { return `<svg viewBox="0 0 260 190" aria-hidden="true">${shapesSvg(phoenixShapes, chuColors.gold)}</svg>`; }
export function brickSvg() { return `<svg viewBox="0 0 180 108" aria-hidden="true">${shapesSvg(brickShapes, chuColors.gold)}</svg>`; }
export function waveSvg() { return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="116" viewBox="0 0 54 116"><path d="${sideWavePath}" fill="none" stroke="${chuColors.gold}" stroke-width="1" opacity=".42"/></svg>`; }
export function bottomWavesSvg() { return `<svg viewBox="0 0 1200 110" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="chu-footer-wave" width="124" height="110" patternUnits="userSpaceOnUse"><path d="${bottomWavePath}" fill="none" stroke="${chuColors.gold}" stroke-width="1.2"/></pattern></defs><rect width="1200" height="110" fill="url(#chu-footer-wave)" opacity=".32"/></svg>`; }
export function ornamentMarkup() {
  return `<span class="chu-side chu-side-left"></span><span class="chu-side chu-side-right"></span><span class="chu-bottom-waves">${bottomWavesSvg()}</span><span class="chu-brick chu-brick-left">${brickSvg()}</span><span class="chu-brick chu-brick-right">${brickSvg()}</span>`;
}
export function headerMarkup(format) {
  return `<svg class="chu-header-svg" viewBox="0 0 1200 210" aria-hidden="true"><defs><linearGradient id="chu-header-red" x2="0" y2="1"><stop stop-color="#853831"/><stop offset="1" stop-color="#582421"/></linearGradient></defs>
  <path d="M 24 24 H 1176 V 142 H 1038 Q 1008 142 997 164 H 203 Q 192 142 162 142 H 24 Z" fill="url(#chu-header-red)" stroke="${chuColors.darkGold}" stroke-width="2"/>
  <path d="M 18 18 H 280 Q 245 49 236 99 Q 225 185 137 185 H 18 Z" fill="${chuColors.black}" stroke="${chuColors.gold}" stroke-width="2.6"/>
  <path d="M 1182 18 H 920 Q 955 49 964 99 Q 975 185 1063 185 H 1182 Z" fill="${chuColors.black}" stroke="${chuColors.gold}" stroke-width="2.6"/>
  <g transform="translate(22 18)">${shapesSvg(phoenixShapes, chuColors.gold)}</g><g transform="translate(1178 18) scale(-1 1)">${shapesSvg(phoenixShapes, chuColors.gold)}</g>
  <g fill="${chuColors.lightGold}" text-anchor="middle" font-family="CityPulse Display, serif"><text x="600" y="53" font-family="Arial, sans-serif" font-size="15" letter-spacing="4">JINGZHOU · CITY MEMORIES</text><text x="600" y="107" font-size="46">${chuHeaderTitle}</text><text x="600" y="145" font-size="23" letter-spacing="4">${chuFormatLabel(format)}</text></g>
  <path d="M 344 130 H 450 M 750 130 H 856" fill="none" stroke="${chuColors.gold}" stroke-width="1"/><path d="M 332 130 L 338 126 L 344 130 L 338 134 Z M 856 130 L 862 126 L 868 130 L 862 134 Z" fill="${chuColors.gold}"/>
  </svg>`;
}
function drawShapes(ctx, shapes, color) {
  ctx.strokeStyle = color;ctx.lineCap = 'round';ctx.lineJoin = 'round';
  for (const shape of shapes) {const p = new Path2D(shape.d);ctx.lineWidth = shape.width;if (shape.fill) {ctx.fillStyle = color;ctx.fill(p);}ctx.stroke(p);}
}
export function drawChuHeader(ctx, format) {
  ctx.save();
  const red = ctx.createLinearGradient(0, 24, 0, 164);red.addColorStop(0, '#853831');red.addColorStop(1, '#582421');
  const band = new Path2D('M 24 24 H 1176 V 142 H 1038 Q 1008 142 997 164 H 203 Q 192 142 162 142 H 24 Z');
  ctx.fillStyle = red;ctx.fill(band);ctx.strokeStyle = chuColors.darkGold;ctx.lineWidth = 2;ctx.stroke(band);
  for (const right of [false, true]) {
    ctx.save();if (right) {ctx.translate(1200, 0);ctx.scale(-1, 1);}
    const panel = new Path2D('M 18 18 H 280 Q 245 49 236 99 Q 225 185 137 185 H 18 Z');
    ctx.fillStyle = chuColors.black;ctx.fill(panel);ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 2.6;ctx.stroke(panel);
    ctx.translate(22, 18);drawShapes(ctx, phoenixShapes, chuColors.gold);ctx.restore();
  }
  ctx.textAlign = 'center';ctx.textBaseline = 'alphabetic';ctx.fillStyle = chuColors.lightGold;
  // Canvas letter spacing is optional; title itself has identical font/size in both forms.
  ctx.font = '15px Arial';if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';ctx.fillText('JINGZHOU · CITY MEMORIES', 600, 53);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';ctx.font = `46px ${displayFontFamily}`;ctx.fillText(chuHeaderTitle, 600, 107);
  ctx.font = `23px ${displayFontFamily}`;if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';ctx.fillText(chuFormatLabel(format), 600, 145);
  ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 1;ctx.stroke(new Path2D('M 344 130 H 450 M 750 130 H 856'));
  ctx.fillStyle = chuColors.gold;ctx.fill(new Path2D('M 332 130 L 338 126 L 344 130 L 338 134 Z M 856 130 L 862 126 L 868 130 L 862 134 Z'));
  ctx.restore();
}
export function drawChuFrame(ctx, height) {
  ctx.save();ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 2.2;ctx.strokeRect(18, 18, 1164, height - 36);
  ctx.strokeStyle = chuColors.darkGold;ctx.lineWidth = 1;ctx.strokeRect(30, 30, 1140, height - 60);
  // Tile, don't stretch: longer text simply adds repeat units along both sides.
  for (const right of [false, true]) {
    ctx.save();ctx.beginPath();ctx.rect(right ? 1146 : 0, 205, 54, height - 330);ctx.clip();ctx.globalAlpha = 0.34;
    for (let y = 208; y < height - 110; y += 116) {ctx.save();ctx.translate(right ? 1146 : 0, y);ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 1;ctx.stroke(new Path2D(sideWavePath));ctx.restore();}ctx.restore();
  }
  ctx.save();ctx.beginPath();ctx.rect(205, height - 100, 790, 76);ctx.clip();ctx.globalAlpha = 0.3;
  for (let x = 172; x < 1000; x += 124) {ctx.save();ctx.translate(x, height - 106);ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 1.2;ctx.stroke(new Path2D(bottomWavePath));ctx.restore();}ctx.restore();
  for (const right of [false, true]) {
    ctx.save();ctx.translate(right ? 1160 : 40, height - 125);if (right) ctx.scale(-1, 1);drawShapes(ctx, brickShapes, chuColors.gold);ctx.restore();
  }
  ctx.restore();
}
// Postage perforations: identical path is used by SVG preview and Canvas export.
export function postagePath() {
  let path = 'M 12 12';
  for (let i = 0; i < 13; i++) {const x = 12 + i * 15;path += ` L ${x + 3} 12 Q ${x + 7.5} 21 ${x + 12} 12 L ${x + 15} 12`;}
  for (let i = 0; i < 13; i++) {const y = 12 + i * 15;path += ` L 207 ${y + 3} Q 198 ${y + 7.5} 207 ${y + 12} L 207 ${y + 15}`;}
  for (let i = 0; i < 13; i++) {const x = 207 - i * 15;path += ` L ${x - 3} 207 Q ${x - 7.5} 198 ${x - 12} 207 L ${x - 15} 207`;}
  for (let i = 0; i < 13; i++) {const y = 207 - i * 15;path += ` L 12 ${y - 3} Q 21 ${y - 7.5} 12 ${y - 12} L 12 ${y - 15}`;}
  return path + ' Z';
}
const pointShortNames = {'jingzhou-wall': '古城 · 宾阳楼', 'jingzhou-museum': '荆州博物馆', 'zhang-juzheng': '张居正故居', 'guandi-temple': '荆州关帝庙', 'wanshou-pagoda': '万寿宝塔', 'chu-chariots': '楚王车马阵', 'guanyu-shrine': '荆州关羽祠', 'linjiangxian-park': '临江仙公园', 'yingcheng-panda-park': '历史资料'};
export function stampPlaceName(place) { return pointShortNames[place.id] || place.name.replace(/^荆州|· 历史资料/g, '').trim().slice(0, 8) || '荆州足迹'; }
const escapeXml = text => text.replace(/[<>&"']/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[c]));
export function stampMarkup(kind, place, color = chuColors.gold) {
  return `<svg class="postage-art" viewBox="0 0 220 220" aria-hidden="true"><path d="${postagePath()}" fill="none" stroke="${color}" stroke-width="3"/><g stroke="${color}" stroke-width="1.6" fill="none"><rect x="22" y="22" width="175" height="175"/><rect x="29" y="29" width="161" height="161"/><path d="M 29 75 H 190 M 29 142 H 190"/></g><g fill="${color}" text-anchor="middle" font-family="CityPulse Display, serif"><text x="110" y="59" font-size="24">荆州${kind === 'wish' ? '向往' : '记忆'}</text><text x="110" y="119" font-size="34">${kind === 'wish' ? '向往' : '记忆'}邮戳</text><text x="110" y="172" font-size="${stampPlaceName(place).length > 6 ? 18 : 21}">${escapeXml(stampPlaceName(place))}</text></g></svg>`;
}
export function drawPostageStamp(ctx, x, y, kind, place, color) {
  ctx.save();ctx.translate(x + 110, y + 110);ctx.rotate(-0.07);ctx.translate(-110, -110);
  ctx.strokeStyle = color;ctx.lineWidth = 3;ctx.stroke(new Path2D(postagePath()));
  ctx.lineWidth = 1.6;ctx.strokeRect(22, 22, 175, 175);ctx.strokeRect(29, 29, 161, 161);ctx.stroke(new Path2D('M 29 75 H 190 M 29 142 H 190'));
  ctx.fillStyle = color;ctx.textAlign = 'center';ctx.textBaseline = 'alphabetic';
  ctx.font = `24px ${displayFontFamily}`;ctx.fillText('荆州' + (kind === 'wish' ? '向往' : '记忆'), 110, 59);
  ctx.font = `34px ${displayFontFamily}`;ctx.fillText((kind === 'wish' ? '向往' : '记忆') + '邮戳', 110, 119);
  ctx.font = `${stampPlaceName(place).length > 6 ? 18 : 21}px ${displayFontFamily}`;ctx.fillText(stampPlaceName(place), 110, 172, 151);
  ctx.restore();
}
export async function ensureDisplayFont() {
  // Load exactly the same local subset for SVG preview and Canvas export.
  await document.fonts.load(`46px ${displayFontFamily}`, chuHeaderTitle + '城市记忆护照经典相纸向往邮戳');
  await document.fonts.ready;
}
