#!/usr/bin/env node
const {existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync}=require('node:fs');
const {resolve,join}=require('node:path');
const {homedir}=require('node:os');
const root=resolve(__dirname,'../..'),dir=join(process.env.CODEX_HOME||join(homedir(),'.codex'),'skills','neil-video'),target=join(dir,'SKILL.md');
if(!existsSync(join(root,'SKILL.md')))throw Error('工程技能说明不存在');
const body=`---\nname: neil-video\ndescription: 本地口播视频技能包（原 talk-workbench）：把确认好的配音做成 16:9 横屏（1920×1080）或 3:4 竖屏（1080×1440，主推荐标准；兼顾 9:16 兼容）口播讲解视频，内置 5 套模块化风格（简约工作台 Hybrid/Story、蓝光口播 BlueTalk、虹彩对话 PrismTalk、纸感排印 PaperTalk、纯白镜头 CleanTalk），支持零 .mp4 卡片/截图出片与 -14.5 LUFS 响度交付。\n---\n\n# neil-video 本地入口\n\n<!-- neil-video-local-router -->\n\n工程根目录：${root}\n\n先读取 [工程 SKILL.md](<${join(root,'SKILL.md')}>)，再按所选风格读取 视频规则.md 与 references/{blue-talk,prism-talk,paper-talk,clean-talk,hybrid,story-flow}.md（查看历史归档风格时读取 references/pixel-world-portrait.md 等归档文档）。以本工程内文件为权威，不从远程重新安装旧版。\n\n在本工程内修改和执行；默认使用当期配置的品牌名与配音时间轴，不混入作者私人品牌或角色。用本地的 npm run verify 检查横竖双画幅配置与测试，新片通过逐片验收后另存。\n\n这是路径入口，规则和源码只维护在工程中。工程移动后，从新目录运行 template/scripts/install-local-skill.cjs 更新入口。\n`;
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({root,target},null,2));process.exit(0);}
mkdirSync(dir,{recursive:true});
if(existsSync(target)&&readFileSync(target,'utf8')!==body){const backup=join(dir,`SKILL.backup-${Date.now()}.md`);copyFileSync(target,backup);console.log('原入口已备份：'+backup);}
writeFileSync(target,body);console.log('本地技能入口已安装：'+target+'\n下次对话可用。');
