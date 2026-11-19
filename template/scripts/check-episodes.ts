import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {prepareEpisode} from '../src/kit/timing';
import {validateLaunch} from '../src/kit/halftone';
import {validatePaper} from '../src/kit/paperDesign';
import {validatePromo} from '../src/kit/pixelPromo';
import {validateOg} from '../src/templates/OgCollage';
import {validateTalk} from '../src/kit/talk';
import {validatePrismTalk} from '../src/kit/prismTalk';
import {validatePaperTalk} from '../src/kit/paperTalk';
import {validateCleanTalk} from '../src/kit/cleanTalk';
import {validateExpLab} from '../src/kit/expLab';

export const STYLE_VALIDATORS:Record<string,(ep:any)=>void>={
 blue:validateTalk,
 prism:validatePrismTalk,
 paper:validatePaperTalk,
 clean:validateCleanTalk,
};

export const EXP_VALIDATORS:Record<string,(ep:any)=>void>={
 'exp-lab':validateExpLab,
};

export function checkStyledEpisode(ep:any){
 const fn=STYLE_VALIDATORS[ep?.style]??EXP_VALIDATORS[ep?.style];
 if(!fn)throw Error(`未知口播风格：${ep?.style}，可选 ${[...Object.keys(STYLE_VALIDATORS),...Object.keys(EXP_VALIDATORS)].join(' / ')}`);
 const fmts=ep?.style==='prism'||ep?.style==='clean'?['landscape','3:4','portrait','5:8']:['landscape','3:4','portrait'];
 for(const format of fmts){
  fn({...structuredClone(ep),format});
 }
}

export function checkAllEpisodes(names:string[]=[]){
 const list=names.length?names:readdirSync('public/episodes').filter(n=>!n.startsWith('.')).sort();
 for(const name of list){
  const ogPath=resolve('public/episodes',name,'og.json');
  if(existsSync(ogPath)){const og=JSON.parse(readFileSync(ogPath,'utf8'));validateOg(og);for(const m of Object.values(og.materials?.slots??{})as any[]){if(m.kind==='image'&&m.src&&!existsSync(resolve('public',m.src)))throw Error(`${name}: 替换图片不存在 ${m.src}`);}console.log(`${name}: OG拼贴24秒配置通过`);continue;}
  const launchPath=resolve('public/episodes',name,'launch.json');
  if(existsSync(launchPath)){validateLaunch(JSON.parse(readFileSync(launchPath,'utf8')));console.log(`${name}: 半调24秒配置通过`);continue;}
  const paperPath=resolve('public/episodes',name,'paper.json');
  if(existsSync(paperPath)){validatePaper(JSON.parse(readFileSync(paperPath,'utf8')));console.log(`${name}: 剪纸竖屏配置通过`);continue;}
  const storyPath=resolve('public/episodes',name,'story.json');
  if(existsSync(storyPath)){validatePromo(JSON.parse(readFileSync(storyPath,'utf8')));console.log(`${name}: 60秒像素宣传片配置通过`);continue;}
  const ep=JSON.parse(readFileSync(resolve('public/episodes',name,'episode.json'),'utf8'));
  if(ep.style){checkStyledEpisode(ep);console.log(`${name}: 口播版(${ep.style}) landscape / 3:4 / portrait 配置通过`);continue;}
  const formats=name==='demo'?['3:4','portrait']:['3:4','portrait','landscape'];
  for(const format of formats)prepareEpisode(ep,format as '3:4'|'portrait'|'landscape');
  console.log(`${name}: ${formats.join(' / ')} 配置通过`);
 }
}

if(process.argv[1]?.endsWith('check-episodes.ts')){
 checkAllEpisodes(process.argv.slice(2));
}
