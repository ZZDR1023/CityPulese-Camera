import cv2
from PIL import Image

# 加载 AI 生成的海报
poster = Image.open("posters/final/poster_pure_qr.png").convert("RGBA")

# 加载纯正黑白二维码 (自带高容错率与 quiet zone)
qr_pure = Image.open("assets/qrcode/camera-qrcode-1024.png").convert("RGBA")

# AI 生成的白色区域是 x: 783~964 (宽181), y: 59~238 (高179)
# 调整为正好覆盖该区域的 181x181 纯正二维码
target_size = 181
qr_resized = qr_pure.resize((target_size, target_size), Image.Resampling.LANCZOS)

# 精确贴合在 AI 生成的白色框内
poster.paste(qr_resized, (783, 59), qr_resized)

# 保存最终成品海报
final_poster_path = "posters/final/poster_final_scannable.png"
poster.convert("RGB").save(final_poster_path, "PNG", quality=98)
poster.convert("RGB").save("public/posters/poster_official.png", "PNG", quality=98)

# 验证解码
detector = cv2.QRCodeDetector()
img_cv = cv2.imread(final_poster_path)
data, bbox, _ = detector.detectAndDecode(img_cv)
print(f"Decoded URL from final poster: {data}")
assert data == "https://camera.jajaicb.cn", "Verification failed!"
print("Verification 100% PASSED! The poster QR is scannable!")
