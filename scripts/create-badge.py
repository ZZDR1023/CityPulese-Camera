from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_badge():
    scale = 3  # 3倍超采样抗锯齿
    w, h = 280 * scale, 370 * scale
    pad = 25 * scale
    canvas_w, canvas_h = w + pad * 2, h + pad * 2
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # 柔和多层阴影
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    card_box = [pad, pad + 5 * scale, pad + w, pad + h + 5 * scale]
    s_draw.rounded_rectangle(card_box, radius=18 * scale, fill=(15, 25, 30, 85))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10 * scale))
    canvas.alpha_composite(shadow)
    
    # 卡片底色（米白暖调纸张质感）
    card = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card)
    card_rect = [pad, pad, pad + w, pad + h]
    c_draw.rounded_rectangle(card_rect, radius=18 * scale, fill=(254, 252, 248, 250), outline=(220, 212, 198, 255), width=2 * scale)
    
    # 顶部和纸胶带装饰
    tape_w, tape_h = 80 * scale, 16 * scale
    tape_box = [pad + (w - tape_w) // 2, pad - 8 * scale, pad + (w + tape_w) // 2, pad + 8 * scale]
    c_draw.rounded_rectangle(tape_box, radius=3 * scale, fill=(40, 80, 90, 210))
    
    # 思源中文字体
    f_bold = "/home/zzdr1023/.local/share/fonts/noto-sc-standalone/NotoSansCJKsc-Bold.ttf"
    f_reg = "/home/zzdr1023/.local/share/fonts/noto-sc-standalone/NotoSansCJKsc-Regular.ttf"
    
    font_title = ImageFont.truetype(f_bold, 17 * scale)
    font_sub = ImageFont.truetype(f_reg, 10 * scale)
    font_url = ImageFont.truetype(f_bold, 12 * scale)
    font_tag = ImageFont.truetype(f_reg, 9 * scale)

    # 品牌图标与文字
    c_draw.text((pad + w // 2, pad + 24 * scale), "城脉相机 · 荆州限定", fill=(28, 42, 48), font=font_title, anchor="mt")
    c_draw.text((pad + w // 2, pad + 48 * scale), "手机扫码 制作专属相纸", fill=(100, 118, 128), font=font_sub, anchor="mt")
    
    # 二维码背景框与贴图
    qr = Image.open("assets/qrcode/camera-qrcode-1024.png").convert("RGBA")
    qr_size = 195 * scale
    qr_resized = qr.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    qr_x = pad + (w - qr_size) // 2
    qr_y = pad + 70 * scale
    c_draw.rounded_rectangle([qr_x - 6 * scale, qr_y - 6 * scale, qr_x + qr_size + 6 * scale, qr_y + qr_size + 6 * scale],
                             radius=8 * scale, fill=(255, 255, 255, 255), outline=(232, 225, 215, 255), width=1 * scale)
    card.paste(qr_resized, (qr_x, qr_y), qr_resized)
    
    # 底部网址与功能标签
    c_draw.text((pad + w // 2, pad + 288 * scale), "camera.jajaicb.cn", fill=(168, 76, 42), font=font_url, anchor="mt")
    c_draw.text((pad + w // 2, pad + 312 * scale), "AI 纪念文案 · 虚拟旅拍 · 14 处文化坐标", fill=(120, 135, 143), font=font_tag, anchor="mt")
    
    canvas.alpha_composite(card)
    
    # 缩放到目标尺寸
    out_w = (w + pad * 2) // scale
    out_h = (h + pad * 2) // scale
    badge_final = canvas.resize((out_w, out_h), Image.Resampling.LANCZOS)
    badge_final.save("assets/qrcode/poster_badge.png", "PNG")
    print("Poster badge generated successfully: assets/qrcode/poster_badge.png")

create_badge()
