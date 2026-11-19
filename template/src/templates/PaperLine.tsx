import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,delayRender,continueRender,cancelRender,CalculateMetadataFunction} from 'remotion';
import {FontGate} from '../kit/frame';
import {PixelFonts} from '../kit/PixelFonts';
import {Mark} from './CleanUiDemo';
import {PaperLineConfig,LINE,smooth,lineLayout,lineSchedule,morphOf,paperScenes,paperSceneAt,paperDark,validatePaperLine} from '../kit/paperLine';

// 纸感排印：浅灰纸、一行字、协作名牌；“点点”是用小字符铺出来的灰调，“像素”用在点阵词、转场和小方块上。
export type PaperLineProps={config?:PaperLineConfig;audio?:boolean};
const PAPER='#E8E8E6',INK='#151515',BLUE='#5C8DF0',SANS='"MiSans VF","PingFang SC",sans-serif',MONO='"JetBrains Mono","MiSans VF",monospace',SONG='"Songti SC","STSong",serif',KAI='"Kaiti SC","STKaiti",serif',PIXEL='"Workbench Pixel CN",monospace';
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q,hash=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// 画布里用到字体时，等这款字体就绪再画，避免首帧落到后备字体上。
function useFontCanvas(font:string,text:string,draw:(g:CanvasRenderingContext2D)=>void,deps:unknown[]){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const h=delayRender('paper canvas');document.fonts.load(font,text).then(()=>{const g=ref.current?.getContext('2d');if(g)draw(g);continueRender(h);}).catch(cancelRender);},deps);// eslint-disable-line react-hooks/exhaustive-deps
 return ref;
}
// 点点灰调：一行行小字符，越密的地方字符越“重”，整体是缓慢流动的波浪。
function Texture({t,amount,dark,chars}:{t:number;amount:number;dark:boolean;chars:string}){
 const cw=15,ch=19,ramp=[' ','·',':','-','*','o','m','g'],tx=Array.from(chars);
 const ref=useFontCanvas(`14px ${MONO}`,chars+'·:-*omg',g=>{g.clearRect(0,0,1920,1080);if(amount<=0)return;g.font=`14px ${MONO}`;g.textBaseline='top';g.fillStyle=dark?'#FFFFFF':INK;const thr=lerp(1,.18,amount);
  for(let r=0;r<57;r++)for(let c=0;c<128;c++){const x=c*cw,y=r*ch,f=Math.sin(x*.0021+y*.0034+t*.22)*Math.cos(x*.0013-y*.0029-t*.17+1.1),d=(f-thr)/(1-thr);if(d<=0)continue;
   const k=Math.min(ramp.length+1,Math.floor(d*(ramp.length+2))),s=k<ramp.length?ramp[k]:tx[(c+r)%tx.length];if(s===' ')continue;g.globalAlpha=(dark?.34:.42)*Math.min(1,.35+d);g.fillText(s,x,y);}
 },[Math.round(t*30),amount,dark,chars]);
 return <canvas ref={ref} width={1920} height={1080} style={{position:'absolute',inset:0}}/>;
}
// 像素点阵词：先是大方块，再收成细点，蓝到紫渐变。
function PixelWord({text,size,m}:{text:string;size:number;m:number}){
 const n=Array.from(text).length,w=n*size,h=Math.round(size*1.3),cell=Math.round(lerp(46,9,m));
 const ref=useFontCanvas(`600 ${size}px ${SANS}`,text,g=>{const mask=document.createElement('canvas');mask.width=w;mask.height=h;const q=mask.getContext('2d')!;q.font=`600 ${size}px ${SANS}`;q.textBaseline='middle';q.fillStyle='#fff';q.fillText(text,0,h*.52);const px=q.getImageData(0,0,w,h).data;g.clearRect(0,0,w,h);
  for(let y=cell/2;y<h;y+=cell)for(let x=cell/2;x<w;x+=cell){if(px[(Math.floor(y)*w+Math.floor(x))*4+3]<110)continue;const k=x/w;g.fillStyle=`rgb(${Math.round(lerp(59,155,k))},${Math.round(lerp(107,93,k))},${Math.round(lerp(245,229,k))})`;
   if(cell>16)g.fillRect(x-cell/2+1,y-cell/2+1,cell-2,cell-2);else{g.beginPath();g.arc(x,y,cell*.43,0,Math.PI*2);g.fill();}}
 },[text,size,cell]);
 return <canvas ref={ref} width={w} height={h} style={{position:'absolute',left:0,top:(size*1.2-h)/2,width:w,height:h}}/>;
}
function Tag({x,y,name,color,o=1,flip=false}:{x:number;y:number;name:string;color:string;o?:number;flip?:boolean}){
 return <div style={{position:'absolute',left:x,top:y,opacity:o,fontFamily:SANS}}><div style={{position:'absolute',left:-7,top:-7,width:14,height:14,borderRadius:7,background:color}}/><div style={{position:'absolute',left:flip?undefined:8,right:flip?8:undefined,top:8,padding:'5px 12px 6px',borderRadius:6,background:color,color:'#fff',fontSize:24,lineHeight:1.25,letterSpacing:0,fontWeight:600,fontVariationSettings:'"wght" 600',WebkitTextStroke:'0',whiteSpace:'nowrap'}}>{name}</div></div>;
}
function Square({x,y,size,color,o=1,r=0}:{x:number;y:number;size:number;color:string;o?:number;r?:number}){
 return <div style={{position:'absolute',left:x,top:y,width:size,height:size,opacity:o,transform:`rotate(${r}deg)`,background:color,backgroundImage:'repeating-conic-gradient(#0000 0 25%,#ffffff55 0 50%)',backgroundSize:'8px 8px'}}><div style={{position:'absolute',left:'38%',top:'38%',width:'62%',height:'62%',background:color,outline:`3px solid ${PAPER}`}}/></div>;
}
const SQ=[[-120,-70,BLUE,-9],[20,-10,INK,6],[-50,60,'#C9A27A',14],[110,40,BLUE,-4],[-180,30,INK,10]] as const;

