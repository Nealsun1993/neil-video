// 口播版：时间轴只认配音。一期 = public/episodes/<id>/episode.json（带 style 字段），
// 每个镜头选一个场景、填内容；镜头起止来自配音的句子时间，画面里的动作落在 at 写的秒数上。
// 音乐只是铺底：任意一首，自动循环，说话时压低。
export type TalkFormat='landscape'|'portrait'|'3:4';
export const talkFormatDims=(format:TalkFormat='landscape')=>format==='3:4'?{w:1080,h:1440}:format==='portrait'?{w:1080,h:1920}:{w:1920,h:1080};
export type TalkCaption={text:string;start:number;end:number};
export type TalkShot={id:string;template:string;start:number;end:number;props:any};
export type TalkSource={kind?:'video'|'image'|'card';src?:string;length?:number};
export type TalkClip={kind?:'video'|'image'|'card';src?:string;at?:number;label:string;title?:string;lines?:string[];badge?:string;fit?:'cover'|'contain'};
export type TalkEpisode={id:string;title:string;style:'blue';format?:TalkFormat;duration:number;brand:string;audio:string;audioOffset?:number;
 music?:{src:string;volume?:number;voiceVolume?:number};sfx?:{src:string;volume?:number};
 sources?:Record<string,TalkSource>;clips:Record<string,TalkClip>;
 captions:TalkCaption[];shots:TalkShot[]};
export const TALK_FPS=60,TALK_OVERLAP=.3;
/** 素材路径：以 / 开头 = public 根目录；否则相对本期目录 */
export const talkAsset=(ep:{id:string},p:string)=>p.startsWith('/')?p.slice(1):`episodes/${ep.id}/${p}`;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** 说话时为 1，停顿处为 0，前后各留 0.3 秒过渡。 */
export const speakingAt=(ep:{captions:TalkCaption[]},t:number)=>Math.max(0,...ep.captions.map(c=>Math.min(clamp((t-c.start+.5)/.3),clamp((c.end+.6-t)/.3))));
export function musicGainAt(ep:{duration:number;captions:TalkCaption[];music?:{src:string;volume?:number;voiceVolume?:number}},t:number){
 if(!ep.music)return 0;const quiet=ep.music.voiceVolume??.09,loud=ep.music.volume??.3,k=speakingAt(ep,t);
 return (loud+(quiet-loud)*k)*clamp(t/.4)*clamp((ep.duration-t)/1);
}

const IMG_RE=/\.(png|jpe?g|webp|gif|svg)$/i;
export function resolveTalkClip(ep:{id:string;sources?:Record<string,TalkSource>;clips?:Record<string,TalkClip>},id:string){
 const c=ep.clips?.[id];if(!c)return null;
 const srcObj=c.src?ep.sources?.[c.src]:undefined;
 const rawPath=srcObj?.src??c.src??'';
 const kind:'video'|'image'|'card'=c.kind??srcObj?.kind??(!c.src?'card':(IMG_RE.test(rawPath)&&srcObj?.length==null?'image':'video'));
 return {clip:c,source:srcObj,kind,asset:rawPath?talkAsset(ep,rawPath):''};
}

type Spec={min:number;max:number;check:(p:any,s:TalkShot,ep:TalkEpisode)=>void};
const len=(s:unknown)=>typeof s==='string'?Array.from(s).length:0;
const text=(name:string,s:unknown,max:number,optional=false)=>{if(optional&&s==null)return;const n=len(s);if(!n||n>max)throw Error(`${name}要1到${max}个字：${s}`);};
const count=(name:string,a:unknown,min:number,max:number)=>{if(!Array.isArray(a)||a.length<min||a.length>max)throw Error(`${name}要${min}到${max}项`);};
export function validateTalkClip(ep:{id:string;sources?:Record<string,TalkSource>;clips?:Record<string,TalkClip>},s:TalkShot,id:string){
 const r=resolveTalkClip(ep,id);if(!r)throw Error(`用了没登记的片段：${id}`);
 const {clip:c,source:src,kind,asset}=r;
 if(kind==='card'){
  text('卡片名',c.label,12);text('卡片标题',c.title,18,true);text('卡片角标',c.badge,12,true);
  if(c.lines!=null){count('卡片内容',c.lines,1,4);c.lines.forEach(l=>text('卡片每行',l,22));}
  return;
 }
 if(kind==='image'){
  if(!asset)throw Error(`片段 ${id} 缺少图片路径`);
  if(c.src&&ep.sources&&!src&&!IMG_RE.test(c.src))throw Error(`片段 ${id} 的片源没登记：${c.src}`);
  if(c.fit!=null&&c.fit!=='cover'&&c.fit!=='contain')throw Error(`片段 ${id} 的 fit 仅支持 cover 或 contain`);
  text('卡片名',c.label,12);return;
 }
 if(!src)throw Error(`片段 ${id} 的片源没登记：${c.src}`);
 const at=c.at??0;
 if(typeof src.length!=='number'||at<0||at+(s.end-s.start)+TALK_OVERLAP>src.length-.05)throw Error(`片段 ${id} 的片源不够长`);
}
const clip=(ep:TalkEpisode,s:TalkShot,id:string)=>validateTalkClip(ep,s,id);
// 一组按说话时间出现的东西：第一项可以不写 at，之后每项的 at 要在镜头内、递增，并且至少间隔 gap 秒。
const cues=(s:TalkShot,items:{at?:number}[],gap:number,first=true)=>{let last=s.start-gap;items.forEach((x,i)=>{if(x.at==null){if(i||!first)throw Error('缺少 at（这一项在第几秒出现）');return;}
 if(x.at<s.start||x.at>s.end-.5)throw Error(`at=${x.at} 不在这个镜头里`);if(x.at-last<gap)throw Error(`at=${x.at} 离上一项太近，至少隔 ${gap} 秒`);last=x.at;});};
