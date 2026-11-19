import React,{useRef,useLayoutEffect}from'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction}from'remotion';
import {PixelFonts}from'../kit/PixelFonts';
import {PIXEL as P,PIXEL_FONT,PIXEL_MONO,pixelEase as E,pixelTyped}from'../kit/pixelDesign';
import {promoSceneAt}from'../kit/pixelPromo';
import {worldHash as H}from'../kit/pixelWorld';
import {portraitCards,portraitHubNodes,portraitNarrative}from'../kit/pixelWorldPortrait';
import {R,T,Glyph,Window,MiniArt,PixelWorldProps,pixelWorldMetadata}from'./PixelWorld';
import {envAt}from'../kit/types';
function VerticalAtmosphere({kind,u,t}:any){
 const ref=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const g=ref.current!.getContext('2d')!;g.imageSmoothingEnabled=false;g.fillStyle='#03070a';g.fillRect(0,0,270,480);
  const matrix=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(let y=0;y<480;y+=2)for(let x=0;x<270;x+=2){const dx=(x-135)/135,dy=(y-235)/230,r=Math.sqrt(dx*dx+dy*dy),b=matrix[(y/2%4)*4+x/2%4];if(b<Math.max(0,(1-r)*5)){g.fillStyle=r<.4?'#37251e':r<.73?'#172432':'#0c1723';g.fillRect(x,y,2,2);}}
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  if(kind==='city'){
   rect(217,147,14,14,'#e5b780');
   for(let layer=0;layer<3;layer++)for(let i=-1;i<15;i++){
    const x=((i*34-u*(4+layer*7))%510+510)%510-65,w=20+H(i+layer*77)*19,h=44+H(i*11+layer*29)*139,y=400-h+layer*6;
    rect(x,y,w,h,['#0e1925','#122536','#1b3141'][layer]);
    for(let r=0;r<h-8;r+=9)for(let c=4;c<w-3;c+=7)if(H(i*47+r+c+layer)>.55)rect(x+c,y+r+5,2,3,layer===2?'#c38b51':'#46554e');
   }
   rect(0,418,270,62,'#03070a');for(let i=0;i<14;i++)rect(((i*32-u*48)%500+500)%500-50,431,13,2,'#76503c');
   const sx=25+E(u/4.8)*220,sy=228-56*Math.sin(u*.75);for(let j=15;j>=0;j--)rect(sx-j*3,sy+j*.8,Math.max(1,4-j*.16),2,j>8?'#674333':P.accent);rect(sx,sy-1,4,4,P.warm);
  }else if(kind==='tunnel'){
   for(let i=0;i<45;i++){const a=i*2.399,n=(H(i)*1.7+u*.35)%1.7,r=n*n*175;g.strokeStyle=i%3===0?'#ad704b':'#48515b';g.beginPath();g.moveTo(135+Math.cos(a)*r*.7,230+Math.sin(a)*r*1.35);g.lineTo(135+Math.cos(a)*(r+10+n*18)*.7,230+Math.sin(a)*(r+10+n*18)*1.35);g.stroke();}
  }else if(['signal','typevoice','bigtype'].includes(kind)){
   for(let i=0;i<10;i++){const x=((u*(i%2?40:-33)+i*47)%470+470)%470-180;rect(x,65+i*32,80+i*7,1,'#714b37');}
   if(kind!=='bigtype')for(let i=0;i<58;i++){const h=(4+Math.abs(Math.sin(i*.19+u*2)*Math.cos(i*.47))*29)*E(u/.8);rect(20+i*4,322-h/2,2,h,i%7===0?P.warm:P.accent);}
  }else for(let i=0;i<26;i++)rect(H(i*17)*270,(H(i*7)*480+t*(2+H(i)*5))%480,1,1,i%3===0?'#6a4935':'#294254');
 },[kind,u,t]);
 return <canvas ref={ref} width={270} height={480} style={{position:'absolute',inset:0,width:1080,height:1920,imageRendering:'pixelated'}}/>;
}
function VerticalDuo({u}:any){return <g>
 <T x={135} y={56} size={15} center>一句指令，画面回应。</T>
 <Window x={20} y={77} w={230} h={132}><T x={32} y={101} size={9} fill={P.warm}>创作指令 / 概念示意</T><R x={31} y={110} w={207} h={27} fill="none" stroke="#736153"/><T x={37} y={126} size={9}>{pixelTyped('让一段讲解，变成像素短片。',u,.25)}</T>{['保留声音的节奏','把关键词变成画面','让场景接着场景'].map((v,i)=><g key={v} opacity={E((u-.9-i*.4)/.25)}><R x={33} y={151+i*17} w={3} h={3} fill={P.ok}/><T x={42} y={157+i*17} size={9}>{pixelTyped(v,u,1+i*.4)}</T></g>)}</Window>
 <R x={134} y={216} w={2} h={17} fill={P.accent}/><path d="m130 228 5 5 5-5" stroke={P.accent} fill="none"/>
 <Window x={20} y={242} w={230} h={142} light><T x={135} y={264} size={9} fill="#4c4c43" center>画面预演 / 示意</T><g transform="translate(48 271) scale(1.75)"><MiniArt variant={u<1.8?0:u<2.8?2:4} t={u}/></g></Window>
 </g>;}
