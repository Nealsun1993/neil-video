/** 夜色像素版：独立绘图与排版，共用口播和模块动作时间。 */
import React,{useRef,useLayoutEffect}from'react';
import {AbsoluteFill}from'remotion';
import {envAt}from'../kit/types';
import {PIXEL as P,PIXEL_FONT,PIXEL_MONO,pixelState,pixelTyped,pixelEase}from'../kit/pixelDesign';
import type {TemplateProps}from'./types';
const SPRITES:Record<string,string[]>={
 'file-text':['11111000','10001100','10000100','10110100','10000100','10110100','10000100','11111100'],
 microphone:['00110000','01111000','01111000','01111000','10110100','10000100','01111000','00110000'],
 'film-slate':['11111111','10101010','11111111','10000001','10011001','10011001','10000001','11111111'],
};
export const PixelStory:React.FC<TemplateProps>=({t,ep,shot,env})=>{
 const p=shot.props,c=p.cues,format=ep.format??'portrait',state=pixelState(t,c,format,p.modules.items,p.modules.orchestrator.at),l=state.layout,portrait=l.portrait,is34=l.is34;
 const canvas=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const g=canvas.current!.getContext('2d')!;g.imageSmoothingEnabled=false;
  const matrix=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  g.fillStyle=P.bg;g.fillRect(0,0,l.width,l.height);
  for(let y=Math.floor(l.height*.54);y<l.height;y+=2)for(let x=0;x<l.width;x+=2){
   const strength=(y/l.height-.54)*12;
   if(matrix[(Math.floor(y/2)%4)*4+Math.floor(x/2)%4]<strength){g.fillStyle='#14223a';g.fillRect(x,y,2,2);}
  }
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{
   g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
  };
  const border=(r:{x:number;y:number;w:number;h:number},color:string,fill:string)=>{
   rect(r.x+3,r.y+4,r.w,r.h,'#020408');rect(r.x,r.y,r.w,r.h,color);rect(r.x+2,r.y+2,r.w-4,r.h-4,fill);
  };
  const f=state.frame;
  border(f,P.edge,P.panel);rect(f.x+2,f.y+2,f.w-4,11,'#22334d');
  for(let i=0;i<3;i++)rect(f.x+7+i*7,f.y+6,3,3,i===0?P.accent:'#7c8da8');
  rect(f.x+f.w-12,f.y+5,5,5,P.muted);
  const waveAlpha=1-pixelEase((t-c.boxAt)/.3);
  if(waveAlpha>0){
   g.globalAlpha=waveAlpha;
   const wx=f.x+12,wy=f.y+24,ww=f.w-24;
   rect(wx,wy,ww,32,P.inset);
   for(let i=0;i<Math.floor(ww/3);i++){
    const at=i/(ww/3)*c.boxAt,a=envAt(env,at),h=Math.max(1,Math.round(a*24));
    rect(wx+i*3,wy+16-Math.floor(h/2),2,h,at<=t?P.accent:'#344661');
   }
   rect(wx+Math.round(ww*Math.min(1,t/c.boxAt)),wy,1,32,P.warm);
   g.globalAlpha=1;
  }
  const sprite=(name:string,x:number,y:number,on:boolean)=>{
   const rows=SPRITES[name]??SPRITES['file-text'];
   rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')rect(x+i*2,y+j*2,2,2,on?P.warm:'#61718b');}));
  };
  state.cards.forEach((r,i)=>{
   const ready=state.active[i],connected=state.connected[i],enter=state.appear[i];
   if(enter===0)return;
   const box=r;
   border(box,connected?P.ok:ready?P.accent:P.edge,ready?'#202635':P.inset);
   g.globalAlpha=state.contentAlpha;const {icon}=state.geometry[i];sprite(p.modules.items[i].icon,icon.x,icon.y,ready);
   g.globalAlpha=1;if(connected){rect(box.x+box.w-8,box.y+5,3,3,P.ok);rect(box.x+box.w-11,box.y+8,3,3,P.ok);}
   if(i){
    const prev=state.cards[i-1],color=connected?P.ok:'#344661',q=portrait?state.progress:1;
    const ax=prev.x+prev.w/2+prev.w/2*q,ay=prev.y+prev.h-prev.h/2*q;
    const bx=box.x+box.w/2*(1-q),by=box.y+box.h/2*q,steps=Math.max(1,Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay))));
    for(let k=0;k<=steps;k++)rect(ax+(bx-ax)*k/steps,ay+(by-ay)*k/steps,1,1,color);
   }
  });
  rect(f.x+Math.round(f.w*.35),f.y+f.h+4,Math.round(f.w*.3),4,'#263b57');
 },[t,env,l.width,l.height,format,p]);
 const lines=state.phase==='voice'?p.pixelLines.voice:state.phase==='modules'?p.pixelLines.modules:p.pixelLines.result;
 const start=state.phase==='voice'?shot.start+.12:state.phase==='modules'?c.openAt+.12:c.boxAt+.12;
 const screen=(x:number,y:number)=>({left:Math.round(x)*4,top:Math.round(y)*4});
 return <AbsoluteFill style={{background:P.bg,color:P.ink,fontFamily:PIXEL_FONT,fontWeight:400}}>
  <canvas ref={canvas} width={l.width} height={l.height} style={{position:'absolute',inset:0,width:'100%',height:'100%',imageRendering:'pixelated'}}/>
  <div style={{position:'absolute',left:80,top:is34?50:portrait?72:48,fontFamily:PIXEL_MONO,fontSize:is34?22:24,color:P.muted}}>TALK-WORKBENCH / PIXEL 01</div>
  <div style={{position:'absolute',left:80,top:is34?136:portrait?210:248,width:portrait?920:620,fontSize:is34?80:portrait?96:72,lineHeight:1.45}}>
   {lines.map((line:string,i:number)=><div key={state.phase+'-'+i} style={{height:is34?116:portrait?144:108,color:i?P.accent:P.ink}}>{pixelTyped(line,t,start+i*.18)}{i===1&&t<start+1.4?<span style={{color:P.accent}}>_</span>:null}</div>)}
   <div style={{fontSize:is34?32:portrait?36:30,color:P.muted,marginTop:is34?16:portrait?24:32}}>配音驱动 / 工作流示意</div>
  </div>
  {t<c.openAt?<div style={{position:'absolute',...screen(l.frame.x+12,l.frame.y+(is34?66:71)),width:(l.frame.w-24)*4,color:P.warm,fontSize:is34?44:portrait?48:36,textAlign:'center'}}>{t>=c.at?'关键词：'+p.keyword:'声音输入 > 等待关键词'}</div>:null}
  {state.cards.map((r,i)=>{
   if(t<c.openAt+i*.12+.12)return null;
   const {x,y,w}=state.geometry[i].label;
   return <div key={i} style={{position:'absolute',...screen(x,y),width:w*4,opacity:state.contentAlpha,color:state.active[i]?P.ink:P.muted,fontSize:is34?44:portrait?48:36,textAlign:'center',lineHeight:1}}>{p.modules.items[i].name}</div>;
  })}
  {state.progress>.96?<div style={{position:'absolute',...screen(l.result.x+8,l.result.y+(is34?16:19)),width:(l.result.w-16)*4,textAlign:'center',fontSize:is34?44:portrait?48:36,color:P.ok}}>工作流已连接</div>:null}
  <div style={{position:'absolute',left:80,bottom:is34?42:portrait?70:40,fontFamily:PIXEL_MONO,fontSize:is34?22:portrait?24:20,color:P.muted}}>{'VOICE > MODULES > WORKFLOW'}</div>
 </AbsoluteFill>;
};
