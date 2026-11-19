# 虹彩对话口播版 `PrismTalk`

按口播配音驱动的虹彩对话风格（`style: "prism"`）。保留虹彩流体底场、暗场四角留光、景深层叠对话卡与桌面预览窗，同时解除旧版固定 30 秒音乐踩点、单镜 ≤ 4 秒、单行 18 字上限以及必须准备 `.mp4` 实片素材的限制。

支持 **1920×1080 横屏**（`PrismTalk`）与 **1080×1440（`3:4`）竖屏主标准**（`PrismTalk3x4`），并保留 `1080×1920`（`9:16`，`PrismTalkPortrait`）与 `1080×1728`（`5:8`，`PrismTalk5x8`）兼容画幅（60fps）。时长完全跟随配音，背景音乐自动循环并在说话时自动压低。

## 一期配置结构

`template/public/episodes/<期名>/episode.json`：

| 字段 | 说明 |
| --- | --- |
| `id`、`title` | 期目录名与标题 |
| `style` | 固定为 `"prism"` |
| `format` | 可选，`"landscape"`（默认 1920×1080）、`"3:4"`（竖屏推荐标准 1080×1440），兼容 `"portrait"`（1080×1920）与 `"5:8"`（1080×1728）；渲染时也可通过 `--props` 覆盖 |
| `duration` | 全片总秒数（与最后一镜 `end` 对齐） |
| `brand` | 品牌/栏目名（1–12 字），用于品牌标镜头与回复方名称 |
| `handle` | 可选，提及前缀（如 `"@Agent"`），默认 `@<brand>`，在气泡文本中自动高亮 |
| `user` | 可选，提问方身份（字符串如 `"林夏"` 或 `{ "name": "林夏", "initial": "林" }`） |
| `audio`、`audioOffset` | 配音文件（如 `"narration.m4a"`）与起始偏移秒数 |
| `music` | 可选，`{ "src": "/prism-promo/music.m4a", "volume": 0.28, "voiceVolume": 0.08 }`，自动循环与闪避人声 |
| `sfx` | 可选，转场与提示音轨（如 `"sfx.m4a"`） |
| `sources`、`clips` | 可选，登记视频片源、静态图片或复用卡片；零外部视频时可完全省略 `sources` |
| `captions` | 口播字幕数组 `{ "text", "start", "end" }` |
| `shots` | 模块化镜头列表：`id`、`template`、`start`、`end`、可选 `dark`、`props` |

路径以 `/` 开头表示相对 `template/public/` 根目录，否则相对本期目录 `public/episodes/<期名>/`。

## 6 个模块化场景（可自由排序与重复）

| 场景 `template` | 画面说明 | 时长范围 | `props` 主要字段 |
| --- | --- | --- | --- |
| `prism.logo` | 品牌标与名称单调缓出定格，可配顶标与副标 | 1.5 – 8 秒 | 可选 `brand`、`kicker`、`tagline`、`dark`（默认暗场） |
| `prism.icons` | 2 到 4 枚发光功能图标卡按说话时间依次展开（`3:4` 竖屏 3–4 枚采用原生 2×2 双列） | 1.5 – 10 秒 | `items`（2–4 项，支持 `mark / play / spark / text / wand / check / chat / code / layers / mic` 及 `label`、`sub`、`at`），可选 `kicker`、`title` |
| `prism.headline` | 1 到 3 行居中粗体大标题，字号随字数与画幅自适应，落定后静止 | 1.5 – 10 秒 | `lines`（1–3 行，每行 ≤ 14 字），可选 `kicker`、`sub`、`showIcons` |
| `prism.chat` | 顶边锚定景深对话卡，新消息按 `at` 浮现、旧卡上移露头变虚，自动双行折行 | 2.0 – 12 秒 | `messages`（1–4 条：`from: "user" \| "bench"`、`text` 1–40 字、可选 `at`、`typed`、`list`、`media`、`mediaAt`、`focusAt`、`focusScale`） |
| `prism.window` | 带红黄绿顶栏的桌面预览窗，可叠加按 `at` 弹出的要点胶囊与重点放大 | 2.0 – 12 秒 | `title`、可选 `badge`、`media`（视频/图片/零素材卡片）、可选 `callouts`（`{ "text", "at" }[]`）、可选 `zoom`（`false` 或 `{ "at", "scale"?, "origin"? }`）或 `focusAt` |
| `prism.punch` | 收尾短句依次单调缓出定格，后半句从虹彩渐变收为纯白 | 1.8 – 12 秒 | `lines`（1–4 组 `[前半句, 虹彩后半句]`，合起来 ≤ 14 字），可选 `kicker` |

