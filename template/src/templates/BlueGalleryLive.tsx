import React from 'react';
import {AbsoluteFill,Audio,CalculateMetadataFunction,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {ease,font,Mark,Traffic} from './CleanUiDemo';
import {BLUE_DURATION,BLUE_FPS,BlueLiveConfig,blueShots,shotsAt,validateBlueLive} from '../kit/blueLive';

// 蓝光展廊·实片版：镜头一直在动，卡片是干净风格的真实成片；段落之间用光和推焦接，不留空画面。
export type BlueLiveProps={config?:BlueLiveConfig;audio?:boolean};
type C={c:BlueLiveConfig};
type M={c:Pick<BlueLiveConfig,'sources'|'media'>};
const shot=(c:BlueLiveConfig,id:string)=>blueShots(c).find(s=>s.id===id)!;
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q;

function Field({t}:{t:number}){
 // 暗场：16–17.5 与 25.8–27.6；收尾光从底部升起。
 const dim=Math.max(ease(t,15.7,16.4)*(1-ease(t,17.2,17.9)),ease(t,25.9,26.6)*(1-ease(t,27.3,28.3)))*.78,rise=ease(t,27.2,31);
 const x=30+Math.sin(t*.55)*14+ease(t,27,31)*18*Math.sin(t*1.3),y=60+Math.sin(t*.47)*10,x2=70+Math.cos(t*.5)*14;
 return <AbsoluteFill style={{background:`radial-gradient(ellipse at ${x}% ${y}%, #1A6CC4 0%, transparent 62%),radial-gradient(ellipse at ${x2}% ${18+Math.sin(t*.6)*8}%, #63ADE6 0%, transparent 30%),linear-gradient(132deg,#071A2E,#123A66 62%,#06182A)`}}>
  <AbsoluteFill style={{background:'#00060E',opacity:dim}}/>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% ${lerp(130,92,rise)}%, #5FB4FF ${lerp(0,8,rise)}%, #1F78D4 ${lerp(10,38,rise)}%, transparent ${lerp(30,72,rise)}%)`,opacity:rise}}/>
 </AbsoluteFill>;
}
// 段落之间的光团：从一侧扫过，同时盖住切换。
export function Sweep({t,at}:{t:number;at:number}){
 const p=ease(t,at-.45,at+.45);if(p<=0||p>=1)return null;
 return <AbsoluteFill style={{background:`radial-gradient(circle at ${lerp(-10,110,p)}% 55%, #8CCBFFcc 0%, #3D93E866 16%, transparent 36%)`,opacity:Math.sin(p*Math.PI),mixBlendMode:'screen'}}/>;
}
// 逐字推焦淡入。
export function Words({text,t,at,size,style,step=.045}:{text:string;t:number;at:number;size:number;style?:React.CSSProperties;step?:number}){
 return <div style={{fontSize:size,fontWeight:650,letterSpacing:-1,whiteSpace:'nowrap',lineHeight:1.2,...style}}>{Array.from(text).map((c,i)=>{const q=ease(t,at+i*step,at+i*step+.38);return <span key={i} style={{display:'inline-block',opacity:q,filter:`blur(${(1-q)*14}px)`,transform:`translateY(${(1-q)*18}px)`}}>{c}</span>;})}</div>;
}
export function Clip({c,m,from}:M&{m:string;from:number}){
 const x=c.media[m];
 return <Sequence from={Math.round(from*BLUE_FPS)} layout="none"><OffthreadVideo src={staticFile(c.sources[x.src].src)} trimBefore={Math.round(x.at*BLUE_FPS)} muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></Sequence>;
}
export function Card({c,m,from,w,h,chrome=true,style}:M&{m:string;from:number;w:number;h:number;chrome?:boolean;style?:React.CSSProperties}){
 const bar=chrome?Math.round(h*.075):0;
 return <div style={{position:'absolute',width:w,height:h,borderRadius:Math.max(10,w*.018),overflow:'hidden',background:'#0B1624',boxShadow:'0 24px 70px #00102a99',border:'1px solid #FFFFFF3a',...style}}>
  {chrome?<div style={{height:bar,display:'flex',alignItems:'center',gap:bar*.4,padding:`0 ${bar*.5}px`,background:'#F6F8FB',borderBottom:'1px solid #E3E8EE'}}><div style={{transform:`scale(${bar/56})`,transformOrigin:'left center',width:bar*1.4}}><Traffic/></div><div style={{fontSize:bar*.42,color:'#5E6B7C'}}>{c.media[m].label}</div></div>:null}
  <div style={{position:'absolute',top:bar,left:0,right:0,bottom:0}}><Clip c={c} m={m} from={from}/></div>
 </div>;
}

// 开场：先只出品牌名，画面干净；名字淡出时模板墙按列整齐地从下方升起。之后整体横移推近；两次单卡浮到左侧，右侧大字；最后光标点中第二张。
const WALL={cols:4,w:560,h:350,gx:44,gy:52,x0:110,y0:150};
export const featureAt=[4.4,6.35];
function Wall({t,c}:C&{t:number}){
 const s=shot(c,'wall'),u=Math.max(0,t-2.2),drift=u*-62,zoom=1+u*.018,m=c.wall.cards,brand=c.brand,ft=c.wall.features;
 const f1=ease(t,featureAt[0],featureAt[0]+.6)*(1-ease(t,featureAt[1]-.25,featureAt[1]+.3)),f2=ease(t,featureAt[1],featureAt[1]+.6),focus=Math.max(f1,f2);
 const click=ease(t,7.75,8.15),press=t>8.05&&t<8.22?.97:1;
 const feat=(k:number,q:number,mm:string)=>{const w=lerp(WALL.w,960,q),h=w*.625;const live=Math.max(0,t-featureAt[k]-.6);return q>0?<div key={k} style={{position:'absolute',left:lerp(WALL.x0+WALL.w+WALL.gx+drift,120,q),top:lerp(WALL.y0,540-h/2,q),opacity:Math.min(1,q*2),transform:`translate(${-live*26}px,${-live*8}px) scale(${(k===1?press:1)*(1+live*.035)})`,transformOrigin:'50% 50%',willChange:'transform'}}><Card c={c} m={mm} from={s.start} w={w} h={h} style={{position:'relative'}}/></div>:null;};
 return <AbsoluteFill style={{opacity:1-ease(t,8.45,8.6)}}>
  <AbsoluteFill style={{transform:`scale(${zoom}) rotateY(${lerp(-5,0,ease(t,2.2,6))}deg)`,transformOrigin:'50% 45%',opacity:1-.7*focus,filter:`blur(${focus*5}px)`}}>
   {m.map((mm,i)=>{const col=i%WALL.cols,row=Math.floor(i/WALL.cols),at=1.5+col*.09+row*.14,q=ease(t,at,at+.8);return <div key={i} style={{position:'absolute',left:0,top:0,transform:`translate(${WALL.x0+col*(WALL.w+WALL.gx)+drift}px,${WALL.y0+row*(WALL.h+WALL.gy+40)+(1-q)*260}px) scale(${lerp(.94,1,q)})`,transformOrigin:'50% 50%',willChange:'transform',opacity:q}}>
    <Card c={c} m={mm} from={s.start} w={WALL.w} h={WALL.h} style={{position:'relative'}}/><div style={{marginTop:14,fontSize:26,color:'#D4E8FA',opacity:ease(t,2.4,2.9)}}>{c.media[mm].label}</div></div>;})}
  </AbsoluteFill>
  <div style={{position:'absolute',left:0,right:0,top:470,display:'flex',justifyContent:'center',opacity:1-ease(t,1.35,1.8),filter:`blur(${ease(t,1.35,1.8)*16}px)`,transform:`scale(${1+t*.03})`,willChange:'transform'}}><Words text={c.wall.intro[0]} t={t} at={.15} size={100} style={{opacity:.75,marginRight:30}}/><Words text={brand} t={t} at={.4} size={100}/><Words text={c.wall.intro[1]} t={t} at={.85} size={100} style={{marginLeft:24,color:'#9FD3FF'}}/></div>
  {feat(0,f1,ft[0].media)}{feat(1,f2,ft[1].media)}
  <div style={{position:'absolute',left:1150,top:400}}>
   {f1>0?<div style={{opacity:f1}}><Words text={ft[0].lines[0]} t={t} at={featureAt[0]+.25} size={92}/><Words text={ft[0].lines[1]} t={t} at={featureAt[0]+.55} size={92} style={{color:'#9FD3FF'}}/></div>:null}
   {f2>0?<div style={{position:'absolute',top:0,opacity:f2}}><Words text={ft[1].lines[0]} t={t} at={featureAt[1]+.25} size={92}/><Words text={ft[1].lines[1]} t={t} at={featureAt[1]+.55} size={92} style={{color:'#9FD3FF'}}/></div>:null}
  </div>
  {t>7.3?<svg width={60} height={60} viewBox="0 0 24 24" style={{position:'absolute',left:lerp(1500,700,ease(t,7.3,7.95)),top:lerp(880,560,ease(t,7.3,7.95)),transform:`scale(${press})`,filter:'drop-shadow(0 6px 10px #0008)',opacity:1-ease(t,8.3,8.5)}}><path d="M4 2l15 9-7 1.6L8.8 20z" fill="#fff" stroke="#0B2340" strokeWidth={1.2}/></svg>:null}
  {click>0&&click<1?<div style={{position:'absolute',left:700-80*click,top:560-80*click,width:160*click,height:160*click,borderRadius:'50%',border:'3px solid #9FD3FF',opacity:1-click}}/>:null}
 </AbsoluteFill>;
}

// 单卡推到满屏，在卡里继续播放真实片段。
function Push({t,c}:C&{t:number}){
 const p=ease(t,8.3,9.1),out=ease(t,11.6,12.3),w0=960,w=lerp(w0,2050,p)*(1+(t-8.3)*.035),h=w*.625;
 return <AbsoluteFill style={{opacity:1-out,filter:`blur(${out*14}px)`}}>
  <Card c={c} m={c.wall.features[1].media} from={shot(c,'push').mediaFrom!} w={w} h={h} style={{left:lerp(120,960-w/2,p)+lerp(0,-160,ease(t,9,12)),top:lerp(540-w0*.625/2,540-h/2,p),borderRadius:lerp(18,0,p)}}/>
 </AbsoluteFill>;
}

// 五种成片横排，持续左移；下面是名字。
function Formats({t,c}:C&{t:number}){
 const s=shot(c,'formats'),u=t-s.start,w=620,h=388,show=ease(t,12,12.6),out=ease(t,15.5,16.2);
 return <AbsoluteFill style={{opacity:show*(1-out),filter:`blur(${out*10}px)`}}>
  {s.media.map((mm,i)=>{const q=ease(t,12.05+i*.16,12.7+i*.16);return <div key={i} style={{position:'absolute',left:200+i*(w+48)-u*120+(1-q)*220,top:300+(1-q)*50,opacity:q}}>
   <Card c={c} m={mm} from={s.start} w={w} h={h} style={{position:'relative'}}/><div style={{marginTop:22,fontSize:36,fontWeight:600}}>{c.media[mm].label}</div></div>;})}
  <Words text={c.formats.title} t={t} at={12.6} size={56} style={{position:'absolute',left:200,top:160,opacity:.9}}/>
 </AbsoluteFill>;
}

function Prompt({t,c}:C&{t:number}){
 const prompt=c.prompt.text,orb=ease(t,16.3,17)*(1-ease(t,17.4,17.9)),box=ease(t,17.4,17.9),go=ease(t,20.45,20.95),count=Math.floor([...prompt].length*ease(t,17.7,19.9)),press=t>20.15&&t<20.35;
 return <AbsoluteFill>
  <div style={{position:'absolute',left:'50%',top:'50%',width:420,height:420,marginLeft:-210,marginTop:-210,borderRadius:'50%',background:'radial-gradient(circle,#5FB0FF 0%,#1B6FD0aa 35%,transparent 70%)',opacity:orb,transform:`scale(${lerp(.4,1.6,ease(t,16.3,17.8))})`}}/>
  <div style={{position:'absolute',left:`${50+Math.sin(t*1.6)*34}%`,top:`${55+Math.cos(t*1.3)*12}%`,width:900,height:900,marginLeft:-450,marginTop:-450,borderRadius:'50%',background:'radial-gradient(circle,#3F95F0aa 0%,transparent 65%)',opacity:box*(1-go)}}/>
  <div style={{position:'absolute',left:0,right:0,top:470,display:'flex',justifyContent:'center',opacity:1-ease(t,17.2,17.6),filter:`blur(${ease(t,17.2,17.6)*12}px)`}}><Words text={c.prompt.title} t={t} at={16.05} size={92}/></div>
  <div style={{position:'absolute',left:'50%',top:'50%',width:1160,height:260,padding:'36px 42px',boxSizing:'border-box',background:`linear-gradient(#0E1620,#0E1620) padding-box,conic-gradient(from ${t*140}deg,#1B95F5,#9FD3FF 18%,#0E1620 36%,#0E1620 64%,#7DD0FF 82%,#1B95F5) border-box`,border:'3px solid transparent',boxShadow:`0 20px 70px #00101FAA,0 0 ${50+30*Math.sin(t*4)}px #3D93E855`,borderRadius:36,opacity:box*(1-go),filter:`blur(${go*18}px)`,transform:`translate(-50%,-50%) translateY(${lerp(40,-30,ease(t,17.4,20.4))}px) scale(${lerp(.9,1,box)*lerp(1,1.1,ease(t,17.6,20.4))*lerp(1,2.6,go)})`}}>
   <div style={{fontSize:40,lineHeight:1.45}}>{[...prompt].slice(0,count).join('')}<span style={{color:'#76CAFF',opacity:Math.floor(t*4)%2?1:0}}>▏</span></div>
   <div style={{position:'absolute',bottom:28,left:34,fontSize:34,color:'#91A4B4'}}>＋</div>
   <div style={{position:'absolute',bottom:24,right:26,padding:'12px 28px',borderRadius:30,fontSize:30,fontWeight:650,background:t>20.15?'#7DD0FF':'#1B95F5',transform:`scale(${press?.94:1})`}}>{c.prompt.button} →</div>
  </div>
 </AbsoluteFill>;
}

// 冲进编辑器，预览连换三种风格；左侧设置同步变化。
const SWAPS=[21.9,23.1] as const;
function Editor({t,c}:C&{t:number}){
 const s=shot(c,'editor'),e=c.editor,land=ease(t,20.7,21.3),out=ease(t,24.8,25.3),k=SWAPS.filter(a=>t>=a+.2).length;
 return <AbsoluteFill style={{opacity:Math.min(1,land*1.4)*(1-out),filter:`blur(${(1-land)*16+out*14}px)`,transform:`scale(${lerp(1.22,1,land)*(1+(t-20.7)*.01)})`}}>
  <div style={{position:'absolute',left:150,top:110,width:1620,height:860,borderRadius:24,overflow:'hidden',background:'#111922',border:'1px solid #FFFFFF3a',boxShadow:'0 30px 90px #001C3CAA'}}>
   <div style={{height:70,display:'flex',alignItems:'center',gap:24,padding:'0 30px',borderBottom:'1px solid #FFFFFF22'}}><Traffic/><span style={{fontSize:24,color:'#CAD5E0'}}>{e.window}</span></div>
   <div style={{position:'absolute',top:110,left:36,width:330,fontSize:26,color:'#D6E0EA'}}>{e.heading}
    {[['风格',e.styles[k].name],...e.fields].map(([a,b],i)=><div key={a} style={{border:`1px solid ${i===0&&t>SWAPS[0]-.3&&t<SWAPS[1]+.6?'#7DD0FF':'#FFFFFF28'}`,borderRadius:12,padding:'16px 18px',marginTop:20,fontSize:22,display:'flex',justifyContent:'space-between'}}>{a}<span style={{color:'#A3CFEF'}}>{b}</span></div>)}</div>
   <div style={{position:'absolute',left:400,right:36,top:104,bottom:36,borderRadius:14,overflow:'hidden',background:'#000'}}>
    {e.styles.map(({media:mm},i)=>{const wipe=i===0?1:ease(t,SWAPS[i-1],SWAPS[i-1]+.55);return <div key={mm} style={{position:'absolute',inset:0,clipPath:`inset(0 ${(1-wipe)*100}% 0 0)`}}><Clip c={c} m={mm} from={s.start}/>
     {wipe>0&&wipe<1?<div style={{position:'absolute',top:0,bottom:0,left:`${wipe*100}%`,width:6,marginLeft:-3,background:'#BFE6FF',boxShadow:'0 0 40px 16px #7DD0FFaa'}}/>:null}</div>;})}
   </div>
  </div>
 </AbsoluteFill>;
}

function Outro({t,c}:C&{t:number}){
 const a=1-ease(t,26.8,27.3),b=ease(t,27.1,27.8);
 return <AbsoluteFill>
  <div style={{position:'absolute',left:0,right:0,top:480,display:'flex',justifyContent:'center',opacity:a,filter:`blur(${(1-a)*12}px)`,transform:`scale(${1+(t-25)*.02})`}}><Words text={c.outro.line} t={t} at={25.15} size={96}/></div>
  <div style={{position:'absolute',left:0,right:0,top:400,textAlign:'center',opacity:b,transform:`translateY(${lerp(40,0,b)}px) scale(${lerp(.96,1,b)+Math.max(0,t-27.1)*.02})`,willChange:'transform'}}>
   <Words text={c.outro.title} t={t} at={27.1} size={120} step={.06} style={{display:'flex',justifyContent:'center'}}/>
   <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,fontSize:40,marginTop:36,opacity:ease(t,27.9,28.5)}}><Mark size={46} cutout="#1684D9"/>{c.brand}</div>
  </div>
 </AbsoluteFill>;
}

