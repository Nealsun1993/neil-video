import React from 'react';
import {AbsoluteFill,Audio,CalculateMetadataFunction,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {button,ease,font,Hand,ink,Mark,Traffic} from './CleanUiDemo';
import {Wave} from './CleanUiWorkflow';
import {musicGainAt,resolveTalkClip,TALK_FPS,TALK_OVERLAP,talkAsset,TalkShot} from '../kit/talk';
import {
 boardTimings,buildSceneCamera,cameraAt,CLEAN_SCENES,CleanFormat,cleanFormatDims,CleanIconKind,cleanGeom,CleanTalkEpisode,
 dropTimings,editTimings,previewTimings,validateCleanTalk,
} from '../kit/cleanTalk';

export {CLEAN_SCENES,validateCleanTalk};
export type {CleanFormat,CleanTalkEpisode};
export type CleanTalkProps={episode:string;ep?:CleanTalkEpisode;format?:CleanFormat;audio?:boolean};

const blue='#0797F4',mist='#F3F6F6',muted='#697575';
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q;
const fitSize=(txt:string,base:number,maxW:number)=>Math.min(base,Math.floor(maxW/Math.max(1,Array.from(txt).length)));
const ICON_PATHS:Record<CleanIconKind|'check',string>={
 sound:'M3 12h2m3-5v10m4-14v18m4-15v12m3-6h2',
 text:'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
 preview:'M3 5h18v13H3zM8 22h8m-6-12 5 2.5-5 2.5z',
 spark:'M12 2.5 14.4 9.6 21.5 12 14.4 14.4 12 21.5 9.6 14.4 2.5 12 9.6 9.6zM19 3v3m-1.5-1.5h3',
 code:'m8 8-5 4 5 4m8-8 5 4-5 4M14 4l-4 16',
 layers:'M12 3 3 8l9 5 9-5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5',
 check:'m5 12 4 4L19 6',
};

function CleanIcon({kind,size=32,progress=1,strokeWidth=1.8}:{kind:CleanIconKind|'check';size?:number;progress?:number;strokeWidth?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
  <path d={ICON_PATHS[kind]} pathLength={1} strokeDasharray={1} strokeDashoffset={Math.max(0,1-progress)}/>
 </svg>;
}

type S={t:number;u:number;d:number;p:any;s:TalkShot;ep:CleanTalkEpisode;fmt:CleanFormat};

export function cleanCardMetrics(w:number,h:number,lineCount:number,hasFooter:boolean){
 const rows=lineCount+(hasFooter?1.2:0),tall=h>w*1.25;
 const rawUnit=Math.max(130,Math.min(w,h));
 const need=tall?280+rows*76:250+rows*72;
 const compact=rows>=3&&h<need?Math.min(1,h/need):1;
 const unit=rawUnit*compact;
 const pad=Math.max(14,Math.round(unit*(tall?.074:.084)));
 const iconBox=Math.max(30,Math.round(unit*.165));
 const baseTitle=Math.max(16,Math.round(unit*(tall?.086:.098)));
 const lSize=Math.max(12,Math.round(unit*(tall?.047:.054)));
 const lPadY=Math.max(4,Math.round(lSize*.38)),lGap=Math.max(5,Math.round(unit*.024));
 const fSize=Math.max(13,Math.round(unit*(tall?.046:.052)));
 return {unit,tall,pad,iconBox,baseTitle,lSize,lPadY,lGap,fSize};
}

function CleanCardSurface({brand,label,title,lines,badge,footerPill,icon='spark',w,h}:{brand:string;label:string;title?:string;lines?:string[];badge?:string;footerPill?:string;icon?:CleanIconKind;w:number;h:number}){
 const m=cleanCardMetrics(w,h,lines?.length??0,Boolean(footerPill));
 const heading=title??label,innerW=Math.max(120,w-m.pad*2);
 const tSize=m.tall?Math.min(m.baseTitle,Math.max(20,fitSize(heading,m.baseTitle,Math.round(innerW*1.35)))):fitSize(heading,m.baseTitle,Math.round(innerW*1.4));
 return <div style={{width:'100%',height:'100%',boxSizing:'border-box',padding:m.pad,display:'flex',flexDirection:'column',gap:Math.max(10,Math.round(m.unit*.04)),background:'linear-gradient(155deg,#F5FAFF 0%,#E7F2FD 100%)',color:ink}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexShrink:0}}>
   <div style={{width:m.iconBox,height:m.iconBox,borderRadius:Math.max(10,Math.round(m.unit*.05)),background:blue,color:'#fff',display:'grid',placeItems:'center',boxShadow:'0 8px 20px #0797F438',flexShrink:0}}><CleanIcon kind={icon} size={Math.max(18,Math.round(m.iconBox*.56))}/></div>
   <span style={{padding:'5px 12px',borderRadius:99,background:'#FFFFFFD8',border:'1px solid #D6E6F5',fontSize:Math.max(11,Math.round(m.unit*.045)),color:'#3E586E',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{badge??brand}</span>
  </div>
  <div style={{marginTop:m.tall?Math.round(m.unit*.06):'auto',marginBottom:lines?.length||footerPill?0:'auto'}}>
   <div style={{fontSize:tSize,fontWeight:720,lineHeight:1.24,letterSpacing:-.4}}>{heading}</div>
  </div>
  {lines?.length?<div style={{display:'flex',flexDirection:'column',gap:m.lGap}}>
   {lines.map((l,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:`${m.lPadY}px ${Math.max(10,Math.round(m.lSize*.66))}px`,borderRadius:Math.max(8,Math.round(m.unit*.03)),background:'#FFFFFFDF',border:'1px solid #DCEAF6',fontSize:m.lSize,color:'#24343F',fontWeight:550}}>
    <span style={{width:6,height:6,borderRadius:'50%',background:blue,flexShrink:0}}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l}</span>
   </div>)}
  </div>:!footerPill?<div style={{display:'flex',gap:8,marginTop:'auto'}}>
   <div style={{height:7,width:'48%',borderRadius:99,background:blue,opacity:.8}}/>
   <div style={{height:7,width:'28%',borderRadius:99,background:'#BFD8EC'}}/>
  </div>:null}
  {footerPill?<div style={{marginTop:'auto',paddingTop:4,textAlign:'center',flexShrink:0}}>
   <span style={{display:'inline-block',maxWidth:'100%',boxSizing:'border-box',background:'#090B0BE2',color:'#fff',borderRadius:10,padding:`${Math.max(6,Math.round(m.fSize*.38))}px ${Math.max(12,Math.round(m.fSize*.7))}px`,fontSize:m.fSize,fontWeight:600,lineHeight:1.35}}>{footerPill}</span>
  </div>:null}
 </div>;
}

function CleanMedia({ep,media,from,fallbackTitle,footerPill,icon='preview',w=640,h=400,defaultFit='cover'}:{ep:CleanTalkEpisode;media?:string;from:number;fallbackTitle?:string;footerPill?:string;icon?:CleanIconKind;w?:number;h?:number;defaultFit?:'cover'|'contain'}){
 if(!media)return <CleanCardSurface brand={ep.brand} label={fallbackTitle??ep.brand} title={fallbackTitle??ep.brand} footerPill={footerPill} icon={icon} w={w} h={h}/>;
 const r=resolveTalkClip(ep,media);
 if(!r)return <CleanCardSurface brand={ep.brand} label={fallbackTitle??ep.brand} footerPill={footerPill} icon={icon} w={w} h={h}/>;
 if(r.kind==='card')return <CleanCardSurface brand={ep.brand} label={r.clip.label} title={r.clip.title} lines={r.clip.lines} badge={r.clip.badge} footerPill={footerPill} icon={icon} w={w} h={h}/>;
 if(r.kind==='image'){
  const fit=r.clip.fit??defaultFit;
  return <Img src={staticFile(r.asset)} style={{width:'100%',height:'100%',objectFit:fit,background:fit==='contain'?'#F8FAFC':undefined,display:'block'}}/>;
 }
 return <Sequence from={Math.round(from*TALK_FPS)} layout="none"><OffthreadVideo src={staticFile(r.asset)} trimBefore={Math.round((r.clip.at??0)*TALK_FPS)} muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></Sequence>;
}

function CleanWindow({fmt,windowTitle,heading,action,icon='sound',surround,autoHeight,style,children}:{fmt:CleanFormat;windowTitle:string;heading:string;action:string;icon?:CleanIconKind;surround?:React.CSSProperties;autoHeight?:boolean;style?:React.CSSProperties;children:React.ReactNode}){
 const g=cleanGeom(fmt),p=g.portrait,is58=g.is58,is34=g.is34;
 const compact=autoHeight??(is58||is34);
 const headTop=is34?74:p?94:92,bodyOffset=is34?162:p?194:186,botPad=is34?30:p?38:42;
 return <div style={{position:'absolute',left:g.win.x,top:g.win.y,width:g.win.w,height:compact?'auto':g.win.h,minHeight:compact?(is34?660:760):undefined,maxHeight:g.win.h,background:'#FFFFFF',border:'1px solid #E8EEEE',borderRadius:p?28:25,boxShadow:'0 16px 60px #17282814',overflow:'hidden',isolation:'isolate',zIndex:0,...style}}>
  <div style={{height:g.barH,borderBottom:'1px solid #EEF2F2',display:'flex',alignItems:'center',padding:`0 ${p?25:28}px`,position:'relative',...surround}}>
   <Traffic/><div style={{position:'absolute',left:p?'24%':'33%',width:p?'52%':'34%',textAlign:'center',borderRadius:30,padding:'7px 14px',boxSizing:'border-box',fontSize:is58||is34?20:p?19:17,background:mist,color:'#4E5959',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{windowTitle}</div>
  </div>
  <div style={{position:'absolute',left:g.padX,right:g.padX,top:headTop,display:'flex',alignItems:'center',gap:p?18:22,...surround}}>
   <div style={{width:is34?62:p?70:72,height:is34?62:p?70:72,borderRadius:'50%',background:ink,color:'#fff',display:'grid',placeItems:'center',flexShrink:0}}><CleanIcon kind={icon} size={is34?34:p?38:40}/></div>
   <div style={{fontSize:is34?32:is58?35:p?33:32,fontWeight:700,letterSpacing:-.5}}>{heading}</div>
   <div style={{...button,marginLeft:'auto',width:g.btn.w,height:g.btn.h,borderRadius:14,fontSize:p?22:21,fontWeight:600}}>{action}</div>
  </div>
  {compact
   ?<div style={{padding:`${bodyOffset-g.barH}px ${g.padX}px ${botPad}px`,boxSizing:'border-box'}}>{children}</div>
   :<div style={{position:'absolute',left:g.padX,right:g.padX,top:bodyOffset,bottom:botPad}}>{children}</div>}
 </div>;
}

function OpeningScene({u,d,p,ep,fmt}:S){
 const g=cleanGeom(fmt),is58=g.is58,is34=g.is34,icons:CleanIconKind[]=p.icons??['sound','text','preview'];
 const title=p.title??ep.brand,icStart=p.iconsAt!=null?p.iconsAt-(p.__start??0):Math.min(1.1,d*.32);
 const lift=ease(u,Math.max(.15,icStart-.25),icStart+.35);
 const y0=is34?-80:is58?-68:0,y1=is34?-172:is58?-172:g.portrait?-130:-95;
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:ease(u,0,.38)}}>
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',transform:`translateY(${Math.round(lerp(y0,y1,lift))}px)`}}>
   <div style={{display:'flex',flexDirection:g.portrait?'column':'row',alignItems:'center',gap:g.portrait?20:26}}>
    <Mark size={is34?106:is58?114:g.portrait?108:98}/>
    <div style={{fontSize:is34?fitSize(title,88,920):is58?fitSize(title,92,920):g.portrait?fitSize(title,86,880):fitSize(title,92,1300),fontWeight:750,letterSpacing:-3,textAlign:'center'}}>{title}</div>
   </div>
   {p.kicker?<div style={{marginTop:g.portrait?20:18,fontSize:is34?31:is58?34:g.portrait?32:28,color:muted,fontWeight:550,opacity:ease(u,.2,.65)}}>{p.kicker}</div>:null}
  </div>
  <div style={{position:'absolute',top:is34?738:is58?888:g.portrait?1020:610,display:'flex',gap:is34?56:is58?66:g.portrait?58:120,alignItems:'center'}}>
   {icons.map((kind,i)=>{
    const q=ease(u,icStart+i*.26,icStart+.72+i*.26);
    const box=is34?146:is58?158:g.portrait?148:156;
    return <div key={`${kind}-${i}`} style={{width:box,height:box,borderRadius:36,background:mist,border:'1px solid #E5ECEC',display:'grid',placeItems:'center',opacity:Math.min(1,q*2.2),transform:q>=.999?undefined:`translateY(${(1-q)*24}px) scale(${.93+.07*q})`}}>
     <CleanIcon kind={kind} size={is34?74:is58?80:g.portrait?76:82} progress={q} strokeWidth={1.7}/>
    </div>;
   })}
  </div>
 </AbsoluteFill>;
}

function ChapterScene({t,u,p,s,fmt}:S){
 const g=cleanGeom(fmt),is58=g.is58,is34=g.is34,enter=ease(u,0,.42),items:any[]=p.items??[];
 return <AbsoluteFill style={{opacity:enter}}>
  <div style={{position:'absolute',left:is58||is34?68:g.portrait?86:192,right:is58||is34?68:g.portrait?86:192,top:is34?312:is58?410:g.portrait?560:270,transform:enter>=.999?undefined:`translateY(${(1-enter)*20}px)`}}>
   {p.badge?<div style={{display:'inline-block',border:'3.5px solid #7D8383',borderRadius:80,padding:g.portrait?'8px 28px 10px':'9px 32px 11px',fontSize:is34?36:is58?40:g.portrait?38:44,color:'#6E7676',fontWeight:600}}>{p.badge}</div>:null}
   <div style={{fontSize:is34?fitSize(p.title,92,940):is58?fitSize(p.title,98,940):g.portrait?fitSize(p.title,92,900):fitSize(p.title,114,1520),fontWeight:750,letterSpacing:-4,marginTop:p.badge?(is34?38:g.portrait?46:54):0,lineHeight:1.08}}>{p.title}</div>
   {p.subtitle?<div style={{fontSize:is34?32:g.portrait?34:32,color:muted,marginTop:is34?24:28,lineHeight:1.45,opacity:ease(u,.18,.62)}}>{p.subtitle}</div>:null}
   <div style={{marginTop:is34?34:42,height:6,width:(g.portrait?260:340)*ease(u,.2,.85),borderRadius:99,background:blue}}/>
   {items.length?<div style={{display:'flex',flexWrap:'wrap',gap:18,marginTop:is34?32:38}}>
    {items.map((x,i)=>{const a=x.at??(s.start+.35+i*.32),q=ease(t,a,a+.45);return <div key={i} style={{display:'inline-flex',alignItems:'center',gap:12,padding:'14px 24px',borderRadius:18,background:mist,border:'1px solid #E3EBEB',fontSize:g.portrait?28:26,fontWeight:600,opacity:q,transform:q>=.999?undefined:`translateY(${(1-q)*16}px)`}}>
     {x.icon?<span style={{color:blue,display:'grid',placeItems:'center'}}><CleanIcon kind={x.icon} size={26}/></span>:null}{x.label}
    </div>;})}
   </div>:null}
  </div>
 </AbsoluteFill>;
}

function DropScene({u,p,s,ep,fmt}:S){
 const g=cleanGeom(fmt),is34=g.is34,{dragStartU,dropU,resultU}=dropTimings(s);
 const enter=ease(u,0,.38),drag=ease(u,dragStartU,dropU),dropped=ease(u,dropU-.04,dropU+.42),fill=ease(u,dropU+.12,Math.min(s.end-s.start-.3,dropU+1.35));
 const startX=g.portrait?740:1310,startY=is34?360:g.portrait?485:335;
 const x=lerp(startX,g.dropZone.x,drag),y=lerp(startY,g.dropZone.y,drag);
 const items:string[]=p.items??[],useList=p.mode==='list'||items.length>0,icon:CleanIconKind=p.icon??'sound';
 return <AbsoluteFill style={{opacity:enter,transform:enter>=.999?undefined:`translateY(${(1-enter)*20}px)`}}>
  <CleanWindow fmt={fmt} windowTitle={p.window??ep.brand} heading={p.heading??ep.brand} action={p.action??'导入素材'} icon={icon}>
   <div style={{position:'relative',height:g.dropZone.h,background:mist,borderRadius:22,border:`2px dashed ${drag>.2&&dropped<.55?blue:'#D7E1E2'}`,display:'grid',placeItems:'center',padding:'0 36px',boxSizing:'border-box'}}>
    <div style={{textAlign:'center',opacity:1-dropped,color:muted,fontSize:is34?27:g.portrait?29:28}}>
     <CleanIcon kind={icon} size={is34?54:g.portrait?60:56}/>
     <div style={{marginTop:14}}>{p.hint??'将文件拖入此处'}</div>
    </div>
    <div style={{position:'absolute',left:36,right:36,top:is34?30:g.portrait?42:44,opacity:dropped}}>
     <div style={{display:'flex',alignItems:'center',gap:14,fontSize:is34?28:g.portrait?30:29,fontWeight:680}}>
      <span style={{color:blue,display:'grid',placeItems:'center'}}><CleanIcon kind={icon} size={32}/></span>{p.fileName}
     </div>
     {useList?<div style={{display:'grid',gridTemplateColumns:g.portrait?'1fr':'repeat(3,1fr)',gap:is34?10:12,marginTop:is34?20:26}}>
      {(items.length?items:['结构提取','要点对齐','预览就绪']).map((it,i)=>{const iq=ease(u,dropU+.14+i*.16,dropU+.52+i*.16);return <div key={i} style={{background:'#fff',borderRadius:14,padding:is34?'13px 18px':g.portrait?'15px 20px':'16px 18px',border:'1px solid #E3ECEC',display:'flex',alignItems:'center',gap:12,fontSize:is34?22:g.portrait?24:22,fontWeight:600,opacity:iq,transform:iq>=.999?undefined:`translateY(${(1-iq)*12}px)`}}>
       <span style={{width:8,height:8,borderRadius:'50%',background:blue,flexShrink:0}}/>{it}
      </div>;})}
     </div>:<div style={{marginTop:is34?36:44}}><Wave progress={fill}/></div>}
     <div style={{marginTop:is34?18:22,fontSize:is34?21:g.portrait?22:21,color:muted,display:'flex',alignItems:'center',gap:8,opacity:ease(u,dropU+.38,dropU+.82)}}>
      <span style={{color:blue,display:'grid',placeItems:'center'}}><CleanIcon kind="check" size={22}/></span>{p.status??'已完成解析'}
     </div>
    </div>
   </div>
   {p.result?<div style={{marginTop:is34?18:22,padding:is34?'20px 24px':g.portrait?'22px 26px':'22px 30px',background:mist,borderRadius:20,fontSize:is34?23:g.portrait?25:24,opacity:ease(u,resultU-.1,resultU+.38)}}>
    <div style={{fontWeight:700,color:ink,fontSize:is34?23:g.portrait?25:23}}>{p.resultLabel??'解析结果'}</div>
    <div style={{marginTop:8,color:'#2B3838',lineHeight:1.45}}>{p.result}</div>
   </div>:null}
  </CleanWindow>
  <div style={{...button,position:'absolute',zIndex:15,left:x-130,top:y-44,width:260,height:82,background:'#fff',color:ink,border:'1px solid #DCE6E6',boxShadow:'0 14px 42px #18242624',fontSize:23,padding:'0 18px',boxSizing:'border-box',opacity:ease(u,Math.max(0,dragStartU-.22),dragStartU+.15)*(1-dropped)}}>
   <CleanIcon kind={icon} size={26}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.fileName}</span>
  </div>
  <div style={{position:'absolute',inset:0,zIndex:20,pointerEvents:'none'}}>
   <Hand x={x+66} y={y-8} opacity={ease(u,Math.max(0,dragStartU-.18),dragStartU+.18)*(1-dropped)} press={drag*(1-dropped)}/>
  </div>
 </AbsoluteFill>;
}

