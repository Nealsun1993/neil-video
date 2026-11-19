# 蓝光口播版 `BlueTalk`

按口播稿出片的蓝光风格。时间轴只认配音：一句话或一个意群是一个镜头，镜头起止来自配音里这句话的时间，画面里的动作落在关键词被说出的那一秒。音乐只是铺底，换哪一首都不影响画面。

支持 **1920×1080 横屏**（默认 `BlueTalk`）与 **1080×1440（`3:4`）竖屏主标准**（`BlueTalk3x4`），并保留 `1080×1920`（`9:16`，`BlueTalkPortrait`）旧版兼容，60fps，时长等于配音加首尾留白。

## 一期由什么组成

`template/public/episodes/<期名>/episode.json`，带 `"style": "blue"`：

| 字段 | 内容 |
| --- | --- |
| `format` | 可选。`"landscape"`（默认 1920×1080）、`"3:4"`（竖屏推荐标准 1080×1440）或 `"portrait"`（1080×1920 兼容） |
| `duration` | 全片秒数 |
| `brand` | 品牌名（1–10 字），收尾镜头与内置卡片角标用 |
| `audio`、`audioOffset` | 配音文件，以及配音在片子里从第几秒开始 |
| `music` | 可选。`src` 任意一首；`volume` 是停顿和首尾的音量，`voiceVolume` 是说话时的音量。比片子短会自动循环 |
| `sfx` | 转场音效，由 `scripts/talk-sfx.py` 生成并登记 |
| `sources` | 可选。登记视频或图片片源（视频填 `{ "src": "xxx.mp4", "length": 秒数 }`）。若全部使用内置卡片或直接图片路径可省略 |
| `clips` | 卡片素材表，支持三种 `kind`：`"video"`（实机录屏片段）、`"image"`（静态截图 `<Img>`）、`"card"`（零录屏内置暗色毛玻璃 UI 卡片 `{ label, title?, lines?, badge? }`） |
| `captions` | 字幕，时间是片子里的秒数（横屏置于 `y=930`，`3:4` 竖屏置于 `y≈1292`，`9:16` 兼容置于 `y=1600`，与主体卡片互不遮挡） |
| `shots` | 镜头：`template` 选场景，`start`/`end` 是起止，`props` 是内容 |

路径以 `/` 开头表示 `public/` 根目录，否则相对本期目录。

### 零录屏卡片与截图写法（免 `.mp4` 直接出片）

没有录屏视频时，无需准备 `.mp4`，直接在 `clips` 中使用 `"kind": "card"` 或 `"kind": "image"`：

```json
"clips": {
  "topicCard": {
    "kind": "card",
    "label": "定选题",
    "title": "拉出四个受众方向",
    "badge": "STEP 01",
    "lines": ["追问真实经历与数字", "一屏出标题封面与开头"]
  },
  "pageShot": {
    "kind": "image",
    "src": "screenshot.png",
    "label": "实际页面"
  }
}
```

## 场景

| 场景 | 画面（横屏 16:9 / 竖屏 3:4 主标准自适应） | 时长 | 内容 |
| --- | --- | --- | --- |
| `blue.title` | 一到两行大字单调缓出定格，背后深海柔光流动 | 1.5 到 5 秒 | `lines` 每行最多 12 字，可选 `kicker` |
| `blue.feature` | 横屏左卡右字，竖屏上卡下字；按 `at` 干脆切换并稳稳停住 | 2 到 7 秒 | `items` 1 到 3 项，每项 `media`、两行 `lines`（每行最多 8 字）；第二项起写 `at` |
| `blue.row` | 横屏横排展开定格，竖屏纵向错落展开定格 | 2 到 7 秒 | `cards` 3 到 5 张，每张 `media`、可选 `label` 和 `at`；可选 `title` |
| `blue.wall` | 模板墙：横屏 4 列升起定格，`3:4` 竖屏 2×3 升起定格 | 2.5 到 8 秒 | `cards` 6 到 8 个片段名 |
| `blue.push` | 单卡单向无回弹推至主展示位并保持清晰稳定 | 2.5 到 8 秒 | `media` |
| `blue.prompt` | 三脚架锁死提示词框，逐字输入后点击按钮冲出 | 3.5 到 8 秒 | `text` 最多 48 字、`button`，可选 `title` |
| `blue.editor` | 静止锁死的编辑器窗口，预览按 `at` 光边擦除切换（消除 1px 表格线闪烁） | 3 到 10 秒 | `window`、`heading`、可选 `styleLabel`（默认 `"风格"`）、`styles` 2 到 4 项（`name`、`media`，第二项起写 `at`）、可选 `fields`（0 到 4 项键值） |
| `blue.outro` | 收尾大字和品牌名定格，底部蓝光托起 | 2.5 到 8 秒 | `title`；可选 `line` 加 `titleAt` |

## 三脚架稳定动效铁律

环境光场（`Field`）与镜头间 0.3 秒扫光（`Sweep` / `Wipe`）保持连贯流动；**前景 UI 窗口、卡片、提示词外框与编辑器表格在单调无回弹入场落定后 100% 静止锁死**，严禁落定后对角线慢漂、`Math.sin` 剪刀摇晃、打字过程外框上漂或 `1 + u*k` 持续微爬缩放；重点强调仅使用单向无过冲定点放大并稳稳驻留。

## 出片步骤

所有命令在 `template/` 下运行，一次只跑一条。

1. 从配音生成骨架：`python3 scripts/from_audio.py <配音文件> <期名> --style blue --format 3:4 --brand <品牌名>`（横屏用 `--format landscape`）。通读字幕，改掉同音错字。
2. 在 `episode.json` 里按需调整 `clips`（可用内置 `card`、截图 `image` 或视频 `sources`）与 `music`。
3. 给每个镜头选场景、填 `props`，动作时间点 `at` 对齐 `captions` 里说到该词的秒数。
4. 校验配置：`npx tsx scripts/check-episodes.ts <期名>`。
5. 生成音效：`python3 scripts/talk-sfx.py <期名>`。
6. 导出横屏或竖屏：
   - 横屏（`16:9`）：`npm run export -- BlueTalk --props='{"episode":"<期名>","format":"landscape"}'`
   - 竖屏主标准（`3:4`）：`npm run export -- BlueTalk3x4 --props='{"episode":"<期名>","format":"3:4"}'`
   - 旧版 9:16 兼容：`npm run export -- BlueTalkPortrait --props='{"episode":"<期名>","format":"portrait"}'`
7. 响度收尾：`python3 scripts/talk-finish.py <导出的.mp4> <交付的.mp4>`（目标 -14.5 LUFS）。
8. 解码检查：`ffmpeg -v error -i <交付的.mp4> -f null -`。

## 样片

| 期 | 画幅 | 配音 | 音乐 | 时长 |
| --- | --- | --- | --- | --- |
| `blue-talk-demo` | 16:9 / 3:4 主竖屏（兼容 9:16） | 26.5 秒演示配音 | 蓝光展廊配乐 | 30 秒 |
| `blue-talk-short` | 16:9 / 3:4 主竖屏（兼容 9:16） | 13.5 秒短稿 | 纸感排印配乐 | 15 秒 |
