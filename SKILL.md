---
name: neil-video
description: 把确认好的口播配音做成 16:9 横屏（1920×1080）或 3:4 竖屏（1080×1440，主推荐标准；兼顾 9:16 旧版兼容）讲解视频，内置 5 套模块化口播风格（简约工作台 Hybrid/Story、蓝光口播 BlueTalk、虹彩对话 PrismTalk、纸感排印 PaperTalk、纯白镜头 CleanTalk）。时间轴完全由真实配音驱动，UI 与卡片遵循三脚架稳定铁律（零晃动、零微爬、单向无回弹重点放大），支持任意时长、音乐自动循环压低、零 .mp4 视频素材直接出片与 -14.5 LUFS 成片响度交付。本仓库不内置商业 TTS 或真人原片语义剪辑接口。
---

# neil-video（五风格口播视频技能包）

> 原 `talk-workbench` v2.0 升级更名版。一期视频 = `template/public/episodes/<期名>/episode.json`。所有风格均按**真实配音时间轴**驱动镜头起止与画面动作，标准输出 **16:9 横屏（`1920×1080`）** 与 **3:4 竖屏（`1080×1440`，默认推荐竖屏规范）**，同时保留 `9:16`（`1080×1920`）旧版竖屏兼容。

## 1. 五套配音驱动风格选型

先根据内容气质、是否有录屏/截图素材以及目标发布画幅选择一套风格，再阅读对应的参考文档：

| 风格 | `style` 字段 | 横屏 `16:9` / 竖屏 `3:4` 主入口（兼容入口） | 帧率 | 适用场景与视觉特征 | 样片目录与字段规范 |
| --- | --- | --- | --- | --- | --- |
| **风格 1：简约工作台** | 省略（默认） | `HybridLandscape` / `Hybrid3x4`<br>`StoryLandscape` / `Story3x4`<br>（兼容：`HybridPortrait` · `StoryPortrait` · `Episode`） | 30fps | 概念碎片场景 + 示意工作台 + 连续叙事变形，适合步骤拆解与工作流讲解 | `hybrid-demo` · `story-demo`<br>[横竖屏与混合节奏](references/hybrid.md) · [连续叙事](references/story-flow.md) · [模板字段](references/templates.md) |
| **风格 2：蓝光口播** | `"blue"` | `BlueTalk` / `BlueTalk3x4`<br>（兼容：`BlueTalkPortrait`） | 60fps | 深海蓝光底场、斜切展廊、特写定格与参数面板，适合工具合集、模板展示与功能盘点 | `blue-talk-demo` · `blue-talk-short`<br>[蓝光口播规则](references/blue-talk.md) |
| **风格 3：虹彩对话** | `"prism"` | `PrismTalk` / `PrismTalk3x4`<br>（兼容：`PrismTalkPortrait` · `PrismTalk5x8`） | 60fps | 虹彩流体底场、暗场四角留光、顶边锁死景深问答气泡与桌面预览窗，适合痛点问答与前后对比 | `prism-talk-demo`<br>[虹彩对话规则](references/prism-talk.md) |
| **风格 4：纸感排印** | `"paper"` | `PaperTalk` / `PaperTalk3x4`<br>（兼容：`PaperTalkPortrait`） | 60fps | 浅灰纸底 + 流动 ASCII 点阵、光标跟随打字与 6 种词形变形、定格字墙与像素擦除黑底海报，纯文字即可撑满张力（跨平台内置字体） | `paper-talk-demo`<br>[纸感排印规则](references/paper-talk.md) |
| **风格 5：纯白镜头** | `"clean"` | `CleanTalk` / `CleanTalk3x4`<br>（兼容：`CleanTalkPortrait` · `CleanTalk5x8`） | 60fps | 纯白留白界面、手形光标拖拽/点击、弹窗前后润色、看板拾取与干脆单向推近定格，适合清爽产品与方法论演示 | `clean-talk-demo`<br>[纯白镜头规则](references/clean-talk.md) |

> 另附独立实验沙盒 `ExpLab` / `ExpLab3x4`（`style: "exp-lab"`，5 套 UI 皮肤 × 7 套几何信息骨架正交组合），详见 [exp-adu-archetypes.md](references/exp-adu-archetypes.md)。查看固定配乐宣传短片或历史归档风格见 [视频规则](视频规则.md)。

## 2. 画幅规范（横屏 `16:9` + 竖屏 `3:4` 主标准）

