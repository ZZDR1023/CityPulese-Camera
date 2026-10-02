export const paperThemes = {
  classic: {name: '经典相纸', background: '#fffcf4', ink: '#263d36', muted: '#677164', accent: '#a0684d', line: '#dfdfd0'},
  chuyun: {name: '楚韵 · 漆红鎏金', background: '#201b1a', ink: '#f7ead3', muted: '#cfbda0', accent: '#d6b46a', line: '#594537'}
};
// Original stylized phoenix-inspired linework, not a historical artifact replica.
export const phoenixPath = 'M 9 51 C 29 12 67 10 88 30 C 72 23 55 27 48 41 C 63 33 80 36 91 46 C 72 42 59 51 47 59 C 40 65 33 64 27 59 C 36 53 40 46 37 39 C 28 50 20 56 9 51 M 47 59 C 64 69 79 68 93 55 M 43 62 C 58 81 80 85 99 74 M 35 63 C 43 84 65 97 83 96 M 76 27 L 81 19 L 85 30';
export function drawPhoenix(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 110, size / 110);
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(phoenixPath)); ctx.restore();
}
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
  const headerHeight = isChu || isPassport ? 162 : 50;
  const drawWidth = 1100;
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
    commands.push(() => {
      ctx.save(); ctx.translate(180, stampY + 100); ctx.rotate(-0.08);
      ctx.strokeStyle = palette.accent; ctx.lineWidth = 3;
      if (passport.kind === 'wish') ctx.setLineDash([10, 7]);
      ctx.strokeRect(-80, -80, 160, 160); ctx.setLineDash([]); ctx.strokeRect(-70, -70, 140, 140);
      ctx.fillStyle = palette.accent; ctx.font = '36px serif'; ctx.textAlign = 'center';
      ctx.fillText(passport.kind === 'wish' ? '向往' : '记忆', 0, -18); ctx.font = '20px sans-serif'; ctx.fillText('荆州 · 城脉', 0, 33);ctx.restore();
    });
    block(passport.stamp, {x: 300, width: 810, font: '38px serif', lineHeight: 54, color: palette.ink, after: 12});
    block(passport.boundary, {x: 300, width: 810, font: '26px sans-serif', lineHeight: 40, after: 12});
    y = Math.max(y, stampY + 200);
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
  const styleLabel = {anime: '动漫风格图', watercolor: '水彩风格图', travel: '虚拟旅拍图'}[photoStyle];
  if (styleLabel) block(styleLabel, {font: '23px sans-serif', lineHeight: 34, after: 10});
  if (isChu) block('原创楚韵设计 · 非文物复原', {font: '21px sans-serif', lineHeight: 32, after: 10});
  rule();
  block('城脉相机 · CITY MEMORIES', {font: '24px sans-serif', lineHeight: 36, color: palette.accent, after: 35});
  canvas.height = Math.ceil(y + 28);
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (isChu) {
    ctx.fillStyle = '#702c29';ctx.fillRect(25, 25, 1150, 108);
    ctx.strokeStyle = palette.accent;ctx.lineWidth = 2;ctx.strokeRect(24, 24, 1152, canvas.height - 48);
    drawPhoenix(ctx, 65, 32, 85, palette.accent); drawPhoenix(ctx, 1050, 32, 85, palette.accent);
  }
  ctx.textBaseline = 'top';
  if (isChu || isPassport) {
    ctx.fillStyle = palette.accent;ctx.font = '38px serif';ctx.textAlign = 'center';
    ctx.fillText(isPassport ? '荆州 · 城市记忆护照' : '荆州限定 · 楚韵纪念', 600, 62);ctx.textAlign = 'left';
  }
  ctx.drawImage(photo, (1200 - photoWidth) / 2, headerHeight, photoWidth, photoHeight);
  for (const command of commands) command();
  return canvas;
}
