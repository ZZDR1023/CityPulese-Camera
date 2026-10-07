import {drawChuFrame, drawChuHeader, drawPostageStamp, displayFontFamily} from './chu-artwork.js';
export const paperThemes = {
  classic: {name: '经典相纸', background: '#fffcf4', ink: '#263d36', muted: '#677164', accent: '#a0684d', line: '#dfdfd0'},
  chuyun: {name: '楚韵 · 漆红鎏金', background: '#201b18', ink: '#f7ead3', muted: '#cfbda0', accent: '#dcb96f', line: '#594537'}
};
export function wrapText(ctx, value, width) {
  const output = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (ctx.measureText(line + char).width > width && line) {
        if ('，。！？；：、）》】”’'.includes(char)) { output.push(line + char); line = ''; }
        else { output.push(line); line = char; }
      } else line += char;
    }
    if (line || !paragraph) output.push(line);
  }
  return output;
}
export function renderPaper({photo, place, story, date, photoStyle, theme = 'classic', format = 'paper', passport}) {
  const palette = paperThemes[theme] || paperThemes.classic;
  const canvas = document.createElement('canvas'); canvas.width = 1200;
  const ctx = canvas.getContext('2d');
  const isChu = theme === 'chuyun', isPassport = format === 'passport';
  const headerHeight = isChu ? 220 : isPassport ? 162 : 50;
  const drawWidth = isChu ? 1040 : 1100;
  // Preserve the full photograph even with unusually tall source images.
  const photoHeight = Math.min(2200, Math.round(drawWidth * photo.naturalHeight / photo.naturalWidth));
  const photoWidth = Math.min(drawWidth, Math.round(photoHeight * photo.naturalWidth / photo.naturalHeight));
  let y = headerHeight + photoHeight + 36;
  const commands = [];
  const block = (text, {font = '32px sans-serif', lineHeight = 52, color = palette.muted, after = 18, x = 90, width = 1020} = {}) => {
    ctx.font = font;
    const lines = wrapText(ctx, text, width);
    const yStart = y;
    commands.push(() => {ctx.font = font; ctx.fillStyle = color; lines.forEach((line, i) => ctx.fillText(line, x, yStart + i * lineHeight));});
    y += lines.length * lineHeight + after;
  };
  const rule = () => {const at = y; commands.push(() => {ctx.fillStyle = palette.line; ctx.fillRect(90, at, 1020, 2);}); y += 30;};
  block(place.name, {font: '28px sans-serif', lineHeight: 42, color: palette.accent, after: 4});
  block(date, {font: '24px sans-serif', lineHeight: 34, after: 30});
  block(story.title, {font: '54px serif', lineHeight: 76, color: palette.ink, after: 14});
  block(story.body, {after: 24});
  rule();
  if (isPassport) {
    const stampY = y;
    commands.push(() => drawPostageStamp(ctx, 88, stampY + 6, passport.kind, place, palette.accent));
    y += 30;
    block(passport.stamp, {x: 350, width: 760, font: `38px ${displayFontFamily}`, lineHeight: 54, color: palette.ink, after: 12});
    block(passport.boundary, {x: 350, width: 760, font: '26px sans-serif', lineHeight: 40, after: 12});
    y = Math.max(y, stampY + 252);
    block('此刻的心情', {font: '24px sans-serif', lineHeight: 36, color: palette.accent, after: 6});
    block(passport.mood, {font: '28px sans-serif', lineHeight: 46, after: 26});
    block('这一站的文化发现', {font: '24px sans-serif', lineHeight: 36, color: palette.accent, after: 6});
    block(passport.discovery, {font: '28px sans-serif', lineHeight: 46, after: 26});
    if (passport.next) {
      rule();
      block('下一站 · ' + passport.next.name, {font: '32px serif', lineHeight: 48, color: palette.ink, after: 10});
      block(passport.next.reason, {font: '26px sans-serif', lineHeight: 42, after: 6});
      block('探索建议，非实时路线；出行前请确认开放与交通。', {font: '23px sans-serif', lineHeight: 36, after: 22});
    }
  } else {
    block('城脉小记', {font: '24px sans-serif', lineHeight: 36, color: palette.accent, after: 6});
    block(place.fact, {font: '25px sans-serif', lineHeight: 40, after: 20});
  }
  const styleLabel = {anime: '动漫风格图', watercolor: '水彩风格图', film: '胶片记忆图', gongbi: '国风工笔图', travel: '虚拟旅拍图'}[photoStyle];
  if (styleLabel) block(styleLabel, {font: '23px sans-serif', lineHeight: 34, after: 10});
  if (isChu) block('原创楚韵设计 · 非文物复原', {font: '21px sans-serif', lineHeight: 32, after: 10});
  rule();
  block('城脉相机 · CITY MEMORIES', {font: '24px sans-serif', lineHeight: 36, color: palette.accent, after: 35});
  canvas.height = Math.ceil(y + (isChu ? 128 : 28));
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (isChu) {drawChuFrame(ctx, canvas.height);drawChuHeader(ctx, format);}
  ctx.textBaseline = 'top';
  if (!isChu && isPassport) {
    ctx.fillStyle = palette.accent;ctx.font = `38px ${displayFontFamily}`;ctx.textAlign = 'center';
    ctx.fillText('荆州 · 城市记忆护照', 600, 62);ctx.textAlign = 'left';
  }
  ctx.drawImage(photo, (1200 - photoWidth) / 2, headerHeight, photoWidth, photoHeight);
  for (const command of commands) command();
  return canvas;
}
