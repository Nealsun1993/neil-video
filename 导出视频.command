#!/bin/zsh
set -e
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "${0:A:h}/template"
print "配音驱动 · 五套模块化风格（16:9 横屏 + 3:4 竖屏主标准）"
print " 1. 蓝光口播横屏 (BlueTalk)          2. 蓝光口播 3:4 竖屏 (BlueTalk3x4)"
print " 3. 虹彩对话横屏 (PrismTalk)         4. 虹彩对话 3:4 竖屏 (PrismTalk3x4)"
print " 5. 纸感排印横屏 (PaperTalk)         6. 纸感排印 3:4 竖屏 (PaperTalk3x4)"
print " 7. 纯白镜头横屏 (CleanTalk)         8. 纯白镜头 3:4 竖屏 (CleanTalk3x4)"
print " 9. 简约工作台横屏 (HybridLandscape)  10. 简约工作台 3:4 竖屏 (Hybrid3x4)"
print "11. 连续叙事横屏 (StoryLandscape)    12. 连续叙事 3:4 竖屏 (Story3x4)"
print "9:16 兼容竖屏入口"
print "13. 蓝光 9:16 (BlueTalkPortrait)     14. 虹彩 9:16 (PrismTalkPortrait)"
print "15. 纸感 9:16 (PaperTalkPortrait)    16. 纯白 9:16 (CleanTalkPortrait)"
print "17. 工作台 9:16 (HybridPortrait)     18. 连续叙事 9:16 (StoryPortrait)"
print "固定配乐 · 历史试片"
print "19. 纯白工作流横屏  20. 纯白工作流竖屏  21. 纯白校对短试片"
read "choice?请选择 1–21："
case "$choice" in
  1) composition=BlueTalk;;
  2) composition=BlueTalk3x4;;
  3) composition=PrismTalk;;
  4) composition=PrismTalk3x4;;
  5) composition=PaperTalk;;
  6) composition=PaperTalk3x4;;
  7) composition=CleanTalk;;
  8) composition=CleanTalk3x4;;
  9) composition=HybridLandscape;;
  10) composition=Hybrid3x4;;
  11) composition=StoryLandscape;;
  12) composition=Story3x4;;
  13) composition=BlueTalkPortrait;;
  14) composition=PrismTalkPortrait;;
  15) composition=PaperTalkPortrait;;
  16) composition=CleanTalkPortrait;;
  17) composition=HybridPortrait;;
  18) composition=StoryPortrait;;
  19) composition=CleanUiWorkflow;;
  20) composition=CleanUiWorkflowPortrait;;
  21) composition=CleanUiDemo;;
  *) print "未选择有效片名。"; exit 1;;
esac
node scripts/local-workbench.cjs render "$composition"
read "?导出完成。按回车退出"