function EditScene({u,p,s,ep,fmt}:S){
 const g=cleanGeom(fmt),is34=g.is34,{openU,swapU,applyU}=editTimings(s);
 const enter=ease(u,0,.38),modal=ease(u,openU,openU+.38)*(1-ease(u,applyU,applyU+.38));
 const applied=u>=applyU,swapped=u>=swapU,afterFocus=ease(u,applyU+.12,applyU+.52);
 const reachOpen=ease(u,Math.max(0,openU-.48),openU),reachApply=ease(u,openU+.22,Math.max(openU+.35,applyU-.06));
 const hx=lerp(g.btn.x+70,g.btn.x,reachOpen)+(g.modalApply.x-g.btn.x)*reachApply;
 const hy=lerp(g.btn.y+110,g.btn.y,reachOpen)+(g.modalApply.y-g.btn.y)*reachApply;
 const press=Math.max(ease(u,openU-.08,openU)*(1-ease(u,openU+.02,openU+.18)),ease(u,applyU-.08,applyU)*(1-ease(u,applyU+.02,applyU+.18)));
 const prefix=p.prefix??'',suffix=p.suffix??'';
 return <AbsoluteFill style={{opacity:enter}}>
  <CleanWindow fmt={fmt} windowTitle={p.window??ep.brand} heading={p.heading??ep.brand} action={p.action??'开始优化'} icon="text">
   <div style={{display:'grid',gridTemplateColumns:g.portrait?'1fr':'1.05fr 1fr',gap:is34?18:g.portrait?22:26}}>
    <section style={{background:mist,borderRadius:20,padding:is34?'20px 22px':g.portrait?'24px 26px':'28px',minHeight:is34?196:g.portrait?230:330,boxSizing:'border-box',opacity:1-.2*afterFocus}}>
     <div style={{display:'flex',alignItems:'center',gap:10,fontSize:is34?23:g.portrait?25:24,fontWeight:680}}><CleanIcon kind="text" size={24}/>{p.leftTitle??'修改前'}</div>
     <div style={{marginTop:is34?12:16,background:'#fff',borderRadius:14,padding:is34?'15px 16px':'18px 18px',fontSize:is34?23:g.portrait?25:24,lineHeight:1.5,color:applied?muted:ink}}>
      {prefix}<span style={{textDecoration:applied?'line-through':'none',opacity:applied?.68:1}}>{p.before}</span>{suffix}
     </div>
    </section>
    <section style={{background:mist,borderRadius:20,padding:is34?'20px 22px':g.portrait?'24px 26px':'28px',minHeight:is34?236:g.portrait?270:330,boxSizing:'border-box',border:`1.5px solid ${applied?'#8AD4FF':'transparent'}`,boxShadow:afterFocus>0?`0 14px 40px rgba(7,151,244,${.15*afterFocus})`:'none'}}>
     <div style={{display:'flex',alignItems:'center',gap:10,fontSize:is34?23:g.portrait?25:24,fontWeight:680}}><CleanIcon kind="preview" size={24}/>{p.rightTitle??'更新预览'}</div>
     <div style={{marginTop:is34?12:16,minHeight:is34?150:g.portrait?170:206,borderRadius:14,background:'#E9F0F2',padding:is34?'16px 16px':'20px 18px',boxSizing:'border-box',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:14}}>
      <span style={{color:applied?blue:muted,display:'grid',placeItems:'center'}}><CleanIcon kind={applied?'spark':'sound'} size={is34?38:44}/></span>
      <div style={{background:ink,color:'#fff',fontSize:is34?22:g.portrait?24:23,lineHeight:1.45,padding:'10px 18px',borderRadius:10,textAlign:'center',maxWidth:'94%'}}>
       {prefix}<span style={{padding:'2px 6px',borderRadius:5,background:applied?'#0797F440':'transparent',color:applied?'#8AD4FF':'#fff',fontWeight:650}}>{applied?p.after:p.before}</span>{suffix}
      </div>
     </div>
    </section>
   </div>
   <div style={{marginTop:is34?18:22,background:mist,borderRadius:16,height:is34?78:g.portrait?92:88,display:'grid',placeItems:'center',padding:'0 24px',opacity:1-.18*afterFocus}}>
    <Wave progress={1}/>
   </div>
   <div style={{marginTop:is34?14:16,color:muted,fontSize:is34?21:g.portrait?23:22,display:'flex',alignItems:'center',gap:10,opacity:ease(u,applyU+.18,applyU+.55)}}>
    <span style={{color:blue,display:'grid',placeItems:'center'}}><CleanIcon kind="check" size={22}/></span>{p.cue??'内容已同步更新'}
   </div>
  </CleanWindow>
  {modal>0?<>
   <AbsoluteFill style={{zIndex:10,background:'#111818',opacity:modal*.36}}/>
   <div style={{position:'absolute',zIndex:11,left:g.modal.x,top:g.modal.y,width:g.modal.w,height:g.modal.h,background:'#fff',borderRadius:30,boxShadow:'0 26px 76px #14222042',opacity:modal,transform:modal>=.999?undefined:`translateY(${(1-modal)*16}px) scale(${.98+.02*modal})`,overflow:'hidden'}}>
    <div style={{position:'absolute',left:24,top:22}}><Traffic color/></div>
    <div style={{textAlign:'center',marginTop:is34?46:g.portrait?54:46}}><Mark size={is34?48:g.portrait?54:50}/><div style={{fontSize:is34?30:g.portrait?33:30,fontWeight:700,marginTop:10}}>{p.modalTitle??p.action??'编辑内容'}</div></div>
    <div style={{position:'absolute',left:36,right:36,top:is34?192:g.portrait?210:176,borderRadius:18,background:mist,padding:is34?'18px 20px':g.portrait?'22px 22px':'20px 20px',fontSize:is34?24:g.portrait?26:24,lineHeight:1.48}}>
     <div style={{fontSize:is34?19:g.portrait?20:18,color:muted,marginBottom:8}}>{swapped?'优化后':'原表达'}</div>
     <div>{prefix}<span style={{padding:'2px 6px',borderRadius:6,background:swapped?'#DCEFFD':'#EAEFEF',color:swapped?blue:ink,fontWeight:650}}>{swapped?p.after:p.before}</span>{suffix}</div>
    </div>
    <div style={{...button,position:'absolute',left:36,right:36,bottom:is34?34:g.portrait?40:34,height:is34?72:g.portrait?76:68,borderRadius:18,fontSize:is34?25:g.portrait?27:25}}>
     <Mark size={26} cutout={blue}/>{p.applyLabel??'应用更新'}
    </div>
   </div>
  </>:null}
  <div style={{position:'absolute',inset:0,zIndex:20,pointerEvents:'none'}}>
   <Hand x={hx} y={hy} press={press} opacity={ease(u,Math.max(0,openU-.5),openU-.18)*(1-ease(u,applyU+.12,applyU+.36))}/>
  </div>
 </AbsoluteFill>;
}

