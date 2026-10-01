from pathlib import Path
from PIL import Image

raw_dir = Path("posters/raw")
final_dir = Path("posters/final")
pub_dir = Path("public/posters")
final_dir.mkdir(parents=True, exist_ok=True)
pub_dir.mkdir(parents=True, exist_ok=True)

# 加载无 bug、高清晰度的精美二维码相纸徽章
badge_src = Image.open("assets/qrcode/poster_badge.png").convert("RGBA")

# 针对 1024x1536 尺寸调整徽章大小
# 徽章原始尺寸 330x420，宽高比 0.7857
# 缩放到宽 260px，高 331px
badge_w = 260
badge_h = int(badge_src.height * (badge_w / badge_src.width))
badge = badge_src.resize((badge_w, badge_h), Image.Resampling.LANCZOS)

configs = [
    {
        "raw": "poster1_heritage.png",
        "final": "poster1_heritage_final.png",
        "pub": "poster1.png",
        "x": 1024 - badge_w - 36,
        "y": 36,
        "title": "方案一：国风楚韵 · 暮色城脉"
    },
    {
        "raw": "poster2_lifestyle.png",
        "final": "poster2_lifestyle_final.png",
        "pub": "poster2.png",
        "x": 1024 - badge_w - 42,
        "y": 42,
        "title": "方案二：文艺治愈 · 拍立得旅行手帐"
    },
    {
        "raw": "poster3_fantasy.png",
        "final": "poster3_fantasy_final.png",
        "pub": "poster3.png",
        "x": 1024 - badge_w - 36,
        "y": 36,
        "title": "方案三：奇旅幻境 · 楚凤鸣霄与AI虚拟旅拍"
    }
]

for cfg in configs:
    base = Image.open(raw_dir / cfg["raw"]).convert("RGBA")
    base.alpha_composite(badge, dest=(cfg["x"], cfg["y"]))
    
    out_img = base.convert("RGB")
    out_img.save(final_dir / cfg["final"], "PNG", quality=98)
    out_img.save(pub_dir / cfg["pub"], "PNG", quality=98)
    print(f"Rendered: {cfg['title']} -> {cfg['final']}")

print("All 3 final posters successfully assembled!")
