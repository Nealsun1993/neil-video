# OG 拼贴 · 通用素材模板

2026-11-02：用户要求减少定制贴画、降低后续换主题时的重做成本。新用户和新一期默认从 `OgTemplateLaunch` 开始，旧 `OgMixLaunch` 保留为带定制人物和作品图的演示，不自动覆盖。

## 三层职责

1. **版式与动效**：保持OG巨字、红底、色带、深紫叠层和拼贴的切换关系。素材换掉后，时间和排版仍由模板控制。
2. **通用组件**：波形、画框叠片、图形网格、几何轨道，以及文档/声音/播放/网格/完成/强调六种线条图标。它们由SVG绘制，随时间变化，可直接重复使用。
3. **内容插槽**：品牌、短标题、六拍文案、三张卡片标签与图标、辅助句、两个展示框标题、可选图片。图片替换只填路径，空槽自动回到通用组件。

默认模板使用零张定制人物、产品截图或专题插画，不会加载旧演示的照片。它仍使用工程字体和原器乐；“零定制图”不等于没有所有资源依赖。需要强化主题时再配置用户授权照片或产品图，用户不必为每期重新生图。

## 配置入口

复制 `template/public/episodes/og-template/og.json` 为新一期，改 `brand`、`headline` 和 `scenes[].lines`。当前为24秒六拍固定结构；不是任意时长长稿的自动排镜。

新一期可省略 `materials`，也可只填 `{}`，都会使用通用组件默认值。常用字段：

```json
{
  "materials": {
    "slots": {
      "listener": {"kind": "waveform"},
      "filmmaker": {"kind": "frames"},
      "landscape": {"kind": "grid"},
      "portrait": {"kind": "frames"},
      "character": {"kind": "orbit"},
      "decoration": {"kind": "frames"}
    },
    "cards": [
      {"label": "计划", "icon": "document"},
      {"label": "执行", "icon": "check"},
      {"label": "结果", "icon": "grid"}
    ],
    "caption": "你的辅助句",
    "windowLabels": ["主画面", "补充画面"]
  }
}
```

槽位名称沿用现有构图位置：listener为红底右侧，filmmaker为色带右侧，landscape/portrait为两个展示框，character/decoration为拼贴两侧。这些只是位置标识，通用模板不要求真的有人物或设备图。

组件种类：`waveform` / `frames` / `grid` / `orbit`。六个位置可独立更换。自备图片放进当前工程public目录，然后填 `{"kind":"image","src":"episodes/新一期/product.png"}`；`src` 留空时自动回到该槽默认组件。有路径却找不到文件时，配置检查会明确报错，避免导出到一半才发现。

品牌最多12字，短标题最多16字，分镜单行最多12字；主文字在支持范围内按可用宽度收小，卡片标签最多8字并独立适配。每期仍需查看断行与画面边界，不宣称任意长文自动适配。

## 预览与导出

- 默认入口 `OgTemplateLaunch`，双击导出菜单选18。
- 在template运行 `npm run export -- OgTemplateLaunch`。
- 新一期放在 `public/episodes/my-og/og.json` 后：`npm run export -- OgTemplateLaunch --props='{"episode":"my-og"}'`。
- 通用组件与槽位解析：`template/src/kit/ogMaterials.tsx`。
- 素材容器与背景：`template/src/templates/OgMix.tsx`；卡片继续复用 `OgCollage.tsx`。
- 关键帧：`npx tsx scripts/check-og-template.ts`；检查：`npm run verify`。

本次校验覆盖默认配置不依赖定制图、空图片回退、独立换图、标签容量与本地路径约束；实际模板片另做解码、帧数、声音与构图检查。原照片演示和其生成记录保留，模板版另存。已新增竖屏OgTemplatePortrait，按独立纵向排版复用同一配置与素材库，详见 [竖屏规则](og-template-portrait.md)。横屏模板方向已获用户确认；新竖屏的主观观看、试听和具体平台遮挡仍待验收。

通用模板开场先放大第一行标题，再缩回排版位置，余下各行随后入位。起始字号受各画幅的可用宽度限制，长首行的放大幅度会相应减小。横竖屏使用同一组件，各自设定字号和留白。
