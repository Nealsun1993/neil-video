import React,{useLayoutEffect,useRef,useState,useEffect} from 'react';
import {delayRender,continueRender,cancelRender} from 'remotion';
import {launchEase,launchSmooth,askTimes,Launch} from './halftone';
const PAPER='#F5EEDC',CYAN='#59C6CE',AMBER='#DDB366';
// Original drawing implementation of the installed skill's circle / crossed-box / dot-box grammar.
export function drawFusionGlyph(g:CanvasRenderingContext2D,x:number,y:number,size:number,kind:number){
 const r=size*.5;g.lineWidth=Math.max(1,size*.085);g.beginPath();
 if(kind===0){g.arc(x,y,r*.72,0,Math.PI*2);g.stroke();return;}
 if(kind===1||kind===2)g.strokeRect(x-r,y-r,size,size);
 if(kind===2){g.fillRect(x-1.4,y-1.4,2.8,2.8);return;}
 if(kind===3){g.moveTo(x-r,y);g.lineTo(x+r,y);g.moveTo(x,y-r);g.lineTo(x,y+r);}
 else{g.moveTo(x-r,y-r);g.lineTo(x+r,y+r);g.moveTo(x+r,y-r);g.lineTo(x-r,y+r);}
 g.stroke();
}
export function glyphMix(t:number,x:number,y:number){
 return launchSmooth((Math.sin(x*.0035+y*.004-t*1.15)+.55)/1.3)*.84;
}
// Small local bursts only; no whole-screen white/black inversion.
export function glitchWindow(t:number){
 return [[4.72,.14],[9.60,.18],[10.45,.12],[11.25,.16],[12.82,.14],[20.10,.12]].some(([at,d])=>t>=at&&t<at+d);
}
export function AsciiWord({text,t,u,portrait=false}:{text:string;t:number;u:number;portrait?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null),[ready,setReady]=useState(false),[handle]=useState(()=>delayRender('ASCII title font')),released=useRef(false);
 useEffect(()=>{document.fonts.ready.then(()=>setReady(true)).catch(cancelRender);},[]);
 const width=portrait?600:1200,height=portrait?1100:650;
 useLayoutEffect(()=>{if(!ready)return;const g=ref.current!.getContext('2d')!,mask=document.createElement('canvas');mask.width=width;mask.height=height;const m=mask.getContext('2d')!;m.font='600 400px "MiSans VF","PingFang SC",sans-serif';m.fillStyle='white';m.textAlign='center';if(portrait){Array.from(text).slice(0,2).forEach((ch,i)=>m.fillText(ch,300,440+i*430));}else m.fillText(text,600,465);const pixels=m.getImageData(0,0,width,height).data;g.clearRect(0,0,width,height);
  const reveal=launchEase(u/.45),morph=launchSmooth((u-.35)/.65);
  for(let y=0;y<height;y+=15)for(let x=0;x<width;x+=15){if(pixels[(y*width+x)*4+3]<100||(portrait?y>height*reveal:x>width*reveal))continue;
   const hue=(x+y)%60===0?CYAN:PAPER;g.strokeStyle=hue;g.fillStyle=hue;g.globalAlpha=.92;
   if(morph<.01){g.beginPath();g.arc(x,y,5.2,0,Math.PI*2);g.fill();}
   else{const kind=(Math.floor(x/15)+Math.floor(y/15)*3+Math.floor(t*6))%5;drawFusionGlyph(g,x,y,9+morph*3,kind);}
  }g.globalAlpha=1;if(!released.current){continueRender(handle);released.current=true;}
 },[text,t,u,ready,handle,portrait,width,height]);
 return <canvas ref={ref} width={width} height={height} style={{position:'absolute',left:portrait?240:360,top:portrait?350:200,width,height,transform:`scale(${.9+.14*launchSmooth(u/.7)})`}}/>;
}
export function FusionTracking({t,launch}:{t:number;launch:Launch}){
 const b=launch.beats.find(b=>t>=b.start&&t<b.end)??launch.beats.at(-1)!,u=t-b.start;
 let box=[160,380,1100,175];
 if(b.id==='surface')box=[530,215,860,565];
 if(b.id==='problem')box=[160,390,850,170];
 if(b.id==='ask')box=[240,415,1280,155];
 if(b.id==='firehose'){const i=Math.max(0,askTimes.filter(a=>u>=a).length-1);box=[175+((i*71)%137),737-i*108-u*38,1400,85];}
 if(b.id==='proof'){const q=launchEase((u-1.5)/.65);box=[1025-q*168,235+q*45,300+q*650,510+q*38];}
 if(b.id==='reframe')box=[155,265,1330,385];
 if(b.id==='lockup')box=[900,225,120,120];
 const [x,y,w,h]=box,p=launchEase((u-.32)/.45),burst=glitchWindow(t),frame=Math.floor(t*30),n=22;
 const corners=`M${x+n},${y}H${x}V${y+n} M${x+w-n},${y}H${x+w}V${y+n} M${x},${y+h-n}V${y+h}H${x+n} M${x+w-n},${y+h}H${x+w}V${y+h-n}`;
 return <><svg width={1920} height={1080} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <g opacity={p*.7}><path d={corners} fill="none" stroke={CYAN} strokeWidth={2}/><text x={x} y={y-18} fontFamily='"JetBrains Mono",monospace' fontSize={19} fill={CYAN}>{`x:${Math.round(x)}  y:${Math.round(y)}`}</text><path d={`M${x+w},${y+h} Q${Math.min(1850,x+w+90)},${y+h+40} 1810,950`} fill="none" stroke={CYAN} strokeOpacity={.28} strokeDasharray="5 10" strokeDashoffset={-t*24}/><rect x={1803} y={943} width={14} height={14} fill="none" stroke={CYAN}/></g>
  {burst?Array.from({length:5},(_,i)=>{const xx=120+(frame*97+i*271)%1510,yy=160+(i*149+frame*17)%740;return <g key={i}><rect x={xx} y={yy} width={80+(i*53)%240} height={i%2?3:13} fill={i%2?CYAN:AMBER} opacity={.35}/><text x={xx+20} y={yy-5} fontFamily="monospace" fontSize={17} fill={PAPER} opacity={.65}>{['+ / ×','[::]','001 /','× □ +','[ . ]'][i]}</text></g>;}):null}
 </svg><div style={{position:'absolute',inset:0,opacity:.13,pointerEvents:'none',background:'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,#000 4px,transparent 5px)'}}/></>;
}
