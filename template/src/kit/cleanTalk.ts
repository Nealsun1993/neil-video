// 纯白口播版（CleanTalk）：配音驱动时间轴 + 三脚架稳固画框与重点定点放大，支持 16:9 / 9:16 / 5:8 / 3:4，不写死时长与文案。
import {TalkCaption,TalkClip,TalkFormat,TalkShot,TalkSource,validateTalkClip} from './talk';

export type CleanFormat=TalkFormat|'5:8'|'3:4';
export const CLEAN_ICONS=['sound','text','preview','spark','code','layers'] as const;
export type CleanIconKind=typeof CLEAN_ICONS[number];

export type CleanTalkEpisode={
 id:string;title:string;style:'clean';format?:CleanFormat;duration:number;brand:string;
 audio:string;audioOffset?:number;
 music?:{src:string;volume?:number;voiceVolume?:number};
 sfx?:{src:string;volume?:number};
 sources?:Record<string,TalkSource>;
 clips?:Record<string,TalkClip>;
 captions:TalkCaption[];
 shots:TalkShot[];
};

export function cleanFormatDims(format:CleanFormat='landscape'){
 return format==='portrait'?{w:1080,h:1920}:format==='5:8'?{w:1080,h:1728}:format==='3:4'?{w:1080,h:1440}:{w:1920,h:1080};
}

// 镜头关键帧：[镜头内秒数 u, 放大倍数 s, 焦点中心 x, 焦点中心 y]
export type CameraKey=[number,number,number,number];

export function cleanGeom(format:CleanFormat='landscape'){
 const is58=format==='5:8',is34=format==='3:4',portrait=format!=='landscape',{w,h}=cleanFormatDims(format),cx=w/2,cy=h/2;
 const win=is34?{x:68,y:84,w:944,h:1080}:is58?{x:68,y:140,w:944,h:1160}:portrait?{x:72,y:176,w:936,h:1310}:{x:240,y:74,w:1440,h:830};
 const padX=is34?40:is58?42:portrait?46:88,barH=is34?56:portrait?62:60;
 const bodyTop=win.y+(is34?162:portrait?194:186),bodyW=win.w-padX*2;
 const btn={x:win.x+win.w-padX-(portrait?86:88),y:win.y+(is34?103:portrait?125:122),w:portrait?172:176,h:is34?52:portrait?58:56};
 const modal=is34?{x:114,y:268,w:852,h:516}:is58?{x:114,y:390,w:852,h:556}:portrait?{x:126,y:548,w:828,h:572}:{x:640,y:210,w:640,h:460};
 const modalApply={x:cx,y:modal.y+modal.h-(is34?70:portrait?81:70)};
 const dropH=is34?390:portrait?460:330;
 const dropZone={x:cx,y:bodyTop+dropH/2,h:dropH};
 const dropResult={x:cx,y:bodyTop+dropH+(is34?78:portrait?86:115)};
 const editLeft=portrait?{x:cx,y:bodyTop+(is34?100:130)}:{x:win.x+padX+bodyW*.24,y:bodyTop+190};
 const editRight=portrait?{x:cx,y:bodyTop+(is34?340:440)}:{x:win.x+padX+bodyW*.76,y:bodyTop+190};
 const boardLeft=portrait?{x:cx,y:bodyTop+(is34?114:134)}:{x:win.x+padX+bodyW*.23,y:bodyTop+178};
 const boardRight=portrait?{x:cx,y:bodyTop+(is34?388:448)}:{x:win.x+padX+bodyW*.74,y:bodyTop+178};
 const boardTrack=portrait?{x:cx,y:bodyTop+(is34?620:760)}:{x:cx,y:bodyTop+440};
 const previewStage={x:cx,y:bodyTop+(is34?320:portrait?390:255)};
 const focusY=is34?660:is58?800:910;
 return {is58,is34,portrait,w,h,cx,cy,win,padX,barH,bodyTop,bodyW,btn,modal,modalApply,dropZone,dropResult,editLeft,editRight,boardLeft,boardRight,boardTrack,previewStage,focusY};
}

export function clampCameraKey(u:number,s:number,x:number,y:number,w=1920,h=1080):CameraKey{
 const sc=Math.max(1,Math.min(2.4,s));
 const minX=w/(2*sc),maxX=w-minX,minY=h/(2*sc),maxY=h-minY;
 return [u,sc,Math.max(minX,Math.min(maxX,x)),Math.max(minY,Math.min(maxY,y))];
}