> **全片秒数约定**：`prism.icons`、`prism.chat`、`prism.window` 中的 `at` / `mediaAt` / `focusAt` / `zoom.at` 均填写**全片秒数**（直接对照 `captions` 里的句子时间），第一项可省略 `at`。

## 三脚架稳定动效铁律（横屏与竖屏统一）

- **全组件单调无回弹落定（`focusEase`）**：所有卡片、图标、标题均采用 `cubic-bezier(0.22, 1, 0.36, 1)` 在约 `0.36s` 内一步到位并保持静止；除背景流体底场 `Field` 外，UI 元素严禁使用 `Math.sin` 上下漂浮或 `1 + u * k` 持续微爬缩放。
- **对话气泡顶边锁死**：`prism.chat` 采用顶边固定锚点（`transformOrigin: "50% 0%"`）+ 同格隐藏全文预占位 + 列表项静态槽位渐显；打字跨行、列表逐条出现或底部 `media` 抽屉展开时，气泡顶边、头像与正文行**零像素跳动**。
- **连续预览窗外框无缝驻留 + 重点单向放大**：相邻两个 `prism.window` 镜头切换时外框与红黄绿顶栏原地锁死；讲到最终 `callout`（或指定 `zoom` / `focusAt`）时执行一次单向无过冲推近（默认 `1.045x`）并静止保持至切镜，绝不反向回拉。

## 零素材复用：三种 `media` 写法

`prism.window` 和 `prism.chat` 消息里的 `media` 支持三种模式，无需准备外部 `.mp4` 也能直接出片：

1. **零素材内置 UI 卡（推荐无录屏时使用）**：直接传 `{ "title": "...", "badge": "STEP 01", "lines": ["要点一", "要点二"], "footer": "..." }`（可写 `kind: "card"` 或省略 `kind`）。
2. **静态截图/插画（`<Img>`）**：直接传图片路径 `"dbs-hero.png"`，或 `{ "kind": "image", "src": "dbs-hero.png", "fit": "contain", "label": "说明" }`。
3. **真实录屏片段（`<OffthreadVideo>`）**：在 `sources` 与 `clips` 中登记 `.mp4` 片源与起点秒数，`validatePrismTalk` 会自动检查片源剩余时长是否够用。

## 画幅安全区

- **横屏 `1920×1080`（`landscape`）**：主视觉居中在 `y: 76–868`，高对比度深色描边字幕胶囊位于 `y = 928`，在明亮虹彩底与暗场黑底上均清晰可读。
- **竖屏主标准 `1080×1440`（`3:4`）**：主视觉重心 `centerY = 626`，预览窗 `964×1096`（`y: 82–1178`），对话卡宽 `968px`（`y: 90–1210`），字幕位于 `y = 1296` 独立安全区，饱满紧凑、零遮挡零切边。
- **旧版竖屏兼容 `1080×1920`（`portrait`）**：主视觉居中在 `y: 180–1390`，字幕位于 `y = 1470`。

## 校验与导出

- 校验函数：`validatePrismTalk(ep)`（检查镜头连续性、弹性时长、双行字数预算、素材存在/时长、禁忌平台词与外链）。
- 样片目录：`template/public/episodes/prism-talk-demo/`（30 秒真实配音 + 静态截图 + 零素材内置卡片，零 `.mp4` 依赖）。
- 单元测试：`cd template && npx tsx --test tests/prism-talk.test.ts`
- 横屏导出：`npm run export -- PrismTalk --props='{"episode":"prism-talk-demo","format":"landscape"}'`
- 竖屏主标准导出（`3:4`）：`npm run export -- PrismTalk3x4 --props='{"episode":"prism-talk-demo","format":"3:4"}'`
