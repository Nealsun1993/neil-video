# 连续叙事实验：从关键词到工作流

这是现有 Remotion 组件上的一段13.5秒连续叙事模板，入口为 Studio 的 `StoryLandscape`（1920×1080 横屏）与 **`Story3x4`（1080×1440 竖屏主标准）**（同时保留 `StoryPortrait` 1080×1920 旧版兼容），共用 `public/episodes/story-demo/episode.json`。主白板容器与变形收束均采用单调无过冲曲线，到位即稳稳锁死，无弹簧回晃。

## 表达链路

- 2.3秒：出现“工具”关键词卡，对应原 demo 这句口播的句级起点。
- 3.4秒：同一矩形成为工作台启动源，窗口展开。
- 5.0 / 5.64 / 6.4秒：沿用原模块组件，依次加入文案、配音和画面。
- 8.3秒附近：原光标点击连接，模块逐项变为已连接。
- 9.52秒：先淡出内部文字；9.82秒开始把同一窗口壳收束成结果卡。
- 10.82秒后：出现结论和相同三个模块组成的工作流。

配音由原公开 demo 的前9.52秒剪出，末尾做0.12秒淡出，不重写或生成声音；取时依据为已有句级字幕和组件动作，不宣称逐词强制对齐。原26秒与34秒样片保持原样。

## 实现与配置

story.flow 是一个完整动作组，内部复用 AppStage、app.modules、Tile、Icon 和既有光标规划。关键词卡、窗口和结果卡共享几何；竖屏启动矩形先换算到舞台内部坐标。没有迁移渲染引擎，也没有复制 Adu 源码或素材。

props.cues 使用整期绝对秒数：at 为关键词入场，openAt 为开窗，boxAt 为内部文字退出，liftAt 为壳开始变形。标题使用 introLines / actionLines / resultLines，1–2行、每行最多9字。modules 是原 app.modules 的配置。

当前实验支持1–3个模块和一个统筹者，先添加完、连接完成后才能收束。退字至少0.24秒，变形1秒，留出结论进入与阅读时间。缺少这些阶段时应选择别的表达组。

顶部的“组件示意”说明它是动画组件演示，不表示真实应用后台已执行了任务。动作提示音由 scripts/synth-story-sfx.py 合成，独立 sfx 音轨，可用顶层 sfx.volume 调音量；audio:false 同时静音配音、配乐与动作音。示例没有背景音乐。

## 预览、导出与验证

```bash
npm run studio -- --no-open
npm test
npm run typecheck
python3 scripts/lint_episode.py demo hybrid-demo story-demo
npx tsx scripts/check-story.ts
npx remotion render src/index.tsx StoryLandscape out/story-landscape.mp4 --codec=h264 --crf=18
npx remotion render src/index.tsx Story3x4 out/story-3x4.mp4 --codec=h264 --crf=18
# 旧版 9:16 兼容：npx remotion render src/index.tsx StoryPortrait out/story-portrait.mp4 --codec=h264 --crf=18
```

关键帧检查覆盖卡片入场、开窗中途、连接前后、退字、空壳变形与结果。测试核对先退字再变形、结果不提前出现、横竖屏启动锚点以及动作阶段约束。最终MP4仍需检查实际连续运动、声音与手机观看效果，不能用静帧或解码通过代替观感验收。

设计研究参考：[Adu 动作设计](https://github.com/adunext/adu-motion-video/blob/main/references/motion-quality.md)、[内容适配方法](https://github.com/adunext/adu-motion-video/blob/main/references/adaptive-composition.md)。采用对象连续、文字与容器错时、语义阶段与动作对应的思路，具体实现为本项目独立编写。

## 交接点连续性修复

3.4秒的旧实现直接卸载关键词卡，切换到另一块空白底板；9.52秒又叠入新壳与第二层阴影。现已由 StoryFlow 全程持有唯一底板，并同时连续计算位置、大小、圆角与阴影；AppStage 使用 surface=false 只绘制内部内容，默认模式仍自带底板。关键词在开窗后0.22秒内渐隐。

新增真实MP4回归脚本 scripts/check-story-seams.py，核对101→102、285→286帧在固定区域的突发像素差。它能使旧片失败、修正版通过，仅用于本实验的两处交接，不是通用流畅度评分。几何与透明度边界也有独立回归测试。
