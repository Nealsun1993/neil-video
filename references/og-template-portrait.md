# OG 通用素材模板 · 竖屏规则

2026-11-02新增 `OgTemplatePortrait`，1080×1920、30fps、24秒/720帧。用户确认通用素材方向后要求竖屏；保留横屏 `OgTemplateLaunch`，共用同一期JSON、通用素材库与120BPM原器乐，前景独立重排。

## 六拍布局

- 0–4秒：荧光底、左对齐双行巨字、中心几何标记，文字x96/y450，标记放在下方。
- 4–8秒：红底文字在上，波形或自备图片移到下方750×720内容区，辅助句在y1660；默认不使用人物图。
- 8–12秒：色带沿纵向穿插，三张卡片在y500/860/1220接力；卡片790×285，图标与标签左右排列，长标签按卡片空间收小。装饰叠片在底部后层，避免遮挡标签。
- 12–16秒：深紫双色场，主展示框x80/y520/820×650，补充框x590/y1090/380×580；上下错位并保留层次。标题和辅助标题在各自容器内。
- 16–20秒：曲线拼贴底，白字在中上部；几何轨道与叠片在下方两侧，继续支持可换图片。
- 20–24秒：荧光底品牌收束，几何标记在上、品牌在中、短标题在下。品牌与标题按可用宽度收小，未把横屏大字整体缩成一条。

切换沿用0.65秒方向揭示；背景先进入，文字随后出现。当前主文字左右各96px，辅助句不进入最底部；这些是本样片构图边距，不代表所有平台统一安全区。

## 素材与配置

配置仍是 `template/public/episodes/og-template/og.json`。品牌、短标题、分镜文案、三张卡片标签和六种图标无需新增一份竖屏数据。槽位 `listener` 对应红底下方，`filmmaker` 对应色带下方装饰，`landscape/portrait` 对应两个展示框，`character/decoration` 对应拼贴下方两侧。

同样使用 `waveform / frames / grid / orbit` 通用SVG。需要照片时将该槽改为image并填public内路径，默认contain保留图片比例；空槽自动回到默认组件。零张定制图片即可运行本版。位置名称是历史标识，竖屏不要求存在人物或手机图片。

## 使用

- 预览：Studio选择 `OgTemplatePortrait`。
- 导出：双击“导出视频.command”选19，或在template运行 `npm run export -- OgTemplatePortrait`。
- 新一期：`npm run export -- OgTemplatePortrait --props='{"episode":"my-og"}'`，读取对应目录og.json。
- 竖屏前景和布局：`template/src/templates/OgTemplatePortrait.tsx`。
- 组件和槽位：`template/src/kit/ogMaterials.tsx`。
- 检查：`npm run verify`；关键帧 `npx tsx scripts/check-og-template-portrait.ts`。

固定24秒六拍，文案容量与横屏共用校验；新增长文仍需查看断行，素材替换仍需核对裁切和遮挡。当前竖屏样片待用户观看确认，完整主观试听和具体发布平台实看需单独完成。通用模板配置详见 `og-template.md`。