- **横屏 `1920×1080`（`format: "landscape"`，16:9）**：适合桌面宽屏观看、课程与长横屏频道；使用 `BlueTalk`、`PrismTalk`、`PaperTalk`、`CleanTalk`、`HybridLandscape`、`StoryLandscape`。
- **竖屏主标准 `1080×1440`（`format: "3:4"`，3:4）**：**所有竖屏口播的默认推荐规范**，使用对应的 `*3x4` 入口（`BlueTalk3x4`、`PrismTalk3x4`、`PaperTalk3x4`、`CleanTalk3x4`、`Hybrid3x4`、`Story3x4`）。`3:4` 画幅信息密度饱满、避免瘦长 `9:16` 上下空洞留白，主体视觉稳居安全区（`[48..1032]×[60..1230]`），高对比度字幕固定在底部 `y ≈ 1292` 独立区域，零遮挡、零裁切。
- **旧版竖屏兼容 `1080×1920`（`format: "portrait"`，9:16）**：仅在特定全屏竖滑渠道明确要求 `9:16` 时选用对应的 `*Portrait` 入口。
- 同一份 `episode.json` 可无缝导出 `landscape`、`3:4` 与 `portrait`：`scripts/check-episodes.ts` 会自动执行多画幅完整校验。

## 3. 统一动效铁律（三脚架稳定原则）

横屏（`16:9`）与竖屏（`3:4` / `9:16`）全系模板严格遵守同一套稳定审美准则：

1. **UI / 卡片 / 窗口 / 底板三脚架锁死**：所有信息容器在完成短促入场（单调缓出曲线 `cubic-bezier(0.22, 1, 0.36, 1)`，约 `0.28–0.40s`）后立即 100% 静止锁死在整数或固定坐标上；打字换行、列表逐项显现、内嵌媒体展开时，气泡/窗口顶边与外框纹丝不动。
2. **严禁一切无意义晃动与微漂**：禁止 `Math.sin / Math.cos` 周期上下浮动或绕轨摇摆、禁止欠阻尼弹簧过冲回晃、禁止 `1 + u * k` 持续线性微爬缩放（避免 1px 边框与网格闪烁）、禁止对角线慢漂与多航点来回点头、禁止推近后又反向拉回的倒走镜头。
3. **重点强调只做单向无回弹定点放大 + 静止驻留**：仅在口播讲到核心结论、弹窗揭晓或关键要点时，执行一次干脆、单向、无过冲的定点推近（约 `1.04x–1.18x`），到位后稳稳停住直至切镜，让观众把字读清。

## 4. 从一条配音快速起片

所有脚本与渲染命令均在 `template/` 目录下运行：

```bash
cd template
npm install && npm run setup
python3 -m pip install -r requirements.txt

# 生成带真实时间轴与零素材起始镜头的 episode.json（竖屏默认推荐 --format 3:4）
python3 scripts/from_audio.py <配音文件> <期名> \
  --style clean \
  --format 3:4 \
  --brand "你的频道名" \
  --title "本期标题"
```

- `--style` 可选 `default`（风格 1）、`blue`、`prism`、`paper`、`clean`。
- `--format` 可选 `landscape`（`1920×1080` 横屏）、`3:4`（`1080×1440` 竖屏主推荐标准）、`portrait`（`1080×1920` 旧版 9:16 兼容）。
- `--brand` 设置你自己的频道或产品名（未填时回退到 `--title` 或 `"我的频道"`，**不会**自动填入作者私人的 `"口播工作台"`、`"尼尔"` 或 `"莱恩"`）。
- 转写后端按顺序自动尝试 `faster-whisper` → `mlx-whisper` → `openai-whisper`；已有字幕 JSON 时也可传 `--captions-json <路径>` 跳过转写。无标点中文转写已内置短停顿与语助词断句优化，生成后仍建议通读 `captions` 修正同音错字。
- 若使用真人实拍原片且需语义删词或剪气口，请先在外部剪辑流程导出定稿音频，再用 `from_audio.py` 生成时间轴。

## 5. 零 `.mp4` 素材直接出片（`card` / `image` / `video`）

使用者**不需要**预先录制 60fps `.mp4` 屏幕视频也能完整出片：

