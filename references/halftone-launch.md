# 半调 × ASCII · 早期网点底场记录

当前归属：2026-11-02已合并到“半调 × ASCII”。统一规则见 [统一风格规则](halftone-ascii-fusion.md)，本文保留纯网点阶段的技术与历史记录。

状态：新风格效果样片，等待用户确认。设计依据：已安装 `bs-hyperframes-halftone-canvas-launch` v1.0.0 的单画布、背景提前0.1秒、八拍结构；实现独立编写并适配现有React/Remotion工程。

## 风格

一张程序化网点画布贯穿24秒，冷青绿两层点距22/34px，暖纸色文字，少量琥珀色。背景只改变整体位移、缩放及暖色/暗色叠层透明度，底图持续存在，不重新创建、不切换，不用背景位置或尺寸动画。

每个新节拍的画布变化从前景之前0.1秒开始；画布移动量大于前景，或以明显缩放建立方向。前景不在边界前抢先退出。只有请求叠加段有有限6–8次紧扰动，其余段落保持克制。结尾恢复开场密度与色温，仍缓慢运动。

## 内容与证据

- 五个内容槽：开场“让画面，听你的。”、对象“画面”、问题“总差一点。”、真实请求、重新定义“从描述效果，到确定画面。”。
- 六条请求来自本次用户对话，不是编造的客户反馈；原文与来源说明在配置中。
- 产品证明使用同一工程的真实Composition入口 PaperStoryPortrait / PaperStoryLandscape，及两条实际成片21.5秒的画面。表现一次完整选择变化及结果；不是通用UI假稿，也不宣称全部旧模板能够自动换画幅。
- 音乐与轻微输入/交接音由本地代码原创制作，120 BPM，无旁白、无付费生成调用。

## 编辑与检查

Studio：`HalftoneLaunch`（24秒横屏）；`HalftoneCanvasStudy`（30秒纯画布观察片）。

配置：`template/public/episodes/halftone-launch/launch.json`；时间与场状态：`halftone.ts`；图形：`HalftoneLaunch.tsx`。静态SVG与真实证明帧在 `public/halftone/`，来源记录在sources.json。密度与温度状态由时间纯函数决定，可倒放、随机跳帧。

`检查记录/半调画布/STORYBOARD.md` 和 ledger.json 保存八拍与画布列。校验：`npm run verify`；关键帧：`npx tsx scripts/check-halftone.ts`；导出：`npm run export -- HalftoneLaunch`。检查切点前后连续帧，确认画布先动；实际片核对1920×1080、30fps、720帧、24秒、完整解码与声音。

本工程没有运行HyperFrames CLI；检查结果来自当前Remotion工程、几何与时间测试、真实MP4。30秒画布观察片和逐秒抽帧用于复核，完整主观观看与新风格接受仍待用户确认。

程序化SVG预先完整绘入6144×2048的固定Canvas缓存，素材解码与绘制完成后才允许出帧；全片只变换这个画布，避免大矢量图随缩放重绘时偶发缺图。`scripts/check-halftone-field.py` 对纯画布视频每秒两次检查空白带，只用于本设计的覆盖回归，不作为通用流畅度评分。当前排版与声音节奏支持六条真实请求，数量修改需同步扩展编排。

画布回归可使用 `python scripts/check-halftone-field.py out/20261027-HalftoneCanvasStudy-v3.mp4 --all-frames` 对900帧全部检查；需要numpy和FFmpeg。该检查专门捕捉底场均匀空白带，不能替代对节奏与主观观感的观看。

素材重建脚本已改为相对工程定位，现成证明帧随包附带；需重新截取时运行 `node scripts/build-halftone.cjs --refresh-proof`，从工程 `成片/` 内的剪纸视频取21.5秒画面。换机器后不依赖原电脑的输出路径。

## 动态网点对照版（2026-10-30）

`HalftoneLaunchDynamic` 为24秒成片，`HalftoneCanvasDynamic` 为30秒纯背景观察。旧版 `HalftoneLaunch` 保留。

按用户要求增加网点自身的波动：原底场以42%不透明度承托，叠加30px点距的连续波场，点半径约1.6–8.3px、横摆10px、纵向起伏12px；青绿与青蓝交织、亮度随波纹移动。所有状态由绝对视频时间求值，不随场景重新起算。证明段仍沿用原暗色叠层，保持文字与实际画面清楚。

这是在原技能“整场变换”的基础上新增逐帧Canvas点阵形变；不是原技能仅用transform的原样实现。未调用生成模型。音乐、前景排版和八拍时间与原样片一致。新动态风格仍待用户观看确认。
