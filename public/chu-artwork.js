// Original engraved ornaments. SVG preview and Canvas export share every path,
// stroke weight and pigment below. No remote art or extra model request is used.
export const displayFontFamily = '"CityPulse Display", "Noto Serif CJK SC", "Songti SC", serif';
export const chuHeaderTitle = '荆州 · 楚韵纪念';
export const chuFormatLabel = format => format === 'passport' ? '城市记忆护照' : '经典纪念相纸';
export const chuColors = {gold: '#dcb96f', lightGold: '#f2d693', darkGold: '#8e6b36', red: '#762e2b', black: '#201b18', engraving: '#b68b4c'};

// Feather hierarchy: silhouette → separate flight feathers → shafts/barbs →
// breast scales and long coiled tail. Fine engraving stays quieter than outline.
const phoenixShapes = [
  {d: 'M 40 130 C 53 119 57 106 72 101 C 88 95 94 88 98 75 C 101 65 99 51 110 44 C 119 38 130 42 133 50 L 147 55 L 133 60 C 136 76 127 94 114 105 C 98 119 80 125 64 125 L 53 139 L 46 140 L 53 128 Z', width: 2.1, tone: 'lightGold', fill: '#35291c'},
  {d: 'M 101 92 C 81 82 68 61 57 43 C 45 26 29 17 14 12 C 18 29 20 46 31 62 C 43 81 59 95 79 102 C 88 106 95 101 101 92 Z', width: 1.9, fill: '#493722'},
  {d: 'M 87 93 C 58 66 32 39 17 17 C 37 24 60 52 87 93 Z M 89 96 C 57 81 27 56 22 31 C 31 51 61 78 89 96 Z M 89 100 C 63 96 35 80 27 57 C 44 77 63 92 89 100 Z', width: 1.15, tone: 'lightGold'},
  {d: 'M 25 24 C 39 45 62 70 85 91 M 27 40 C 40 62 60 80 81 91 M 34 64 C 45 78 62 89 78 95', width: .9, tone: 'darkGold'},
  {d: 'M 30 30 L 32 43 M 38 38 L 40 53 M 46 48 L 49 64 M 55 58 L 58 74 M 64 70 L 70 86 M 30 50 L 41 55 M 37 62 L 50 67 M 46 74 L 61 79 M 58 85 L 71 87', width: .8, tone: 'gold', opacity: .8},
  {d: 'M 64 55 C 56 40 59 27 58 21 C 74 36 82 50 81 65 C 80 76 88 83 94 88 M 64 30 C 69 45 73 58 75 68 M 65 39 L 73 44 M 68 50 L 77 55 M 73 63 L 81 69', width: 1.25},
  {d: 'M 109 44 C 96 33 103 21 112 18 C 108 25 108 34 116 39 M 116 39 C 116 26 126 20 133 23 C 122 28 123 33 123 40 M 126 42 C 136 32 145 35 148 40 C 138 38 134 40 132 45', width: 1.45, tone: 'lightGold'},
  {d: 'M 119 51 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M 132 52 L 140 55 M 121 58 C 127 62 124 70 121 76', width: .9, fill: true},
  {d: 'M 111 51 C 108 59 110 66 106 74 M 108 81 C 115 81 121 77 126 70 M 101 90 C 110 90 117 86 122 81 M 94 99 C 104 100 111 95 115 90 M 82 107 C 94 111 103 106 107 100', width: 1.05, tone: 'lightGold'},
  {d: 'M 105 81 q 3 4 6 0 M 110 87 q 3 4 6 0 M 99 91 q 3 4 6 0 M 103 98 q 3 4 6 0 M 91 102 q 3 4 6 0 M 95 109 q 3 4 6 0 M 80 113 q 3 4 6 0', width: .8, tone: 'darkGold'},
  {d: 'M 77 120 L 81 133 L 91 136 M 74 126 L 71 138 L 60 142 M 87 134 L 94 132 M 87 135 L 91 141 M 64 141 L 59 147', width: 1.4},
  {d: 'M 61 117 C 31 101 8 121 13 141 C 17 159 41 163 47 149 C 53 136 40 128 32 135 C 26 141 31 149 36 144 M 61 123 C 44 116 24 120 22 134 C 20 144 29 151 37 150', width: 1.65},
  {d: 'M 62 127 C 67 151 88 166 113 162 C 132 159 141 140 131 130 C 123 122 112 128 115 137 C 118 145 129 139 123 135 M 69 128 C 80 151 93 158 110 154', width: 1.65, tone: 'lightGold'},
  {d: 'M 68 136 C 55 155 34 171 17 164 M 70 142 C 62 159 54 169 40 172 M 84 143 C 93 168 123 175 143 152 M 90 141 C 106 161 129 162 144 146', width: 1.15},
  {d: 'M 112 105 C 131 104 144 99 156 88 C 169 76 171 57 184 50 C 196 43 208 48 207 59 C 206 70 191 73 187 63 C 184 56 195 53 198 58 C 199 62 194 65 192 61', width: 1.6, tone: 'lightGold'},
  {d: 'M 123 111 C 146 112 163 101 170 90 C 179 80 186 78 199 80 M 141 111 C 157 122 178 119 191 109 C 208 95 219 92 226 93 M 155 111 C 170 112 177 107 185 101', width: 1.35},
  {d: 'M 153 81 C 166 62 155 49 166 36 C 177 22 198 21 214 31 C 228 40 229 53 219 60 C 210 66 199 58 203 49 C 206 42 215 43 216 48 C 217 53 211 55 209 51 M 172 34 C 187 33 196 39 200 44', width: 1.45},
  {d: 'M 156 71 C 144 67 145 52 150 43 C 152 55 159 56 156 71 Z M 179 84 C 176 73 182 69 186 66 C 185 78 188 79 179 84 Z M 202 87 C 208 76 219 77 224 78 C 216 84 212 91 202 87 Z M 173 116 C 180 129 191 126 195 123 C 184 121 181 114 173 116 Z', width: 1, fill: '#5b4225'},
  {d: 'M 36 163 C 31 156 23 159 21 162 C 27 163 30 167 36 163 Z M 101 165 C 98 174 106 178 112 177 C 109 171 107 168 101 165 Z M 87 30 C 85 23 89 17 94 16 C 95 23 93 28 87 30 Z M 213 17 C 219 16 225 20 226 25 C 220 24 217 23 213 17 Z', width: .9, fill: true},
  {d: 'M 164 129 C 171 141 164 151 155 150 C 146 149 144 140 149 136 C 154 132 160 138 156 141 M 210 72 C 224 67 232 68 237 74 M 226 67 C 231 58 229 52 225 48', width: 1.15, tone: 'darkGold'}
];

