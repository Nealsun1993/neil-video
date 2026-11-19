# 剪纸故事 · 竖屏样片

状态：2026-10-27用户确认本版通过，当前横屏成片及竖屏同源版本作为本地复用基准。来源技能：本地安装的 `bs-paper-cutout-story-video` v1.0.0。此风格以暖色纸张、柔软黏土/毛毡纸片、层叠山丘和轻柔动作叙事。

## 样片内容

45秒、1080×1920、30fps，9场：“一个想法长成片子”→灵感→文字→节奏→画面→连接→长大→留下一句话→暖色片尾。文字来自本次原创分镜，围绕用户产品的已知流程作概念表达，没有外部科普或统计主张。

保留技能自带纸片的手剪边缘、纤维质感、浮雕感和柔和阴影，另做9:16构图。原技能的默认HTML引擎固定1920×1080；本工程沿用既有React/Remotion编辑和导出方式，复用原技能的素材与材质，不改变已确认的简约版及像素版。

## 视觉与动作

- 奶油、浅薄荷、浅紫与桃色纸底；草木绿、姜黄、珊瑚色为道具主色。深蓝用于文字。
- 标题1–2行，每行最多12个汉字，通常72–86px；每场突出一个短语。纸条、书页、景物、步骤和片尾轮换布局。
- 大道具站在地面，小灯泡、音符与蝴蝶可漂浮。素材滤镜留白不计入地面锚点，避免悬空。
- 纸片弹入、从地面长出、滑入，柔和小角度摆动；动作由帧时间驱动。浅色纸条承载绿色地面上的旁注。
- 镜头和纹理保持干净；标题区留白，太阳和道具避开文字。景物层次形成纸张叠放感。
- 一条连续的原创本地器乐贯穿；80 BPM，结尾渐弱。本片无旁白、无额外音效、未调用付费生成服务。后续配乐路线依用户选择处理。

## 编辑入口

Studio：`PaperStoryPortrait`。

- 内容与时间：`template/public/episodes/paper-story/paper.json`
- React构图：`template/src/templates/PaperStory.tsx`
- 颜色、弹入与锚点：`template/src/kit/paperDesign.ts`
- 纸片素材：`template/public/paper-cutout/`；来源、字体许可随素材保留。
- 从用户本地安装技能重建素材：`node template/scripts/build-paper-assets.cjs`。该步骤需要技能仍在本地；已有素材可直接预览、导出。
- 重建音乐的进阶脚本：`template/scripts/paper-music.py`，需要numpy和FFmpeg；常规导出直接使用已保存音轨。

在template目录依次运行：

```bash
npm run verify
npx tsx scripts/check-paper.ts
npm run export -- PaperStoryPortrait
```

检查每场构图、纸片接地、纸条文字、出入场及实际MP4；当前成片应为1350帧。技术检查、用户风格确认和手机发布检查分别记录。

## 横屏效果对照

新增 `PaperStoryLandscape`，同一45秒分镜、配乐、纸片素材与时间；原生1920×1080、30fps。场景采用独立横屏构图：景物段左侧标题、右侧人物与道具；文字段左纸条右书本；插画与步骤横向展开；片尾居中，并为网址加浅纸条。

组件 `PaperStoryWide.tsx`，横屏卡片几何 `paperWide.ts`。共用纸片锚点和材质，竖屏位置保持原样。配置中的format仍为内容源默认竖屏，横屏Composition独立确定输出尺寸。

在template下运行 `npx tsx scripts/check-paper-wide.ts` 检查九场关键帧，`npm run export -- PaperStoryLandscape` 导出新文件。本版已获用户确认；发布前按目标平台检查遮挡与听感。

## 新一期与人物

横竖屏共用同一份人物配置。默认使用原创通用纸偶 `paper-cutout/guide.svg`，青绿外套、奶油色领口、简化表情和纸面纹理。灯泡、节奏、成长三场共用此人物，并沿用原场景的接地与入场动作。

复制 `public/episodes/paper-story/paper.json` 至 `public/episodes/my-paper/paper.json`，修改文案、场景和音轨后，用 `--props='{"episode":"my-paper"}'` 选择新一期。配图卡和步骤卡的内部文字目前属于固定版式内容，跨主题使用时要一起核对。

- 省略 `character` 即使用通用纸偶。
- 设为 `"character": "original"` 可恢复样片原人物。
- 需要专用人物时，填入 `"character": {"src":"episodes/my-paper/host.svg","w":112,"h":200,"pad":25}`。路径相对 `public/`，宽高是纸偶主体尺寸，`pad` 是四边等宽透明留白。人物脚底对齐主体下沿，阴影可延伸到留白。

纸偶是本工程独立素材，重建原技能素材时保留 `guide.svg`。

「成长」镜头从纸偶和嫩芽所在的地面拉远，约 3 秒稳定到全景。云层、远丘和地面分层移动，纸偶和站立道具随地面使用同一个变换，标题与纸条留在画面坐标中。横竖屏各自设定相机焦点，替换人物后可沿用。
