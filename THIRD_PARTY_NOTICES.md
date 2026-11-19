# Third-party notices

## Phosphor Icons

The icon paths embedded in `template/src/kit/icons.ts` are from Phosphor Icons.

MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## FredTalk

`template/scripts/motion_audit.py` 的检测思路和默认阈值参考了 FredTalk 的 `motion_audit.py`，按竖屏 1080×1920 画面重写。
`references/workflow.md` 与 `references/scheme-d.md` 中整期编排的若干规则（段间交接、动态自查）也来自对 FredTalk 公开文档的学习。

- 仓库：https://github.com/njrhts2kvv-star/FredTalk
- 许可：MIT License，Copyright (c) 2026 FredTalk

没有使用 FredTalk 的组件源码、字体、音效或任何媒体素材。

## huashu-motion / huashu-art-motion

`references/scheme-d.md`「节奏与镜头」一节和大字、包装的若干规则，参考了这两个仓库公开方法文档里的思路（节奏单、段落交界的对比、动镜头前三问、口播包装克制），按竖屏口播重写。砸入参数 1.55 → 0.94 → 1.0 / 0.17 秒取自 huashu-art-motion 的镜头语言说明。

- 仓库：https://github.com/alchaincyf/huashu-motion 、https://github.com/alchaincyf/huashu-art-motion
- 许可：MIT License

没有使用这两个仓库的源码、字体、配乐或任何媒体素材。

## CreatorMotion inspect-split

`scene` 的放大镜分屏（`split`）参考了 CreatorMotion 的 inspect-split 效果（两张卡、放大镜依次看过、分开露出中间的结果），按竖屏和本仓库的配色规则自行实现，没有使用其源码或素材。


## 展示结构与动效配方参考

横屏/混合节奏扩展参考 [code-video-showcase](https://github.com/Moessif/code-video-showcase)（MIT）的章节组织、拍点揭示与展示段配方；实现沿用本仓库 Remotion 组件，未引入其浏览器逐帧截图引擎。

## Adu motion video 设计研究

连续叙事实验参考 https://github.com/adunext/adu-motion-video 的对象承接、错时与完整表达组方法。实现独立编写，未复制其代码、配音或人物素材；本实验使用 talk-workbench 原 demo 配音。

## 夜色像素版设计参考与字体

视觉参考用户提供的 `bs-hyperframes-pixel-promo-1.0.0.zip`。Remotion模板、Canvas绘图与像素图标独立实现，未复制参考包的引擎代码或其它媒体素材。

使用包内 OFL 字体 Departure Mono 与 Fusion Pixel。字体及其原始许可保留在 `template/public/pixel-fonts/`，包括 DepartureMono、FusionPixel、ArkPixel、Cubic11、Galmuri 许可文件。字体许可分别适用。

## Skillry Paper Cutout Story Video

剪纸样片使用用户通过官方Skillry CLI安装的 `bs-paper-cutout-story-video` v1.0.0。`template/public/paper-cutout/` 中的16件纸片及其材质由该本地技能的 props.js / papercut.js 生成，素材来源记录在 SOURCE.txt 与 manifest.json；适用原来源条款，不纳入本工程MIT授权。未向GitHub推送。

字体Nunito、Caveat随该技能提供，SIL OFL许可保存在同目录OFL.txt。竖屏React构图、分镜和本地原创配乐为本次新增实现；未调用FAL或ElevenLabs生成服务。

## Skillry Halftone Canvas Launch

半调样片设计依据用户已安装的 bs-hyperframes-halftone-canvas-launch v1.0.0 的单画布、提前0.1秒和八拍方法。网点SVG、React实现、原创配乐独立编写；证明帧来自用户工程既有成片，没有复制参考品牌、标记或外部界面。

## ASCII融合设计参考

本地 `bs-ascii-glitch-launch-video` v1.0.1 提供字符单元、追踪框、局部故障与扫描线设计参考；融合组件独立实现，无第三方眼睛照片、示例帖子或客户素材。原技能的原有条款仍适用于技能备份；不重新授权为工程MIT。

## OG拼贴设计参考

本地安装的 bs-linktree-style-og v1.0.2 提供大字、人物剪影和拼贴的视觉语法参考。样张由内置图像工具按原创品牌构图生成，无源品牌标识或人物复刻。原技能备份仍保留其原条款，不重新授权为工程MIT。

OG动效样片的矢量人物、叶片、卡片与器乐由本工程独立编写。原生成封面仍另存作风格参考，不使用源品牌标志或第三方人物。

## OG背景配方补充

本地官方安装 bs-spotify-style-og、bs-nike-style-og、bs-slack-style-og、bs-wise-style-og，均v1.0.2，提供背景语法参考；原条款继续适用于技能备份。新版只提取构图与视觉关系，使用本工程标记、原创生成的匿名人物、真实自有作品帧及既有React组件，无源品牌素材或背书。
