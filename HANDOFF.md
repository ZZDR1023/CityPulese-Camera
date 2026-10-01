# 城脉相机：新会话交接（最新版）

更新时间：2026-10-02（黑客松交付冲刺阶段）

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

3. **最新功能特性（全功能就绪）**：
   - **单一选图入口与设备智能适配**：
     - 主操作区统一为单一【选择照片】大按钮，视觉彻底去冗余；
     - 移动端点击直接拉起手机原生的相机/相册选择；
     - 电脑端点击弹出精致的专属二选一弹窗（【从电脑相册选择】/【打开电脑相机拍摄】）。
   - **《荆州谣》黑胶唱片音乐播放器**：
     - 严格位于页面右上角标处（正对大标题右侧留白），移动端专项自适应；
     - 采用 `gpt-image-2.5-sunburst`（image2.5）真实生成的古典楚韵艺术黑胶封面（金石题字《荆州谣》、古城楼、长江夕照帆影、古楚编钟与金秋银杏）；
     - 音频来自高质量立体声《荆州谣》（`public/audio/jingzhouyao.mp3`，44.1kHz）；
     - 默认静止不转；点击播放流畅旋转，中心图标变为暂停 `⏸`；点击暂停即时静止在当前角度；播放完毕自动复位。
   - **虚拟旅拍多图循环轮播**：
     - 9 大核心地标扩充为 2~5 张候选精美实景图（共 25 张经过画质优化的实景图，全部严格控制在 90KB~660KB 之间，加载秒开且完全小于 1MB）；
     - 旅拍视窗两侧配备悬浮 `<` 和 `>` 箭头，首尾平滑循环切换，右下角带有 `1 / N` 序号指示器与动态站位提示；
     - 生成虚拟旅拍时，精准将用户当前查看的背景图发送给模型融合。
   - **小红书/抖音游玩攻略直达与防并行深度唤起**：
     - 旅拍区域与坐标区域均配置打卡机位与游玩实况链接；
     - 移动端支持 Deep Link（`xhsdiscover://` 和 `snssdk1128://`），安装对应 App 优先唤起；
     - 采用 `pagehide`/`blur`/`visibilitychange` 智能监听，彻底杜绝切入 App 后的并发网页跳转；未安装时平滑降级打开官方网页版。
   - **旅拍模型直观命名**：统一重命名为“快速”（Gemini 3.1，20–40s）、“标准”（image2）、“精细”（image2.5）。
   - **相纸底图与纯净排版**：相纸默认展示官方参赛海报，出片后平滑覆盖；导出相纸彻底移除了冗长繁杂的来源网址文本，输出品质极高。

4. **官方宣传海报已制作完毕并上线**：
   - **官方海报直链**：`https://camera.jajaicb.cn/posters/poster_official.png`
   - **本地高清源文件**：`posters/final/poster_final_scannable.png`（1024×1536 印刷级，2.7MB）。
   - **海报核心要素**：暮色宾阳楼主体、门额金字“州荆”、金色书法“城脉相机”、4张真实地标相纸与100%可扫秒达的纯黑白二维码。

5. **宣传二维码物料**：
   - 纯二维码（H 级容错）：`https://camera.jajaicb.cn/qrcode.png`（本地 `assets/qrcode/camera-qrcode-2048.png`）。
   - 相纸卡片挂件：`https://camera.jajaicb.cn/qrcode-card.png`。

---

## 二、架构与关键配置

- **技术栈**：原生 HTML/CSS/JavaScript + 原生 Node.js 服务端，生产环境零第三方 npm 依赖。
- **端口架构**：Node 服务监听 `127.0.0.1:3210`，外网通过 Nginx 443 HTTPS 反代。
- **静态资源路由**：`server.mjs` 原生支持 html, js, css, png, jpg, svg, webp, mp3，并支持 GET 和 HEAD 请求。
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
PORT=3210 npm start       # 本地运行服务（读取 .env）
```

---

## 四、后续建议推进方向（新会话待办事项）

1. **比赛提交材料准备**（赛道一“荆州奇旅”，截止时间见 `docs/参赛手册核对与交接.md`）：
   - **海报提交**：使用已生成的官方海报 `public/posters/poster_official.png`。
   - **知乎帖子与项目广场**：按官方要求带指定话题发布（用户未授权前不要代发）。
   - **产品演示视频**：若需要录制手机端流畅操作视频，可通过手机连接 HTTPS 站点直接录屏，伴随《荆州谣》背景音乐体验绝佳。
2. **保持环境卫生**：
   - `.env` 保持忽略，切勿提交或打印 API Key；
   - 任何服务器改动请保持本地与远程 Git 一致。
