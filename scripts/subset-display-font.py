"""Build a small, renamed OFL Chinese display font for headers and postage stamps.
Requires fonttools[brotli] only at development time; no runtime dependency.
"""
from pathlib import Path
import argparse
import json
from fontTools import subset
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser()
parser.add_argument('--source', default='/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc')
parser.add_argument('--font-number', type=int, default=2)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
text = '荆州·楚韵纪念城市记忆护照经典相纸旅行向往邮戳城脉原创设计非文物复原古城宾阳楼博物馆张居正故居关帝庙万寿宝塔楚王车马阵章华寺关羽祠临江仙公园洈水风景区颜将军洞洪湖湿地生态旅游区瞿家湾园博东方神画郢文化熊猫乐足迹'
places = json.loads((root / 'data/places.json').read_text())
text += ''.join(p['name'] for p in places)
text += ''.join(chr(i) for i in range(32, 127))
font = TTFont(args.source, fontNumber=args.font_number)
options = subset.Options()
options.flavor = 'woff2'
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
options.name_legacy = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
for record in font['name'].names:
    if record.nameID in [1, 3, 4, 6, 16]:
        value = 'CityPulseDisplay' if record.nameID == 6 else 'CityPulse Display'
        record.string = value.encode(record.getEncoding())
font.flavor = 'woff2'
out = root / 'public/fonts/citypulse-display.woff2'
out.parent.mkdir(parents=True, exist_ok=True)
font.save(out)
print(f'{out}: {out.stat().st_size} bytes, {len(font.getBestCmap())} glyph mappings')