/** 每个场景能撑住的最短和最长时长，以及版面放得下的内容量。 */
export const BLUE_SCENES:Record<string,Spec>={
 'blue.title':{min:1.5,max:5,check:p=>{count('大字',p.lines,1,2);p.lines.forEach((l:string)=>text('大字每行',l,12));text('小标',p.kicker,10,true);}},
 'blue.feature':{min:2,max:7,check:(p,s,ep)=>{count('特写',p.items,1,3);cues(s,p.items,1.2);for(const x of p.items){clip(ep,s,x.media);count('特写大字',x.lines,2,2);x.lines.forEach((l:string)=>text('特写大字每行',l,8));}}},
 'blue.row':{min:2,max:7,check:(p,s,ep)=>{count('横排卡片',p.cards,3,5);cues(s,p.cards,.4);text('横排标题',p.title,24,true);for(const x of p.cards){clip(ep,s,x.media);text('卡片名',x.label??ep.clips[x.media].label,10);}}},
 'blue.wall':{min:2.5,max:8,check:(p,s,ep)=>{count('模板墙',p.cards,6,8);p.cards.forEach((m:string)=>{clip(ep,s,m);text('卡片名',ep.clips[m].label,10);});}},
 'blue.push':{min:2.5,max:8,check:(p,s,ep)=>clip(ep,s,p.media)},
 'blue.prompt':{min:3.5,max:8,check:p=>{text('提示标题',p.title,16,true);text('提示正文',p.text,48);text('按钮',p.button,6);}},
 'blue.editor':{min:3,max:10,check:(p,s,ep)=>{count('编辑器风格',p.styles,2,4);cues(s,p.styles,.9);text('窗口名',p.window,16);text('设置标题',p.heading,8);text('切换项名',p.styleLabel,8,true);
  if(p.fields!=null){count('设置项',p.fields,0,4);for(const f of p.fields){count('设置项键值',f,2,2);text('设置项',f[0],8);text('设置项',f[1],10);}}
  for(const x of p.styles){clip(ep,s,x.media);text('风格名',x.name,8);}}},
 'blue.outro':{min:2.5,max:8,check:(p,s)=>{text('收尾短句',p.line,16,true);text('收尾大字',p.title,12);if(p.line)cues(s,[{at:p.titleAt}],1,false);}},
};
export function validateTalk(ep:TalkEpisode){
 if(ep.style!=='blue')throw Error(`未知风格：${ep.style}`);
 if(ep.format!=null&&ep.format!=='landscape'&&ep.format!=='portrait'&&ep.format!=='3:4')throw Error(`未知画幅：${ep.format}`);
 if(!(ep.duration>0)||!ep.shots?.length)throw Error('需要正数 duration 和至少一个镜头');
 text('品牌名',ep.brand,10);
 let end=0,prev='';
 for(const s of ep.shots){const where=`[${s.id}] `;
  try{
   if(Math.abs(s.start-end)>.01)throw Error(`镜头不连续：上一镜结束在 ${end}，这一镜从 ${s.start} 开始`);
   const spec=BLUE_SCENES[s.template];if(!spec)throw Error(`没有这个场景：${s.template}，可选 ${Object.keys(BLUE_SCENES).join(' / ')}`);
   const d=+(s.end-s.start).toFixed(3);
   if(d<spec.min)throw Error(`这一镜只有 ${d} 秒，${s.template} 至少要 ${spec.min} 秒；和相邻的句子合并，或换一个场景`);
   if(d>spec.max)throw Error(`这一镜有 ${d} 秒，${s.template} 最多撑 ${spec.max} 秒；把这句话拆成两个镜头`);
   if(s.template===prev)throw Error(`连续两个镜头都是 ${s.template}，换一个场景`);
   spec.check(s.props??{},s,ep);
  }catch(e){throw Error(where+(e as Error).message);}
  end=s.end;prev=s.template;}
 if(Math.abs(end-ep.duration)>.01)throw Error(`最后一个镜头结束在 ${end}，和 duration ${ep.duration} 对不上`);
 let cap=0;for(const c of ep.captions){if(c.start<cap-.01||c.end<=c.start||c.end>ep.duration)throw Error(`字幕时间有误：${c.text}`);text('字幕',c.text,30);cap=c.end;}
 if(/github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i.test(JSON.stringify([ep.brand,ep.clips,ep.captions,ep.shots])))throw Error('文案里不能出现平台名或链接');
}
