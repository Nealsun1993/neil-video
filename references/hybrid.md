# 横屏与混合节奏（开发预览）

保留 talk-workbench 的 Remotion 组件与视觉语义，把展示配方变成可配置的开场、章节、结果页。所有动作仍由 Remotion 帧时间驱动，没有另建 Canvas/Playwright 渲染管线。

## 展示设计预设

顶层 `presentation: "showcase"` 启用参考宣传片的视觉组织：纯色深浅背景、两行短标题、末行强调、章节角标、品牌与底部进度线。省略或写 `"workbench"` 保留原工作台外观。渲染仍全部使用 Remotion。

镜头 `dark: true` 决定深色段落；在相邻镜头间用0.18秒切换配色。示例采用深色开场 → 浅色介绍与工作台 → 深色聚光演示 → 浅色能力总结 → 深色收尾。不要机械地每镜交替，按内容分组。

`showcase.props.titleLines` 控制两行标题，建议每行4–8个汉字；`accent: "coral"` 用于开场痛点，默认蓝色。`title` 仍填写完整标题用于内容元数据。

横屏 app / scene 可添加左栏：

```json
"editorial": {
  "label": "光标与相机 · 让重点被看见",
  "lines": ["说到哪里，", "就看哪里。"],
  "sub": "先聚光关键句，再把原文抬成卡片。",
  "tag": "FOCUS / 聚光与原文"
}
```

`editorial` 写在镜头 `props` 内。展示设计的 scene 使用独立标题区时不再重复绘制 text 碎片；toggles 的动作和时间照旧。竖屏采用纵向专用布局：顶部两行标题，中下部独立工作台视口、底部字幕；概念卡片放大成两列两行。开场可写 portraitFlow 三个短词，显示配音到画面的步骤。

## 先选内容，再选画幅

顶层 `format` 支持竖屏主标准 **`"3:4"`（`1080×1440`，默认推荐竖屏）**、横屏 **`"landscape"`（`1920×1080`）**，以及旧版竖屏兼容 `"portrait"`（`1080×1920`）。CLI 的 `--props='{"episode":"hybrid-demo","format":"3:4"}'` 可覆盖它。所有画幅统一遵守三脚架稳定铁律：窗口与卡片单调无回弹落定后静止锁死，无微爬、无过冲晃动。

当前原生横屏范围：

| 模板 | 横屏布局 | 竖屏 |
|---|---|---|
| `app.modules` | 宽窗口、紧凑行；4–6 项分两列 | 沿用原有清单 |
| `app.browser` | 左侧截图、右侧原文卡片 | 截图下方/上方抬起原文 |
| `scene` 的 `text` / `toggles` | 关键词在左、碎片在右，保留开关/荧光笔 | 沿用原位置 |
| `showcase` | 标题与展示卡片分栏，或居中章节 | 标题上方、卡片纵向展开 |

其他模板和 scene 碎片继续使用竖屏。请求尚未适配的横屏模板会明确报错；先选择支持的模板，或为新模板增加原生横屏布局后再使用。此版不把整张竖屏画布缩小塞进横屏。

长模块名称/说明需实际检查；横屏清单最多6项、showcase最多3项。旧模板的像素坐标仍代表其原画幅坐标。`scene.text` 横屏进入左侧关键词区，`toggles.y` 仍表达纵向顺序并映射到右侧内容区。

## 两种节奏共用一条时间轴

顶层 `rhythm` 默认 `{"mode":"voice"}`；单镜可覆盖为 `{"mode":"beat","bpm":120}`。

- 数字 `at: 12.8`：保留原有语义，整期绝对秒数。
- `at: {"beat": 2}`：本镜开始后第2拍；120 BPM 时等于 `shot.start + 1` 秒。只用于 beat 模式。可用 `rhythm.offset` 调整该镜拍点起始偏移。
- `at: {"word": 15, "offset": 0.05}`：输入配音 `_words[15][1]` 的真实时间，加 `audioOffset` 和可选微调。只用于 voice 模式，索引基于 `from_audio.py` 生成的 `_words`。

镜头 `start/end`、字幕和章节继续写整期绝对秒数。添加 `audioOffset` 时同步平移数字时间轴；词锚点会自动加音轨偏移。旧配置完全不需要新增字段。

`prepareEpisode()` 在入口一次性解析锚点；Page、光标、相机和承接读取同一份结果。它不按字数猜配音时间，也不会为了卡点移动人声。

