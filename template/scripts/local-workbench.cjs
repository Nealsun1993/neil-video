#!/usr/bin/env node
const {spawnSync}=require('node:child_process');
const {existsSync,mkdirSync,writeFileSync}=require('node:fs');
const {resolve,join}=require('node:path');
const {browserExecutable}=require('./browser-path.cjs');
const root=resolve(__dirname,'..');
const args=process.argv.slice(2),dry=args.includes('--dry-run'),clean=args.filter(x=>x!=='--dry-run');
const action=clean[0]||'help';
const composition=action==='render'?(clean[1]||'StoryLandscape'):'StoryLandscape';
const extra=clean.slice(action==='render'?2:1);
const choices=[
 'BlueTalk','BlueTalk3x4','BlueTalkPortrait',
 'PrismTalk','PrismTalk3x4','PrismTalkPortrait','PrismTalk5x8',
 'PaperTalk','PaperTalk3x4','PaperTalkPortrait',
 'CleanTalk','CleanTalk3x4','CleanTalkPortrait','CleanTalk5x8',
 'ExpLab','ExpLab3x4',
 'HybridLandscape','Hybrid3x4','HybridPortrait',
 'StoryLandscape','Story3x4','StoryPortrait',
 'Episode',
 'CleanUiWorkflow','CleanUiWorkflowPortrait',
 'CleanUiLive','PaperLine','CleanUiDemo',
];
function run(command,a){const r=spawnSync(command,a,{cwd:root,stdio:'inherit',shell:process.platform==='win32'&&command.endsWith('.cmd')});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
if(action==='help'||action==='--help'){
 console.log('neil-video 本地编辑包\n\n预览：npm run preview\n检查：npm run verify\n导出横屏：npm run export -- BlueTalk --props=\'{"episode":"blue-talk-demo"}\'\n导出 3:4 竖屏：npm run export -- BlueTalk3x4 --props=\'{"episode":"blue-talk-demo","format":"3:4"}\'\n可选：'+choices.join(' / ')+'\n每次导出保存到 template/exports 的新文件，不覆盖旧片。');process.exit(0);
}
if(!['preview','render','verify'].includes(action)||!choices.includes(composition)){console.error('未知操作或片名；运行 npm run workbench 查看用法。');process.exit(2);}
const stamp=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}).replace(/[: ]/g,'-')+'-'+String(Date.now()).slice(-3);
const dest=join(root,'exports',`${stamp}-${composition}.mp4`),chrome=browserExecutable();
const cli=join(root,'node_modules/@remotion/cli/remotion-cli.js');
const renderArgs=[cli,'render','src/index.tsx',composition,dest,'--codec=h264','--crf=18','--concurrency=2',...(chrome?[`--browser-executable=${chrome}`]:[]),...extra];
if(dry){console.log(JSON.stringify({action,composition,root,output:action==='render'?dest:null,browser:chrome||'Remotion managed browser',argv:action==='render'?renderArgs:[]},null,2));process.exit(0);}
if(Number(process.versions.node.split('.')[0])<20){console.error('需要 Node.js 20 或更新版本。');process.exit(1);}
const npm=process.platform==='win32'?'npm.cmd':'npm';
if(!existsSync(cli))run(npm,['ci']);
if(!existsSync(join(root,'public/fonts/misans/MiSansVF.min.css')))run(npm,['run','setup']);
if(action==='preview')run(process.execPath,[cli,'studio','src/index.tsx',...extra]);
if(action==='verify'){
 run(npm,['test']);run(npm,['run','typecheck']);run(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),'scripts/check-episodes.ts']);
 console.log('本地基础检查通过。最终影片仍需连续查看与试听。');
}
if(action==='render'){
 mkdirSync(join(root,'exports'),{recursive:true});run(process.execPath,renderArgs);
 writeFileSync(join(root,'exports','latest-render.json'),JSON.stringify({composition,output:dest,createdAt:new Date().toISOString()},null,2));
 console.log('已保存：'+dest);
}