// 单次「干脆推近 -> 零漂移静止驻留至镜头结束」关键帧生成（无倒走拉回）；其余镜头 100% 三脚架锁死 (s=1, cx, cy)
function plateauZoomKeys(d:number,atU:number,s:number,fx:number,fy:number,w:number,h:number):CameraKey[]{
 const cx=w/2,cy=h/2,t0=Math.max(.16,atU),avail=d-t0;
 if(s<=1.001||avail<.52)return [[0,1,cx,cy],[d,1,cx,cy]];
 const pushDur=Math.min(.42,avail*.45),t1=t0+pushDur;
 const [,sc,xc,yc]=clampCameraKey(t1,s,fx,fy,w,h);
 return [[0,1,cx,cy],[t0,1,cx,cy],[t1,sc,xc,yc],[d,sc,xc,yc]];
}

export function dropTimings(s:TalkShot){
 const d=s.end-s.start,p=s.props??{};
 const dropU=p.dropAt!=null?p.dropAt-s.start:Math.min(d*.42,Math.max(.85,d-1.2));
 const dragStartU=Math.max(.2,dropU-Math.min(1.25,dropU*.65));
 const resultU=p.resultAt!=null?p.resultAt-s.start:Math.min(d-.45,dropU+Math.max(.45,(d-dropU)*.45));
 return {d,dragStartU,dropU,resultU};
}

export function editTimings(s:TalkShot){
 const d=s.end-s.start,p=s.props??{};
 const openU=p.openAt!=null?p.openAt-s.start:Math.max(.48,Math.min(1.35,d*.24));
 const applyU=p.applyAt!=null?p.applyAt-s.start:Math.max(openU+.75,Math.min(d-.65,d*.62));
 const swapU=openU+(applyU-openU)*.52;
 return {d,openU,swapU,applyU};
}

export function boardTimings(s:TalkShot){
 const d=s.end-s.start,items:any[]=s.props?.items??[],n=Math.max(1,items.length);
 const picks=items.map((x,i)=>x.at!=null?x.at-s.start:(.4+i*((d-1.0)/n)));
 return {d,picks};
}

export function previewTimings(s:TalkShot){
 const d=s.end-s.start,p=s.props??{},mode:'both'|'phone'|'desktop'=p.mode??'both';
 const switchU=mode==='phone'?0:mode==='desktop'?d+10:(p.switchAt!=null?p.switchAt-s.start:d*.48);
 return {d,mode,switchU};
}

export function buildSceneCamera(shot:TalkShot,format:CleanFormat='landscape'):CameraKey[]{
 const g=cleanGeom(format),d=Math.max(1.5,shot.end-shot.start),p=shot.props??{};
 const locked:CameraKey[]=[[0,1,g.cx,g.cy],[d,1,g.cx,g.cy]];
 if(p.zoom===false)return locked;
 const defaultScale=g.portrait?1.10:1.22;
 const explicitAt=typeof p.zoom==='object'&&p.zoom?.at!=null?p.zoom.at-shot.start:(p.zoomAt!=null?p.zoomAt-shot.start:null);
 const explicitScale=typeof p.zoom==='object'&&p.zoom?.scale!=null?Math.min(g.portrait?1.10:1.35,p.zoom.scale):defaultScale;
 switch(shot.template){
  case 'clean.edit':{
   const {applyU}=editTimings(shot),atU=explicitAt??(applyU+.06);
   const fx=g.portrait?g.cx:g.editRight.x,fy=g.portrait?g.focusY:g.editRight.y;
   return plateauZoomKeys(d,atU,explicitScale,fx,fy,g.w,g.h);
  }
  case 'clean.drop':{
   const {resultU}=dropTimings(shot);
   if(explicitAt==null&&!p.result)return locked;
   const fx=g.portrait?g.cx:g.dropResult.x,fy=g.portrait?g.focusY:g.dropResult.y;
   return plateauZoomKeys(d,explicitAt??resultU,explicitScale,fx,fy,g.w,g.h);
  }
  case 'clean.board':{
   if(explicitAt==null)return locked;
   const fx=g.portrait?g.cx:g.boardTrack.x,fy=g.portrait?g.focusY:g.boardTrack.y;
   return plateauZoomKeys(d,explicitAt,explicitScale,fx,fy,g.w,g.h);
  }
  default:
   if(explicitAt!=null)return plateauZoomKeys(d,explicitAt,explicitScale,g.cx,g.portrait?g.focusY:g.cy,g.w,g.h);
   return locked;
 }
}

// 精确单调无回弹缓动 Easing.bezier(0.22, 1, 0.36, 1)（因 y1=y2=1，y(t)=1-(1-t)^3 严格单调无过冲）
export function focusEase(p:number){
 if(p<=0)return 0;if(p>=1)return 1;
 let lo=0,hi=1;
 for(let i=0;i<14;i++){
  const m=(lo+hi)*.5,u=1-m,x=3*u*u*m*.22+3*u*m*m*.36+m*m*m;
  if(x<p)lo=m;else hi=m;
 }
 const t=(lo+hi)*.5,u=1-t;
 return 1-u*u*u;
}