function BoardScene({u,p,s,ep,fmt}:S){
 const g=cleanGeom(fmt),is34=g.is34,{d,picks}=boardTimings(s),enter=ease(u,0,.38),items:any[]=p.items;
 const activeIdx=Math.max(0,picks.reduce((acc,pk,i)=>(u>=pk?i:acc),0));
 const curPick=picks[activeIdx]??.4,nextPick=activeIdx+1<picks.length?picks[activeIdx+1]:d-.35,span=Math.max(.55,nextPick-curPick);
 const sel=ease(u,curPick,curPick+Math.min(.28,span*.25)),open=ease(u,curPick+span*.25,curPick+span*.52),land=ease(u,curPick+span*.62,curPick+span*.88);
 const trackPadX=g.portrait?20:24,labelW=g.portrait?108:112,trackGap=g.portrait?14:18,slotGap=g.portrait?12:18;
 const availSlotsW=g.bodyW-trackPadX*2-labelW-trackGap;
 const slotW=Math.min(g.portrait?236:290,Math.floor((availSlotsW-Math.max(0,items.length-1)*slotGap)/Math.max(1,items.length)));
 const slotX=(i:number)=>g.win.x+g.padX+trackPadX+labelW+trackGap+i*(slotW+slotGap)+slotW/2;
 const flyX=lerp(g.boardLeft.x,g.boardRight.x,open)+(slotX(activeIdx)-g.boardRight.x)*land;
 const flyY=lerp(g.boardLeft.y+40,g.boardRight.y,open)+(g.boardTrack.y-24-g.boardRight.y)*land;
 const fullCardW=is34?390:g.portrait?430:440,fullCardH=is34?208:g.portrait?236:240;
 const flyW=lerp(200,fullCardW,open)+(slotW-fullCardW)*land;
 const flyH=lerp(58,fullCardH,open)+(48-fullCardH)*land;
 const curItem=items[activeIdx];
 const cols=Math.min(3,Math.max(2,items.length));
 const cardBoxW=Math.floor(((g.portrait?g.bodyW:g.bodyW*.535)-44-(cols-1)*12)/cols);
 const gridCardH=is34?200:g.portrait?226:242;
 return <AbsoluteFill style={{opacity:enter}}>
  <CleanWindow fmt={fmt} windowTitle={p.window??ep.brand} heading={p.heading??ep.brand} action={p.action??'匹配画面'} icon="layers">
   <div style={{display:'grid',gridTemplateColumns:g.portrait?'1fr':'1fr 1.15fr',gap:is34?16:g.portrait?20:26}}>
    <div style={{height:is34?226:g.portrait?268:346,background:mist,borderRadius:20,padding:is34?'18px 22px':g.portrait?'22px 24px':'26px',boxSizing:'border-box'}}>
     <div style={{fontSize:is34?22:24,fontWeight:700}}>{p.leftTitle??'文稿要点'}</div>
     {p.text?<div style={{background:'#fff',borderRadius:12,padding:is34?'10px 14px':'13px 16px',marginTop:is34?10:12,fontSize:is34?20:22,color:'#2F3C3C'}}>{p.text}</div>:null}
     <div style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:is34?12:14}}>
      {items.map((it,i)=>{const on=u>=picks[i];return <div key={i} style={{padding:is34?'8px 14px':'9px 16px',borderRadius:12,background:on?'#DCEFFD':'#fff',border:`1.5px solid ${on?blue:'#E1E9E9'}`,color:on?blue:ink,fontSize:is34?20:g.portrait?22:21,fontWeight:650}}>{it.keyword}</div>;})}
     </div>
    </div>
    <div style={{height:is34?284:g.portrait?324:346,background:mist,borderRadius:20,padding:is34?'18px 20px':g.portrait?'22px 22px':'26px',boxSizing:'border-box'}}>
     <div style={{fontSize:is34?22:24,fontWeight:700}}>{p.rightTitle??'画面卡片'}</div>
     <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12,marginTop:is34?12:16,height:gridCardH+4}}>
      {items.map((it,i)=>{const hi=i===activeIdx&&u>=picks[i];return <div key={i} style={{borderRadius:16,overflow:'hidden',border:`2px solid ${hi?blue:'#E2ECEC'}`,background:'#fff',boxShadow:hi?'0 10px 28px #0797F426':'none'}}>
       <CleanMedia ep={ep} media={it.media} from={s.start} fallbackTitle={it.label??it.keyword} icon={it.icon??(i===0?'spark':i===1?'preview':'layers')} w={cardBoxW} h={gridCardH}/>
      </div>;})}
     </div>
    </div>
   </div>
   <div style={{marginTop:is34?16:20,background:mist,borderRadius:18,padding:`${is34?14:18}px ${trackPadX}px`,height:is34?172:g.portrait?200:168,boxSizing:'border-box',position:'relative'}}>
    <div style={{display:'flex',alignItems:'center',gap:trackGap,height:is34?48:54}}>
     <span style={{fontSize:g.portrait?19:20,color:muted,width:labelW,flexShrink:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.trackLabel??'时间轴'}</span>
     <div style={{display:'flex',gap:slotGap,flex:1,minWidth:0}}>
      {items.map((it,i)=>{const pk=picks[i],nx=i+1<picks.length?picks[i+1]:d-.35,ld=ease(u,pk+(nx-pk)*.62,pk+(nx-pk)*.88);
       return <div key={i} style={{width:slotW,height:is34?46:50,borderRadius:12,background:ld>.5?blue:'#E4ECEC',color:ld>.5?'#fff':muted,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'0 8px',boxSizing:'border-box',fontSize:g.portrait?18:20,fontWeight:650,opacity:.45+.55*ld,whiteSpace:'nowrap',overflow:'hidden'}}>
        <CleanIcon kind={it.icon??'layers'} size={18}/><span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{it.label??it.keyword}</span>
       </div>;})}
     </div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:trackGap,marginTop:is34?14:g.portrait?22:14}}>
     <span style={{fontSize:g.portrait?19:20,color:muted,width:labelW,flexShrink:0,whiteSpace:'nowrap'}}>音频轨</span>
     <div style={{flex:1,minWidth:0}}><Wave progress={1}/></div>
    </div>
   </div>
   {p.cue?<div style={{marginTop:is34?12:14,fontSize:is34?20:21,color:muted,opacity:ease(u,picks.at(-1)!+.45,picks.at(-1)!+.85)}}>{p.cue}</div>:null}
  </CleanWindow>
  {curItem&&sel>0&&land<.99?<div style={{position:'absolute',zIndex:15,left:flyX-flyW/2,top:flyY-flyH/2,width:flyW,height:flyH,borderRadius:16,boxShadow:'0 18px 46px #15324B26',background:'#E2F2FD',color:blue,display:'grid',placeItems:'center',fontSize:24,fontWeight:700,overflow:'hidden',opacity:sel*(1-land*.35)}}>
   <div style={{position:'absolute',inset:0,opacity:open*(1-land)}}><CleanMedia ep={ep} media={curItem.media} from={s.start} fallbackTitle={curItem.label??curItem.keyword} icon={curItem.icon??'spark'} w={fullCardW} h={fullCardH}/></div>
   <span style={{opacity:1-open+land}}>{curItem.keyword}</span>
  </div>:null}
  <div style={{position:'absolute',inset:0,zIndex:20,pointerEvents:'none'}}>
   <Hand x={flyX+28} y={flyY+18} press={sel*(1-open)+land*(1-ease(u,curPick+span*.88,curPick+span*.98))} opacity={ease(u,Math.max(0,picks[0]-.22),picks[0]+.08)*(1-ease(u,d-.48,d-.18))}/>
  </div>
 </AbsoluteFill>;
}

