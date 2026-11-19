# 半调 × ASCII · 统一风格规则

状态：2026-10-30实验样片，待用户观看确认。入口 `HalftoneAsciiFusion`，24秒、1920×1080、30fps。旧 `HalftoneLaunch` 与 `HalftoneLaunchDynamic` 均保留。

## 风格归属

2026-11-02用户将原“半调画布”与“半调 × ASCII”统一为一个风格，名称为“半调 × ASCII”。网点流动、点到字符的过渡、字符大字和短促故障组成同一连续动效。正式复用入口为横屏 `HalftoneAsciiFusion` 与竖屏 `HalftoneAsciiPortrait`；旧 `HalftoneLaunch` / `HalftoneLaunchDynamic` 为同风格的历史实验，不另作独立风格。此确认针对命名与归类，不代替逐片技术及观看验收。

## 设计分工

半调负责连续波场、青绿深底、暖纸色文字、背景提前前景0.1秒和八拍叙事。ASCII负责网点到字形单元的交织、关键字点阵转字形、对象坐标追踪框、虚线连线与有限的局部故障条。

底场仍为一个贯穿全片的场，字符随波形渐入、圆点渐出；字符不是每一镜重新随机撒一遍。标题“画面”用真实中文字形蒙版采样为15px网格，再绘制圆、十字、交叉方框、中心点方框，字体加载后才允许出帧。除字形自身的变化，主文字与画幅证明沿用上一版。

局部故障窗口：4.72–4.86、9.60–9.78、10.45–10.57、11.25–11.41、12.82–12.96、20.10–20.22秒。只画局部细条、字符碎片，不做整屏黑白反转。证明段不覆盖故障条，原暗色叠层保留。它们是设计故障效果，不能把任意非设计缺图解释为故障风格。

## 源材与范围

设计参考本地 `bs-ascii-glitch-launch-video` v1.0.1（Skillry官方CLI安装）。读取其字符图集、坐标标记、虚线及扫描线实现后，独立编写React/Canvas融合组件 `template/src/kit/AsciiFusion.tsx`；未复制其示例客户、社交帖子、照片或眼睛素材。

这是用户要求的融合改编，保留现有24秒/30fps与配乐，没有照搬该技能的18.2秒/60fps固定结构、高频硬切、黑白反转或完整浏览器编辑器。工程仍为现有Remotion，未宣称运行其独立渲染器或HyperFrames CLI。

请求文本仍来自本次对话；证明画面仍为项目已完成的真实剪纸横竖屏21.5秒帧。音乐沿用本地原创，无额外付费生成调用。第三方技能原件保留原条款，备份不改变许可。

## 编辑

- 配置：`template/public/episodes/halftone-launch/launch.json`。
- 字形、跟踪框、故障窗口：`template/src/kit/AsciiFusion.tsx`。
- 波场与前景集成：`template/src/templates/HalftoneLaunch.tsx`。
- 检查：在template运行 `npm run verify`；关键帧 `npx tsx scripts/check-halftone-ascii.ts`。
- 导出：`npm run export -- HalftoneAsciiFusion`。

每次确认中文字形能读、真实证明未被遮挡、故障只出现在记录窗口、连续底场无缺图。实际成片需另做完整解码与声音检查；主观观看、试听、手机安全区不由技术检查代替。

原生竖屏版本入口 `HalftoneAsciiPortrait`，竖屏权威规则见 `halftone-ascii-portrait.md`；与横屏分开保留。

## 换一期与案例画面

横竖屏共用 `launch.json`。复制 `public/episodes/halftone-launch/launch.json` 到新期目录，例如 `public/episodes/my-launch/launch.json`，用 `--props='{"episode":"my-launch"}'` 导出。同步更换品牌、短句、六条真实请求及其来源、音轨。现有分镜沿用 24 秒、8 拍的结构。

原剪纸案例通过 `proof` 配置接入。可以替换 `portrait`、`landscape`（路径相对 `public/`），以及 `heading`、`caption`、`portraitLabel` 和 `landscapeLabel`。缺少图片时对应窗口使用通用线框。无成片可展示时，删除整个 `proof`，横竖屏均显示明确标注的「版式示意」。

请求段结束前 0.55 秒出现短扫描线，跟随案例段起点折成案例窗口边框，约 0.6 秒交给静态边框。横竖屏共用动作曲线，分别使用各自的窗口坐标。案例可继续使用实图或线框。该动作启用于半调 × ASCII，历史纯半调构图沿用原过渡。
