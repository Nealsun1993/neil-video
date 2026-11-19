import React,{useRef,useLayoutEffect} from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction} from 'remotion';
import {PixelFonts} from '../kit/PixelFonts';
import {PIXEL as P,PIXEL_FONT,PIXEL_MONO,pixelEase as E,pixelTyped} from '../kit/pixelDesign';
import {PromoStory,promoSceneAt,validatePromo} from '../kit/pixelPromo';
import {worldCards,worldNarrative,worldHash as H} from '../kit/pixelWorld';
import {PixelPromo,PixelPromoProps} from './PixelPromo';
import {envAt} from '../kit/types';
export const R:React.FC<any>=({x,y,w,h,fill=P.ink,...props})=><rect x={Math.round(x)} y={Math.round(y)} width={Math.max(0,Math.round(w))} height={Math.max(0,Math.round(h))} fill={fill} {...props}/>;
export const T:React.FC<any>=({x,y,size=12,fill=P.ink,children,center=false,...props})=><text x={x} y={y} fontSize={size} fill={fill} textAnchor={center?'middle':'start'} fontFamily={PIXEL_FONT} {...props}>{children}</text>;
export function Glyph({kind,x=0,y=0,scale=1,color=P.warm}:any){
 const paths:Record<string,string[]>={doc:['11111000','10001100','10000100','10110100','10000100','10110100','10000100','11111100'],mic:['00110000','01111000','01111000','01111000','10110100','10000100','01111000','00110000'],film:['11111111','10101010','11111111','10000001','10011001','10011001','10000001','11111111'],mark:['11111110','10000010','10000010','10010010','10000010','10000010','11111110','00000000']};
 return <g transform={`translate(${Math.round(x)} ${Math.round(y)}) scale(${scale})`}>{(paths[kind]??paths.doc).flatMap((row,j)=>[...row].map((v,i)=>v==='1'?<R key={i+'-'+j} x={i} y={j} w={1} h={1} fill={color}/>:null))}</g>;
}
export function Window({x,y,w,h,light=false,children}:any){return <g><R x={x+3} y={y+4} w={w} h={h} fill="#000"/><R x={x} y={y} w={w} h={h} fill={light?'#e7dfca':'#4a5158'}/><R x={x+1} y={y+1} w={w-2} h={h-2} fill={light?'#e9e6d9':'#080d10'}/><R x={x+2} y={y+2} w={w-4} h={9} fill={light?'#cfcbbd':'#151b20'}/>{[0,1,2].map(i=><R key={i} x={x+5+i*5} y={y+5} w={2} h={2} fill={[P.accent,P.muted,P.ok][i]}/>)}{children}</g>;}
export function MiniArt({variant=0,t=0}:any){
 const n=variant%6;
 return <g><R x={0} y={0} w={96} h={64} fill={['#e8e4d6','#111b2b','#ec6c2d','#122a35','#e2dfd2','#10171f'][n]}/>
  {n===0?<><T x={6} y={22} size={18} fill="#111">STORY</T><T x={7} y={39} size={11} fill="#111">一句话的旅程</T><path d="M7 48h70m-12-7 12 7-12 7" stroke="#e9662c" fill="none" strokeWidth={2}/></>:null}
  {n===1?<>{Array.from({length:22},(_,i)=><R key={i} x={5+i*4} y={30-Math.abs(Math.sin(i*.83+t))*18} w={2} h={Math.abs(Math.sin(i*.83+t))*36+2} fill={P.accent}/>)}<T x={6} y={58} size={8}>VOICE / MOTION</T></>:null}
  {n===2?<><T x={7} y={26} size={23} fill="#101010">MAKE</T><T x={7} y={49} size={23} fill="#101010">IT MOVE</T></>:null}
  {n===3?<>{[0,1,2,3,4].map(i=><g key={i}><line x1={48} y1={30} x2={10+i*18} y2={i%2?52:10} stroke={P.warm}/><R x={7+i*18} y={i%2?48:6} w={8} h={8} fill={i%2?P.ok:P.accent}/></g>)}<R x={43} y={25} w={10} h={10} fill={P.ink}/></>:null}
  {n===4?<><path d="M3 53 29 16 46 40 62 23 94 53Z" fill="#132735"/><path d="m24 24 5-8 7 10-7-3Z" fill="#faf5e7"/><R x={72} y={7} w={12} h={12} fill={P.accent}/><T x={6} y={61} size={7} fill="#112534">A PIXEL WORLD</T></>:null}
  {n===5?<>{[0,1,2].map(i=><g key={i}><R x={6+i*30} y={12} w={25} h={37} fill={i===Math.floor(t)%3?P.accent:'#294257'}/><Glyph x={11+i*30} y={20} scale={2} kind={['doc','mic','film'][i]}/></g>)}<T x={6} y={60} size={8}>SCENE / 0{variant+1}</T></>:null}
 </g>;
}
function Atmosphere({kind,u,t}:any){
 const ref=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const g=ref.current!.getContext('2d')!;g.imageSmoothingEnabled=false;g.fillStyle='#03070a';g.fillRect(0,0,480,270);
  const matrix=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(let y=0;y<270;y+=2)for(let x=0;x<480;x+=2){const dx=(x-240)/230,dy=(y-140)/135,r=Math.sqrt(dx*dx+dy*dy),b=matrix[(y/2%4)*4+x/2%4];if(b<Math.max(0,(1-r)*5)){g.fillStyle=r<.45?'#37251e':r<.75?'#172432':'#0c1723';g.fillRect(x,y,2,2);}}
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  if(kind==='city'){
   rect(371,36,17,17,'#e5b780');
   for(let layer=0;layer<3;layer++)for(let i=-1;i<18;i++){
    const sp=4+layer*7,off=u*sp,w=22+H(i+layer*77)*23,x=((i*39-off)%690+690)%690-70,height=30+H(i*11+layer*29)*105,y=217-height+layer*8;
    rect(x,y,w,height, ['#0e1925','#122536','#1b3141'][layer]);
    for(let r=0;r<height-8;r+=9)for(let c=4;c<w-3;c+=7)if(H(i*47+r+c+layer)>.55)rect(x+c,y+r+5,2,3,layer===2?'#c38b51':'#46554e');
   }
   rect(0,237,480,33,'#03070a');for(let i=0;i<20;i++)rect(((i*38-u*48)%760+760)%760-50,248,17,2,'#76503c');
   const sx=50+E(u/4.8)*380,sy=100+25*Math.sin(u*1.25);for(let j=20;j>=0;j--)rect(sx-j*4,sy+Math.sin(j*.1)*7,Math.max(1,4-j*.12),2,j>8?'#674333':P.accent);rect(sx,sy-1,4,4,P.warm);
  }else if(kind==='tunnel'){
   const p=u*.35;
   for(let i=0;i<45;i++){const a=i*2.399,near=((H(i)*1.7+p)%1.7),r=near*near*270;g.strokeStyle=i%3===0?'#ad704b':'#48515b';g.beginPath();g.moveTo(240+Math.cos(a)*r,135+Math.sin(a)*r*.58);g.lineTo(240+Math.cos(a)*(r+10+near*18),135+Math.sin(a)*(r+10+near*18)*.58);g.stroke();}
  }else if(['signal','typevoice','bigtype'].includes(kind)){
   for(let i=0;i<8;i++){const y=45+i*28,x=((u*(i%2?55:-43)+i*77)%650+650)%650-180;rect(x,y,90+i*9,1,'#714b37');}
   if(kind==='signal'||kind==='typevoice')for(let i=0;i<110;i++){const x=20+i*4,h=(4+Math.abs(Math.sin(i*.19+u*2)*Math.cos(i*.47))*22)*E(u/.8);rect(x,201-h/2,2,h,i%7===0?P.warm:P.accent);}
  }else{
   for(let i=0;i<24;i++){const x=H(i*17)*480,y=(H(i*7)*270+t*(2+H(i)*5))%270;rect(x,y,1,1,i%3===0?'#6a4935':'#294254');}
  }
 },[kind,u,t]);
 return <canvas ref={ref} width={480} height={270} style={{position:'absolute',inset:0,width:1920,height:1080,imageRendering:'pixelated'}}/>;
}
function Hub({u}:any){
 const points=[{x:15,y:60,name:'文案'},{x:15,y:133,name:'配音'},{x:15,y:206,name:'时间轴'},{x:335,y:60,name:'字幕'},{x:335,y:133,name:'横屏'},{x:335,y:206,name:'竖屏'}];
 return <g transform={`translate(240 137) scale(${1+.85*(1-E((u-.3)/1.4))}) translate(-240 -137)`}>{[80,64,48].map((r,i)=><circle key={r} cx={240} cy={137} r={r+Math.sin(u*2)*2} fill="none" stroke={i===2?'#7d5138':'#352a27'} strokeWidth={i===2?2:1}/>)}{points.map((p,i)=>{const q=E((u-i*.12)/.65),endx=p.x<240?p.x+130:p.x;const k=(u*.6+i*.13)%1;return <g key={i} opacity={q}><line x1={240} y1={137} x2={endx} y2={p.y+9} stroke={P.accent} strokeWidth={1}/><R x={240+(endx-240)*k-1} y={137+(p.y+9-137)*k-1} w={3} h={3}/><R x={p.x} y={p.y} w={130} h={18} fill="#060b0f" stroke="#4a5154"/><R x={p.x+6} y={p.y+7} w={3} h={3} fill={P.accent}/><T x={p.x+15} y={p.y+13} size={10}>{p.name}</T></g>;})}<circle cx={240} cy={137} r={34} fill="#05090a" stroke="#6e4935"/><Glyph kind="mark" x={226} y={123} scale={4} color={P.accent}/><g transform={`translate(205 229) rotate(-6)`} opacity={E((u-2.2)/.4)}><R x={0} y={0} w={73} h={17} fill="none" stroke={P.accent}/><T x={36} y={12} size={10} fill={P.accent} center>CONNECTED</T></g></g>;
}
function Duo({u}:any){return <g><Window x={12} y={48} w={211} h={174}><T x={24} y={75} size={10} fill={P.warm}>创作指令 / 概念示意</T><R x={23} y={85} w={188} h={40} fill="none" stroke="#736153"/><T x={29} y={101} size={9}>{pixelTyped('让一段讲解，变成像素短片。',u,.25)}</T>{['保留声音的节奏','把关键词变成画面','让场景接着场景'].map((v,i)=><g key={v} opacity={E((u-.9-i*.4)/.25)}><R x={25} y={141+i*22} w={3} h={3} fill={P.ok}/><T x={34} y={146+i*22} size={9}>{pixelTyped(v,u,1+i*.4)}</T></g>)}</Window><Window x={244} y={39} w={224} h={191} light><T x={356} y={66} size={9} fill="#4c4c43" center>画面预演 / 示意</T><g transform={`translate(257 77) scale(2.05)`}><MiniArt variant={u<1.8?0:u<2.8?2:4} t={u}/></g><T x={356} y={222} size={8} fill="#4d5148" center>WORDS BECOME A WORLD</T></Window><R x={228} y={134} w={10} h={2} fill={P.accent}/><R x={233} y={130} w={2} h={10} fill={P.accent}/></g>;}
function Narrative({u,ep,env}:any){
 const cards=worldNarrative(u,ep.shots[0].props.modules.items),gather=E((u-9.82)/1.5),at=ep.shots[0].props.cues,coreY=132+55*E((u-3.4)/1.4);
 return <g>{cards.map((c,i)=>{const q=c.connected?P.ok:c.active?P.accent:'#4a5a69';return <g key={i} opacity={c.opacity}><line x1={240} y1={coreY} x2={c.x} y2={c.y} stroke={q} strokeWidth={c.connected?2:1}/><g transform={`translate(${c.x} ${c.y}) scale(${c.scale})`}><R x={-30} y={-29} w={60} h={60} fill="#09121a" stroke={q} strokeWidth={2}/><Glyph x={-16} y={-20} scale={4} kind={['doc','mic','film'][i]} color={c.active?P.warm:'#576677'}/><T x={0} y={22} size={10} center>{['文案','配音','画面'][i]}</T></g></g>;})}
  <circle cx={240} cy={coreY} r={Math.max(6,25*(1-gather))} fill="#060b0e" stroke={u>=7.8?P.accent:'#3d4a52'} strokeWidth={2}/><Glyph x={233} y={coreY-7} scale={2} kind="mark" color={u>=7.8?P.accent:P.muted}/>
  {u<3.4?<><T x={240} y={83} size={u<2.3?17:22} fill={P.warm} center>{u<2.3?'声音，正在组织画面。':'关键词：工具'}</T>{Array.from({length:60},(_,i)=>{const h=3+envAt(env,i/60*at.boxAt)*15;return <R key={i} x={120+i*4} y={194-h/2} w={2} h={h} fill={i/60*at.boxAt<=u?P.accent:'#344661'}/>;})}</>:<T x={240} y={65} size={16} fill={gather>.9?P.ok:P.ink} center>{gather>.9?'三个模块，连成工作流。':u>=7.8?'一个统筹者，把它们连起来。':'说到哪个，就点亮哪个。'}</T>}
  {u>=9.82?<T x={240} y={207} size={12} fill={P.ok} center opacity={gather}>声音 &gt; 模块 &gt; 完整叙事</T>:null}
 </g>;
}
function Tunnel({u}:any){return <g>{worldCards(u).map(c=><g key={c.id} transform={`translate(${c.x} ${c.y}) scale(${c.scale}) rotate(${c.rotate})`}><R x={-50} y={-34} w={100} h={68} fill="#d5cdbb"/><g transform="translate(-48 -32)"><MiniArt variant={c.id} t={u}/></g></g>)}</g>;}
function Formats({u}:any){const p=E((u-.4)/1.4);return <g><g transform={`translate(${45+(1-p)*80} ${87+(1-p)*20}) rotate(${-5*(1-p)})`}><R x={-2} y={-2} w={258} h={148} fill={P.accent}/><g transform="scale(2.65 2.25)"><MiniArt variant={4} t={u}/></g></g><g transform={`translate(${337+(1-p)*150} ${37}) rotate(${7*(1-p)})`}><R x={-2} y={-2} w={92} h={182} fill={P.warm}/><R x={0} y={0} w={88} h={178} fill="#ec6c2d"/><T x={44} y={40} size={24} fill="#131718" center>MAKE</T><T x={44} y={69} size={22} fill="#131718" center>IT</T><T x={44} y={98} size={23} fill="#131718" center>MOVE</T><Glyph x={26} y={121} scale={5} kind="film" color="#111b21"/></g><T x={172} y={254} size={10} center>16:9 / 横向展开</T><T x={381} y={239} size={10} center>9:16 / 纵向聚焦</T></g>;}
function Assemble({u}:any){const q=E((u-.4)/2);return <g>{Array.from({length:36},(_,i)=>{const row=Math.floor(i/9),col=i%9,x=132+col*24,y=79+row*24,dx=(H(i*2)-.5)*600,dy=(H(i*2+1)-.5)*400;return <R key={i} x={x+dx*(1-q)} y={y+dy*(1-q)} w={21} h={21} fill={i%4===0?P.accent:i%3===0?'#e4dccb':'#244054'} opacity={.4+.6*q}/>;})}<R x={129} y={76} w={222} h={102} fill="none" stroke={P.warm} strokeWidth={1} opacity={q}/><T x={240} y={209} size={16} center opacity={E((u-2.3)/.4)}>自由设计，保持叙事。</T></g>;}
export type PixelWorldProps=PixelPromoProps & {baseStory?:PromoStory};
export const PixelWorld:React.FC<PixelWorldProps>=({story,baseStory,ep,env,audio=true})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;if(!story||!baseStory||!ep||!env)return null;
 const s=promoSceneAt(story,t),u=t-s.start,kind=s.kind,caption=kind==='narrative'?ep.captions.find(c=>t-16>=c.start&&t-16<c.end):null;
 const isType=['signal','typevoice','bigtype'].includes(kind),headline=kind==='bigtype'?['画面。','节奏。','叙事。'][Math.min(2,Math.floor(u/1.6))]:kind==='typevoice'?'声音。':'让想法，';
 const wordAt=kind==='bigtype'?u%1.6:u;
 const wipe=E(u/.22),sceneIndex=story.scenes.indexOf(s);
 return <AbsoluteFill style={{background:P.bg,fontFamily:PIXEL_FONT,color:P.ink}}>
  <PixelFonts text={JSON.stringify(story)+JSON.stringify(ep)}/>{audio?<Audio src={staticFile(story.audio)}/>:null}
  {t>=54?<PixelPromo story={baseStory} ep={ep} env={env} audio={false}/>:<>
   <Atmosphere kind={kind} u={u} t={t}/>
   <svg viewBox="0 0 480 270" width="1920" height="1080" style={{position:'absolute',inset:0}} shapeRendering="crispEdges">
    {kind==='duo'?<Duo u={u}/>:kind==='hub'?<Hub u={u}/>:kind==='narrative'?<Narrative u={u} ep={ep} env={env}/>:kind==='tunnel'?<Tunnel u={u}/>:kind==='formats'?<Formats u={u}/>:kind==='assemble'?<Assemble u={u}/>:null}
    {isType?<><T x={240} y={kind==='signal'?115:145} size={kind==='bigtype'?48:kind==='typevoice'?43:32} center fill={kind==='bigtype'&&Math.floor(u/1.6)===1?P.accent:P.ink}>{pixelTyped(headline,wordAt,.08)}</T>{kind==='signal'?<T x={240} y={159} size={32} fill={P.accent} center>{pixelTyped('开始流动。',u,.65)}</T>:null}{kind==='typevoice'?<T x={240} y={108} size={10} center fill={P.muted}>EVERY STORY STARTS WITH A VOICE</T>:null}</>:null}
   </svg>
   <div style={{position:'absolute',left:68,top:44,fontFamily:PIXEL_MONO,fontSize:24,color:P.muted}}>PIXEL WORLD / {String(sceneIndex+1).padStart(2,'0')}</div>
   {kind==='tunnel'?<div style={{position:'absolute',left:60,bottom:60,padding:'10px 18px',background:'#03070ae8',fontSize:40}}>穿过画面，遇见不同表达。</div>:null}
   {kind==='city'?<div style={{position:'absolute',left:80,top:80,fontSize:64,lineHeight:1.5}}><div>{pixelTyped('让一个信号，',u,.1)}</div><div style={{color:P.accent}}>{pixelTyped('穿过整个世界。',u,.55)}</div></div>:null}
   {['duo','typevoice'].includes(kind)?<div style={{position:'absolute',left:80,bottom:76,width:1760,textAlign:'center',fontSize:40,color:kind==='typevoice'?P.warm:P.ink}}>{kind==='duo'?'一句指令，画面回应。':'是故事的起点。'}</div>:null}
   {caption?<div style={{position:'absolute',left:80,top:944,width:1760,textAlign:'center',fontSize:48}}>{caption.text}</div>:null}
   {kind==='narrative'?<div style={{position:'absolute',left:80,bottom:30,fontSize:24,color:P.muted}}>原演示配音 / 像素叙事示意</div>:null}
   {kind==='hub'?<div style={{position:'absolute',left:80,top:92,width:1760,fontSize:36,textAlign:'center',color:P.muted}}>让每个元素，找到自己的位置。</div>:null}
   {kind==='bigtype'?<div style={{position:'absolute',left:80,bottom:80,width:1760,fontSize:32,textAlign:'center',color:P.muted}}>不同内容，用不同的视觉语言。</div>:null}
   {u<.22&&sceneIndex>0&&kind!=='narrative'?<div style={{position:'absolute',inset:0,background:sceneIndex%2?'#03070a':P.accent,clipPath:sceneIndex%2?`inset(0 ${Math.round(wipe*100)}% 0 0)`:`inset(${Math.round(wipe*100)}% 0 0 0)`}}/>:null}
  </>}
 </AbsoluteFill>;
};
export const pixelWorldMetadata:CalculateMetadataFunction<PixelWorldProps>=async()=>{
 const read=(p:string)=>fetch(staticFile(p)).then(r=>r.json());
 const [story,baseStory,ep,env]=await Promise.all([read('episodes/pixel-world/story.json'),read('episodes/pixel-minute/story.json'),read('episodes/pixel-demo/episode.json'),read('episodes/story-demo/envelope.json')]);validatePromo(story);ep.format='landscape';
 return {durationInFrames:1800,props:{story,baseStory,ep,env}};
};