## 新模板 showcase

```json
{
  "id": "opening",
  "template": "showcase",
  "start": 0,
  "end": 4,
  "rhythm": {"mode": "beat", "bpm": 120},
  "props": {
    "variant": "hero",
    "kicker": "口播工作台",
    "title": "讲解，也能有节奏",
    "sub": "先让人想看，再把事情讲清楚。",
    "revealAt": {"beat": 1},
    "items": [
      {"title": "配音驱动", "icon": "microphone", "at": {"beat": 2}},
      {"title": "原生双画幅", "icon": "devices", "at": {"beat": 3}}
    ]
  }
}
```

`variant` 可用 `hero`、`chapter`、`result`。`chapter` 只放居中短标题，不带 items；`result` 可写 `cta` 与 `ctaAt`。`dark: true` 继续由镜头控制深色背景。展示配方采用短促到位、适度缩放、逐拍卡片和重点揭示，沿用 MiSans、图标和语义色。

新段落开始时，若上一镜为 showcase，工作台可写：

```json
"launch": {"from": {"showcaseItem": 0}, "r": 30}
```

第0张展示卡片的矩形按当前画幅解析，直接长成窗口；引用不存在的卡片会报错。旧的 `launch.from: [x,y,w,h]` 仍可使用。工作台内部 `carry.anchor` 保留原逻辑。

## 声音

默认仍只播放输入配音。`audioOffset` 是配音在整期中的起点。

需要配乐时显式配置：

```json
"music": {"src":"score.mp3", "volume":0.22, "voiceVolume":0.025}
```

讲解区压低、展示区恢复；切换过渡0.2秒，首尾渐变。`audio: false` 的预览同时静音配音和音乐。响度与真峰值仍需检查实际导出的 AAC。

`hybrid-demo` 使用原公开 demo 配音，前后各加4秒展示段；原解说整体平移4秒，正文保持真实配音时间。示例配乐由 `scripts/synth-demo-score.py` 合成，仅在首尾出现。

## 查看与验证

Studio 中的 `Episode` 保留旧 demo（9:16 兼容）；`HybridLandscape`（1920×1080）、`Hybrid3x4`（1080×1440 竖屏主标准）与 `HybridPortrait`（1080×1920 旧版兼容）读取同一个 `hybrid-demo/episode.json`。

```bash
npm ci && npm run setup
npm run studio -- --no-open
npm test
npm run typecheck
python3 scripts/lint_episode.py demo hybrid-demo
npx tsx scripts/check-previews.ts
```

抽帧覆盖原示例与双画幅的开场、启动承接、模块、原文、概念场景和结果页。它们不能代替实际影片动态审查、连续试听与手机裁切检查。此版未声称其余模板已适配横屏。

重新合成示例配乐（需要本机 FFmpeg）：

```bash
python3 scripts/synth-demo-score.py
ffmpeg -y -i public/episodes/hybrid-demo/score.wav -codec:a libmp3lame -q:a 4 public/episodes/hybrid-demo/score.mp3
```

## 竖屏展示的构图与导出（`3:4` 主标准 + `9:16` 兼容）

竖屏主标准为 **`3:4`（`1080×1440`，`Hybrid3x4`）**：顶部标题区紧凑收束，中部工作台视口饱满占屏，字幕独立置于底部 `y ≈ 1292` 安全区上方，互不遮挡；重点聚焦采用单向无回弹定格，不晃动、不倒走。旧版 `9:16`（`1080×1920`，`HybridPortrait`）作为兼容保留（标题区从 y=190 开始，工作台视口 y=550–1690，字幕 y=1710）。

展示卡片的位置与启动窗口的源矩形通过同一组变换换算，使用语义 showcaseItem 引用即可，避免手填不同画幅的像素值。

用户要求导出后可分别生成：

```bash
npx remotion render src/index.tsx HybridLandscape out/landscape.mp4 --codec=h264 --crf=18
npx remotion render src/index.tsx Hybrid3x4 out/vertical-3x4.mp4 --codec=h264 --crf=18
# 旧版 9:16 兼容：npx remotion render src/index.tsx HybridPortrait out/portrait.mp4 --codec=h264 --crf=18
```

连续对象承接的独立试验见 [从关键词到工作流](story-flow.md)。它是当前单组动作样板，不代表已支持任意叙事结构。