export const blueLiveMetadata:CalculateMetadataFunction<BlueLiveProps>=async({props})=>{const config:BlueLiveConfig=props.config??await fetch(staticFile('blue-gallery/live.json')).then(r=>r.json());validateBlueLive(config);return {durationInFrames:BLUE_DURATION*BLUE_FPS,fps:BLUE_FPS,width:1920,height:1080,props:{...props,config}};};
export const BlueGalleryLive:React.FC<BlueLiveProps>=({config,audio=true})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;if(!config)return null;
 const c=config,on=new Set(shotsAt(t,blueShots(c)).map(s=>s.id));
 return <AbsoluteFill style={{background:'#05131F',fontFamily:font,color:'#F7FBFF',overflow:'hidden'}}>
  <FontGate text={JSON.stringify([c.brand,c.media,c.wall,c.formats,c.prompt,c.editor,c.outro])+'风格→＋▏'}/>
  {audio?<Audio src={staticFile(c.audio)}/>:null}
  <Field t={t}/>
  {on.has('wall')?<Wall t={t} c={c}/>:null}
  {on.has('push')?<Push t={t} c={c}/>:null}
  {on.has('formats')?<Formats t={t} c={c}/>:null}
  {on.has('prompt')?<Prompt t={t} c={c}/>:null}
  {on.has('editor')?<Editor t={t} c={c}/>:null}
  {on.has('outro')?<Outro t={t} c={c}/>:null}
  {[1.2,12,16,20.75,25].map(a=><Sweep key={a} t={t} at={a}/>)}
 </AbsoluteFill>;
};