function PreviewScene({u,p,s,ep,fmt}:S){
 const g=cleanGeom(fmt),is58=g.is58,is34=g.is34,{d,mode,switchU}=previewTimings(s),enter=ease(u,0,.38);
 const formats:[string,string][]=p.formats??[['横屏成片','1920 × 1080'],is34?['3:4 竖屏','1080 × 1440']:is58?['5:8 竖屏','1080 × 1728']:['竖屏成片','1080 × 1920']];
 const showPhone=mode==='phone'?ease(u,.05,.5):mode==='desktop'?0:ease(u,switchU,switchU+.48);
 const winFade=mode==='both'?1-ease(u,switchU,switchU+.24):1;
 const morphPortrait=mode==='desktop'?ease(u,d*.35,d*.62):ease(u,Math.max(.35,switchU*.45),Math.max(.85,switchU*.88));
 const phoneW=is34?396:is58?446:g.portrait?424:356,phoneH=is34?724:is58?836:g.portrait?816:696,phoneTop=is34?128:is58?196:g.portrait?212:124;
 const resolved=p.media?resolveTalkClip(ep,p.media):null;
 const isCardMedia=!resolved||resolved.kind==='card';
 const deskW=(is34?720:is58?756:720)-(is34?276:is58?306:g.portrait?300:440)*morphPortrait;
 const deskH=(is34?405:is58?424:g.portrait?408:405)+(is34?187:is58?286:g.portrait?320:44)*morphPortrait;
 return <AbsoluteFill style={{opacity:enter}}>
  {mode!=='phone'&&winFade>.001?<CleanWindow fmt={fmt} windowTitle={p.window??ep.brand} heading={p.heading??ep.brand} action={p.action??'导出成片'} icon="preview" style={{opacity:winFade}}>
   <div style={{height:is34?640:is58?780:g.portrait?880:510,background:mist,borderRadius:22,display:'grid',placeItems:'center',position:'relative'}}>
    <div style={{position:'absolute',left:26,top:22,fontSize:22,color:muted,fontWeight:600}}>{morphPortrait>.5?(is34?'竖屏 3:4':is58?'竖屏 5:8':'竖屏 9:16'):'横屏 16:9'}</div>
    <div style={{position:'relative',width:Math.round(deskW),height:Math.round(deskH),borderRadius:18,overflow:'hidden',boxShadow:'0 12px 36px #162E4522',background:'#fff'}}>
     <CleanMedia ep={ep} media={p.media} from={s.start} fallbackTitle={p.title??ep.brand} footerPill={isCardMedia?p.caption:undefined} icon="preview" w={Math.round(deskW)} h={Math.round(deskH)}/>
     {!isCardMedia&&p.caption?<div style={{position:'absolute',bottom:20,left:14,right:14,textAlign:'center'}}><span style={{display:'inline-block',background:ink,color:'#fff',borderRadius:8,padding:'6px 14px',fontSize:20,fontWeight:600}}>{p.caption}</span></div>:null}
    </div>
   </div>
  </CleanWindow>:null}
  {showPhone>0?<AbsoluteFill style={{zIndex:5}}>
   <AbsoluteFill style={{background:'#FFFFFF',opacity:Math.min(1,showPhone*2.4)}}/>
   <div style={{position:'absolute',left:Math.round(g.cx-phoneW/2),top:phoneTop,width:phoneW,height:phoneH,borderRadius:is34?48:52,background:'#0E1114',padding:13,boxSizing:'border-box',boxShadow:'0 36px 86px #1424233B',opacity:Math.min(1,showPhone*1.8),transform:showPhone>=.999?undefined:`translateY(${(1-showPhone)*48}px)`}}>
    <div style={{width:'100%',height:'100%',borderRadius:is34?36:40,overflow:'hidden',background:'#fff',position:'relative'}}>
     <CleanMedia ep={ep} media={p.media} from={s.start} fallbackTitle={p.title??ep.brand} footerPill={isCardMedia?p.caption:undefined} icon="spark" w={phoneW-26} h={phoneH-26} defaultFit="contain"/>
     {!isCardMedia&&p.caption?<div style={{position:'absolute',bottom:24,left:14,right:14,textAlign:'center'}}><span style={{display:'inline-block',background:'#090B0BD8',color:'#fff',borderRadius:10,padding:'7px 14px',fontSize:20,fontWeight:600}}>{p.caption}</span></div>:null}
    </div>
   </div>
   {formats.map(([name,size],i)=>{
    const pq=ease(u,(mode==='phone'?.25:switchU+.22)+i*.16,(mode==='phone'?.72:switchU+.68)+i*.16);
    if(g.portrait){
     const colW=formats.length===1?(is34?520:is58?540:520):(is34?436:is58?446:426),gap=is34?32:36;
     const left=formats.length===1?Math.round(g.cx-colW/2):((is34?88:is58?76:96)+i*(colW+gap));
     const pillTop=is34?916:is58?1100:1096;
     return <div key={`${name}-${i}`} style={{position:'absolute',left,top:pillTop,width:colW,padding:is34?'20px 16px':'24px 18px',boxSizing:'border-box',textAlign:'center',borderRadius:22,background:i?blue:'#fff',color:i?'#fff':ink,border:i?'none':'1px solid #E1E8E8',boxShadow:'0 14px 38px #17344C1C',opacity:pq,transform:pq>=.999?undefined:`translateY(${(1-pq)*28}px)`}}>
      <div style={{fontSize:is34?28:30,fontWeight:700}}>{name}</div><div style={{fontSize:is34?21:22,opacity:.78,marginTop:6}}>{size}</div>
     </div>;
    }
    const side=i?1:-1;
    return <div key={`${name}-${i}`} style={{position:'absolute',left:Math.round(g.cx+side*(228+pq*216)-155),top:405+i*56,width:310,padding:'22px 16px',boxSizing:'border-box',textAlign:'center',borderRadius:22,background:i?blue:'#fff',color:i?'#fff':ink,border:i?'none':'1px solid #E1E8E8',boxShadow:'0 14px 38px #17344C1C',opacity:pq,transform:`rotate(${side*3.5*pq}deg)`}}>
     <div style={{fontSize:30,fontWeight:700}}>{name}</div><div style={{fontSize:21,opacity:.78,marginTop:6}}>{size}</div>
    </div>;
   })}
  </AbsoluteFill>:null}
 </AbsoluteFill>;
}