function Intro({t,c}:{t:number;c:PaperLineConfig}){
 const out=smooth((t-c.timing.lineAt+.35)/.4);
 return <AbsoluteFill style={{opacity:1-out}}>{SQ.slice(0,3).map(([dx,dy,col,r],i)=>{const q=smooth((t-.1-i*.22)/.4),fl=Math.sin(t*2+i)*8;return <React.Fragment key={i}><Square x={900+dx*1.4-out*400} y={480+dy*1.3+fl} size={96} color={col} o={q} r={r*(1-q)+r*.3}/><Tag x={900+dx*1.4+104-out*400} y={480+dy*1.3+100+fl} name={c.roles[i]} color={LINE.colors[i]} o={smooth((t-.45-i*.22)/.3)}/></React.Fragment>;})}</AbsoluteFill>;
}
// 一行字：镜头跟着光标向左滚；带样式的词打完后变形，并把后文推开。
function Line({t,c}:{t:number;c:PaperLineConfig}){
 const L=lineLayout(c,t),sch=lineSchedule(c),S=LINE.size,pix=L.segs.find(s=>s.seg.style==='pixel')!,sw=smooth((t-L.lineEnd)/.7),scroll=lerp(L.scroll,pix.x+pix.w/2-(960-LINE.left),sw),out=smooth((t-L.lineEnd-c.timing.swarm+.3)/.3);
 return <AbsoluteFill style={{opacity:1-out}}>
  <div style={{position:'absolute',left:LINE.left-scroll,top:540-S*.6,height:S*1.2,fontFamily:SANS,fontSize:S,lineHeight:`${S*1.2}px`,fontWeight:500,color:INK,whiteSpace:'nowrap',willChange:'transform'}}>
   {L.segs.map((s,i)=>{if(t<s.start)return null;const st=s.seg.style,m=morphOf(sch[i],t),text=Array.from(s.seg.text).slice(0,s.shown).join(''),active=st&&t>=s.typed-.1&&t<s.end+.5;
    const style:React.CSSProperties=st==='heavy'?{fontVariationSettings:`"wght" ${lerp(500,700,m)}`,WebkitTextStroke:`${m*3}px ${INK}`,transform:`scaleX(${1+.2*m})`,transformOrigin:'0 50%',display:'inline-block'}:st==='light'?{fontVariationSettings:`"wght" ${lerp(500,150,m)}`}:st==='breathe'?{letterSpacing:`${m*.42}em`}:st==='lean'?{display:'inline-block',fontFamily:m>.5?KAI:SANS,transform:`skewX(${-16*m}deg) translateX(${Math.sin(m*Math.PI)*26}px)`,filter:`blur(${Math.sin(m*Math.PI)*5}px)`}:{};
    return <div key={i} style={{position:'absolute',left:s.x,top:0,width:s.w,height:S*1.2}}>
     {st==='voice'?<div style={{position:'absolute',left:-6,top:14,width:(s.w+12)*m,height:S*1.2-28,background:'#8FB4FF',opacity:.55}}/>:null}
     {st==='pixel'&&m>0?<div style={{opacity:m>.02?1:0}}><PixelWord text={s.seg.text} size={S} m={m}/></div>:<span style={style}>{text}</span>}
     {st==='voice'?<svg width={s.w} height={30} style={{position:'absolute',left:0,top:S*1.2-4,opacity:m}}>{Array.from({length:Math.floor(s.w/9)},(_,k)=>{const h=4+Math.abs(Math.sin(k*.7+t*7))*24;return <rect key={k} x={k*9} y={(30-h)/2} width={4} height={h} rx={2} fill={BLUE}/>;})}</svg>:null}
     {active?<div style={{position:'absolute',left:-14,top:2,width:s.w+28,height:S*1.2-4,border:`2px solid ${BLUE}`,opacity:smooth((t-s.typed+.1)/.2)*(1-smooth((t-s.end-.2)/.3))}}/>:null}
     {st&&t>=s.typed-.15?<Tag x={i%2?s.w+18:-18} y={i%2?S*1.2+6+Math.sin(t*2+i)*6:-34+Math.sin(t*2+i)*6} flip={!(i%2)} name={s.seg.tag!} color={LINE.colors[i%LINE.colors.length]} o={smooth((t-s.typed+.15)/.25)*(1-smooth((t-s.end-1.4)/.4)*(st==='pixel'?0:1))}/>:null}
    </div>;})}
   {t<L.lineEnd+.3?<div style={{position:'absolute',left:L.caret+8,top:S*.1,width:6,height:S,background:INK,opacity:t<L.lineEnd&&Math.floor(t*2.4)%2===0?1:t<L.lineEnd?.85:0}}/>:null}
   {t>=L.lineEnd?c.roles.concat(c.roles).map((name,k)=>{const at=L.lineEnd+.12+k*.085,q=smooth((t-at)/.4),a=hash(k)*Math.PI*2,r=lerp(900,150+hash(k+40)*190,q);return <Tag key={k} x={pix.x+pix.w/2+Math.cos(a)*r*1.25} y={S*.6+Math.sin(a)*r*.62} name={name} color={LINE.colors[k%LINE.colors.length]} o={q} flip={Math.cos(a)<0}/>;}):null}
  </div>
 </AbsoluteFill>;
}
// 字墙：同一个词用各种字重、宽窄、字体铺满，整面墙带倾斜并缓慢横移。
const VARIANTS:React.CSSProperties[]=[
 {fontFamily:SANS,fontVariationSettings:'"wght" 700',WebkitTextStroke:`6px ${INK}`},{fontFamily:SANS,fontVariationSettings:'"wght" 150'},{fontFamily:SONG,fontWeight:900},{fontFamily:KAI,transform:'skewX(-10deg)'},
 {fontFamily:PIXEL},{fontFamily:SANS,fontVariationSettings:'"wght" 700',color:'transparent',WebkitTextStroke:`3px ${INK}`},{fontFamily:SANS,fontVariationSettings:'"wght" 700',background:INK,color:PAPER,padding:'0 18px'},
 {fontFamily:SANS,fontVariationSettings:'"wght" 700',transform:'scaleX(1.45)'},{fontFamily:SONG,transform:'scale(.62,1.3)'},{fontFamily:MONO,letterSpacing:'.2em',fontWeight:500},{fontFamily:SANS,fontVariationSettings:'"wght" 600',color:BLUE},{fontFamily:SANS,fontVariationSettings:'"wght" 700',WebkitTextStroke:`4px ${INK}`,transform:'skewX(12deg)'}];
