# 城脉相机：新会话交接

更新：2026-10-01。

## 最新接手结果（优先于下方旧交接）

### 旅拍融合与三模型更新

用户反馈人物／环境色差、比例违和后，新增 `Gemini 3.1 / image2 / image2.5`选择和 `自然合影 / 风景为主`构图。image2、image2.5已真实验证multipart参考图编辑，独立凭据只在.env；不自动重试或换模型。5场景新增环境光和布局锚点，提示重新协调白平衡、曝光、锐度、透视与脚部接触阴影。风景为主另发服务端生成的构图示意PNG，不增加额外生图调用。

三模型同一虚构写实人像对比均HTTP200：约40.275／61.273／95.379秒；image2.5实际页面导出／恢复原片通过。但小人物档几次实测仍没准确达到28–38%目标，已在UI明确提示，**不能宣称人物比例精准可控**。严格控制需要后续人物分割、确定性尺度放置和局部融合管线，本轮未实现。最新验收与限制见 `docs/旅拍融合优化与模型对比.md`；脚本 `scripts/travel-harmony-browser-check.cjs`，真实比较产物在忽略的 `artifacts/harmony/`。用户提供的成片仅本地诊断，没有上传其真人截图。


本轮已按用户要求上传到 `https://github.com/ZZDR1023/CityPulese-Camera`，主分支 `main`，远程 `origin`。`.env`、密钥、node_modules、artifacts 均未上传。原有功能保留。

- `data/places.json` 已从2个扩展为14个文化点位，覆盖11组清单；组合地名拆分，三类分组，来源与提醒完整。
- `data/travel-scenes.json` 已有5个已授权实景：古城墙／宾阳楼、博物馆、张居正故居、关帝庙、万寿宝塔。旧墙／馆参考图已更换；每图含拍摄日期、人物站位与服务端英文构图提示。
- 没有授权背景的地点不会自动换成别的景点，原片／动漫／水彩／文案仍可用。熊猫乐园只保留历史卡并提示当前开放状态未确认。
- 11项单元测试、基础／风格化／扩展旅拍／相机浏览器回归通过；5场景真实合成均成功，万寿首请求超时后显式重试成功；3条最终新增文字测试通过。详见 `docs/景点扩展验收.md`。
- 服务已启动监听3210，入口 `http://localhost:3210`；本轮Wi-Fi地址 `http://10.163.200.14:3210`，接手前重新核对进程与IP。
- 待续仅剩未授权景点补背景、新版本实体手机和真实人像／多人试用；未部署公网、未代发比赛材料。

下方保留原会话交接作为历史研究线索。其中“untracked／只有两个点位／3210未监听／旧图作者与许可”均已经过时，勿照此回退当前代码。当前图像许可以 `public/scenes/ATTRIBUTION.md` 与 scene JSON 为准。

---

## 旧交接记录

用户原先要求新开会话、换模型接手。原会话在此交接，不继续后台开发。

## 1. 当前唯一需要继续推进的任务

**用户已经确认现有功能基本可用；现在要补齐他列出的其余荆州景点，并选更适合把人物合成进去的真实景点照片。**

用户指定可用 opencli 查看：

- 小红书：https://www.xiaohongshu.com/explore?channel_id=homefeed_recommend
- 必应：https://www.bing.com/search?q=%E8%8D%86%E5%B7%9E%E6%99%AF%E5%8C%BA%E5%9B%BE&form=ANNTH1&refig=6abd4cd3acb24881a80252b57358ad97&pc=U531

他希望你判断图片对应哪个景区。选图重点：**平视、前景有真实可站立区域、主体辨识度高、路人少、避免航拍和人群遮挡**。不能只按搜索标题判断，应看图并核对来源。

当前只完成了本轮搜索的初步线索收集，**没有完成新增景点的数据写入，也没有更新内置照片**。不要把以下候选说成已经上线。

原清单共 11 组：

1. 荆州古城历史文化旅游区／宾阳楼（已上线古城墙）
2. 荆州博物馆（已上线）
3. 楚王车马阵
4. 张居正故居
5. 关帝庙
6. 万寿宝塔
7. 洈水风景区／颜将军洞
8. 洪湖生态旅游区／瞿家湾
9. 荆州园博园
10. 荆州方特东方神画
11. 郢城文化园／熊猫乐园

