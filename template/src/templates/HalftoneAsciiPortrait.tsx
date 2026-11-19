import {genericProof,type LaunchProof} from '../kit/halftone';
import {ProofCarry,ProofLayer,proofWindow} from './HalftoneProof';
import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {Launch,HALFTONE as C,launchBeat,launchEase as E,askTimes} from '../kit/halftone';
import {AsciiWord,glitchWindow} from '../kit/AsciiFusion';
import {Field} from './HalftoneLaunch';
const FONT='"MiSans VF","PingFang SC",sans-serif',MONO='"JetBrains Mono","MiSans VF",monospace';
const askLines=(s:string)=>s.replace('片子看','片子\n看').replace('9.5有','9.5\n有').replace('可以用这个','可以用\n这个').split('\n');
function Tracking({box,t,u}:{box:number[];t:number;u:number}){
 const [x,y,w,h]=box,n=26,p=E((u-.32)/.45),burst=glitchWindow(t),f=Math.floor(t*30);
 const d=`M${x+n},${y}H${x}V${y+n} M${x+w-n},${y}H${x+w}V${y+n} M${x},${y+h-n}V${y+h}H${x+n} M${x+w-n},${y+h}H${x+w}V${y+h-n}`;
 return <svg width={1080} height={1920} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
 <g opacity={p*.7}><path d={d} fill="none" stroke="#59C6CE" strokeWidth={2}/><text x={x} y={y-22} fontFamily={MONO} fontSize={26} fill="#59C6CE">{`x:${Math.round(x)} y:${Math.round(y)}`}</text><path d={`M${x+w},${y+h} Q1000,${Math.min(1710,y+h+100)} 944,1740`} fill="none" stroke="#59C6CE" strokeOpacity={.28} strokeDasharray="6 12" strokeDashoffset={-t*24}/><rect x={936} y={1732} width={16} height={16} fill="none" stroke="#59C6CE"/></g>
 {burst?Array.from({length:4},(_,i)=><g key={i}><rect x={110+(f*47+i*173)%620} y={360+(f*23+i*229)%1130} width={90+i*37} height={i%2?4:12} fill={i%2?'#59C6CE':C.amber} opacity={.36}/></g>):null}
 </svg>;
}
function Proof({u,proof,carry=false}:{u:number;proof:LaunchProof;carry?:boolean}){
 const wide=u>=1.5,q=E((u-1.5)/.65),box=proofWindow.portrait,width=box.width+q*450,height=box.height-q*269,left=(1080-width)/2,top=box.top+q*145;
 return <div style={{position:'absolute',inset:0,opacity:E(u/.45),transform:carry?undefined:`translateY(${(1-E(u/.55))*100}px)`}}>
  <div style={{position:'absolute',left:96,top:330,fontSize:46,fontWeight:600}}>{proof.heading}</div>
  <div style={{position:'absolute',left:96,top:430,width:888,fontFamily:MONO,fontSize:36,color:C.amber}}>{wide?proof.landscapeLabel:proof.portraitLabel}</div>
  <div style={{position:'absolute',left,top,width,height,border:'1px solid #8FA59A',boxShadow:'0 28px 65px #0006',overflow:'hidden'}}>
   <ProofLayer src={proof.portrait} opacity={1-q}/>
   <ProofLayer src={proof.landscape} opacity={q}/>
  </div>
  <div style={{position:'absolute',top:1480,left:96,width:888,fontSize:36,lineHeight:1.6,color:'#B4CBC6'}}>{proof.caption}</div>
 </div>;
}
export const HalftoneAsciiPortrait:React.FC<{episode?:string;launch?:Launch;audio?:boolean}>=({launch,audio=true})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;if(!launch)return null;
 const b=launchBeat(t,launch),u=t-b.start,q=E(u/.5),i=launch.beats.indexOf(b);
 const asks=launch.asks.map(askLines);
 const carryTime=t-(launch.beats.find(beat=>beat.id==='proof')?.start??Infinity);
 let box=[80,640,920,350];
 if(b.id==='surface')box=[310,395,460,930];
 if(b.id==='problem')box=[80,700,920,160];
 if(b.id==='ask')box=[80,680,920,300];
 if(b.id==='firehose')box=[80,340,920,1150];
 if(b.id==='proof'){const r=E((u-1.5)/.65);box=[(1080-(460+r*450))/2,575+r*145,460+r*450,794-r*269];}
 if(b.id==='reframe')box=[80,570,920,610];
 if(b.id==='lockup')box=[465,540,150,150];
 return <AbsoluteFill style={{background:C.deep,color:C.paper,fontFamily:FONT,overflow:'hidden'}}>
  <FontGate text={JSON.stringify(launch)}/>{audio?<Audio src={staticFile(launch.audio)}/>:null}
  <div style={{position:'absolute',width:1920,height:1080,transformOrigin:'0 0',transform:'translateX(1080px) rotate(90deg)'}}><Field t={t} launch={launch} dynamic fusion/></div>
  <div style={{position:'absolute',left:96,top:140,fontFamily:MONO,fontSize:24,letterSpacing:2,color:'#B4CBC6'}}>TALK-WORKBENCH<br/>HALFTONE × ASCII</div>
  {b.id==='thesis'?<div style={{position:'absolute',left:96,top:655,width:888,fontSize:104,fontWeight:600,lineHeight:1.5,opacity:q,transform:`translateY(${(1-q)*100}px)`}}>{launch.thesis.split('，').map((line,j)=><div key={j}>{line}{j===0?'，':''}</div>)}</div>:null}
  {b.id==='surface'?<AsciiWord text={launch.surface} t={t} u={u} portrait/>:null}
  {b.id==='problem'?<div style={{position:'absolute',left:96,top:720,width:888,fontSize:104,fontWeight:600,opacity:q,transform:`translateY(${(1-q)*100}px)`}}>{launch.problem}</div>:null}
  {b.id==='ask'?<div style={{position:'absolute',left:96,top:705,width:888,fontSize:78,lineHeight:1.55,fontFamily:MONO,clipPath:`inset(0 0 ${(1-E((u-.15)/1))*100}% 0)`}}><span style={{color:C.amber}}>&gt; </span>{launch.ask.replace('的看','的\n看').split('\n').map((line,j)=><span key={j}>{j>0?<br/>:null}{line}</span>)}<span style={{color:C.amber}}>_</span></div>:null}
  {b.id==='firehose'?<>{asks.map((lines,j)=>{const age=u-askTimes[j];if(age<0)return null;const p=E(age/.22);return <div key={j} style={{position:'absolute',left:108+(j%2)*28,top:1360-j*180-u*38,fontFamily:MONO,fontSize:48,lineHeight:1.45,color:j===5?C.amber:C.paper,opacity:p*(.65+j*.06)*(1-E((carryTime+.35)/.35)),transform:`translateY(${(1-p)*65}px)`}}>{lines.map((line,k)=><div key={k}>{line}</div>)}</div>;})}</>:null}
  {b.id==='proof'?<Proof u={u} carry proof={launch.proof??genericProof}/>:null}
  {b.id==='reframe'?<div style={{position:'absolute',left:96,top:600,width:888,fontSize:96,fontWeight:600,lineHeight:1.65,color:C.amber,opacity:q,transform:`translateY(${(1-q)*100}px)`}}>{launch.reframe.map((line,j)=><div key={j} style={{whiteSpace:'pre-line'}}>{line.replace('定画','定\n画')}</div>)}</div>:null}
  {b.id==='lockup'?<div style={{position:'absolute',inset:0,opacity:q,transform:`translateY(${(1-q)*100}px)`}}><svg width={120} height={120} style={{position:'absolute',left:480,top:555}}><rect x={8} y={8} width={104} height={104} fill="none" stroke={C.paper} strokeWidth={7}/><rect x={52} y={52} width={16} height={16} fill={C.amber}/></svg><div style={{position:'absolute',top:810,width:'100%',textAlign:'center',fontSize:104,fontWeight:600}}>{launch.brand}</div><div style={{position:'absolute',left:96,top:1070,width:888,textAlign:'center',fontFamily:MONO,fontSize:32,lineHeight:1.8,color:'#B4CBC6'}}>github.com/Nealsun1993/<br/>talk-workbench</div></div>:null}
  <Tracking box={box} t={t} u={u}/>
  <ProofCarry time={carryTime} portrait/>
  <div style={{position:'absolute',inset:0,opacity:.13,pointerEvents:'none',background:'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,#000 4px,transparent 5px)'}}/>
  <div style={{position:'absolute',right:96,bottom:160,fontFamily:MONO,fontSize:26,color:'#B4CBC6'}}>{String(i+1).padStart(2,'0')} / 08</div>
 </AbsoluteFill>;
};