// Staggered courses, coping stones, a deep gateway and radial arch voussoirs.
const brickShapes = [
  {d: 'M 8 98 V 24 H 16 V 12 H 31 V 24 H 45 V 12 H 60 V 24 H 74 V 8 H 91 V 24 H 105 V 12 H 121 V 24 H 136 V 12 H 151 V 24 H 170 V 98 Z', width: 1.9, tone: 'lightGold', fill: '#282219'},
  {d: 'M 8 29 H 170 M 8 34 H 170 M 8 96 H 170 M 4 101 H 174 M 16 16 H 31 M 45 16 H 60 M 75 12 H 91 M 106 16 H 120 M 136 16 H 151', width: 1.0},
  {d: 'M 8 47 H 170 M 8 60 H 170 M 8 73 H 170 M 8 86 H 170 M 25 34 V 47 M 55 34 V 47 M 87 34 V 47 M 119 34 V 47 M 151 34 V 47 M 39 47 V 60 M 71 47 V 60 M 103 47 V 60 M 135 47 V 60 M 25 60 V 73 M 55 60 V 73 M 119 60 V 73 M 151 60 V 73 M 39 73 V 86 M 71 73 V 86 M 103 73 V 86 M 135 73 V 86 M 25 86 V 98 M 55 86 V 98 M 119 86 V 98 M 151 86 V 98', width: .7, tone: 'darkGold'},
  {d: 'M 12 36 V 93 M 17 36 V 93 M 160 36 V 93 M 165 36 V 93 M 20 41 H 32 M 144 41 H 156 M 21 80 H 33 M 145 80 H 157 M 46 54 H 57 M 115 92 H 126', width: .8, tone: 'engraving'},
  {d: 'M 64 98 V 75 A 24 24 0 0 1 112 75 V 98 Z', width: 1.65, fill: '#171713'},
  {d: 'M 70 98 V 75 A 18 18 0 0 1 106 75 V 98 M 67 98 V 75 A 21 21 0 0 1 109 75 V 98 M 64 82 H 70 M 64 91 H 70 M 106 82 H 112 M 106 91 H 112', width: 1.05},
  ...Array.from({length: 9}, (_, i) => {
    const angle = Math.PI + i * Math.PI / 8;
    const point = radius => `${(88 + Math.cos(angle) * radius).toFixed(2)} ${(75 + Math.sin(angle) * radius).toFixed(2)}`;
    return {d: `M ${point(18)} L ${point(24)}`, width: .85, tone: 'lightGold'};
  }),
  {d: 'M 76 95 V 74 M 82 95 V 62 M 88 95 V 58 M 94 95 V 62 M 100 95 V 74 M 73 82 H 103 M 73 90 H 103 M 87 78 h 2 v 6 h -2 Z', width: .7, tone: 'darkGold'},
  {d: 'M 76 37 H 100 V 44 H 76 Z M 80 40 H 96 M 79 46 H 97', width: .8, tone: 'gold', fill: '#201b18'},
  {d: 'M 23 97 Q 32 91 42 97 M 131 97 Q 140 91 151 97', width: .7, tone: 'engraving'}
];
const sideShapes = [
  {d: 'M 36 0 C 55 16 55 33 36 48 C 17 63 17 81 36 96 C 55 111 55 127 36 144 M 42 0 C 61 16 61 33 42 48 C 23 63 23 81 42 96 C 61 111 61 127 42 144 M 30 0 C 49 16 49 33 30 48 C 11 63 11 81 30 96 C 49 111 49 127 30 144', width: .9, tone: 'engraving', opacity: .50},
  {d: 'M 40 31 L 45 36 L 40 41 L 35 36 Z M 40 103 L 45 108 L 40 113 L 35 108 Z M 40 35 V 37 M 40 107 V 109', width: 1.0, opacity: .75},
  {d: 'M 24 4 H 28 V 16 H 24 V 28 H 28 M 24 116 H 28 V 128 H 24 V 140 H 28', width: .85, tone: 'darkGold', opacity: .75}
];
const bottomShapes = [
  {d: 'M -6 32 C 24 6 39 6 65 32 S 106 58 130 32 M -6 39 C 24 13 39 13 65 39 S 106 65 130 39 M -6 46 C 24 20 39 20 65 46 S 106 72 130 46 M -6 53 C 24 27 39 27 65 53 S 106 79 130 53 M -6 60 C 24 34 39 34 65 60 S 106 86 130 60', width: 1, opacity: .42},
  {d: 'M 30 14 L 34 18 L 30 22 L 26 18 Z M 92 69 L 96 73 L 92 77 L 88 73 Z', width: 1, tone: 'lightGold', opacity: .65}
];
const panelPath = 'M 18 18 H 280 Q 245 49 236 99 Q 225 185 137 185 H 18 Z';
const panelInlay = 'M 25 25 H 265 Q 235 58 229 99 Q 219 178 136 178 H 25 Z';
const bandPath = 'M 24 24 H 1176 V 142 H 1038 Q 1008 142 997 164 H 203 Q 192 142 162 142 H 24 Z';
const bandInlay = 'M 280 31 H 920 M 250 149 H 950 M 293 38 H 907';
const tone = (shape, color) => shape.tone ? chuColors[shape.tone] : color;
const fill = (shape, color) => shape.fill === true ? tone(shape, color) : shape.fill || 'none';
const shapesSvg = (shapes, color = chuColors.gold) => shapes.map(s => `<path d="${s.d}" fill="${fill(s, color)}" stroke="${tone(s, color)}" stroke-width="${s.width}" opacity="${s.opacity ?? 1}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
function drawShapes(ctx, shapes, color = chuColors.gold) {
  ctx.save();ctx.lineCap = 'round';ctx.lineJoin = 'round';
  for (const shape of shapes) {
    ctx.save();ctx.globalAlpha *= shape.opacity ?? 1;
    const p = new Path2D(shape.d);ctx.lineWidth = shape.width;ctx.strokeStyle = tone(shape, color);
    if (shape.fill) {ctx.fillStyle = fill(shape, color);ctx.fill(p);}ctx.stroke(p);ctx.restore();
  }
  ctx.restore();
}
export function phoenixSvg() { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190" aria-hidden="true">${shapesSvg(phoenixShapes)}</svg>`; }
export function brickSvg() { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 108" aria-hidden="true">${shapesSvg(brickShapes)}</svg>`; }
export function waveSvg() { return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="144" viewBox="0 0 54 144">${shapesSvg(sideShapes)}</svg>`; }
export function bottomWavesSvg() { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 110" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="chu-footer-wave" width="124" height="110" patternUnits="userSpaceOnUse">${shapesSvg(bottomShapes)}</pattern></defs><rect width="1200" height="110" fill="url(#chu-footer-wave)"/></svg>`; }
export function ornamentMarkup() {
  return `<span class="chu-frame-inner"></span><span class="chu-side chu-side-left"></span><span class="chu-side chu-side-right"></span><span class="chu-bottom-waves">${bottomWavesSvg()}</span><span class="chu-brick chu-brick-left">${brickSvg()}</span><span class="chu-brick chu-brick-right">${brickSvg()}</span>`;
}
export function headerMarkup(format) {
  const id = `chu-${format === 'passport' ? 'passport' : 'paper'}`;
  const corner = right => `<g class="chu-corner" transform="${right ? 'translate(1200 0) scale(-1 1)' : 'translate(0 0)'}"><path d="${panelPath}" fill="url(#${id}-bronze)" stroke="${chuColors.gold}" stroke-width="2.6"/><path d="${panelInlay}" fill="none" stroke="${chuColors.darkGold}" stroke-width=".85"/><g clip-path="url(#${id}-clip)"><g transform="translate(22 18)">${shapesSvg(phoenixShapes)}</g></g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="chu-header-svg" viewBox="0 0 1200 210" aria-hidden="true"><defs><linearGradient id="${id}-red" x1="0" y1="24" x2="0" y2="164" gradientUnits="userSpaceOnUse"><stop stop-color="#853831"/><stop offset="1" stop-color="#582421"/></linearGradient><linearGradient id="${id}-bronze" x1="18" y1="18" x2="240" y2="185" gradientUnits="userSpaceOnUse"><stop stop-color="#3b3022"/><stop offset=".55" stop-color="#282219"/><stop offset="1" stop-color="#201b18"/></linearGradient><clipPath id="${id}-clip"><path d="${panelInlay}"/></clipPath></defs>
  <path d="${bandPath}" fill="url(#${id}-red)" stroke="${chuColors.darkGold}" stroke-width="2"/>
  <path d="${bandInlay}" fill="none" stroke="${chuColors.gold}" stroke-width=".8" opacity=".6"/>
  ${corner(false)}${corner(true)}
  <g fill="${chuColors.lightGold}" text-anchor="middle" font-family="CityPulse Display, serif"><text x="600" y="53" font-family="Arial, sans-serif" font-size="15" letter-spacing="4">JINGZHOU · CITY MEMORIES</text><text x="600" y="107" font-size="46">${chuHeaderTitle}</text><text x="600" y="145" font-size="23" letter-spacing="4">${chuFormatLabel(format)}</text></g>
  <path d="M 344 130 H 450 M 750 130 H 856" fill="none" stroke="${chuColors.gold}" stroke-width="1"/><path d="M 332 130 L 338 126 L 344 130 L 338 134 Z M 856 130 L 862 126 L 868 130 L 862 134 Z" fill="${chuColors.gold}"/>
  </svg>`;
}
export function drawChuHeader(ctx, format) {
  ctx.save();
  const red = ctx.createLinearGradient(0, 24, 0, 164);red.addColorStop(0, '#853831');red.addColorStop(1, '#582421');
  ctx.fillStyle = red;ctx.fill(new Path2D(bandPath));ctx.strokeStyle = chuColors.darkGold;ctx.lineWidth = 2;ctx.stroke(new Path2D(bandPath));
  drawShapes(ctx, [{d: bandInlay, width: .8, opacity: .6}]);
  for (const right of [false, true]) {
    ctx.save();if (right) {ctx.translate(1200, 0);ctx.scale(-1, 1);}
    const bronze = ctx.createLinearGradient(18, 18, 240, 185);bronze.addColorStop(0, '#3b3022');bronze.addColorStop(.55, '#282219');bronze.addColorStop(1, chuColors.black);
    ctx.fillStyle = bronze;ctx.fill(new Path2D(panelPath));ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 2.6;ctx.stroke(new Path2D(panelPath));
    ctx.strokeStyle = chuColors.darkGold;ctx.lineWidth = .85;ctx.stroke(new Path2D(panelInlay));ctx.clip(new Path2D(panelInlay));
    ctx.translate(22, 18);drawShapes(ctx, phoenixShapes);ctx.restore();
  }
  ctx.textAlign = 'center';ctx.textBaseline = 'alphabetic';ctx.fillStyle = chuColors.lightGold;
  ctx.font = '15px Arial';if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';ctx.fillText('JINGZHOU · CITY MEMORIES', 600, 53);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';ctx.font = `46px ${displayFontFamily}`;ctx.fillText(chuHeaderTitle, 600, 107);
  ctx.font = `23px ${displayFontFamily}`;if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';ctx.fillText(chuFormatLabel(format), 600, 145);
  ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 1;ctx.stroke(new Path2D('M 344 130 H 450 M 750 130 H 856'));
  ctx.fillStyle = chuColors.gold;ctx.fill(new Path2D('M 332 130 L 338 126 L 344 130 L 338 134 Z M 856 130 L 862 126 L 868 130 L 862 134 Z'));
  ctx.restore();
}
export function drawChuFrame(ctx, height) {
  ctx.save();
  ctx.strokeStyle = chuColors.gold;ctx.lineWidth = 2.2;ctx.strokeRect(18, 18, 1164, height - 36);
  ctx.strokeStyle = chuColors.darkGold;ctx.lineWidth = 1;ctx.strokeRect(26, 26, 1148, height - 52);
  ctx.strokeStyle = chuColors.engraving;ctx.lineWidth = .7;ctx.strokeRect(32, 32, 1136, height - 64);
  for (const right of [false, true]) {
    ctx.save();if (right) {ctx.translate(1200, 0);ctx.scale(-1, 1);}
    ctx.beginPath();ctx.rect(0, 208, 54, height - 333);ctx.clip();
    for (let y = 208; y < height - 125; y += 144) {ctx.save();ctx.translate(0, y);drawShapes(ctx, sideShapes);ctx.restore();}ctx.restore();
  }
  ctx.save();ctx.beginPath();ctx.rect(210, height - 108, 780, 82);ctx.clip();
  for (let x = 210; x < 990; x += 124) {ctx.save();ctx.translate(x, height - 108);drawShapes(ctx, bottomShapes);ctx.restore();}ctx.restore();
  for (const right of [false, true]) {
    ctx.save();ctx.translate(right ? 1160 : 40, height - 125);if (right) ctx.scale(-1, 1);drawShapes(ctx, brickShapes);ctx.restore();
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
