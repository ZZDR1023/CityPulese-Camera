import os, json, time, urllib.request, base64, requests
from pathlib import Path
from PIL import Image

KEY = "sk-zz-g8AuieOrlszZQBCDvo02Gx0FhvqbB71Qcf94pwKi5cR1fpOG"
URL = "https://cpa.jajaicb.cn/v1/images/edits"

# 准备参考图，将大图适当缩放至最长边 1024/1280 并以高品质保存为临时文件，避免请求体过大被网关截断
tmp_dir = Path("posters/tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

print("Preparing reference images...")
# 1. 主场景图（海报1）
im1 = Image.open("posters/raw/poster1_heritage.png")
im1.thumbnail((1024, 1536), Image.Resampling.LANCZOS)
ref1_path = tmp_dir / "ref1_scene.jpg"
im1.convert("RGB").save(ref1_path, "JPEG", quality=92)

# 2. 相纸内容图（海报2）
im2 = Image.open("posters/raw/poster2_lifestyle.png")
im2.thumbnail((1024, 1536), Image.Resampling.LANCZOS)
ref2_path = tmp_dir / "ref2_polaroids.jpg"
im2.convert("RGB").save(ref2_path, "JPEG", quality=92)

# 3. 二维码徽章图
im3 = Image.open("assets/qrcode/poster_badge.png")
ref3_path = tmp_dir / "ref3_badge.png"
im3.save(ref3_path, "PNG")

print(f"Ref1 size: {ref1_path.stat().st_size//1024} KB")
print(f"Ref2 size: {ref2_path.stat().st_size//1024} KB")
print(f"Ref3 size: {ref3_path.stat().st_size//1024} KB")

prompt = """Comprehensive high-concept travel poster composite based on the three reference images. Vertical 1024x1536 composition.

1. SCENE COMPOSITION & ATMOSPHERE:
Retain the majestic, atmospheric mood from Image 1: the ancient Jingzhou city wall and historic Binyang Tower at golden hour sunset, dramatic crimson and amber evening skies, glowing red lanterns, and drifting golden autumn leaves and warm embers.

2. CITY WALL HORIZONTAL PLAQUE (CRITICAL DETAIL):
On the front center horizontal plaque/lintel of the ancient city tower gate, prominently and clearly display exactly TWO large traditional Chinese carved characters reading from left to right: '州荆' (traditional horizontal plaque engraved in ancient golden relief calligraphy).

3. FOUR POLAROID PHOTOS IN THE FOREGROUND:
In the foreground resting/floating along the stone wall, replace the four near polaroid photos with the four distinct Jingzhou cultural scenes shown in Image 2:
- First polaroid: The grand bronze statue of Guan Yu holding the Green Dragon Crescent Blade under daylight.
- Second polaroid: The historic lakeside pavilion surrounded by weeping willows reflecting on tranquil water at sunrise.
- Third polaroid: The grand stone archway and entrance of Jingzhou ancient city gate.
- Fourth polaroid: The ancient fortified watchtower bathed in morning golden light amidst lush trees.
Each photo must look like an authentic retro polaroid print with clean white paper borders.

4. POSTER TITLE TYPOGRAPHY:
Artistically render the official project title '城脉相机' (CityPulse Camera) on the poster in elegant, classical Chinese calligraphy typography with a subtle antique gilded/vermilion glow. Position the typography tastefully in the lower-left or mid-left area over the stone fortress shadow, ensuring it NEVER obscures or covers any important architecture, towers, or flying eaves.

5. TOP-RIGHT QR CODE BADGE:
Position the QR code card from Image 3 neatly and cleanly at the exact top-right corner of the poster. Keep the square QR code pattern sharp, flat, high-contrast black-and-white, undistorted, with a delicate warm-cream polaroid border and gentle natural drop shadow over the twilight sky.

Masterpiece, 8k resolution, cinematic lighting, editorial graphic design, perfect harmonious fusion."""

print("Calling image2.5 (gpt-image-2.5-sunburst) /images/edits...")
t0 = time.time()

files = [
    ("image[]", ("ref1.jpg", open(ref1_path, "rb"), "image/jpeg")),
    ("image[]", ("ref2.jpg", open(ref2_path, "rb"), "image/jpeg")),
    ("image[]", ("ref3.png", open(ref3_path, "rb"), "image/png"))
]

data = {
    "model": "gpt-image-2.5-sunburst",
    "prompt": prompt,
    "size": "1024x1536",
    "n": "1",
    "response_format": "b64_json"
}

headers = {
    "Authorization": f"Bearer {KEY}"
}

try:
    resp = requests.post(URL, files=files, data=data, headers=headers, timeout=240)
    print(f"Response status: {resp.status_code} ({time.time()-t0:.1f}s)")
    if resp.status_code == 200:
        result = resp.json()
        b64_data = result["data"][0]["b64_json"]
        out_file = Path("posters/final/poster_custom_edits.png")
        out_file.write_bytes(base64.b64decode(b64_data))
        print(f"Success! Output saved to: {out_file} ({out_file.stat().st_size//1024} KB)")
    else:
        print("Error response:", resp.text[:500])
except Exception as e:
    print("Request failed:", e)
