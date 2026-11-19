// 纸感排印：一行口播在纸上打出来，每个词换成符合词义的样子。全部内容来自 public/paper-line/line.json。
export type LineStyle='voice'|'heavy'|'light'|'breathe'|'pixel'|'lean';
export type LineSeg={text:string;style?:LineStyle;tag?:string};
export type PaperLineConfig={brand:string;tagline:string;audio:string;duration:number;
 timing:{lineAt:number;char:number;styledChar:number;hold:number;swarm:number;wall:number;poster:number;block:number};
 line:LineSeg[];roles:string[];wallWord:string;poster:string[];block:{label:string;rows:string[]};texture:string};
export const LINE={fps:60,size:150,caret:1180,left:300,morph:.6,colors:['#E5484D','#30A46C','#8E4EC6','#F5A524','#0091FF','#E93D82','#12A594','#F76B15']};
export const smooth=(p:number)=>{const q=Math.max(0,Math.min(1,p));return q*q*(3-2*q);};
export type Sched={seg:LineSeg;index:number;start:number;typed:number;end:number;n:number};
// 每段的打字起点、打完时刻、让出光标的时刻。带样式的词打完后停一下，让样式变出来。
export function lineSchedule(c:PaperLineConfig):Sched[]{
 let t=c.timing.lineAt;return c.line.map((seg,index)=>{const n=Array.from(seg.text).length,typed=t+n*(seg.style?c.timing.styledChar:c.timing.char),end=typed+(seg.style?c.timing.hold:0),s={seg,index,start:t,typed,end,n};t=end;return s;});
}
export const morphOf=(s:Sched,t:number)=>s.seg.style?smooth((t-s.typed-.08)/LINE.morph):0;
// 一段在 t 时刻占的宽度：变粗和拉开字距会把后面的字往右推。
export function segWidth(s:Sched,t:number){const m=morphOf(s,t),f=s.seg.style==='heavy'?1+.2*m:s.seg.style==='breathe'?1+.42*m:1;return s.n*LINE.size*f;}
export function lineLayout(c:PaperLineConfig,t:number){
 const sch=lineSchedule(c);let x=0,caret=0;
 const segs=sch.map(s=>{const w=segWidth(s,t),p=Math.max(0,Math.min(1,(t-s.start)/(s.typed-s.start))),shown=t<s.start?0:Math.min(s.n,Math.floor(p*s.n+1e-6)),box={...s,x,w,shown,p:t<s.start?0:p};if(t>=s.start)caret=x+w*(t>=s.typed?1:p);x+=w;return box;});
 return {segs,caret,scroll:Math.max(0,caret-(LINE.caret-LINE.left)),lineEnd:sch.at(-1)!.end};
}
export type PaperScene={id:'intro'|'line'|'swarm'|'wall'|'poster'|'block'|'outro';start:number;end:number};
export function paperScenes(c:PaperLineConfig):PaperScene[]{
 const end=lineSchedule(c).at(-1)!.end,T=c.timing,a=end+T.swarm,b=a+T.wall,p=b+T.poster,k=p+T.block;
 return [{id:'intro',start:0,end:T.lineAt},{id:'line',start:T.lineAt,end},{id:'swarm',start:end,end:a},{id:'wall',start:a,end:b},{id:'poster',start:b,end:p},{id:'block',start:p,end:k},{id:'outro',start:k,end:c.duration}];
}
export const paperSceneAt=(t:number,c:PaperLineConfig)=>{const list=paperScenes(c);return list.find(s=>t>=s.start&&t<s.end)??list.at(-1)!;};
// 暗场：从海报段开始，到蓝色海报块结束。
export function paperDark(t:number,c:PaperLineConfig){const s=paperScenes(c),a=s.find(x=>x.id==='poster')!.start,b=s.find(x=>x.id==='block')!.end;return {on:t>=a-.45&&t<b+.5,in:smooth((t-a+.45)/.7),out:smooth((t-b+.1)/.6)};}
export function validatePaperLine(c:PaperLineConfig){
 const sc=paperScenes(c),outro=sc.at(-1)!;if(outro.end-outro.start<2.5)throw Error(`纸感排印：收尾只剩${(outro.end-outro.start).toFixed(1)}秒，缩短句子或加长总时长`);
 const n=c.line.reduce((v,s)=>v+Array.from(s.text).length,0);if(n>34)throw Error('纸感排印：一行最多34个字');
 for(const s of c.line){if(s.style&&!s.tag)throw Error(`带样式的词需要一个分工名牌：${s.text}`);if(s.style&&Array.from(s.text).length>4)throw Error(`带样式的词最多4个字：${s.text}`);}
 if(!c.line.some(s=>s.style==='pixel'))throw Error('需要一个像素点阵词');
 if(Array.from(c.wallWord).length>3||c.poster.some(l=>Array.from(l).length>5)||c.block.rows.some(r=>Array.from(r).length>4))throw Error('字墙、海报或色块文字过长');
 if(c.roles.length<6)throw Error('至少6个分工名牌');
}