export function cameraAt(u:number,keys:CameraKey[],w=1920,h=1080){
 let s=keys[0][1],x=keys[0][2],y=keys[0][3];
 if(u>keys[0][0]){
  const z=keys.at(-1)!;
  if(u>=z[0]){s=z[1];x=z[2];y=z[3];}
  else for(let i=1;i<keys.length;i++)if(u<keys[i][0]){
   const a=keys[i-1],b=keys[i];
   if(a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3]){s=a[1];x=a[2];y=a[3];break;}
   const q=focusEase((u-a[0])/Math.max(1e-4,b[0]-a[0]));
   s=a[1]+(b[1]-a[1])*q;x=a[2]+(b[2]-a[2])*q;y=a[3]+(b[3]-a[3])*q;break;
  }
 }
 const [,sc,xc,yc]=clampCameraKey(u,s,x,y,w,h);
 return {s:sc,x:xc,y:yc};
}

type CleanSpec={min:number;max:number;check:(p:any,s:TalkShot,ep:CleanTalkEpisode)=>void};
const len=(s:unknown)=>typeof s==='string'?Array.from(s).length:0;
const text=(name:string,s:unknown,max:number,optional=false)=>{if(optional&&s==null)return;const n=len(s);if(!n||n>max)throw Error(`${name}要1到${max}个字：${s}`);};
const count=(name:string,a:unknown,min:number,max:number)=>{if(!Array.isArray(a)||a.length<min||a.length>max)throw Error(`${name}要${min}到${max}项`);};
const icon=(ic:unknown,optional=false)=>{if(optional&&ic==null)return;if(typeof ic!=='string'||!(CLEAN_ICONS as readonly string[]).includes(ic))throw Error(`未知图标：${ic}，可选 ${CLEAN_ICONS.join(' / ')}`);};
const cueAt=(s:TalkShot,at:unknown,tail=.35)=>{if(typeof at!=='number'||!Number.isFinite(at)||at<s.start||at>s.end-tail)throw Error(`at=${at} 不在这个镜头里`);};
const cues=(s:TalkShot,items:{at?:number}[],gap:number,first=true)=>{let last=s.start-gap;items.forEach((x,i)=>{if(x.at==null){if(i||!first)throw Error('缺少 at（这一项在第几秒出现）');return;}
 cueAt(s,x.at,.35);if(x.at-last<gap)throw Error(`at=${x.at} 离上一项太近，至少隔 ${gap} 秒`);last=x.at;});};
const checkZoom=(p:any,s:TalkShot)=>{
 if(p.zoomAt!=null)cueAt(s,p.zoomAt,.35);
 if(p.zoom&&typeof p.zoom==='object'&&p.zoom.at!=null)cueAt(s,p.zoom.at,.35);
};