不要照搬原清单中的票价、免费开放、VR、平台评分、“唯一／最早”等未经核验信息。清单中“荆州博物馆藏越王勾践剑”有误，已向用户纠正；官网所说五代越王剑不是越王勾践剑。详见 `docs/景点候选与核验.md`。

## 2. 工作区与启动

- 工作区：`/home/zzdr1023/orca/projects/黑客松`
- 原生 HTML/CSS/JavaScript + Node HTTP 服务，无前端构建框架。
- Node 本机 v25.9.0，运行要求 Node >=22.9。
- 启动：`npm start`（读取 `.env`）；也可 `PORT=3210 npm start`。
- 预览：`http://localhost:3210`；过去局域网地址 `http://192.168.0.108:3210`，须重新核对 IP。
- **交接时检查 3210 没有监听进程，需要接手后启动。** 不要假定原会话的工具 session ID 可恢复。
- `.env` 已有文字和图像模型配置，是隐藏文件。不要输出、复制进交接正文或提交密钥。
- `.env`、`node_modules/`、`artifacts/` 已被 `.gitignore` 忽略。
- 当前 Git `master`，所有项目新增文件仍是 untracked，尚未 git add/commit。不要清理或覆盖它们；开一个新 checkout 不会自动带上这些文件。**直接在同一目录新开会话最安全。**

## 3. 已完成且可保留的功能

1. 拍照／选照片，本机压缩与预览；地点、心情、文字风格；真实 AI 纪念文案；文化卡与独立来源；1200px 宽动态高度 PNG。
2. 手机原先两个按钮都会弹相机／相册菜单。已修：局域网 HTTP 单个“拍照或选择照片”；HTTPS／localhost 支持 getUserMedia 时额外提供直接取景相机。用户已真机确认此修复正常。
3. 动漫／水彩照片转换：用户主动勾选第三方上传同意后才上传压缩原图；两种结果在本页缓存，切换不再次调用；可取消等待、失败保留原片；新照片清空缓存与同意。
4. 虚拟旅拍：上传人像 + 服务端已绑定的真实景点参考图，两张图发给模型；目前古城墙／博物馆两地点。地点和文化卡同步，切换地点会丢弃不匹配的旅拍结果并恢复原片。
5. 预览和导出保留“AI 虚拟旅拍”或“AI 动漫／水彩风格图”标识；景点图片署名、许可、AI 修改说明保留在导出。
6. 用户要求去掉界面“（CPA）”，已删。**不要重新把供应商名放回产品界面**；仍保留“第三方图像服务”的上传说明。
7. 图像与文案模式分别标识；离线文案显示“文案示例 · 非实时生成”。虚拟旅拍的离线示例及文案提示用想象／期待语气，避免假称真实到访。

## 4. 关键文件

- `server.mjs`：静态文件白名单、GET `/api/health`、`/api/places`、`/api/travel-scenes`，POST `/api/story`、`/api/stylize`、`/api/travel`。
- `image-service.mjs`：图像数据校验、固定风格提示、两参考图旅拍提示、上游解析。
- `public/index.html` / `public/style.css` / `public/app.js`：所有 UI 与 Canvas 导出。已有功能写得较紧凑，修改时避免全局字符串替换误伤。
- `data/places.json`：文化卡与来源、离线文案。现在只有两个地点。
- `data/travel-scenes.json`：内置场景元数据，`placeId` 与文化卡 ID 关联。
- `public/scenes/*.jpg`、`public/scenes/ATTRIBUTION.md`：照片及署名。
- `README.md`：运行、配置、各功能和测试。
- `docs/真实AI验收.md`、`docs/参赛手册核对与交接.md`：已做与未做的验收、比赛提交项。
- `城脉相机_一天开发与参赛规划.md`：最初规划。用户后来明确授权了风格化与虚拟旅拍，不能用原规划中的“不做生图”阻止后续工作。

新增场景写入 JSON 并放置图片后须重启服务：服务端启动时读 JSON，并把内置图路径加入静态白名单。

