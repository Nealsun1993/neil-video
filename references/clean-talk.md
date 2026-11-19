# 纯白口播版 `CleanTalk`

按口播配音驱动的纯白产品镜头风格（`style: "clean"`）。继承纯白界面的克制留白、线性图标、手形光标与焦点推近语言，彻底解除旧版 60 秒固定时长、固定 6 段工作流和固定界面文案的限制：任意配音时长、任意主题品牌、**1920×1080 横屏**（`CleanTalk`）与 **1080×1440（`3:4`）竖屏主标准**（`CleanTalk3x4`，同时保留 `1080×1920` `CleanTalkPortrait` 与 `1080×1728` `CleanTalk5x8` 兼容）、7 个模块化场景可自由排序与重复组合。

## 一期由什么组成

`template/public/episodes/<期名>/episode.json`，带 `"style": "clean"`：

| 字段 | 内容 |
| --- | --- |
| `style` | 固定为 `"clean"` |
| `format` | 可选。`"landscape"`（默认 1920×1080）、`"3:4"`（竖屏推荐标准 1080×1440），兼容 `"portrait"`（1080×1920）与 `"5:8"`（1080×1728） |
| `duration` | 全片秒数（与最后一个镜头的 `end` 一致，不限时长） |
| `brand` | 品牌或栏目名（1–12 字），用于开场、收尾及窗口默认标题 |
| `audio`、`audioOffset` | 配音文件路径与起始偏移秒数 |
| `music` | 可选。自动循环铺底配乐，说话时通过 `musicGainAt` 自动压低、停顿处抬起 |
| `sfx` | 可选。由 `scripts/talk-sfx.py` 按切镜与 `at` 时间点生成的轻音效轨 |
| `sources`、`clips` | 可选。支持 `"video"`（`.mp4` 片段）、`"image"`（`<Img>` 截图，支持可选 `fit: "contain" \| "cover"`，手机预览框默认 `contain` 防横图裁切）和 `"card"`（零外部素材内置浅色 UI 卡片 `{ label, title?, lines?, badge? }`） |
| `captions` | 字幕数组 `{ text, start, end }`，渲染在相机层之外（`3:4` 置于 `y≈1292` 安全区），横竖屏均清晰可读且不遮挡窗口 |
| `shots` | 镜头数组，从 0 秒连续排到 `duration`，自由选用下方 7 个 `clean.*` 场景（允许同场景连续复用） |

## 三脚架稳定镜头引擎（零点头、零反拉）

无需手写关键帧表。`buildSceneCamera(shot, format)` 严格遵守三脚架稳定铁律：

- **全景建立后静止锁死**：纯白窗口、卡片与标题入场到位后外框 100% 锁定，禁止多航点上下左右来回点头、禁止 `Math.sin` 漂浮、禁止 `1 + u*k` 线性微爬或内外容器反向缩放。
- **重点时刻干脆单向推近 + 静止驻留**：仅在口播讲到核心结果、弹窗应用或关键卡片时，使用单调无过冲缓动做一次单向定点放大并稳稳停住（不做推完又退回的倒走镜头），并对缩放与平移做严格边界钳制（`clampCameraKey`），确保任意画幅下零裁切、零越界、零底部文字残影。

## 7 个模块化场景（`CLEAN_SCENES`）

| 场景 | 画面与镜头动作 | 时长范围 | 主要 `props` |
| --- | --- | --- | --- |
| `clean.opening` | 品牌标识与副标单调缓出定格，下方 1–3 枚线性矢量图标逐笔画出 | 1.5–10 秒 | 可选 `title`（默认 `ep.brand`）、`kicker`、`icons`（1–3 项，可选 `sound \| text \| preview \| spark \| code \| layers`）、`iconsAt` |
| `clean.chapter` | 章节过渡卡：可选胶囊角标 + 大字主标题 + 副标与要点标签 | 1.5–8 秒 | `title`（必填，1–18 字）；可选 `badge`（如 `"01"` / `"2 SKILLS"`，不传则不显示）、`subtitle`、`items`（1–3 项 `{ label, icon?, at? }`） |
| `clean.drop` | 纯白窗口内手形光标拖入文件卡，展开为波形或结构化条目列表，浮现底部解析结果卡并单向聚焦定格 | 2.5–12 秒 | `fileName`（必填）；可选 `window`、`heading`、`action`、`icon`、`mode`（`"wave"` 或 `"list"`）、`items`（1–4 条）、`hint`、`status`、`resultLabel`、`result`、`dropAt`、`resultAt` |
| `clean.edit` | 前后状态/文案对比润色：手形光标点击右上按钮弹出浮层，完成任意字数的旧文案→新文案替换并单向聚焦修订结果 | 2.5–12 秒 | `before`（1–36 字）、`after`（1–36 字，无需与 `before` 等长）；可选 `prefix`、`suffix`、`window`、`heading`、`action`、`leftTitle`、`rightTitle`、`modalTitle`、`applyLabel`、`cue`、`openAt`、`applyAt` |
| `clean.board` | 分栏看板 + 底部时间轴：按 `at` 依次拾取要点词卡，展开视频/截图/内置卡片预览后落入底部轨道 | 2.5–12 秒 | `items`（1–3 项 `{ keyword, media?, label?, icon?, at? }`）；可选 `window`、`heading`、`action`、`leftTitle`、`rightTitle`、`trackLabel`、`text`、`cue` |
| `clean.preview` | 桌面横竖切换预览 + 移动端框与双规格标签展示（支持视频、`<Img>` 截图或内置卡片回退） | 2.5–12 秒 | 可选 `media`（不传则用内置卡片）、`title`、`caption`、`mode`（`"both" \| "phone" \| "desktop"`）、`switchAt`、`formats`（1–2 组 `[名称, 说明]`）、`window`、`heading`、`action` |
| `clean.closing` | 纯白品牌标识收束定格，底部可选浮起圆角搜索/行动框并逐字输入 | 1.8–10 秒 | 可选 `brand`（默认 `ep.brand`）、`tagline`、`search`（逐字打字文案）、`cta`、`searchAt` |

## 校验规则（`validateCleanTalk`）

- 检查 `style === "clean"`、画幅合法、镜头首尾无缝衔接且总长等于 `duration`。
- 检查每个镜头时长落在对应场景的 `[min, max]` 弹性区间内，所有 `at` 时间点落在所属镜头内部且递增。
- 检查版面字数上限与 `clips` 引用有效性（视频检查时长余量，图片与内置卡片免视频时长检查）。
- 拦截违禁平台词与外链（`/github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i`）。

## 样片与验证命令

样片位于 `template/public/episodes/clean-talk-demo/`（30 秒真实配音 + 自动压低循环配乐 + 合成音效，覆盖全部 7 个 `clean.*` 场景，零外部 `.mp4` 依赖）。

在 `template/` 下运行：

- 单元测试：`npx tsx --test tests/clean-talk.test.ts`
- 横屏导出（`16:9`）：`npm run export -- CleanTalk --props='{"episode":"clean-talk-demo","format":"landscape"}'`
- 竖屏主标准导出（`3:4`）：`npm run export -- CleanTalk3x4 --props='{"episode":"clean-talk-demo","format":"3:4"}'`
- 旧版 9:16 兼容导出：`npm run export -- CleanTalkPortrait --props='{"episode":"clean-talk-demo","format":"portrait"}'`