export const CLEAN_SCENES:Record<string,CleanSpec>={
 'clean.opening':{min:1.5,max:10,check:(p,s)=>{
  text('开场标题',p.title,16,true);text('开场副标',p.kicker,24,true);
  if(p.icons!=null){count('开场图标',p.icons,1,3);p.icons.forEach((x:unknown)=>icon(x));}
  if(p.iconsAt!=null)cueAt(s,p.iconsAt,.25);checkZoom(p,s);
 }},
 'clean.chapter':{min:1.5,max:8,check:(p,s)=>{
  text('章节角标',p.badge,14,true);text('章节标题',p.title,18);text('章节副标',p.subtitle,36,true);
  if(p.items!=null){count('章节要点',p.items,1,3);cues(s,p.items,.3);for(const x of p.items){text('要点文字',x.label,14);icon(x.icon,true);}}
  checkZoom(p,s);
 }},
 'clean.drop':{min:2.5,max:12,check:(p,s)=>{
  text('窗口标题',p.window,20,true);text('栏目标题',p.heading,16,true);text('按钮文字',p.action,10,true);
  text('文件名',p.fileName,22);text('拖入提示',p.hint,22,true);text('状态提示',p.status,18,true);
  text('结果标题',p.resultLabel,12,true);text('解析结果',p.result,42,true);icon(p.icon,true);
  if(p.mode!=null&&p.mode!=='wave'&&p.mode!=='list')throw Error(`未知导入模式：${p.mode}`);
  if(p.items!=null){count('导入条目',p.items,1,4);p.items.forEach((x:string)=>text('导入条目',x,22));}
  if(p.dropAt!=null)cueAt(s,p.dropAt,.35);
  if(p.resultAt!=null){cueAt(s,p.resultAt,.3);if(p.dropAt!=null&&p.resultAt<=p.dropAt+.15)throw Error('resultAt 要晚于 dropAt');}
  checkZoom(p,s);
 }},
 'clean.edit':{min:2.5,max:12,check:(p,s)=>{
  text('窗口标题',p.window,20,true);text('栏目标题',p.heading,16,true);text('按钮文字',p.action,10,true);
  text('左栏标题',p.leftTitle,12,true);text('右栏标题',p.rightTitle,12,true);
  text('弹窗标题',p.modalTitle,14,true);text('确认按钮',p.applyLabel,10,true);
  text('前缀文字',p.prefix,18,true);text('原内容',p.before,36);text('新内容',p.after,36);
  if(p.before===p.after)throw Error('原内容和新内容不能相同');
  text('后缀文字',p.suffix,18,true);text('底部提示',p.cue,22,true);
  if(p.openAt!=null)cueAt(s,p.openAt,.35);
  if(p.applyAt!=null){cueAt(s,p.applyAt,.35);if(p.openAt!=null&&p.applyAt<=p.openAt+.35)throw Error('applyAt 要晚于 openAt');}
  checkZoom(p,s);
 }},
 'clean.board':{min:2.5,max:12,check:(p,s,ep)=>{
  text('窗口标题',p.window,20,true);text('栏目标题',p.heading,16,true);text('按钮文字',p.action,10,true);
  text('左栏标题',p.leftTitle,12,true);text('右栏标题',p.rightTitle,12,true);text('轨道标题',p.trackLabel,12,true);
  text('摘要文字',p.text,36,true);text('底部提示',p.cue,22,true);
  count('看板条目',p.items,1,3);cues(s,p.items,.45);
  for(const x of p.items){text('关键词',x.keyword,12);text('卡片标题',x.label,14,true);icon(x.icon,true);if(x.media!=null)validateTalkClip(ep,s,x.media);}
  checkZoom(p,s);
 }},
 'clean.preview':{min:2.5,max:12,check:(p,s,ep)=>{
  text('窗口标题',p.window,20,true);text('栏目标题',p.heading,16,true);text('按钮文字',p.action,10,true);
  text('预览标题',p.title,18,true);text('预览字幕',p.caption,26,true);
  if(p.media!=null)validateTalkClip(ep,s,p.media);
  if(p.mode!=null&&!['both','phone','desktop'].includes(p.mode))throw Error(`未知预览模式：${p.mode}`);
  if(p.formats!=null){count('规格标签',p.formats,1,2);for(const f of p.formats){count('规格键值',f,2,2);text('规格名',f[0],14);text('规格说明',f[1],16);}}
  if(p.switchAt!=null)cueAt(s,p.switchAt,.35);
  checkZoom(p,s);
 }},
 'clean.closing':{min:1.8,max:10,check:(p,s)=>{
  text('收尾品牌',p.brand,16,true);text('收尾副标',p.tagline,28,true);
  text('搜索或行动词',p.search,24,true);text('按钮标签',p.cta,12,true);
  if(p.searchAt!=null)cueAt(s,p.searchAt,.25);checkZoom(p,s);
 }},
};

export function validateCleanTalk(ep:CleanTalkEpisode){
 if(ep.style!=='clean')throw Error(`未知风格：${ep.style}`);
 if(ep.format!=null&&ep.format!=='landscape'&&ep.format!=='portrait'&&ep.format!=='5:8'&&ep.format!=='3:4')throw Error(`未知画幅：${ep.format}`);
 if(!(ep.duration>0)||!ep.shots?.length)throw Error('需要正数 duration 和至少一个镜头');
 text('品牌名',ep.brand,12);
 let end=0;
 for(const s of ep.shots){
  const where=`[${s.id}] `;
  try{
   if(Math.abs(s.start-end)>.01)throw Error(`镜头不连续：上一镜结束在 ${end}，这一镜从 ${s.start} 开始`);
   const spec=CLEAN_SCENES[s.template];if(!spec)throw Error(`没有这个场景：${s.template}，可选 ${Object.keys(CLEAN_SCENES).join(' / ')}`);
   const d=+(s.end-s.start).toFixed(3);
   if(d<spec.min)throw Error(`这一镜只有 ${d} 秒，${s.template} 至少要 ${spec.min} 秒；和相邻的句子合并，或换一个场景`);
   if(d>spec.max)throw Error(`这一镜有 ${d} 秒，${s.template} 最多撑 ${spec.max} 秒；把这句话拆成两个镜头`);
   spec.check(s.props??{},s,ep);
  }catch(e){throw Error(where+(e as Error).message);}
  end=s.end;
 }
 if(Math.abs(end-ep.duration)>.01)throw Error(`最后一个镜头结束在 ${end}，和 duration ${ep.duration} 对不上`);
 let cap=0;for(const c of ep.captions){if(c.start<cap-.01||c.end<=c.start||c.end>ep.duration)throw Error(`字幕时间有误：${c.text}`);text('字幕',c.text,30);cap=c.end;}
 if(/github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i.test(JSON.stringify([ep.brand,ep.title,ep.clips,ep.captions,ep.shots])))throw Error('文案里不能出现平台名或链接');
}
