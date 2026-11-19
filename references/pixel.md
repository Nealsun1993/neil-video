# 夜色像素版 · 第二版式预览

保留基础展示与连续叙事设计，另加 `presentation: "pixel"` + `pixel.story`。Studio 选 `PixelLandscape` / `PixelPortrait`，示例配置在 `template/public/episodes/pixel-demo/episode.json`。

## 视觉与动作

- 夜色深蓝、橙色重点、绿色连接状态；点阵背景、硬边图标、像素字体和打字标题。
- 横屏原生480×270、竖屏270×480，画布整数放大4倍，分别输出1920×1080和1080×1920、30fps。文字单独排版，字体跟随像素设计。
- 横屏标题与舞台分栏；竖屏上方标题、下方纵排模块，再收窄、横移、归拢成结果。底板持续变形，重排时内部文字暂退。
- 波形来自真实配音响度包络；模块激活、连接与收束复用 story-demo 的实际时间，方便同一内容比较风格。

## 怎么编辑

复制 pixel-demo 配置；保留原例。改音频后重新核对 captions、modules.items[].at、orchestrator.at 和 cues，不凭字数猜时间。

新增 `pixelLines`，含 voice / modules / result 三组，每组1–2行，每行最多8个汉字宽度。该模板当前只支持1–3个模块；名称、关键词及其它连续叙事字段仍需满足 story.flow 的容量检查。

```json
"pixelLines": {
  "voice": ["先有声音，", "再有画面。"],
  "modules": ["说到哪个，", "就点亮哪个。"],
  "result": ["三个模块，", "连成工作流。"]
}
```

入口与核心实现：`PixelStory.tsx` 负责绘图和文字；`pixelDesign.ts` 负责色彩、横竖屏几何、重排状态；`PixelFonts.tsx` 等待本地字体加载。没有增加外部生成服务。

在 template 下运行：

```bash
npm run verify
npx tsx scripts/check-pixel.ts
npm run export -- PixelLandscape
npm run export -- PixelPortrait
```

抽帧与导出依次执行。`out/pixel-previews` 是关键帧检查结果；原连续叙事固定区域的接缝阈值不适用于本像素模板。

## 来源与范围

参考用户提供的 bs-hyperframes-pixel-promo-1.0.0.zip 的像素视觉语言。Canvas绘图、图标和Remotion模板独立编写，没有搬入其引擎或执行包内安装、付费配乐流程。只使用包内有OFL许可的 Departure Mono 和 Fusion Pixel 字体，完整许可保留在 public/pixel-fonts/。

这是夜色主题的第二版式预览，不代表已经支持参考包的所有主题、城市场景或任意长片。实际视频仍需连续观看、试听及手机验收。

## 一分钟横屏宣传片

Studio 选 `PixelMinute`，输出1920×1080、30fps、1800帧。分镜与文字在 `template/public/episodes/pixel-minute/story.json`；它采用独立宣传片编排，不套用单组 pixel.story 的校验。模板 `PixelPromo.tsx` 复用原13.5秒 PixelStory 作为16–29.5秒的完整演示。

全片结构：0–4秒承诺；4–8秒素材整理；8–12秒声音输入；12–16秒关键词时间轴；16–29.5秒原配音演示；29.5–34秒双画幅；34–39秒版式对照；39–44秒本地编辑；44–49秒预览与另存；49–54秒完整叙事；54–60秒片尾。

设计参考附件 scene-library、story-patterns 和 camera 文档中的 panels、split、devices、editor、endcard，以及对象承接、短标题、错时入场和多种转场思路，React/SVG 实现独立编写。以产品自身的声音、文件和模块作为场景物件，没有补造用户数或收益指标。双画幅、编辑与导出动画是效果示意，不是实际界面录屏。

音乐为本地合成的原创120BPM配乐；16–29.5秒保留原demo口播及动作音，配乐在口播区压低。完整混音 `mix.m4a` 随工程保存；重建脚本 `scripts/pixel-minute-audio.py` 需要 numpy、FFmpeg。常规预览和导出直接使用已生成音轨，不要求安装这些进阶工具。

```bash
npm run export -- PixelMinute
npx tsx scripts/check-pixel-minute.ts
```

此一分钟版本只设计了横屏，不自动声称具备一分钟竖屏构图。

## 像素世界版：独立视觉语言

用户已确认：口播工作台的固定窗口适合简约版；像素版使用独立的多场景设计，保留认可的片尾。不要把“夜色像素”理解成给所有工作台套一层像素边框。

Studio 选 `PixelWorldMinute`，60秒横屏。前54秒由 `PixelWorld.tsx` 独立绘制，54–60秒直接复用已确认的 `PixelPromo` 片尾，关闭内部音轨避免叠声。分镜在 `public/episodes/pixel-world/story.json`，复用已检查的 pixel-minute/mix.m4a。

场景：信号与波形、双窗口概念操作、声音大字、六向中心节点、配音驱动的空间图、卡片隧道、大字章节、横竖构图、像素夜行、碎片聚合、原片尾。卡片、插画和标记均独立绘制，不使用参考截图里的第三方品牌或作品。

`pixelWorld.ts` 提供纯时间驱动的卡片投影、稳定深度排序、模块时间与几何；背景由480×270 Canvas放大4倍，图形和文字由React/SVG绘制。隧道按深度投影，不依赖运行时随机数。夜景只作为一个过渡场景。

编辑分镜与文字后：`npm run verify`；检查关键帧：`npx tsx scripts/check-pixel-world.ts`；导出：`npm run export -- PixelWorldMinute`。音轨仍在16–29.5秒使用原演示口播，模块按原词时间激活；不把概念节点动画说成实际软件已执行成功。

## 像素世界竖屏规则

横屏多场景风格已获用户确认。9:16版本使用 `PixelWorldPortrait`，按 [竖屏版本规则](pixel-world-portrait.md) 独立重排；这是 [我的视频规则](../视频规则.md) 中的另一种风格。早期 PixelPortrait 是13.5秒像素工作台实验，与这套多场景竖屏版分别保留。
