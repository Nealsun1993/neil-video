import {morphEase} from './motion';
import type {Format, Rect} from './layout';
import {layoutFor, stageFor, stageSourceRect} from './layout';
export type FlowCues = {at:number;openAt:number;boxAt:number;liftAt:number};
const unit=(v:number)=>Math.max(0,Math.min(1,v));
const curve=(v:number)=>{const p=unit(v);return p*p*(3-2*p);};
export const storyFlowLayout=(format:Format)=>{
 const portrait=format!=='landscape',is34=format==='3:4',full=layoutFor(format),win=full.app,st=stageFor(format);
 return {
  portrait,is34,height:full.height,
  keyword:is34?{x:280,y:690,w:520,h:168}:portrait?{x:280,y:920,w:520,h:180}:{x:730,y:560,w:460,h:160},
  window:portrait?{x:st.x+win.x*st.scale,y:st.y+win.y*st.scale,w:win.w*st.scale,h:win.h*st.scale}:win,
  result:is34?{x:80,y:780,w:920,h:296}:portrait?{x:80,y:1040,w:920,h:320}:{x:500,y:470,w:920,h:260},
 };
};
export const storyLaunchRect=(format:Format):Rect=>{
 const r=storyFlowLayout(format).keyword;
 return format!=='landscape'?stageSourceRect(r,format):r;
};
/** 内容先淡出，再变容器，最后进入结论；不把正文压扁成小字。 */
export const storyFlowState=(t:number,c:FlowCues,format:Format)=>{
 const l=storyFlowLayout(format),st=stageFor(format),p=curve((t-c.liftAt)/1);
 const opening=morphEase(unit((t-c.openAt-.05)/.65));
 const blend=(a:Rect,b:Rect,k:number):Rect=>k===0?a:k===1?b:({x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,w:a.w+(b.w-a.w)*k,h:a.h+(b.h-a.h)*k});
 const openRect=blend(l.keyword,l.window,opening);
 const winRadius=l.portrait?36*st.scale:36;
 return {rect:blend(openRect,l.result,p),
  radius:(30+(winRadius-30)*opening)*(1-p)+36*p,
  keywordOpacity:1-unit((t-c.openAt)/.22),
  appOpacity:1-unit((t-c.boxAt)/.24),
  resultOpacity:unit((t-c.liftAt-1)/.25),
  dark:curve((t-c.boxAt)/.6),
  morph:p,
 };
};
export function validateStoryFlowProps(p:any,start:number,end:number){
 const c=p?.cues,items=p?.modules?.items,o=p?.modules?.orchestrator;
 if(!c||![c.at,c.openAt,c.boxAt,c.liftAt].every(Number.isFinite)||!(start<=c.at&&c.at<c.openAt&&c.openAt<c.boxAt&&c.boxAt+.24<=c.liftAt&&c.liftAt+1.3<end))throw Error('story.flow 的关键词、开窗、退字、收束时间必须依次留出动作窗口');
 if(!Array.isArray(items)||items.length<1||items.length>3||!o)throw Error('story.flow 当前支持1–3个模块及一个统筹者');
 if(items.some((x:any)=>!Number.isFinite(x.at)||x.at<c.openAt||x.at>=o.at)||!Number.isFinite(o.at)||o.at+.75+(items.length-1)*.14>=c.boxAt)throw Error('story.flow 必须先添加模块、完成连接，再收束结论');
 for(const k of ['introLines','actionLines','resultLines'])if(!Array.isArray(p[k])||p[k].length<1||p[k].length>2||p[k].some((x:any)=>typeof x!=='string'||!x.trim()||[...x].length>9))throw Error('story.flow 标题需1–2行，每行最多9字');
}