function ClosingScene({u,d,p,ep,fmt}:S){
 const g=cleanGeom(fmt),is58=g.is58,is34=g.is34,brand=p.brand??ep.brand,hasBar=Boolean(p.search||p.cta);
 const sU=p.searchAt!=null?p.searchAt-(p.__start??0):Math.min(1.0,d*.32);
 const bar=hasBar?ease(u,sU,sU+.48):0,typedText=p.search??p.cta??'';
 const chars=Array.from(typedText),typed=Math.floor(chars.length*ease(u,sU+.2,Math.max(sU+.55,d-.65)));
 const y0=is34?-72:is58?-68:0,y1=hasBar?(is34?-164:is58?-172:g.portrait?-150:-110):y0;
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:ease(u,0,.42)}}>
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',transform:`translateY(${Math.round(lerp(y0,y1,bar))}px)`}}>
   <div style={{display:'flex',flexDirection:g.portrait?'column':'row',alignItems:'center',gap:g.portrait?20:28}}>
    <Mark size={is34?108:is58?116:g.portrait?112:108}/>
    <div style={{fontSize:is34?fitSize(brand,88,920):is58?fitSize(brand,92,920):g.portrait?fitSize(brand,88,880):fitSize(brand,96,1320),fontWeight:750,letterSpacing:-3,textAlign:'center'}}>{brand}</div>
   </div>
   {p.tagline?<div style={{fontSize:is34?30:is58?32:g.portrait?30:28,color:muted,marginTop:20,opacity:ease(u,.25,.75),textAlign:'center',padding:'0 60px'}}>{p.tagline}</div>:null}
  </div>
  {hasBar?<div style={{position:'absolute',top:is34?736:is58?872:g.portrait?1010:590,width:is34?920:is58?940:g.portrait?900:1120,height:is34?138:g.portrait?146:152,borderRadius:90,border:'3px solid #E1E8E8',background:'#FFFFFF',boxShadow:'0 18px 56px #1A282818',display:'flex',alignItems:'center',gap:28,padding:g.portrait?'0 42px':'0 54px',boxSizing:'border-box',opacity:bar,transform:bar>=.999?undefined:`translateY(${(1-bar)*22}px) scale(${.96+.04*bar})`}}>
   <svg width={g.portrait?56:66} height={g.portrait?56:66} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} strokeLinecap="round" style={{flexShrink:0}}><circle cx={11} cy={11} r={7}/><path d="m20 20-3.6-3.6"/></svg>
   <span style={{fontSize:g.portrait?fitSize(typedText,54,640):fitSize(typedText,68,840),fontWeight:680,letterSpacing:-1,whiteSpace:'nowrap',overflow:'hidden'}}>
    {chars.slice(0,typed).join('')}<span style={{color:blue,opacity:Math.floor(u*3)%2?1:0}}>|</span>
   </span>
   {p.cta&&p.search?<span style={{...button,marginLeft:'auto',padding:'12px 26px',borderRadius:99,fontSize:24,flexShrink:0}}>{p.cta}</span>:null}
  </div>:null}
 </AbsoluteFill>;
}

