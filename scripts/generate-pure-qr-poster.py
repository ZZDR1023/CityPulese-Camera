import os, json, time, urllib.request, base64, requests
from pathlib import Path
from PIL import Image

KEY = "sk-zz-g8AuieOrlszZQBCDvo02Gx0FhvqbB71Qcf94pwKi5cR1fpOG"
URL = "https://cpa.jajaicb.cn/v1/images/edits"

tmp_dir = Path("posters/tmp")
tmp_dir.mkdir(parents=True, exist_ok=True)

# 1. 当前的高质海报作为主图
im_poster = Image.open("posters/final/poster_custom_edits.png")
ref_poster_path = tmp_dir / "ref_poster_current.jpg"
im_poster.convert("RGB").save(ref_poster_path, "JPEG", quality=95)

# 2. 纯黑白二维码图（没有任何附加文字、没有卡片、只有纯二维码）
im_qr = Image.open("assets/qrcode/camera-qrcode-1024.png")
ref_qr_path = tmp_dir / "ref_pure_qr.png"
im_qr.save(ref_qr_path, "PNG")

print(f"Poster ref size: {ref_poster_path.stat().st_size//1024} KB")
print(f"Pure QR ref size: {ref_qr_path.stat().st_size//1024} KB")

prompt = """Precise update to the top-right corner of the poster based on the two reference images. Vertical 1024x1536.

1. TOP-RIGHT CORNER (CRITICAL REQUIREMENT):
In Image 1, completely remove the entire top-right badge card, its text, titles, website URL, and labels. 
In its place at the top-right corner, directly insert ONLY the pure square black-and-white QR code from Image 2.
NO extra text, NO Chinese characters, NO title, NO subheadings, NO website URL, NO decorative frame. 
ONLY the pure, square, high-contrast black-and-white QR code neatly and squarely positioned at the top-right corner.

2. PRESERVE EVERYTHING ELSE EXACTLY AS IN IMAGE 1:
- The ancient city wall with the two horizontal carved characters '州荆' on the gate plaque.
- The grand golden calligraphy title '城脉相机' (CityPulse Camera) on the left.
- The four realistic polaroid photos on the stone wall (Guan Yu bronze statue, lakeside pavilion, city gate entrance, watchtower).
- The vintage camera and antique map resting on the foreground stone ledge.
- The breathtaking golden hour sunset, crimson twilight sky, autumn ginkgo leaves, and warm ember sparks.

Output the complete, unified, high-resolution vertical poster."""

print("Sending edit request to image2.5...")
t0 = time.time()

files = [
    ("image[]", ("poster.jpg", open(ref_poster_path, "rb"), "image/jpeg")),
    ("image[]", ("pure_qr.png", open(ref_qr_path, "rb"), "image/png"))
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
    print(f"Status: {resp.status_code} ({time.time()-t0:.1f}s)")
    if resp.status_code == 200:
        res = resp.json()
        b64 = res["data"][0]["b64_json"]
        out_path = Path("posters/final/poster_pure_qr.png")
        out_path.write_bytes(base64.b64decode(b64))
        print(f"Saved: {out_path} ({out_path.stat().st_size//1024} KB)")
    else:
        print("Error:", resp.text[:500])
except Exception as e:
    print("Exception:", e)