function Wall({t,c,start,end}:{t:number;c:PaperLineConfig;start:number;end:number}){
 const u=t-start,zoom=lerp(2.3,1,smooth(u/1.3)),cols=9,rows=7,cw=350,chh=205,out=smooth((t-end+.5)/.5);
 return <AbsoluteFill style={{opacity:smooth(u/.25)*(1-out*.0)}}>
  <div style={{position:'absolute',left:960,top:540,width:0,height:0,transform:`scale(${zoom*(1+u*.012)}) rotate(${-8*smooth(u/1.6)}deg) translate(${-u*46}px,${-u*10}px)`,willChange:'transform'}}>
   {Array.from({length:cols*rows},(_,i)=>{const col=i%cols,row=Math.floor(i/cols),x=(col-(cols-1)/2)*cw+(row%2?cw/2:0),y=(row-(rows-1)/2)*chh,d=Math.hypot(x,y),q=smooth((u-d*.0009)/.35),center=col===4&&row===3;
    const v=(i*5+row*3+Math.floor((u+hash(i)*2)/(.55+hash(i+9)*.9)))%VARIANTS.length,boxed=hash(i+3)>.8;
    return <div key={i} style={{position:'absolute',left:x-cw/2,top:y-chh/2,width:cw,height:chh,display:'flex',alignItems:'center',justifyContent:'center',opacity:center?1:q,fontSize:124,lineHeight:1,color:INK,whiteSpace:'nowrap'}}>
     <span style={{display:'inline-block',...VARIANTS[center&&u<.9?10:v]}}>{c.wallWord}</span>
     {boxed&&q>0?<><div style={{position:'absolute',inset:'14px 18px',border:`2px solid ${BLUE}`,opacity:q}}/><Tag x={cw-30} y={chh-34} name={c.roles[i%c.roles.length]} color={LINE.colors[i%LINE.colors.length]} o={q}/></>:null}
    </div>;})}
  </div>
 </AbsoluteFill>;
}
// 像素化的黑色涌进来；回到纸面时再被纸色吃掉。
function Wipe({pin,pout}:{pin:number;pout:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const g=ref.current!.getContext('2d')!;g.clearRect(0,0,96,54);g.fillStyle='#0B0B0C';for(let y=0;y<54;y++)for(let x=0;x<96;x++){const n=hash(x*57+y*131)*.14,a=Math.hypot(x-8,y-48)/100+n,b=Math.hypot(x-90,y-6)/100+n;if(a<pin*1.25&&!(b<pout*1.25))g.fillRect(x,y,1,1);}},[pin,pout]);
 return <canvas ref={ref} width={96} height={54} style={{position:'absolute',inset:0,width:1920,height:1080,imageRendering:'pixelated'}}/>;
}
function Poster({t,c,start,end}:{t:number;c:PaperLineConfig;start:number;end:number}){
 const u=t-start,out=smooth((t-end+.35)/.35);
 return <AbsoluteFill style={{opacity:smooth((u-.1)/.3)*(1-out),color:PAPER,fontFamily:SANS,transformOrigin:'30% 50%',transform:`scale(${1+u*.014})`,willChange:'transform'}}>
  {c.poster.map((line,i)=>{const q=smooth((u-.25-i*.22)/.4),boldAt=1.5+i*.85,b=smooth((u-boldAt)/.16),flash=u>=boldAt&&u<boldAt+.22,n=Array.from(line).length;
   return <div key={i} style={{position:'absolute',left:250,top:95+i*295,height:280,display:'flex',alignItems:'center'}}>
    <span style={{display:'inline-block',fontSize:250,lineHeight:1,letterSpacing:lerp(.06,-.02,b)+'em',fontVariationSettings:`"wght" ${lerp(150,700,b)}`,WebkitTextStroke:`${b*5}px ${flash?INK:PAPER}`,background:flash?PAPER:'transparent',color:flash?INK:PAPER,clipPath:`inset(0 ${(1-q)*100}% 0 0)`,transform:`scaleX(${lerp(.9,1.06,b)})`,transformOrigin:'0 50%'}}>{line}</span>
    {u>boldAt-.3?<Tag x={n*250*lerp(.9,1.06,b)+30} y={40+i*30} name={c.roles[(i*2+1)%c.roles.length]} color={LINE.colors[(i*2+1)%8]} o={smooth((u-boldAt+.3)/.25)}/>:null}
   </div>;})}
  {c.roles.slice(0,4).map((name,k)=>{const at=3.9+k*.18,q=smooth((u-at)/.3);return <Tag key={k} x={1250+hash(k+7)*420} y={200+hash(k+17)*640} name={name} color={LINE.colors[(k+3)%8]} o={q} flip={k%2===0}/>;})}
 </AbsoluteFill>;
}
function Block({t,c,start,end}:{t:number;c:PaperLineConfig;start:number;end:number}){
 const u=t-start,S=840,x=540,y=120,q=smooth(u/.35),out=smooth((t-end+.3)/.3),rows=c.block.rows;
 const row=(i:number,top:number,h:number,node:React.ReactNode)=><div key={i} style={{position:'absolute',left:0,top,width:S,height:h,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>{node}</div>;
 const r0=smooth((u-.35)/.3),r0b=smooth((u-.95)/.18),r1=smooth((u-1.5)/.35),r2=smooth((u-2.3)/.3);
 return <AbsoluteFill style={{opacity:1-out,fontFamily:SANS}}>
  <div style={{position:'absolute',left:x,top:y-44,color:PAPER,fontSize:26,opacity:q}}>{c.block.label}</div>
  <div style={{position:'absolute',left:x,top:y,width:S,height:S,background:BLUE,opacity:q,transform:`scale(${lerp(.94,1,q)+u*.02})`,backgroundImage:'linear-gradient(#3F6FD066 2px,transparent 2px),linear-gradient(90deg,#3F6FD066 2px,transparent 2px)',backgroundSize:'168px 168px',overflow:'hidden'}}>
   {row(0,10,300,<span style={{fontSize:262,lineHeight:1,color:INK,fontVariationSettings:`"wght" ${lerp(150,700,r0b)}`,WebkitTextStroke:`${r0b*12}px ${INK}`,clipPath:`inset(0 ${(1-r0)*100}% 0 0)`,transform:'scaleX(1.02)'}}>{rows[0]}</span>)}
   {row(1,300,220,<span style={{fontSize:200,lineHeight:1,color:'transparent',WebkitTextStroke:`3px ${INK}`,letterSpacing:'.12em',clipPath:`inset(0 ${(1-r1)*100}% 0 0)`}}>{rows[1]}</span>)}
   <div style={{position:'absolute',left:0,top:520,width:S*r2,height:320,background:INK}}/>
   {row(2,520,320,<span style={{fontSize:290,lineHeight:1,color:PAPER,fontVariationSettings:'"wght" 700',WebkitTextStroke:`10px ${PAPER}`,letterSpacing:'.08em',opacity:smooth((u-2.5)/.25),transform:`scaleX(${lerp(.8,1,smooth((u-2.5)/.4))})`}}>{rows[2]}</span>)}
  </div>
  {c.roles.slice(0,6).map((name,k)=>{const at=.9+k*.42,pos=[[x-40,y+150],[x+S+20,y+90],[x-60,y+430],[x+S+30,y+400],[x+120,y+S+14],[x+S-140,y+S+20]][k];return <Tag key={k} x={pos[0]+Math.sin(t*2+k)*8} y={pos[1]+Math.cos(t*1.7+k)*6} name={name} color={LINE.colors[k]} o={smooth((u-at)/.25)} flip={k%2===0}/>;})}
 </AbsoluteFill>;
}
function Outro({t,c,start}:{t:number;c:PaperLineConfig;start:number}){
 const u=t-start,g=smooth((u-.5)/.9),mark=smooth((u-1.35)/.3),n=Array.from(c.brand).length,count=Math.floor(n*smooth((u-1.7)/.8)*1.0001);
 return <AbsoluteFill style={{opacity:smooth((u-.25)/.3),color:INK,fontFamily:SANS}}>
  {SQ.map(([dx,dy,col,r],i)=>{const a=hash(i+60)*Math.PI*2,x=lerp(820+Math.cos(a)*620,820+dx*.18,g),y=lerp(500+Math.sin(a)*380,500+dy*.18,g);return <Square key={i} x={x-430} y={y-10} size={lerp(96,70,g)} color={col} o={smooth((u-.3-i*.08)/.3)*(1-mark)} r={r*(1-g)}/>;})}
  <div style={{position:'absolute',left:0,right:0,top:455,display:'flex',alignItems:'center',justifyContent:'center',gap:34,transform:`scale(${1+Math.max(0,u-1.3)*.012})`}}>
   <div style={{opacity:mark,transform:`scale(${lerp(.6,1,mark)})`}}><Mark size={150} cutout={PAPER}/></div>
   <div style={{fontSize:132,fontWeight:600,letterSpacing:-3,minWidth:n*132,whiteSpace:'nowrap'}}>{Array.from(c.brand).slice(0,count).join('')}<span style={{display:'inline-block',width:6,height:120,marginLeft:10,verticalAlign:'-12px',background:INK,opacity:u>1.6&&u<3.3&&Math.floor(t*2.4)%2===0?1:0}}/></div>
  </div>
  <div style={{position:'absolute',left:0,right:0,top:680,textAlign:'center',fontFamily:MONO,fontSize:36,color:'#55585C',opacity:smooth((u-2.7)/.4)}}>{c.tagline}</div>
 </AbsoluteFill>;
}

export const PaperLine:React.FC<PaperLineProps>=({config:c,audio=true})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;if(!c)return null;
 const sc=paperScenes(c),s=paperSceneAt(t,c),by=(id:string)=>sc.find(x=>x.id===id)!,dk=paperDark(t,c),wall=by('wall'),poster=by('poster'),block=by('block'),outro=by('outro');
 const isDark=dk.on&&dk.in>.5&&dk.out<.5,amount=t<wall.start-.3?.5:t<poster.start-.2?lerp(.5,0,smooth((t-wall.start+.3)/.4)):t<outro.start?.85:lerp(.85,.72,smooth((t-outro.start)/1));
 return <AbsoluteFill style={{background:PAPER,overflow:'hidden'}}>
  <FontGate text={JSON.stringify(c)+'·:-*omg0123456789'}/><PixelFonts text={c.wallWord+c.brand}/>
  {audio?<Audio src={staticFile(c.audio)}/>:null}
  {s.id==='intro'||t<c.timing.lineAt+.1?<Intro t={t} c={c}/>:null}
  {t>=c.timing.lineAt-.05&&t<wall.start+.05?<Line t={t} c={c}/>:null}
  {t>=wall.start-.25&&t<poster.start+.5?<Wall t={t} c={c} start={wall.start-.25} end={wall.end}/>:null}
  {dk.on?<Wipe pin={dk.in} pout={dk.out}/>:null}
  <Texture t={t} amount={amount} dark={isDark} chars={c.texture}/>
  {t>=poster.start-.1&&t<poster.end?<Poster t={t} c={c} start={poster.start} end={poster.end}/>:null}
  {t>=block.start&&t<block.end+.1?<Block t={t} c={c} start={block.start} end={block.end}/>:null}
  {t>=outro.start?<Outro t={t} c={c} start={outro.start}/>:null}
  <svg width={1920} height={1080} style={{position:'absolute',inset:0,pointerEvents:'none',mixBlendMode:'multiply',opacity:isDark?0:1}}><filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={4}/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .1 0"/></filter><rect width={1920} height={1080} filter="url(#paper-grain)"/></svg>
 </AbsoluteFill>;
};
export const paperLineMetadata:CalculateMetadataFunction<PaperLineProps>=async({props})=>{const config:PaperLineConfig=props.config??await fetch(staticFile('paper-line/line.json')).then(r=>r.json());validatePaperLine(config);return {durationInFrames:Math.round(config.duration*LINE.fps),fps:LINE.fps,width:1920,height:1080,props:{...props,config}};};