function VerticalHub({u}:any){return <g>
 <T x={135} y={64} size={16} center>让每个元素，</T><T x={135} y={85} size={16} fill={P.accent} center>找到自己的位置。</T>
 <g transform={`translate(135 225) scale(${1+.85*(1-E((u-.3)/1.4))}) translate(-135 -225)`}>
 {[71,56,41].map((r,i)=><circle key={r} cx={135} cy={225} r={r+Math.sin(u*2)*2} fill="none" stroke={i===2?'#7d5138':'#352a27'} strokeWidth={i===2?2:1}/>)}
 {portraitHubNodes.map((p,i)=>{const q=E((u-.9-i*.12)/.45),k=(u*.6+i*.13)%1,ex=p.x+p.w/2,ey=p.y<225?p.y+p.h:p.y;return <g key={i} opacity={q}><line x1={135} y1={225} x2={ex} y2={ey} stroke={P.accent}/><R x={135+(ex-135)*k-1} y={225+(ey-225)*k-1} w={3} h={3}/><R x={p.x} y={p.y} w={p.w} h={p.h} fill="#060b0f" stroke="#4a5154"/><R x={p.x+5} y={p.y+9} w={3} h={3} fill={P.accent}/><T x={p.x+14} y={p.y+15} size={10}>{p.name}</T></g>;})}
 <circle cx={135} cy={225} r={29} fill="#05090a" stroke="#6e4935"/><Glyph kind="mark" x={121} y={211} scale={4} color={P.accent}/>
 </g>
 <g transform="translate(96 367) rotate(-5)" opacity={E((u-2.2)/.4)}><R x={0} y={0} w={79} h={19} fill="none" stroke={P.accent}/><T x={39} y={14} size={11} fill={P.accent} center>CONNECTED</T></g>
 </g>;}
