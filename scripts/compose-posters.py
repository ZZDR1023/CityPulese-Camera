import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

raw_dir = Path("posters/raw")
final_dir = Path("posters/final")
final_dir.mkdir(parents=True, exist_ok=True)

# 加载二维码卡片
card_img = Image.open("assets/qrcode/camera-qrcode-card.png").convert("RGBA")

# 缩放卡片为适合 1024 宽海报右上角的尺寸
# 宽度 240px，高约 316px
target_w = 240
target_h = int(card_img.height * (target_w / card_img.width))
badge = card_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

# 3 张海报处理
posters = [
    ("poster1_heritage.png", "poster1_heritage_final.png", "国风楚韵 · 暮色城脉"),
    ("poster2_lifestyle.png", "poster2_lifestyle_final.png", "文艺治愈 · 拍立得旅行杂志"),
    ("poster3_fantasy.png", "poster3_fantasy_final.png", "奇旅幻境 · 楚风与AI虚拟旅拍")
]

margin_right = 36
margin_top = 36
pos_x = 1024 - target_w - margin_right
pos_y = margin_top

for raw_name, final_name, title in posters:
    raw_path = raw_dir / raw_name
    final_path = final_dir / final_name
    
    base = Image.open(raw_path).convert("RGBA")
    
    # 贴入右上角二维码徽章（带透明度混合）
    base.alpha_composite(badge, dest=(pos_x, pos_y))
    
    # 保存成品 PNG
    out_rgb = base.convert("RGB")
    out_rgb.save(final_path, "PNG", quality=95)
    print(f"Created final poster: {final_path} ({title})")

print("All final posters created successfully!")