const SCENES:Record<string,React.FC<S>>={
 'clean.opening':OpeningScene,'clean.chapter':ChapterScene,'clean.drop':DropScene,
 'clean.edit':EditScene,'clean.board':BoardScene,'clean.preview':PreviewScene,'clean.closing':ClosingScene,
};

function SceneCamera({shot,u,fmt,children}:{shot:TalkShot;u:number;fmt:CleanFormat;children:React.ReactNode}){
 const g=cleanGeom(fmt),keys=buildSceneCamera(shot,fmt),cam=cameraAt(u,keys,g.w,g.h);
 const dx=g.cx-cam.x*cam.s,dy=g.cy-cam.y*cam.s;
 const still=Math.abs(cam.s-1)<1e-3&&Math.abs(dx)<.5&&Math.abs(dy)<.5;
 return <AbsoluteFill style={still?undefined:{transformOrigin:'0 0',transform:`translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) scale(${cam.s.toFixed(4)})`}}>{children}</AbsoluteFill>;
}

function Subtitle({t,ep,fmt}:{t:number;ep:CleanTalkEpisode;fmt:CleanFormat}){
 const c=ep.captions.find(x=>t>=x.start&&t<x.end);if(!c)return null;
 const portrait=fmt!=='landscape',is58=fmt==='5:8',is34=fmt==='3:4',n=Array.from(c.text).length;
 const side=is58||is34?48:portrait?56:80,top=is34?1296:is58?1516:portrait?1605:946;
 return <div style={{position:'absolute',left:side,right:side,top,zIndex:30,display:'flex',justifyContent:'center',pointerEvents:'none'}}>
  <div style={{fontSize:portrait?(n>18?38:42):(n>24?38:42),fontWeight:600,lineHeight:1.4,padding:portrait?'10px 28px':'8px 30px',borderRadius:16,background:'#090B0BE0',color:'#FFFFFF',boxShadow:'0 10px 30px #090B0B24',textAlign:'center'}}>{c.text}</div>
 </div>;
}

