import os, json, time, urllib.request, base64
from pathlib import Path

KEY = "sk-zz-g8AuieOrlszZQBCDvo02Gx0FhvqbB71Qcf94pwKi5cR1fpOG"
URL = "https://cpa.jajaicb.cn/v1/images/generations"

prompts = [
    {
        "id": "poster1_heritage",
        "name": "国风楚韵 · 暮色城脉",
        "prompt": "Vertical 2:3 travel poster, masterpiece. The historic ancient city wall of Jingzhou and majestic Binyang Tower at golden hour sunset with glowing red lanterns and ancient flying eaves. Floating luminous polaroid photo prints drift gently in the twilight breeze, capturing poetic watercolor moments of the historic city. Golden autumn leaves and subtle warm ember particles. The top-right area has clean open twilight sky with subtle clouds. Cinematic lighting, rich oriental colors of deep verdigris teal and sunset amber, 8k resolution, elegant graphic design, no text watermark."
    },
    {
        "id": "poster2_lifestyle",
        "name": "文艺治愈 · 拍立得旅行杂志",
        "prompt": "Vertical 2:3 editorial travel poster, warm and aesthetic Japanese magazine style. A high quality flatlay of a traveler tabletop featuring beautiful vintage polaroid prints of Jingzhou landmarks, a classic 35mm rangefinder camera, an artistic hand-drawn illustrated map of Jingzhou, delicate dried ginkgo leaves, and warm afternoon sunlight casting gentle window shadows. Refined, minimalist, cozy atmosphere with soft beige, linen cream, and deep pine teal palette. Top-right corner is clean uncluttered creamy surface. Ultra-high definition, exquisite still life photography, modern lifestyle poster, no text watermark."
    },
    {
        "id": "poster3_fantasy",
        "name": "奇旅幻境 · 楚风与AI虚拟旅拍",
        "prompt": "Vertical 2:3 high-concept tech-fantasy travel poster for Jingzhou AI Camera. An ethereal golden Chu-state mythological phoenix made of luminous light particles swoops across the starry twilight sky above Jingzhou ancient city walls. A modern young explorer in travel coat looks into a camera lens, with holographic polaroid frames floating around showing vibrant anime-style travel scenes. Vibrant cinematic palette of deep midnight sapphire, electric gold, and cyan neon glow. Top-right corner has clear deep blue sky with subtle starry gradients. Ultra-detailed, award-winning cultural poster design, no text watermark."
    }
]

out_dir = Path("posters/raw")
out_dir.mkdir(parents=True, exist_ok=True)

for i, p in enumerate(prompts, 1):
    pid = p["id"]
    target_file = out_dir / f"{pid}.png"
    print(f"[{i}/3] Generating {p['name']} ({pid})...")
    payload = {
        "model": "gpt-image-2.5-sunburst",
        "prompt": p["prompt"],
        "size": "1024x1536",
        "n": 1
    }
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=240) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        b64 = result["data"][0]["b64_json"]
        target_file.write_bytes(base64.b64decode(b64))
        print(f"  -> Saved {target_file} ({len(b64)//1024} KB b64, {time.time()-t0:.1f}s)")
    except Exception as e:
        print(f"  -> Failed: {e}")