function VerticalNarrative({u,ep,env}:any){
 const items=ep.shots[0].props.modules.items,cards=portraitNarrative(u,items),g=E((u-9.82)/1.5),opened=E((u-3.4)/.9),coreY=220+30*opened;
 return <g>
 <T x={135} y={72} size={17} center fill={g>.95?P.ok:P.ink}>{u<3.4?(u<2.3?'声音，正在组织画面。':'关键词：工具'):g>.95?'三个模块，':u>=7.8?'一个统筹者，':'说到哪个，'}</T>
 {u>=3.4?<T x={135} y={96} size={17} center fill={g>.95?P.ok:P.accent}>{g>.95?'连成工作流。':u>=7.8?'把它们连起来。':'就点亮哪个。'}</T>:null}
 <g opacity={1-E(g/.3)}>{cards.map(c=><line key={c.id} x1={135} y1={coreY} x2={c.x} y2={c.y} stroke={c.connected?P.ok:c.active?P.accent:'#344661'} strokeWidth={c.connected?2:1} opacity={c.opacity}/>)}<circle cx={135} cy={coreY} r={23} fill="#060b0e" stroke={u>=7.8?P.accent:'#3d4a52'} strokeWidth={2}/><Glyph x={128} y={coreY-7} scale={2} kind="mark" color={u>=7.8?P.accent:P.muted}/></g>
 {g>.45?<g opacity={E((g-.45)/.3)}>{cards.slice(1).map((c,i)=><line key={c.id} x1={cards[i].x} y1={cards[i].y+30*cards[i].scale} x2={c.x} y2={c.y-30*c.scale} stroke={P.ok} strokeWidth={2}/>)}</g>:null}
 {cards.map((c,i)=><g key={i} opacity={c.opacity} transform={`translate(${c.x} ${c.y}) scale(${c.scale})`}><R x={-30} y={-29} w={60} h={60} fill="#09121a" stroke={c.connected?P.ok:c.active?P.accent:'#4a5a69'} strokeWidth={2}/><Glyph x={-16} y={-22} scale={4} kind={['doc','mic','film'][i]} color={c.active?P.warm:'#576677'}/><T x={0} y={22} size={10} center>{items[i].name}</T></g>)}
 {u<3.4?Array.from({length:48},(_,i)=>{const h=3+envAt(env,i/48*9.52)*24;return <R key={i} x={40+i*4} y={316-h/2} w={2} h={h} fill={i/48*9.52<=u?P.accent:'#344661'}/>;}):null}
 </g>;
}
function VerticalTunnel({u}:any){return <g>{portraitCards(u).map(c=><g key={c.id} transform={`translate(${c.x} ${c.y}) scale(${c.scale}) rotate(${c.rotate})`}><R x={-50} y={-34} w={100} h={68} fill="#d5cdbb"/><g transform="translate(-48 -32)"><MiniArt variant={c.id} t={u}/></g></g>)}</g>;}
function VerticalFormats({u}:any){const q=E((u-.4)/1.4);return <g>
 <T x={135} y={56} size={18} center>同一个世界，</T><T x={135} y={80} size={18} fill={P.accent} center>展开不同视角。</T>
 <g transform={`translate(${23-Math.round((1-q)*160)} 101)`}><R x={-2} y={-2} w={228} h={130} fill={P.accent}/><g transform="scale(2.33 1.97)"><MiniArt variant={4} t={u}/></g></g><T x={135} y={245} size={10} center>16:9 / 横向展开</T>
 <g transform={`translate(83 ${261+Math.round((1-q)*150)})`}><R x={-2} y={-2} w={84} h={143} fill={P.warm}/><R x={0} y={0} w={80} h={139} fill="#ec6c2d"/><T x={40} y={29} size={22} fill="#131718" center>MAKE</T><T x={40} y={54} size={20} fill="#131718" center>IT</T><T x={40} y={80} size={22} fill="#131718" center>MOVE</T><Glyph x={24} y={99} scale={4} kind="film" color="#111b21"/></g><T x={181} y={318} size={10}>9:16</T><T x={181} y={335} size={10}>纵向聚焦</T>
 </g>;}
function VerticalAssemble({u}:any){const q=E((u-.4)/2);return <g>{Array.from({length:66},(_,i)=>{const x=76+i%6*20,y=104+Math.floor(i/6)*20;return <R key={i} x={x+(H(i*2)-.5)*420*(1-q)} y={y+(H(i*2+1)-.5)*700*(1-q)} w={17} h={17} fill={i%4===0?P.accent:i%3===0?'#e4dccb':'#244054'} opacity={.4+.6*q}/>;})}<R x={72} y={100} w={126} h={224} fill="none" stroke={P.warm} opacity={q}/><g opacity={E((u-2.3)/.4)}><T x={135} y={356} size={22} center>自由设计，</T><T x={135} y={384} size={22} fill={P.accent} center>保持叙事。</T></g></g>;}
function VerticalEnd({u,story}:any){const end=story.scenes.at(-1);return <g>
 {Array.from({length:25},(_,i)=>{const row=Math.floor(i/5),col=i%5;if(!((row===0||row===4||col===0||col===4)||(row===2&&col===2)))return null;const q=E((u-i*.015)/.65);return <R key={i} x={118+col*7+(col-2)*65*(1-q)} y={133+row*7+(row-2)*110*(1-q)} w={5} h={5} fill={P.accent}/>;})}
 <T x={135} y={221} size={28} center>{pixelTyped(end.title,u,.15)}</T><T x={135} y={263} size={23} center fill={P.accent}>{pixelTyped(end.accent,u,.45)}</T>
 {u>.8?<><T x={135} y={333} size={9} center fontFamily={PIXEL_MONO}>github.com/Nealsun1993</T><T x={135} y={350} size={9} center fontFamily={PIXEL_MONO}>/talk-workbench</T></>:null}
 </g>;}
