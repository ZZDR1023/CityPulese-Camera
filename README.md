# 城脉相机

手机可访问的荆州旅行纪念相纸原型：本机照片 → 手选地点 → 心情与风格 → AI 纪念文案 → PNG 保存。

## 运行

需要 Node.js 22.9 或更新版本。运行不依赖第三方包；Playwright 仅用于开发测试。

```bash
cp .env.example .env
npm start
```

默认端口 3000。如果已占用，使用 `PORT=3210 npm start`。本次开发预览使用 <http://localhost:3210>；同一局域网手机可尝试 <http://192.168.0.108:3210>（地址会随网络变化，尚未经过真机验证）。这是本地服务，不是公网部署。

在 `.env` 中配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`，然后重启。接口兼容 `POST <AI_BASE_URL>/chat/completions`，通常 base URL 以 `/v1` 结尾。密钥仅由服务端读取，不写入前端；`.env` 已忽略。无模型配置时真实生成会明确报错，用户可主动选择固定离线示例。

## 已实现

- 照片选择入口，20 MB 校验、本机解码与缩放；原片模式不发送照片给服务端。HTTPS／localhost 且支持媒体 API 时另提供直接取景拍照；局域网 HTTP 仅显示“拍照或选择照片”，由系统选择器提供相机或相册选项。
- 荆州古城墙与荆州博物馆两个点位、官方来源文化卡、100 字以内心情、文艺／轻松风格。
- 服务端可信点位关联、输入校验、45 秒模型超时、并发上限与短时冷却。
- AI 与离线示例分别标识，生成失败保留照片和表单。
- 响应式相纸预览、出片动画、动态高度 1200 px 宽 PNG、下载与长按预览保存。

可选的 AI 风格化会在用户勾选同意并点击生成后，将压缩照片经本服务发送给图像服务。图片按居中正方形裁切，预览和导出一致。文化信息独立于 AI 文案，来源随导出保留。没有建筑识别、数据库或云相册。

## 文化资料

资料位于 `data/places.json`，已核对荆州市人民政府《荆州古城历史文化旅游区》（2023-04-06）。记录来源 URL、核验日期和对应原文片段。新增点位应先核验，再将 `verified` 设置为 `true`；团队内容负责人仍应复核措辞。

## 测试

```bash
npm test
npm ci
npx playwright install chromium
# 另一个终端先启动 PORT=3210 npm start
node scripts/browser-check.cjs
```

已有 Chrome 时可使用 `CHROME_PATH=/opt/google/chrome/chrome node scripts/browser-check.cjs`。`TEST_URL` 可覆盖测试地址。浏览器回归脚本拦截生成请求并模拟 503 回退，不消耗模型额度；接口单元测试同样使用模拟服务。真实 AI 验收独立执行，避免日常测试产生费用。

浏览器脚本覆盖桌面与手机视口、横竖照片、PNG 实际下载、模拟 API 错误、修改输入后的过期导出禁用、横向溢出和页面异常。截图、导出与结果 JSON 写到忽略的 `artifacts/`。

## 仍待验收

- 已完成 5 条真实模型请求，覆盖不同心情、空心情、诱导编造史实；本轮输出未见新增年代、人物、事件或引语。仍需团队内容负责人复核。
- 主展示手机实际拍照、下载、打开 PNG。桌面浏览器模拟手机尺寸不能替代真机验收。
- 公网部署或现场网络验证，以及视频、用户反馈、海报与知乎提交。

参赛时间与提交项见 `docs/参赛手册核对与交接.md`。

## 真实 AI 验收

已接通 `.env` 配置的模型。`npm run test:ai` 会发送 5 条真实请求并保存 `artifacts/real-ai-results.json`；`npm run test:browser:ai` 会在浏览器发起 1 条真实请求并下载 `artifacts/real-ai-paper.png`。两者会消耗模型额度，仅显式执行。Chrome 路径配置同上。真实验收结果与测试用照片均不代表游客调研或真机测试。

## 手机选图兼容性修复

用户真机反馈整体可用，但原“从相册选择”和“拍一张照片”都会弹出系统上传方式菜单。原因是手机浏览器不保证按 `capture` 提示直达相机。现已取消重复的两个文件输入入口，按浏览器能力提供单一系统选图，或系统选图加独立实时相机。直接取景需要安全上下文；[MDN getUserMedia 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)说明了此限制。

`CHROME_PATH=/opt/google/chrome/chrome node scripts/camera-check.cjs` 使用浏览器模拟摄像头验证拍摄、权限拒绝和释放，并检查局域网 HTTP 的单一入口。`LAN_TEST_URL` 可覆盖局域网测试地址。此测试未使用用户真实摄像头，修改后的手机交互仍需用户刷新后确认。

## AI 照片风格化（动漫／水彩）

上传照片后选择动漫或水彩，勾选本张照片的第三方上传同意，再点击生成。选原片不会发出图像请求；已生成的两种风格分别保存在当前页面内存中，切换不产生新请求。重新生成才再次调用模型。更换照片会清除风格缓存与本张照片的同意状态。

`IMAGE_BASE_URL`、`IMAGE_API_KEY`、`IMAGE_MODEL` 与文字模型独立。当前已配置 CPA 的 `gemini-3.1-flash-image`，使用多模态 `/chat/completions` 发送英文编辑指令和原图。只接受模型返回的内嵌 PNG/JPEG/WebP，不抓取任意远程图片 URL。密钥只在忽略的 `.env` 内，不出现在前端或测试记录。

照片先在浏览器压缩至最长边 1280 px、重新编码 JPEG 后发送。项目代码不将用户照片写入磁盘或日志；第三方服务的数据处理不由本项目控制。服务端限制请求大小、每次一个图像生成任务及 150 秒超时，前端可取消等待。取消不会承诺退还已产生的调用费用。

风格图和导出的相纸都会标注 AI 风格化。模型可能改变人脸、衣服、建筑细节，用户应先检查效果；随时可以切回原片。风格化模式不做地点替换；独立的“虚拟旅拍”模式见下文。

- `npm test`：包括图像上传同意、格式、参考图请求构造与上游故障的测试，不收费。
- `CHROME_PATH=/opt/google/chrome/chrome node scripts/style-browser-check.cjs`：模拟图像返回，验证同意门槛、切换、失败恢复、更换照片清空缓存与移动布局，不收费。
- `node scripts/style-real-check.mjs anime` 或 `watercolor`：各发送一次真实请求，使用 `test/fixtures/style-input.png` 合成测试图，产生费用。
- `CHROME_PATH=/opt/google/chrome/chrome node scripts/style-browser-real.cjs`：从页面真实生成一次动漫图并下载相纸，产生费用。为隔离图像验收，纪念文字使用明确标注的离线示例。

本轮真实 API 验收：动漫 19.861 秒，水彩 21.192 秒，均返回 1024×1024 图片。测试来源为手工绘制的合成人物与建筑，不是实际游客照片；真实人脸相似度、多人物和特定地标的保真仍待试用。生成结果及验收记录位于 `artifacts/style-*`。

完整浏览器验收已完成：真实动漫图生成→示例文案排版→PNG 下载→切回原片，23.435 秒；无页面异常。输出为 `artifacts/stylized-paper.png`，记录为 `artifacts/stylized-browser-result.json`，合成测试图与离线文案均明确标注。

## AI 虚拟旅拍

上传清晰人像 → 选择“虚拟旅拍” → 选择荆州古城墙或荆州博物馆 → 查看实景参考图与许可 → 勾选上传同意 → 生成 → 生成文案或使用示例 → 保存相纸。

`POST /api/travel` 使用与风格化相同的独立图像模型配置，向模型发送两张图：用户人像和服务端绑定的景点参考照片。客户端不能传入任意远程背景地址。模型提示要求保持人物特征和参考建筑，匹配光影与比例；仍可能改变面容、细节和空间关系，用户应审阅结果。预览与导出明确显示“AI 虚拟旅拍”，不代表实际到访。

景点选择与文化卡同步。换地点会使旧旅拍失效并恢复原片，不能将旧地点合成图导出为新地点。换原片也清空旧旅拍。旅拍后的 AI 文案提示使用想象／期待语气，离线旅拍示例同样避免宣称真实到访。

参考图元数据位于 `data/travel-scenes.json`，照片位于 `public/scenes/`。古城墙为 lienyuan lee 的 CC BY 3.0 照片；博物馆为 Zhangzhugang 的 CC BY-SA 3.0 照片。预览、导出保留摄影者、许可链接、来源及 AI 合成修改说明。公开分享博物馆合成图须遵循相同许可，页面已有提示。这些许可针对参考图及其改编，不等于项目代码的开源许可。

验收命令：

- `npm test` 包括地点白名单、上传同意、两张参考图请求和来源关联测试。
- `CHROME_PATH=/opt/google/chrome/chrome node scripts/travel-browser-check.cjs` 使用模拟返回验证两地点选择、合成图应用、来源署名、PNG 导出及换地点失效，不消耗模型额度。
- `node scripts/travel-real-check.mjs jingzhou-wall` 使用合成人物测试图完成一次真实模型合成，消耗额度。
- `CHROME_PATH=/opt/google/chrome/chrome node scripts/travel-browser-real.cjs` 在手机尺寸页面对博物馆完成一次真实合成并下载相纸，消耗额度。纪念文字用明确标注的离线示例，以隔离图像功能验收。

虚拟旅拍真实验收：古城墙接口约 23.292 秒；修复回到原片时的标签函数错误后，博物馆手机尺寸页面从合成到 PNG 下载及恢复原片约 21.133 秒，页面异常数为 0。已目视检查 `artifacts/travel-paper.png`，文化卡、AI 虚拟旅拍标识、参考图作者和许可链接完整。测试人物为合成插画，真实人脸保真和多人效果仍需实际照片试用。
