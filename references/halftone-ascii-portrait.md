# 半调 × ASCII · 竖屏规则

状态：2026-10-30竖屏效果样片，待用户观看确认。入口 `HalftoneAsciiPortrait`，1080×1920、30fps、24秒/720帧。横屏入口 `HalftoneAsciiFusion` 保留，内容和原音乐共用。

## 构图与运动

这是独立竖屏前景，不把横屏缩成一条，也不裁掉横屏两侧内容。

- 八拍时间仍为0、2.6、5、7、9.6、13、17.5、20.1、24秒。音乐与原请求时间保持一致。
- 背景将1920×1080连续波场旋转90度，完整铺成1080×1920；几何字符旋转仍保留圆、方框和交叉单元。背景提前0.1秒变化的方向随之转为纵向，前景主要向上进入。
- 页眉位于x96/y140，分成两行；页脚编号距底160。它们是当前样片排版，不冒充平台统一安全区。
- 开场使用x96、y655、104px两行主句；问题句保持同一左侧基线。
- “画面”改成上下两个字，在600×1100字符画布内以400px真实中文字形采样；居中放置x240/y350。字体就绪后才允许渲染，点阵和字符变化按绝对时间求值。
- 输入请求在x96/y705、78px排成两行；六条真实请求在纵向180px层距上接力，48px字号、长句按语义断行，两行请求不相交。用当前JSON内容排版，不另造反馈。
- 证明段：标题与真实Composition名称在上方；竖屏实际画面430×764居中，切换后变为880×495横屏画面，二者保持比例并交叉淡化。证明文字在y1480，不挤进小字侧栏。
- 重新定义使用96px三行；品牌104px，标志与URL上下展开，URL按真实路径分两行。
- 追踪框按每拍的新竖屏边界重算，标记为实际坐标；虚线连接至右下观察点。局部故障窗口沿用横屏账本，只重排位置；不做整屏反转。

## 编辑与复核

- 主配置：`template/public/episodes/halftone-launch/launch.json`。
- 竖屏前景、证明和追踪框：`template/src/templates/HalftoneAsciiPortrait.tsx`。
- 共用字符与故障窗口：`template/src/kit/AsciiFusion.tsx`。
- 共用波场：`template/src/templates/HalftoneLaunch.tsx`，原横屏默认参数保留。
- 预览：Studio选择 `HalftoneAsciiPortrait`。
- 导出：双击“导出视频.command”选择15，或在template运行 `npm run export -- HalftoneAsciiPortrait`。
- 关键帧：`npx tsx scripts/check-halftone-ascii-portrait.ts`。

当前文案与六条请求经过样片构图检查。修改文案、字体、数量后需重新核对断行与边界；不宣称任意长文案自动适配。发布前仍需按具体平台实看遮挡与小字。技术检查不能代替完整主观观看和试听。

完整设计来源和改编边界见 `halftone-ascii-fusion.md`。仍是现有React/Remotion工程，不宣称运行HyperFrames或ASCII技能独立渲染器。