export const PixelWorldPortrait:React.FC<PixelWorldProps>=({story,ep,env,audio=true})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;if(!story||!ep||!env)return null;
 const s=promoSceneAt(story,t),u=t-s.start,kind=s.kind,index=story.scenes.indexOf(s),type=['signal','typevoice','bigtype'].includes(kind),words=['画面。','节奏。','叙事。'],at=kind==='bigtype'?u%1.6:u;
 const caption=kind==='narrative'?ep.captions.find(c=>t-16>=c.start&&t-16<c.end):null,fade=E(t-59),wipe=E(u/.22);
 return <AbsoluteFill style={{background:P.bg,color:P.ink,fontFamily:PIXEL_FONT}}>
  <PixelFonts text={JSON.stringify(story)+JSON.stringify(ep)}/>{audio?<Audio src={staticFile(story.audio)}/>:null}
  <VerticalAtmosphere kind={kind} u={u} t={t}/>
  <svg viewBox="0 0 270 480" width="1080" height="1920" style={{position:'absolute',inset:0}} shapeRendering="crispEdges">
   {kind==='duo'?<VerticalDuo u={u}/>:kind==='hub'?<VerticalHub u={u}/>:kind==='narrative'?<VerticalNarrative u={u} ep={ep} env={env}/>:kind==='tunnel'?<VerticalTunnel u={u}/>:kind==='formats'?<VerticalFormats u={u}/>:kind==='assemble'?<VerticalAssemble u={u}/>:kind==='end'?<VerticalEnd u={u} story={story}/>:null}
   {type?<><T x={135} y={kind==='signal'?197:229} size={kind==='bigtype'?42:kind==='typevoice'?37:29} center fill={kind==='bigtype'&&Math.floor(u/1.6)===1?P.accent:P.ink}>{pixelTyped(kind==='bigtype'?words[Math.min(2,Math.floor(u/1.6))]:s.title,at,.08)}</T>{kind==='signal'?<T x={135} y={240} size={29} fill={P.accent} center>{pixelTyped(s.accent,u,.65)}</T>:null}{kind==='typevoice'?<><T x={135} y={181} size={9} center fill={P.muted}>EVERY STORY STARTS</T><T x={135} y={195} size={9} center fill={P.muted}>WITH A VOICE</T><T x={135} y={375} size={14} center fill={P.warm}>{s.accent}</T></>:null}{kind==='bigtype'?<><T x={135} y={360} size={12} center fill={P.muted}>不同内容，</T><T x={135} y={379} size={12} center fill={P.muted}>用不同的视觉语言。</T></>:null}</>:null}
   {kind==='city'?<><T x={135} y={84} size={24} center>{pixelTyped(s.title,u,.1)}</T><T x={135} y={118} size={24} fill={P.accent} center>{pixelTyped(s.accent,u,.55)}</T></>:null}
  </svg>
  <div style={{position:'absolute',left:72,top:64,fontFamily:PIXEL_MONO,fontSize:24,color:P.muted}}>PIXEL WORLD / PORTRAIT {String(index+1).padStart(2,'0')}</div>
  {kind==='tunnel'?<div style={{position:'absolute',left:72,top:220,padding:'12px 20px',background:'#03070ae8',fontSize:48,lineHeight:1.5}}>穿过画面，<br/>遇见不同表达。</div>:null}
  {caption?<div style={{position:'absolute',left:72,top:1600,width:936,textAlign:'center',fontSize:48,lineHeight:1.5}}>{caption.text}</div>:null}
  {kind==='narrative'?<div style={{position:'absolute',left:72,top:1760,fontSize:24,color:P.muted}}>原演示配音 / 像素叙事示意</div>:null}
  {u<.22&&index>0&&kind!=='narrative'?<div style={{position:'absolute',inset:0,background:index%2?'#03070a':P.accent,clipPath:index%2?`inset(${Math.round(wipe*100)}% 0 0 0)`:`inset(0 ${Math.round(wipe*100)}% 0 0)`}}/>:null}
  {fade>0?<AbsoluteFill style={{background:P.bg,opacity:fade}}/>:null}
 </AbsoluteFill>;
};
export const pixelWorldPortraitMetadata:CalculateMetadataFunction<PixelWorldProps>=async(args)=>{
 const m=await pixelWorldMetadata(args);return {...m,width:1080,height:1920,props:{...m.props,ep:{...m.props.ep,format:'portrait'}}};
};
