# 城脉相机：新会话交接（最新版）

更新时间：2026-10-01（黑客松交付冲刺阶段）

---

## 一、当前最新核心状态一览（优先阅读）

1. **线上生产环境已全面上线运行**：
   - **正式访问地址**：**`https://camera.jajaicb.cn`**（全站 HTTPS，已配置 80 端口 301 强制跳转）。
   - **托管服务器**：香港云服务器（SSH 别名：`cpa-hk`，公网 IP `160.202.47.213`）。
   - **服务路径**：`/var/www/citypulse-camera`。
   - **运行环境**：Node.js v22.23.3 LTS + PM2 守护（服务名 `citypulse-camera`，开机自启）。
   - **网关反代**：Nginx 1.18（支持 HTTP/2、`proxy_read_timeout 300s` 适配 AI 生图、`client_max_body_size 50m` 放宽手机大图上传）。
   - **SSL 证书**：Let's Encrypt 官方证书，自动配置 scheduled 续期任务。
   - **安全策略**：本地 3210 端口不对外公网暴露（UFW 已关），统一经 443 HTTPS 安全入口反代。

2. **代码仓库与版本同步**：
   - **GitHub 仓库**：`https://github.com/ZZDR1023/CityPulese-Camera.git`，主分支 `main`。
   - 本地工作区、GitHub 远程仓库与香港服务器代码 **100% 保持最新且完全同步**（工作区 clean）。
   - 全部 14 项单元回归测试保持全绿（`npm test` 14 pass, 0 fail）。

3. **官方宣传海报已制作完毕并上线**：
   - **官方海报直链**：`https://camera.jajaicb.cn/posters/poster_official.png`
   - **本地高清源文件**：`posters/final/poster_final_scannable.png`（1024×1536 印刷级，2.7MB）。
   - **海报核心要素均已满足**：
     - 视觉主体：暮色晚霞中的荆州古城墙与宾阳楼。
     - 城楼门额匾额：正中雕刻大金字**“州荆”**（从左至右排布为“州荆”）。
     - 海报专属大标题：左侧金色国风书法题字**“城脉相机”**（含 CityPulse Camera 与朱红印章），不遮挡古建筑。
     - 前景 4 张真实文化地标相纸：关公圣像、湖心亭、宾阳楼城门、古城楼；搭配古风手绘地图、复古旁轴相机与金秋银杏叶。
     - 右上角纯黑白二维码：无任何附加字与杂边，经 OpenCV 与真机测试 **100% 瞬间秒扫直达 `https://camera.jajaicb.cn`**。

4. **宣传二维码物料已全套就绪**：
   - 纯二维码（H 级容错）：`https://camera.jajaicb.cn/qrcode.png`（本地 `assets/qrcode/camera-qrcode-2048.png` 印刷级）。
   - 现成相纸卡片挂件：`https://camera.jajaicb.cn/qrcode-card.png`（带“城脉相机 · 荆州限定”排版与投影）。

---

## 二、架构与关键配置

- **技术栈**：原生 HTML/CSS/JavaScript + 原生 Node.js 服务端，生产环境零第三方 npm 依赖。
- **端口架构**：Node 服务监听 `127.0.0.1:3210`，外网通过 Nginx 443 HTTPS 反代。
- **模型配置**：本地与远程服务器的 `.env` 均已配置：
  - 文字生成：`AI_BASE_URL=https://cpa.jajaicb.cn/v1`, `AI_MODEL=gemini-3.8-flash`
  - 风格化：`IMAGE_BASE_URL=https://cpa.jajaicb.cn/v1`, `IMAGE_MODEL=gemini-3.1-flash-image`
  - 旅拍三模型：`gemini` (Gemini 3.1)、`image2` (gpt-image-2)、`image25` (gpt-image-2.5-sunburst)
- **生图脚本位置**：
  - CPA 一键生图：`python3 /home/zzdr1023/.agents/skills/cpa-image-generation/generate.py`
  - 海报合成/编辑脚本：`scripts/generate-final-edits.py`、`scripts/verify-and-fit-qr.py`

---

## 三、常用运维与管理命令

### 1. 香港云服务器操作（通过 SSH）
```bash
# 登录服务器
ssh cpa-hk

# 查看服务运行状态
pm2 status
pm2 logs citypulse-camera --lines 30

# 代码更新与重载
cd /var/www/citypulse-camera
git pull origin main
pm2 reload citypulse-camera

# Nginx 配置检查与重载
nginx -t && systemctl reload nginx
```

### 2. 本地开发与测试
```bash
npm test                  # 运行 14 项无额度消耗单元测试
npm run start             # 本地运行服务（读取 .env）
```

---

## 四、后续建议推进方向（新会话待办事项）

1. **比赛提交材料准备**（赛道一“荆州奇旅”，截止时间见 `docs/参赛手册核对与交接.md`）：
   - **海报提交**：使用已生成的官方海报 `public/posters/poster_official.png`。
   - **知乎帖子与项目广场**：按官方要求带指定话题发布（用户未授权前不要代发）。
   - **产品演示视频**：若需要录制手机端流畅操作视频，可通过手机连接 HTTPS 站点直接录屏。
2. **手机端端到端体验与多用户测试**：
   - 现已支持直接通过 iPhone / Android 打开 `https://camera.jajaicb.cn` 体验原生拍照、文化卡、文案生成与旅拍导出。
3. **保持环境卫生**：
   - `.env` 保持忽略，切勿提交或打印 API Key；
   - 任何服务器改动请保持本地与远程 Git 一致。