1. **零外部素材内置 UI 卡（`kind: "card"`）**：在 `BlueTalk`、`PrismTalk`、`CleanTalk` 的 `clips`（或 `PrismTalk` 的内联 `media`）中直接写 `{ "kind": "card", "label": "模块名", "title": "卡片标题", "badge": "STEP 01", "lines": ["要点一", "要点二"] }`，模板会自动渲染符合该风格质感的毛玻璃/纯白卡片。`from_audio.py` 生成的起始配置默认即采用此模式。
2. **静态截图或插画（`kind: "image"`）**：把 `.png / .jpg / .webp` 放入本期目录，配置 `{ "kind": "image", "src": "hero.png", "label": "界面说明", "fit": "contain" }`（`CleanTalk` 手机预览框对静态图片已默认 `contain` 防止横图左右裁切）。
3. **真实录屏片段（`kind: "video"`）**：有实机录屏时在 `sources` 登记 `{ "src": "demo.mp4", "length": 18.5 }` 并在 `clips` 指定起点 `at`，校验器会自动检查片源剩余时长是否覆盖镜头加转场重叠。
4. **纯排印表达（`PaperTalk`）**：全片由动态字效、词形变形、字墙与海报构成，天然无需任何图片或视频文件。

## 6. 音效、校验、渲染与 `-14.5 LUFS` 交付

模块化口播版（风格 2～5）标准出片流水线：

```bash
cd template

# 1. 按镜头切点与各风格动作时间（at / dropAt / openAt / 重点词变形点）生成轻音效轨
python3 scripts/talk-sfx.py <期名>

# 2. 运行单元测试 + TypeScript 类型检查 + 全期多画幅配置校验
npm run verify

# 3. 导出视频（竖屏主标准用 *3x4，横屏用无后缀入口；保存到 template/exports/）
npm run export -- CleanTalk3x4 --props='{"episode":"<期名>","format":"3:4"}'

# 4. 响度标准化到 -14.5 LUFS（允许范围 -15 ~ -14 LUFS，真峰值 <= -1 dBTP，视频流无损复制）
python3 scripts/talk-finish.py exports/<刚导出的文件名>.mp4 exports/<期名>-final.mp4

# 5. 完整解码检查（无报错输出即通过）
ffmpeg -v error -i exports/<期名>-final.mp4 -f null -
```

风格 1（简约工作台 `Hybrid*` / `Story*` / `Episode`）制作要点：
- **讲“是什么、为什么”用 `scene`，讲“怎么做”用 `app.*` 工作台**，关键词变工作台再收束结果用 `story.flow`。
- 字幕已念出的整句不在画面重复打成同文大字，大字只留 2–4 字核心词；每 2–3 秒保持可见信息推进，且严禁靠慢推或微颤填时长。
- 可配合 `python3 scripts/lint_episode.py <期名>`、`scripts/motion_audit.py` 与 `scripts/seam_sheet.py` 检查接缝与静止段（详见 [workflow.md](references/workflow.md) 与 [checklist.md](references/checklist.md)）。

## 7. 品牌隔离与内容合规红线

- **品牌与角色隔离**：公开复用时不硬编码原项目名称或作者角色头像；`brand`、`user`、`handle`、`app.title` 均由当期 `episode.json` 指定。
- **平台名与外链拦截**：四套 `*Talk` 校验器均自动拦截文案、品牌与卡片中的平台引流词及外链（`github / gitee / 抖音 / 小红书 / douyin / bilibili / B站 / http(s):`），保持成片干净通用。
- **真实性与字号底线**：自制示意卡片标明示意用途，不伪造实测数据；真实页面引用使用真实截图并原文摘录；背景音乐在人声段落自动压低（`musicGainAt`），绝不盖过口播人声。

## 按需阅读参考文档

- **五套口播风格细则**：[蓝光 BlueTalk](references/blue-talk.md) · [虹彩对话 PrismTalk](references/prism-talk.md) · [纸感排印 PaperTalk](references/paper-talk.md) · [纯白镜头 CleanTalk](references/clean-talk.md) · [横竖屏与展示预设 Hybrid](references/hybrid.md) · [连续叙事 StoryFlow](references/story-flow.md)
- **实验信息骨架**：[五套 UI 融合 adu 结构实验](references/exp-adu-archetypes.md)
- **风格 1 深度参考**：[完整制作流程](references/workflow.md) · [方案 D 编排](references/scheme-d.md) · [简约视觉规范](references/style.md) · [光标与动效铁律](references/motion.md) · [页面模板字段](references/templates.md) · [交付验收清单](references/checklist.md)
- **工程与状态说明**：[我的视频规则](视频规则.md) · [本地编辑说明](本地编辑说明.md) · [本地状态记录](LOCAL_STATUS.md) · [固定配乐短片换文案步骤](references/出片步骤.md)
