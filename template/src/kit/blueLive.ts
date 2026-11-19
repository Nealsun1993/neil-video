// 蓝光展廊·实片版：文案、片源、每段用哪些卡片都来自 public/blue-gallery/live.json。
// 段落时间跟着配乐分段走，固定在这里；换一期只改配置和素材。
export const BLUE_FPS=60,BLUE_DURATION=31;
export type BlueMedia={src:string;at:number;label:string};
export type BlueLiveConfig={brand:string;audio:string;sources:Record<string,{src:string;length:number}>;media:Record<string,BlueMedia>;
 wall:{intro:[string,string];cards:string[];features:{media:string;lines:[string,string]}[]};
 formats:{title:string;cards:string[]};prompt:{title:string;text:string;button:string};
 editor:{window:string;heading:string;styles:{name:string;media:string}[];fields:[string,string][]};outro:{line:string;title:string}};
export type BlueShot={id:string;start:number;end:number;media:string[];mediaFrom?:number};
const TIMES:[string,number,number][]=[['wall',0,8.6],['push',8.3,12.3],['formats',12,16.2],['prompt',16,21],['editor',20.7,25.3],['outro',25,31]];
// 每段的起止与本段里出现的卡片；卡片从本段起点（或 mediaFrom）开始播放。推近接着模板墙里第二张特写卡继续播放。
export function blueShots(c:BlueLiveConfig):BlueShot[]{
 const media:Record<string,string[]>={wall:[...c.wall.cards,...c.wall.features.map(f=>f.media)],push:[c.wall.features[1].media],formats:c.formats.cards,prompt:[],editor:c.editor.styles.map(s=>s.media),outro:[]};
 return TIMES.map(([id,start,end])=>({id,start,end,media:media[id],...(id==='push'?{mediaFrom:0}:{})}));
}
export const shotsAt=(t:number,shots:BlueShot[])=>shots.filter(s=>t>=s.start&&t<s.end);
// 版面能放下的最多字数；超了就会出框或压到别的元素。
const LIMITS:[string,(c:BlueLiveConfig)=>string[],number][]=[
 ['开场一行',c=>[c.wall.intro[0]+c.brand+c.wall.intro[1]],14],['特写大字',c=>c.wall.features.flatMap(f=>f.lines),8],
 ['卡片名',c=>Object.values(c.media).map(m=>m.label),10],['横排标题',c=>[c.formats.title],24],
 ['提示标题',c=>[c.prompt.title],16],['提示正文',c=>[c.prompt.text],48],['按钮',c=>[c.prompt.button],6],
 ['窗口名',c=>[c.editor.window],16],['设置项',c=>[c.editor.heading,...c.editor.styles.map(s=>s.name),...c.editor.fields.flat()],8],
 ['收尾短句',c=>[c.outro.line],16],['收尾大字',c=>[c.outro.title],12],['品牌名',c=>[c.brand],8],
];
export function validateBlueLive(c:BlueLiveConfig){
 if(c.wall.cards.length!==8)throw Error('模板墙要正好8张卡');
 if(c.wall.features.length!==2)throw Error('特写卡要正好2张');
 if(c.formats.cards.length!==5)throw Error('横排要正好5张卡');
 if(c.editor.styles.length!==3||c.editor.fields.length!==2)throw Error('编辑器要3种风格、2个设置项');
 for(const[name,get,max]of LIMITS)for(const s of get(c)){const n=Array.from(s).length;if(!n||n>max)throw Error(`${name}要1到${max}个字：${s}`);}
 if(/github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i.test(JSON.stringify([c.brand,c.media,c.wall,c.formats,c.prompt,c.editor,c.outro])))throw Error('文案里不能出现平台名或链接');
 let end=0;for(const s of blueShots(c)){if(s.start>end)throw Error(`${s.id} 之前出现空档`);end=Math.max(end,s.end);
  for(const m of s.media){const x=c.media[m];if(!x)throw Error(`${s.id} 用了没登记的卡片：${m}`);const src=c.sources[x.src];if(!src)throw Error(`${m} 的片源没登记：${x.src}`);
   if(x.at<0||x.at+(s.end-(s.mediaFrom??s.start))>src.length-.05)throw Error(`${s.id} 的 ${m} 片源不够长`);}}
 if(Math.abs(end-BLUE_DURATION)>1e-9)throw Error('总长不符');
}