export const cleanTalkMetadata:CalculateMetadataFunction<CleanTalkProps>=async({props})=>{
 const ep:CleanTalkEpisode=props.ep??await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then(r=>r.json());
 validateCleanTalk(ep);
 const format:CleanFormat=props.format??ep.format??'landscape';
 const {w,h}=cleanFormatDims(format);
 return {durationInFrames:Math.round(ep.duration*TALK_FPS),fps:TALK_FPS,width:w,height:h,props:{...props,ep,format}};
};

export const CleanTalk:React.FC<CleanTalkProps>=({ep,format,audio=true})=>{
 const {fps,width,height}=useVideoConfig(),t=useCurrentFrame()/fps;if(!ep)return null;
 const fmt:CleanFormat=format??ep.format??(height>width?(Math.abs(width/height-3/4)<.03?'3:4':Math.abs(width/height-5/8)<.03?'5:8':'portrait'):'landscape');
 return <AbsoluteFill style={{background:'#FFFFFF',fontFamily:font,color:ink,overflow:'hidden'}}>
  <FontGate text={JSON.stringify([ep.brand,ep.title,ep.clips,ep.captions,ep.shots])+'导入素材将文件拖入此处结构提取要点对齐预览就绪已完成解析解析结果开始优化修改前更新预览原表达优化后编辑内容应用更新内容已同步更新匹配画面文稿要点画面卡片时间轴音频轨导出成片横屏竖屏5:83:4|'}/>
  {audio?<Sequence from={Math.round((ep.audioOffset??0)*fps)} layout="none"><Audio src={staticFile(talkAsset(ep,ep.audio))}/></Sequence>:null}
  {audio&&ep.music?<Audio loop src={staticFile(talkAsset(ep,ep.music.src))} volume={f=>musicGainAt(ep,f/fps)}/>:null}
  {audio&&ep.sfx?<Audio src={staticFile(talkAsset(ep,ep.sfx.src))} volume={ep.sfx.volume??.5}/>:null}
  {ep.shots.map((s,i)=>{
   if(t<s.start||t>=s.end+TALK_OVERLAP)return null;
   const Scene=SCENES[s.template],u=t-s.start,d=s.end-s.start,last=i===ep.shots.length-1,out=last?0:ease(t,s.end-.06,s.end+TALK_OVERLAP);
   return <AbsoluteFill key={s.id} style={{opacity:1-out,filter:out?`blur(${out*8}px)`:undefined}}>
    <SceneCamera shot={s} u={u} fmt={fmt}><Scene t={t} u={u} d={d} p={{...s.props,__start:s.start}} s={s} ep={ep} fmt={fmt}/></SceneCamera>
   </AbsoluteFill>;
  })}
  <Subtitle t={t} ep={ep} fmt={fmt}/>
 </AbsoluteFill>;
};
