# neil-video（原 talk-workbench）

从 视频规则.md、README.md、SKILL.md 和 本地编辑说明.md 开始；稳定范围以 LOCAL_STATUS.md 为准。已确认的设计是展示片的左右分栏、深浅背景、两行标题，以及竖屏独立纵向布局。

- 单期修改先改 template/public/episodes/<id>/episode.json，保留已确认配音的实际时间。
- presentation=showcase 的规则见 references/hybrid.md，连续对象组见 references/story-flow.md；别把默认工作台样式覆盖到展示预设。
- 像素第二版式见 references/pixel.md，独立使用 pixel.story，不覆盖 showcase；竖屏重排先收窄、横移再归拢，保持模块不相交。
- 像素世界版 PixelWorldMinute 使用独立多场景，不套默认工作台窗口；保留54–60秒已确认片尾。原像素与基础版式另存作对照。
- 像素世界竖屏以 references/pixel-world-portrait.md 为准，入口 PixelWorldPortrait；布局独立重排，三角模块先分层后归中，保持显现卡片不相交。
- 几何与语义启动锚点共用 layout.ts / storyFlow.ts，改画幅时同步核对光标、窗口和卡片。
- 3.4秒与9.52秒的交接保持同一底板，内部内容先淡出再变形。修改 StoryFlow 或 AppStage 后重跑相关测试与实际MP4交接检查。
- 运行 template 下的 npm run verify；导出用 npm run export -- <composition>，它自动另存新文件。
- 新增构图需查连续帧，交付时注明实际观看和试听范围；本地检查通过不代表已完成手机验收。

- 日常预览主推全部 5 套配音驱动口播风格（16:9 横屏 `1920×1080` + 3:4 竖屏主标准 `1080×1440`，兼容 9:16 `1080×1920`），全系严格执行三脚架零晃动铁律（UI/卡片落定后静止锁死，无 sin 浮动、无线性微爬、无过冲回弹，重点仅做单向无回弹定点放大并稳停）。用户明确要求查看历史风格时，使用 视频规则.md 的归档入口。

不自动推送GitHub。成片是本地验收基准，编辑新版本时保留旧片。
