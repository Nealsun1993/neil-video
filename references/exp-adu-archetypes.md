# 五套 UI 皮肤 × adu 信息视觉结构实验（ExpLab）

> **实验阶段说明**：本模块为独立沙盒实验（`style: "exp-lab"`，对应 `src/kit/uiSkins.ts`、`src/kit/expLab.ts`、`src/templates/ExpLab.tsx`），**不改动任何既有正式生产模板（`BlueTalk` / `PrismTalk` / `PaperTalk` / `CleanTalk` / `Hybrid`）**，随时可对比评估后再决定是否合入主模板库。

---

## 1. 核心设计思路：视觉皮肤与信息骨架彻底解耦

在连续制作多期口播视频时，如果只复用固定的「标题卡 + 窗口卡 + 列表卡」，画面容易产生版式审美疲劳。`adunext/adu-motion-video` 的强项在于**把抽象逻辑（对比、权衡、汇聚、量化、归拢、杂志拆解）翻译成一眼看懂的几何信息结构**；而我们现有五套口播风格的强项在于**精致克制的 UI 质感与稳如三脚架的阅读体验**。

因此，本次实验将画面拆成正交的两层：

1. **皮肤层（`src/kit/uiSkins.ts` · `UI_SKINS`）**：100% 还原现有五套风格的画布底场、卡片材质、窗口顶栏、语义强调色与底部安全字幕条。既可全片统一使用同一套皮肤，也可在实验对比片中按单镜 `shot.skin` 逐镜换装。
2. **结构层（`src/kit/expLab.ts` · `EXP_SCENES`）**：提炼 7 套高信息密度、强逻辑指向的分镜原型，全部原生适配 **`3:4`（`1080×1440` 主力竖屏，安全区 `[48..1032]×[68..1230]`）** 与 **`16:9`（`1920×1080` 横屏）**，兼容 `9:16`（`1080×1920`）。

---

## 2. 五套高保真 UI 皮肤（`SkinId`）

| `SkinId` | 对应既有风格 | 画布底场（`<SkinBackdrop>`） | 卡片与框线特征 | 主强调色 / 语义色 |
| --- | --- | --- | --- | --- |
| `clean` | 风格 5 纯白口播版 | `#FFFFFF` 纯白画布 + 顶部极淡雾灰柔光 | `#FFFFFF` / `#F3F6F6` 浅灰槽、灰点胶囊顶栏、轻柔阴影 | `#0797F4` 亮蓝 / `#12A594` 青绿 |
| `blue` | 风格 2 蓝光口播版 | `#06101D -> #0E233B` 深海游走柔光底场 | 深蓝磨砂玻璃卡、细冰蓝描边、深色红黄绿顶栏 | `#4FA3F5` 电光蓝 / `#9FD3FF` 冰蓝 |
| `prism` | 风格 3 虹彩口播版 | 虹彩流体多源渐层底场（支持 `dark` 暗场径向渐晕） | 高对比 `#FFFFFF` 悬浮卡片、彩色红黄绿顶栏、虹彩渐变条 | `#1D6BF3` 宝蓝 + 虹彩胶囊渐变 |
| `paper` | 风格 4 纸感口播版 | `#E8E8E6` 暖灰纸底（`dark` 反白 `#151515`）+ 四角静态 ASCII 点阵角标 | `#F4F4F2` 纸卡、`2px solid #151515` 硬框、`6px` 硬投影 | `#5C8DF0` 墨蓝 + 红/绿/紫/黄实色名牌 |
| `minimal` | 风格 1 简约工作台 | `#F6F8FC` 纸白 + `40px` 点阵网格 + 慢速柔和蓝光 | `#FFFFFF` 大圆角柔影工作台卡、`#10243A` 深墨主字 | `#285BF0` 行动蓝 / `#FF795C` 痛点橙红 |

- **跨平台字体安全**：统一内置打包 `MiSans VF`、`JetBrains Mono`、`Workbench Pixel CN`，禁用 macOS 专有系统字体。
- **公共字幕层 `<SkinSubtitle>`**：`3:4` 固定在 `y = 1292`，`16:9` 固定在 `y = 928`，`9:16` 固定在 `y = 1470`，绝不与上方主体内容重叠。

---

## 3. 七套 `adu` 借鉴信息结构契约（`EXP_SCENES`）

| 模板 ID | 视觉信息结构 | 借鉴 `adu-motion-video` 原型 | 适用口播语义 | 核心 `props` 字段 |
| --- | --- | --- | --- | --- |
| `exp.statement` | **回声渐变叠字 + 划错改对金句** | `06-A` echo-focus / answer-to-question | 开场破题、颠覆旧认知、亮出核心主张 | `hero`, `echoLayers?`, `wrong?`, `right?`, `strikeAt?`, `revealAt?`, `sub?` |
| `exp.balance` | **矛盾天平回稳 + 三步方案** | `02-A` paper-balance | 拆解两难矛盾（如点击率 vs 完读率）并给出平衡解法 | `title`, `left`, `right`, `initialTilt?`, `levelAt?`, `steps` (2–3 项) |
| `exp.compare` | **双栏对比 + 斜线划除 + 稳压印章** | `01-D` / `TPL.compare` | 错误做法 vs 正确做法、改造前后直观对比 | `title?`, `left` (`lines`), `right` (`lines`), `strikeAt?`, `stamp?`, `stampAt?` |
| `exp.converge` | **多源输入经 SVG 导轨汇聚至枢纽 + 结果卡** | `02-B` / `04-A` rail-convergence | 多个模块/素材/技能接入同一工作流产出成稿 | `inputs` (2–3 项), `hub`, `output` (`title`, `lines?`, `media?`), `railAt?` |
| `exp.metric` | **大字平滑计数 + 多对比条 + 结论聚焦** | `TPL.number` / `06-A` metric-bars | 用关键指标、效率倍差或前后量化条支撑观点 | `value`, `fromValue?`, `prefix?`, `unit?`, `label`, `bars` (2–4 项), `conclusion?` |
| `exp.stepsMerge` | **步骤轨道逐段点亮 + 三卡归拢合为总结卡** | `05` / `01-B` / `01-E` steps-merge | 三步实操演进并在句尾收束成一张核心总结交付卡 | `steps` (2–4 项), `mergeAt?`, `summary` (`title`, `lines?`, `footer?`) |
| `exp.editorial` | **杂志不对称分栏：窄栏目录高亮 + 宽栏聚光** | `01-D` / `03-A` asymmetric-editorial | 深度拆解单个工具/章节的多维亮点与局部细节聚光 | `issue?`, `title`, `sub?`, `nav` (2–4 项), `panel` (`lines?`, `media?`, `spotlight?`) |

