import {genericProof,type LaunchProof} from '../kit/halftone';
import {ProofCarry,ProofLayer,proofWindow} from './HalftoneProof';
import React,{useEffect,useState,useRef,useLayoutEffect} from'react';
import{AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction,delayRender,continueRender,cancelRender}from'remotion';
import{FontGate}from'../kit/frame';
import{HALFTONE as C,Launch,fieldState,launchBeat,launchEase as E,launchSmooth,askTimes,validateLaunch,rippleDot}from'../kit/halftone';
import{drawFusionGlyph,glyphMix,FusionTracking,AsciiWord}from'../kit/AsciiFusion';
const FONT='"MiSans VF","PingFang SC",sans-serif',MONO='"JetBrains Mono","MiSans VF",monospace';
type Props={episode?:string;launch?:Launch;audio?:boolean;canvasOnly?:boolean;dynamicField?:boolean;asciiFusion?:boolean};
// A fixed canvas caches the procedural SVG once; transforms never repaint the vector image.
function RippleField({t,fusion=false}:{t:number;fusion?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const g=ref.current!.getContext('2d')!;g.clearRect(0,0,1920,1080);
  for(let y=-30;y<1120;y+=30)for(let x=-30;x<1960;x+=30){
   const d=rippleDot(t,x,y);g.beginPath();g.arc(d.x,d.y,d.radius,0,Math.PI*2);
   const mix=fusion?glyphMix(t,x,y):0;
   g.fillStyle=`rgba(${d.cool?'57,170,193':'79,198,164'},${d.alpha*(1-mix)})`;g.fill();
   if(mix>0){g.strokeStyle=`rgba(118,200,192,${d.alpha*mix*.9})`;g.fillStyle=g.strokeStyle;drawFusionGlyph(g,d.x,d.y,d.radius*2.2,(Math.floor((x+30)/30)+3*Math.floor((y+30)/30))%5);}
  }
 },[t,fusion]);
 return <canvas ref={ref} width={1920} height={1080} style={{position:'absolute',inset:0,width:1920,height:1080}}/>;
}
export function Field({t,launch,dynamic=false,fusion=false}:any){
 const ref=useRef<HTMLCanvasElement>(null),[handle]=useState(()=>delayRender('halftone field complete'));
 useEffect(()=>{const img=new Image();img.src=staticFile('halftone/field.svg');img.decode().then(()=>{const g=ref.current!.getContext('2d')!;g.drawImage(img,0,0,6144,2048);g.getImageData(0,0,1,1);continueRender(handle);}).catch(cancelRender);},[handle]);
 const s=fieldState(t,launch);
 return <><canvas ref={ref} data-halftone-field width={6144} height={2048} style={{position:'absolute',left:-2112,top:-484,width:6144,height:2048,transformOrigin:'50% 50%',transform:`translate(${s.x}px,${s.y}px) scale(${s.scale})`,opacity:dynamic?.42:.94}}/>{dynamic?<RippleField t={t} fusion={fusion}/>:null}<AbsoluteFill style={{background:C.amber,opacity:s.warm*.55,mixBlendMode:'screen'}}/><AbsoluteFill style={{background:C.deep,opacity:s.dark}}/></>;
}
function Statement({children,u,end,amber=false}:any){const q=E(u/.5),out=0;return <div style={{position:'absolute',left:180,top:394,width:1560,fontSize:112,fontWeight:600,lineHeight:1.35,color:amber?C.amber:C.paper,clipPath:`inset(0 ${(1-q)*100}% 0 0)`,transform:`translate(${-out*180-(1-q)*95}px,0)`,opacity:1-out}}>{children}</div>;}
function Proof({u,proof,carry=false}:{u:number;proof:LaunchProof;carry?:boolean}){const wide=u>=1.5,q=E((u-1.5)/.65),box=proofWindow.landscape;return <div style={{position:'absolute',inset:0,opacity:E(u/.45),transform:carry?undefined:`translateX(${(1-E(u/.55))*150}px)`}}>
 <div style={{position:'absolute',left:110,top:173,fontFamily:MONO,fontSize:28,color:'#B4CBC6'}}>{proof.heading}</div>
 <div style={{position:'absolute',left:110,top:278,width:750,fontFamily:MONO,fontSize:31,lineHeight:1.9,color:C.paper}}><div style={{color:'#8AB6AA'}}>{proof.context}</div><div style={{marginTop:26,color:wide?'#6F8C87':C.paper}}>{proof.portraitLabel}</div><div style={{marginTop:14,color:wide?C.amber:'#6F8C87'}}>{proof.landscapeLabel}</div><div style={{marginTop:58,fontSize:26,color:'#B4CBC6'}}> {proof.context?'npm run export --':null}</div>{proof.context?<div style={{fontSize:30,color:C.amber}}>{wide?proof.landscapeLabel:proof.portraitLabel}</div>:null}</div>
 <div style={{position:'absolute',left:box.left-q*168,top:box.top+q*45,width:box.width+q*650,height:box.height+q*38,border:'1px solid #8FA59A',boxShadow:'0 26px 65px #0006',overflow:'hidden'}}><ProofLayer src={proof.portrait} opacity={1-q}/><ProofLayer src={proof.landscape} opacity={q}/></div>
 <div style={{position:'absolute',left:110,top:865,fontSize:34,color:'#B4CBC6'}}>{proof.caption}</div>
 </div>;}