每条 scene 的必要字段：`placeId,image,title,credit,license,licenseUrl,sourceUrl,modifications`。`image` 是同源 `/scenes/xxx.jpg`。当前提示支持许可名称中的 `SA` 显示相同方式共享提示。

## 5. 模型与照片处理

文字：`.env` 的 `AI_BASE_URL / AI_API_KEY / AI_MODEL`，兼容 `/chat/completions`，45 秒上游超时。

图像：`.env` 的 `IMAGE_BASE_URL / IMAGE_API_KEY / IMAGE_MODEL`，当前为 CPA 网关的 `gemini-3.1-flash-image`；独立于文字配置。原会话按 `cpa-image-generation` skill 使用已有本地凭据写入 `.env`，已真实验证，不需要再索要密钥。

图像协议：多模态 chat completions，用户内容是英文指令 + `image_url` data URL；旅拍有两张参考图。返回 `choices[0].message.images[0].image_url.url` 内嵌图片。只接受 PNG/JPEG/WebP data URL，不跟随任意远程图片地址。

照片在浏览器重编码至最长边1280px后上传，去掉原文件元数据。程序不把游客照片写盘或写日志，但不能承诺第三方服务零留存。图像端一次一个任务、10秒请求冷却、150秒超时；取消可终止本地等待，不能承诺供应商退费。

## 6. 已有真实参考图及改进方向

- 古城墙：`https://commons.wikimedia.org/?curid=57938540`，lienyuan lee，CC BY 3.0。现图为俯看城门，人多，用户本轮希望换得更适合放人。
- 博物馆：`https://commons.wikimedia.org/?curid=36074052`，Zhangzhugang，CC BY-SA 3.0。2014年正面广场实景，站立空间尚可，但有车／路人。可寻找更清爽版本。

照片许可已在界面和导出保留；博物馆公开分享改编需遵守相同许可。小红书／必应可以用来找角度与景点，不要把“公开看得到”当作获得了图片再分发授权。授权不明可记录候选并寻找可复用版本，别给图片虚构许可。

## 7. 本轮检索的直接续接线索

### 已保存

`artifacts/commons-candidates.json`（约221KB）含9组 Wikimedia Commons 搜索完整结果与 `extmetadata`，可以解析后过滤候选。**结果大量无关，不可直接导入。**

- `Wanshou Pagoda Jingzhou`：有效候选 page IDs 33017280、33017338、33017383、33017397、33017444、33017615，均名为 `Jingzhou Wanshou Baota 2014.04.20 ...jpg`。下一步下载缩略图做 contact sheet，选前景可站人且能看清塔的。
- `荆州 关帝庙`：有效候选 ID 51389548，`File:荆州关帝庙 - panoramio.jpg`；其它文献噪声剔除。
- `Zhang Juzheng residence`：搜索无结果，但前一轮广义 `Jingzhou` 查询已发现 **ID 18157344**，`File:Jingzhou-Zhang Juzheng guju.jpg`，CC BY-SA 3.0，图链接 `https://upload.wikimedia.org/wikipedia/commons/9/9d/Jingzhou-Zhang_Juzheng_guju.jpg`。需重新读取 imageinfo 获取作者并看构图。
- 可改善古城墙的候选：ID 18141351 `File:Muraille Est de Jingzhou.JPG`、ID 18146744 `File:Jingzhou dongmen.jpg`，均 CC BY-SA 3.0。作者与构图仍需核验。
- 洪湖中文查询有深圳洪湖公园、道路等错地结果，不能使用。ID 67902735 `Xintan Town - on the levee - P1540381.JPG` 只是待核对线索，不能当作瞿家湾。
- 洈水查询误匹配渭水／蒋渭水；园博园、方特、郢城查询大量古籍噪声。应换正式名称、官方旅游站、地名组合继续搜索。

### opencli 使用情况

已读取 skills：`opencli-usage`、`opencli-browser`。`opencli doctor` 曾全绿，Chrome 扩展正常。命名 sessions 可能因空闲失效，不要依赖旧 refs。