---

## 4. 动效取舍铁律：刻意舍弃刺激晃动，100% 坚守三脚架稳态

我们在借鉴 `adu-motion-video` 的**版式构图与图形语义**时，严格过滤掉了其中容易造成眩晕或廉价综艺感的高刺激动效，全部改写为现有五版的**三脚架稳态动效**：

| 动效环节 | 刻意舍弃的 `adu` 刺激做法（禁用） | 本实验采用的稳态做法（`expLab.ts`） |
| --- | --- | --- |
| **入场与位移动画** | `spring` 弹性过冲回弹、卡片落地上下弹跳 | 统一 `focusEase(t, start, end)`（`cubic-bezier(0.22, 1, 0.36, 1)`），严格单调无回弹，到终点即恒等于整数 `1` |
| **天平平衡动作** | 阻尼正弦摆动、落平后反复左右余震 | `balanceAngleAt(shot, t)` 单向平滑归零，`u >= levelEndU` 后严格恒等于 `0deg` 静止锁死 |
| **印章盖下与划除** | 盖章瞬间触发全屏 `shake()` 随机像素震屏 | 斜线按 `focusEase` 利落划过；印章从 `1.14 -> 1.0` 干脆稳压落位，画布与双栏纹丝不动 |
| **组件常驻期间** | `Math.sin(t)` 上下漂浮、`1 + u * 0.015` 持续线性微爬 | 所有卡片、文字、导轨、数字到位后移除动态位移与缩放，像素级完全静止 |
| **大数字与进度条** | 到数后尾数抖动或外框呼吸闪烁 | `metricValueAt(shot, t)` 到 `countEndU` 后精确锁死在目标值；对比条填满即停 |
| **SVG 汇聚导轨** | 连线完成后虚线持续高速跑马灯频闪 | `strokeDashoffset` 从 `1 -> 0` 单向连完即变为实线常亮，零频闪 |
| **重点放大推镜** | 推近看细节后在镜尾倒走拉回全景、多段摇移 | `buildPushHoldKeys` / `expPushCamera` 仅允许一次单向平滑推近并静止保持到镜尾，绝不拉回 |

---

## 5. 实验阶段配置与命令用法

### 5.1 `episode.json` 结构示例

在 `template/public/episodes/<id>/episode.json` 中设置 `"style": "exp-lab"`。可通过顶层 `"defaultSkin"` 指定全片统一皮肤，也可在任意镜头通过 `"skin"` 单独覆盖皮肤做横向对比：

```json
{
  "id": "exp-adu-mix",
  "title": "五套 UI 融合 adu 结构对比实验",
  "style": "exp-lab",
  "format": "3:4",
  "defaultSkin": "clean",
  "duration": 30,
  "brand": "文案工坊",
  "audio": "/episodes/clean-talk-demo/narration.m4a",
  "music": {
    "src": "/clean-ui-workflow/music.m4a",
    "volume": 0.24,
    "voiceVolume": 0.08
  },
  "sfx": {
    "src": "sfx.m4a",
    "volume": 0.48
  },
  "captions": [],
  "shots": [
    {
      "id": "s01",
      "template": "exp.statement",
      "skin": "prism",
      "start": 0,
      "end": 4.1,
      "props": {
        "badge": "2 SKILLS",
        "hero": "两个神级写作技能",
        "echoLayers": 3,
        "wrong": "靠感觉硬憋标题与正文",
        "right": "把选题与去味装进工作流"
      }
    }
  ]
}
```

### 5.2 校验与渲染命令（在 `template/` 目录执行）

```bash
# 1. 类型与全量单测校验（含既有 101 项测试零回归 + exp-lab 校验）
npm run verify && npx tsc --noEmit

# 2. 渲染 3:4 主力竖屏实验成片（1080x1440, 60fps）
npx remotion render src/index.tsx ExpLab3x4 out/ExpLab3x4-raw.mp4 --props='{"episode":"exp-adu-mix","format":"3:4"}'
python3 scripts/talk-finish.py out/ExpLab3x4-raw.mp4 out/ExpLab3x4.mp4

# 3. 渲染 16:9 横屏实验成片（1920x1080, 60fps）
npx remotion render src/index.tsx ExpLab out/ExpLab-raw.mp4 --props='{"episode":"exp-adu-mix","format":"landscape"}'
python3 scripts/talk-finish.py out/ExpLab-raw.mp4 out/ExpLab.mp4
```