export const HalftoneLaunch:React.FC<Props>=({launch,audio=true,canvasOnly=false,dynamicField=false,asciiFusion=false})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;if(!launch)return null;
 const b=launchBeat(t,launch),u=t-b.start,d=b.end-b.start,index=launch.beats.indexOf(b),q=E(u/.5),out=0;
 const carryTime=t-(launch.beats.find(beat=>beat.id==='proof')?.start??Infinity);
 return <AbsoluteFill style={{background:C.deep,color:C.paper,fontFamily:FONT,overflow:'hidden'}}><FontGate text={JSON.stringify(launch)}/>{audio&&!canvasOnly?<Audio src={staticFile(launch.audio)}/>:null}<Field t={t} launch={launch} dynamic={dynamicField} fusion={asciiFusion}/>
 {!canvasOnly?<>
 <div style={{position:'absolute',left:110,top:73,fontFamily:MONO,fontSize:22,letterSpacing:2,color:'#B4CBC6'}}>TALK-WORKBENCH / LIVING HALFTONE</div>
 {b.id==='thesis'?<Statement u={u} end={d}>{launch.thesis}</Statement>:null}
 {b.id==='surface'&&asciiFusion?<AsciiWord text={launch.surface} t={t} u={u}/>:null}
 {b.id==='surface'&&!asciiFusion?<div style={{position:'absolute',left:0,top:225,width:1920,textAlign:'center',fontSize:400,fontWeight:600,transform:`translateX(${-out*180}px) scale(${.86+.49*launchSmooth(u/.7)})`,opacity:1-out}}><span style={{color:u>1?'transparent':C.paper,backgroundImage:u>1?`url(${staticFile('halftone/field.svg')})`:undefined,backgroundPosition:'50% 50%',backgroundSize:'2800px 1050px',backgroundClip:'text',WebkitBackgroundClip:'text',WebkitTextStroke:u>1?'3px #BBCFC4':'none'}}>{launch.surface}</span></div>:null}
 {b.id==='problem'?<Statement u={u} end={d}>{launch.problem}</Statement>:null}
 {b.id==='ask'?<div style={{position:'absolute',left:260,top:438,display:'flex',gap:24,fontSize:68,fontFamily:MONO,opacity:1-out,transform:`translateX(${-out*130}px)`}}><span style={{color:C.amber}}>&gt;</span><div style={{clipPath:`inset(0 ${100-E((u-.15)/1)*100}% 0 0)`}}>{launch.ask}<span style={{color:C.amber}}>_</span></div></div>:null}
 {b.id==='firehose'?<>{launch.asks.map((line,i)=>{const age=u-askTimes[i];if(age<0)return null;const n=Math.min(1,Math.max(0,(u-askTimes[i])/(3-askTimes[i]))),p=E(age/.22),x=190+((i*71)%137),y=762-i*108-u*38;return <div key={i} style={{position:'absolute',left:x-(1-p)*100-out*140,top:y,fontFamily:MONO,fontSize:46,whiteSpace:'nowrap',color:i===5?C.amber:C.paper,opacity:p*(.48+.52*(1-n))*(asciiFusion?1-E((carryTime+.35)/.35):1),transform:`scale(${1-n*.12})`,transformOrigin:'0 50%'}}>{line}</div>;})}</>:null}
 {b.id==='proof'?<Proof u={u} carry={asciiFusion} proof={launch.proof??genericProof}/>:null}
 {b.id==='reframe'?<div style={{position:'absolute',left:180,top:285,fontSize:112,lineHeight:1.5,fontWeight:600,color:C.amber,transform:`translateY(${(1-q)*100-out*130}px)`,opacity:q*(1-out)}}>{launch.reframe.map((line,i)=><div key={i}>{line}</div>)}</div>:null}
 {b.id==='lockup'?<div style={{position:'absolute',inset:0,opacity:q,transform:`translateX(${(1-q)*130}px)`}}><svg width={100} height={100} style={{position:'absolute',left:910,top:235}}><rect x={8} y={8} width={84} height={84} fill="none" stroke={C.paper} strokeWidth={7}/><rect x={43} y={43} width={14} height={14} fill={C.amber}/></svg><div style={{position:'absolute',top:405,width:'100%',textAlign:'center',fontSize:112,fontWeight:600}}>{launch.brand}</div><div style={{position:'absolute',top:613,width:'100%',textAlign:'center',fontFamily:MONO,fontSize:30,color:'#B4CBC6'}}>{launch.url}</div></div>:null}
 <div style={{position:'absolute',right:100,bottom:60,fontFamily:MONO,fontSize:22,color:'#B4CBC6'}}>{String(index+1).padStart(2,'0')} / 08</div>
 {asciiFusion?<><FusionTracking t={t} launch={launch}/><ProofCarry time={carryTime}/></>:null}
 </>:null}
 </AbsoluteFill>;
};
export const halftoneMetadata:CalculateMetadataFunction<Props>=async({props})=>{const episode=props.episode??'halftone-launch';
 if(!/^[a-zA-Z0-9_-]+$/.test(episode))throw Error('半调期名只支持英文字母、数字、下划线和连字符');
 const response=await fetch(staticFile(`episodes/${episode}/launch.json`));
 if(!response.ok)throw Error(`找不到半调配置：${episode}/launch.json`);
 const launch=await response.json();validateLaunch(launch);return {durationInFrames:720,width:1920,height:1080,props:{...props,launch}};};
