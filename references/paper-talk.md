# 纸感排印口播版 `PaperTalk`

按口播配音驱动的纸感排印风格（`style: "paper"`）。延续浅灰纸底 `#E8E8E6`、流动 ASCII 点阵灰调、随光标推进的一行字词形变形、排印字墙、像素擦除黑底海报与瑞士网格蓝块，同时彻底打破旧版“固定 7 阶段、全片只能写一行 34 字、纯音乐无配音、依赖 macOS 系统宋楷字体”的限制。

支持 **1920×1080 横屏**（`PaperTalk`）与 **1080×1440（`3:4`）竖屏主标准**（`PaperTalk3x4`），并保留 `1080×1920`（`9:16`，`PaperTalkPortrait`）旧版兼容（60fps），跨平台零系统字体依赖，零外部视频依赖。

## 一期配置结构

`template/public/episodes/<期名>/episode.json`：

| 字段 | 说明 |
| --- | --- |
| `id`、`title` | 期目录名与标题 |
| `style` | 固定为 `"paper"` |
| `format` | 可选，`"landscape"`（默认 1920×1080）、`"3:4"`（竖屏推荐标准 1080×1440）或 `"portrait"`（1080×1920 兼容） |
| `duration` | 全片总秒数（与最后一镜 `end` 对齐） |
| `brand` | 品牌/栏目名（1–12 字），用于收尾打字与默认点阵纹理字符 |
| `tagline` | 可选，收尾等宽副标题（≤ 28 字） |
| `texture` | 可选，全片默认 ASCII 波浪点阵里混入的汉字（镜头内可用 `props.texture` 覆盖，未填时回退到 `brand`） |
| `roles` | 可选，全片默认协作/要点彩色名牌数组（镜头内可用 `props.roles` 覆盖） |
| `audio`、`audioOffset` | 配音文件与起始偏移秒数 |
| `music` | 可选，背景音乐（说话时自动压低至 `voiceVolume`，停顿处回升至 `volume`，支持自动循环） |
| `sfx` | 可选，转场与提示音轨 |
| `captions` | 口播字幕数组 `{ "text", "start", "end" }` |
| `shots` | 模块化镜头列表：`id`、`template`、`start`、`end`、可选 `dark`、`props` |

## 6 个模块化场景（可自由排序与跨句重复）

| 场景 `template` | 画面说明 | 时长范围 | `props` 主要字段 |
| --- | --- | --- | --- |
| `paper.intro` | 棋盘色块与彩色名牌单调缓出定格，可带开场主副标题 | 1.5 – 7 秒 | `title`（可选）、`sub`（可选）、`roles`（可选） |
| `paper.line` | GPU `translate3d` 平滑跟随光标向右打出一句口播，重点词原地变形推开后文，打完居中锁定整数像素；可跨多句重复 | 2.0 – 14 秒 | `line`（分段数组，单镜共 2–64 字）、可选 `kicker`、可选 `roles` 与 `swarm`（句尾名牌聚拢定格） |
| `paper.wall` | 关键词以 12 种字重/宽窄/描边/反白/像素体铺满字墙，入场收束定格后稳稳锁死 | 2.0 – 10 秒 | `word`（1–6 字，兼容 `wallWord`）、可选 `roles`、`texture` |
| `paper.poster` | 正方形像素擦除涌入黑底，1–4 行超大字由极细逐行砸成极粗并带反白闪光，外框静止无微爬 | 2.0 – 10 秒 | `lines`（1–4 行，每行 ≤ 9 字，兼容 `poster`）、可选 `kicker`、`roles` |
| `paper.block` | 瑞士网格蓝色方框，2–3 行字依次以粗体、空心描边、黑底反白展开，周围 6 枚名牌落位后静止 | 2.0 – 10 秒 | `rows`（2–3 行，每行 ≤ 6 字）、可选 `label`、`roles` |
| `paper.outro` | 像素黑底退回浅灰纸面，小色块聚拢为品牌标并打出品牌名与副标，收束后静止定格 | 2.0 – 10 秒 | 可选 `brand`、`line`、`tagline` |

## `paper.line` 的 6 种词形变形与焦点规则

`line` 数组中每个分段为 `{ "text": "...", "style"?: "...", "tag"?: "...", "focus"?: true }`：

- `voice`：浅蓝选区高亮 + 底部声波柱（该词读完后声波立即定格，不持续乱跳）
- `heavy`：字重加粗描边并横向舒展，平滑推开后文
- `light`：字重收细至极轻字重
- `breathe`：字距舒展拉开呼吸感，平滑推开后文
- `pixel`：由大颗粒像素块收束为蓝紫渐变圆点阵
- `lean`：动态前倾与瞬时运动模糊

**不强制要求 `pixel` 词**：打字结束后的收束镜头会按 `focus: true` → `style: "pixel"` → 最后一个带 `style` 的词 → 句尾分段的优先级平滑居中并锁定在整数像素坐标，因此多句口播可以自由拆成多个 `paper.line` 镜头。

## 三脚架稳定动效与跨平台规范

- **零晃动、零微爬铁律**：UI 色块、`<Tag>` 名牌、蓝色方框与标题严禁 `Math.sin / Math.cos` 周期浮动或 `1 + u * k` 线性微爬缩放；`paper.wall` 取消落定后的对角线斜漂、持续旋转与 63 格字体随机跳闪，入场收束即稳稳锁死，确保 2px 网格与笔画边缘零闪烁。
- **跨平台打包字体**：全片（含 Canvas 点阵词与字墙 12 种变体）仅使用工程内置的 `MiSans VF`、`JetBrains Mono` 与 `Workbench Pixel CN`，绝不调用 macOS 专属系统宋楷字体，在 Linux / Windows / macOS 渲染结果一致。
- **画幅安全区与自适应字幕**：
  - **横屏 `1920×1080`（`landscape`）**：像素擦除网格 `96×54`（20px 方格），字幕位于 `y = 932`。
  - **竖屏主标准 `1080×1440`（`3:4`）**：像素擦除网格 `60×80`（18px 正方形像素），主体文字与全部 1–10 字名牌严格落在 `[48..1032]×[60..1230]` 安全区内，字幕位于 `y = 1292`（浅纸底配深墨字、暗场配深底亮字）。
  - **旧版竖屏兼容 `1080×1920`（`portrait`）**：像素擦除网格 `54×96`，字幕位于 `y = 1475`。

## 校验与导出

- 校验函数：`validatePaperTalk(ep)`（检查镜头连续性、时长范围、单镜字数、词形枚举、禁忌平台词与外链）。
- 样片目录：`template/public/episodes/paper-talk-demo/`（30 秒真实配音 + 两段独立 `paper.line` 覆盖全部 6 种变形，零 `.mp4` 依赖）。
- 单元测试：`cd template && npx tsx --test tests/paper-talk.test.ts`
- 横屏导出：`npm run export -- PaperTalk --props='{"episode":"paper-talk-demo","format":"landscape"}'`
- 竖屏主标准导出（`3:4`）：`npm run export -- PaperTalk3x4 --props='{"episode":"paper-talk-demo","format":"3:4"}'`