- `scenery-commons`：Commons API 页面，可在该同源页面通过只读 eval + fetch GET 查询 API，之后输出 JSON。
- `expand-bing`：必应检索；用 `setlang=zh-hans&cc=cn` 较稳定。导航完成后再 eval，否则易读到旧页面。
- `xhs-pictures`：已打开用户给的首页。主页内容可以读取；首页不是荆州专属推荐，需主动搜索。
- `opencli xiaohongshu search '荆州' / '荆州古城' / '荆州 景点 拍照 空镜'` 都返回 `[]`，不是可用搜索结果。可以用浏览器真实搜索框继续，不能说已经读到这些景点笔记。
- `tools.web__run` 在本环境报 HTTP 404，不必反复试它。
- 之前 curl 在 workspace 沙箱 DNS 失败，刚刚**最新权限已切换为 danger-full-access、approval_policy never**，应直接继续联网；新会话仍以实际系统权限为准。用户非常讨厌重复审批。
- 下载 Wikimedia 原图曾 Python urllib 403；`curl -L -A 'ChengmaiCamera/0.1'` 成功，记得加超时并检查 HTTP 状态与实际图像格式。

用户给的必应页已有官方线索（尚未读取正文）：
`https://www.jingzhou.gov.cn/cxfw/whlv/202512/t20251218_1058400.shtml`
`http://wlj.jingzhou.gov.cn/ywgz_19/lyzx/202512/t20251208_1056405.shtml`
`https://jzgcly.com/tourismWeb/common/index`

## 8. 验证与已有证据

最后功能修改后的 `npm test` 8项通过；旅拍、风格化、桌面／手机尺寸回归通过。

```bash
npm test
CHROME_PATH=/opt/google/chrome/chrome node scripts/browser-check.cjs
CHROME_PATH=/opt/google/chrome/chrome node scripts/style-browser-check.cjs
CHROME_PATH=/opt/google/chrome/chrome node scripts/travel-browser-check.cjs
```

新加场景会扩展旅拍测试的遍历范围。注意 `travel-browser-check.cjs` 最后的切换断言假定最后一个场景不是古城墙，调整顺序时需适配。

只在必要时手动运行付费真实测试：
`node scripts/real-ai-check.mjs`（5条文字）、`scripts/style-real-check.mjs`（1次图片）、`scripts/travel-real-check.mjs`（1次旅拍）；浏览器真实版本同目录，见 package.json / README。

过去真实结果：文字5条约5–21秒；风格化动漫19.861秒、水彩21.192秒；古城墙旅拍23.292秒；博物馆真实浏览器合成、下载、恢复原片21.133秒。

证据在 `artifacts/`：`travel-paper.png`、`travel-browser-result.json`、`stylized-paper.png`、`style-*-result.json` 等。测试人像是程序画的合成人物（`test/fixtures/`），不是游客照片，不能声称实测了真人相似度。

用户已经真机确认基础功能和照片入口修复正常；新风格化／旅拍真实人像效果仍需他试用。ADB 曾无设备连接，不要未经确认当成可控手机。

## 9. 比赛上下文（不要代用户发布）

手册：https://edgeintelligence.feishu.cn/wiki/ULw7wUtwmiKs5gkzK7ecqEMsnYi
赛道一“荆州奇旅”。海报截止10月1日24:00，作品10月2日12:00。提交需要视频、带指定话题的知乎帖子、知乎项目广场链接；可访问链接可选。用户暂未授权发布知乎、发消息、提交问卷，不自动执行。

## 10. 建议接手顺序

1. 阅读本文件、README和两个JSON，确认工作区与密钥仍在，启动3210。
2. 从保存的Commons候选优先完成张居正故居、关帝庙、万寿宝塔的看图、官方事实核验与接入。
3. 按用户给的其余景点继续找正确来源；别把错地图片或博物馆展品特写当旅拍背景。
4. 为每张选图记录站人位置、景观辨识点和不采用其它图的原因；必要时把人物摆放建议写入scene并传给模型，避免只换照片不改善合成构图。
5. 更新地点／场景JSON和来源说明，必要时把选择器按历史人文、自然生态、主题休闲分组。保留现有功能，避免无关重构。
6. 重启，运行针对新增地点／图片的回归与少量真实合成验证；向用户明确哪些已完成、哪些因缺少可确认素材仍未上线。

交接方式：用户将自行在此项目新建会话并选择模型。没有创建新worktree或启动另一代理，避免丢失未提交文件或选错模型。
