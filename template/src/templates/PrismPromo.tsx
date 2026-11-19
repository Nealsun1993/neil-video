import React from 'react';
import {AbsoluteFill,Audio,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {ease,font,Glyph} from './CleanUiDemo';

export type PrismProps={brand:string;prompt:string;project:string;action:string;closing:string;audio?:boolean};
const rainbow='linear-gradient(105deg,#428BFF 5%,#8A7BFC 24%,#18DBB0 62%,#A3F773 90%)';
const center:React.CSSProperties={position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'};
const blue='#508DFF', colors=['#398BFF','#4EE7A8','#FFE66A','#FF6A87','#A895FF','#49CCF2'];
const kinds=['sound','text','preview','check','text','preview'] as const;
const range=(t:number,a:number,b:number,x:number,y:number)=>interpolate(t,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});

function Spectrum({t,full=false}:{t:number;full?:boolean}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const dx=Math.sin(t*.92)*16,dy=Math.cos(t*.67)*15;
 const field='radial-gradient(ellipse at '+(11+dx)+'% '+(88+dy)+'%, #FFC338 0%, transparent 43%),radial-gradient(ellipse at '+(75-dx)+'% '+(70+dy)+'%, #FD254C 0%, transparent 57%),radial-gradient(ellipse at '+(14-dx)+'% '+(12+dy)+'%, #3286FD 0%, transparent 65%),linear-gradient(145deg,#33D7AE,#617CFF 39%,#DA3A9E 79%,#FF5639)';
 return full?<AbsoluteFill style={{background:field}}/>:
  <div style={{position:'absolute',left:-80,right:-80,bottom:-80,height:portrait?480:350,background:'radial-gradient(ellipse at '+(16+dx/2)+'% 81%,#397DFF 0%,transparent 49%),radial-gradient(ellipse at 48% 86%,#F74A24 0%,transparent 34%),radial-gradient(ellipse at 61% 95%,#FFC844 0%,transparent 29%),radial-gradient(ellipse at '+(79-dx/2)+'% 88%,#38EA81 0%,transparent 43%)',filter:'blur(36px)',opacity:.84,pointerEvents:'none'}}/>;
}

function DotIcon({index=0,size=62,glow=true}:{index?:number;size?:number;glow?:boolean}){
 const c=colors[index%colors.length];
 return <div style={{width:size,height:size,borderRadius:Math.round(size*.27),display:'grid',placeItems:'center',color:'#FFF',background:'linear-gradient(145deg,'+c+',#151922)',boxShadow:glow?'0 0 28px '+c+'88':'none'}}>
  <Glyph kind={kinds[index%kinds.length]} size={size*.58}/>
 </div>;
}

function ReadyIcon(){
 return <svg width={108} height={80} viewBox="0 0 108 80" aria-hidden style={{overflow:'visible',filter:'drop-shadow(0 0 13px #49E6AE64)'}}>
  <defs>
   <linearGradient id="prism-ready-back" x2="1" y2="1"><stop stopColor="#55AAFF"/><stop offset="1" stopColor="#4FC8CE"/></linearGradient>
   <linearGradient id="prism-ready-front" x1="0" y1="1" x2="1" y2=".18"><stop stopColor="#32BDA1"/><stop offset="1" stopColor="#72DE94"/></linearGradient>
  </defs>
  <rect x={6} y={16} width={77} height={55} rx={13} fill="url(#prism-ready-back)" opacity={.87}/>
  <rect x={18} y={9} width={84} height={57} rx={14} fill="url(#prism-ready-front)" stroke="#A2F0C1" strokeOpacity=".46"/>
  <path d="M52 22a1.6 1.6 0 0 1 2.45-1.35l16.1 9.85a1.6 1.6 0 0 1 0 2.7l-16.1 9.85A1.6 1.6 0 0 1 52 41.7z" fill="#F5FFF9"/>
  <path d="M39 53h15m6 0h20" fill="none" stroke="#F5FFF9" strokeWidth={3.5} strokeLinecap="round"/>
 </svg>;
}

function Pointer({x,y,press=0,opacity=1}:{x:number;y:number;press?:number;opacity?:number}){
 return <svg viewBox="0 0 64 70" width={64} height={70} style={{position:'absolute',left:x-21,top:y-4,opacity,transformOrigin:'21px 6px',transform:'rotate(19deg) scale('+(1-.22*press)+')',filter:'drop-shadow(0 0 13px #57A4FF77)'}}>
  <path d="M24 5 53 63 31 54 11 65Z" fill="#FFF" stroke={blue} strokeWidth={6} strokeLinejoin="round"/>
 </svg>;
}

function Intro({u,brand}:{u:number;brand:string}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const enter=ease(u,.04,.56),leave=ease(u,3.52,4);
 const verbs=1-ease(u,1.08,1.48),icons=ease(u,1.06,1.62)*(1-ease(u,2.72,3.03)),logo=ease(u,2.76,3.21);
 return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:enter*(1-leave)}}>
  <div style={{...center,whiteSpace:'nowrap',fontSize:portrait?110:154,fontWeight:600,letterSpacing:-8,background:rainbow,backgroundClip:'text',color:'transparent',opacity:verbs}}>把口播做成视频</div>
  <div style={{...center,textAlign:'center',opacity:icons}}>
   <div style={{fontSize:portrait?92:110,fontWeight:560,color:'#B5BABD',lineHeight:1.15}}>从一段口播</div>
   <div style={{display:'flex',justifyContent:'center',gap:portrait?20:28,margin:portrait?'36px 0':'28px 0'}}>{colors.map((_,i)=><div key={i} style={{opacity:ease(u,1.06+i*.07,1.3+i*.07),transform:'translateY('+((1-ease(u,1.06+i*.07,1.3+i*.07))*38)+'px)'}}><DotIcon index={i} size={portrait?61:69}/></div>)}</div>
   <div style={{fontSize:portrait?92:110,fontWeight:560,color:'#B5BABD'}}>到一条成片</div>
  </div>
  <div style={{...center,display:'flex',alignItems:'center',gap:22,whiteSpace:'nowrap',fontSize:portrait?73:83,letterSpacing:-3,opacity:logo}}><DotIcon index={1} size={77}/>{brand}</div>
 </AbsoluteFill>;
}

function PromptToBuild({u,prompt,action}:{u:number;prompt:string;action:string}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const typed=[...prompt].slice(0,Math.floor(range(u,.15,2.35,0,[...prompt].length))).join('');
 const color=ease(u,2.24,2.75)*(1-ease(u,6,6.78));
 const grow=ease(u,4.72,6.15),shrink=ease(u,2.18,3.15),aim=ease(u,3.18,4.56);
 const click=ease(u,4.45,4.63)*(1-ease(u,4.65,4.84));
 const panelWidth=(portrait?850:1130)*(1.08-.16*shrink)*(1-grow)+(portrait?862:1200)*grow;
 const panelHeight=(portrait?330:240)*(1.08-.16*shrink)*(1-grow)+(portrait?1080:830)*grow;
 const panelX=(width-panelWidth)/2,panelY=(height-panelHeight)/2-grow*(portrait?35:56);
 const trace=ease(u,4.72,5.05)*(1-ease(u,6.55,7.05));
 const entry=ease(u,0,.39),body=ease(u,5.85,6.45),result=ease(u,8.12,8.78);
 return <>
  <AbsoluteFill style={{opacity:color}}><Spectrum t={u} full/></AbsoluteFill>
  <AbsoluteFill style={{opacity:ease(u,5.86,7)}}><Spectrum t={u}/></AbsoluteFill>
  <div style={{position:'absolute',left:panelX,top:panelY,width:panelWidth,height:panelHeight,opacity:entry,boxSizing:'border-box',border:'1px solid #607177',borderRadius:31,overflow:'hidden',background:'#090B0B',boxShadow:'0 0 '+(95*(1-body))+'px #85FF7B2F'}}>
   <div style={{position:'absolute',inset:0,opacity:1-ease(u,4.8,5.39),padding:'36px 41px'}}>
    <div style={{fontSize:portrait?43:38,lineHeight:1.35}}>{typed}<span style={{color:'#FFEB79',opacity:Math.floor(u*3)%2===0?1:0}}>▏</span></div>
    <div style={{position:'absolute',bottom:26,left:32,display:'flex',gap:13,color:'#CFD0D4'}}>{(['sound','text'] as const).map(k=><div key={k} style={{display:'grid',placeItems:'center',width:51,height:46,border:'1px solid #3D4246',borderRadius:12}}><Glyph kind={k} size={24}/></div>)}</div>
    <div style={{position:'absolute',bottom:26,right:27,padding:'12px 25px',borderRadius:13,fontSize:26,color:'#0A0B0D',background:'#F6F7F7',fontWeight:650}}>{action} ↗</div>
   </div>
   <div style={{position:'absolute',inset:0,opacity:body}}>
    <div style={{padding:'38px 50px',fontSize:27,color:'#A9ADB3'}}>◈　口播工作台 · 流程示意</div>
    <div style={{margin:'0 49px',padding:'27px 34px',background:'#202225',borderRadius:20,fontSize:portrait?35:31,color:'#DDDFE2'}}>{prompt}</div>
    <div style={{position:'absolute',left:54,right:54,top:portrait?360:299,bottom:48,border:'1px solid #353F45',borderRadius:25,padding:'24px 28px'}}>
     {['字幕轨','画面轨'].map((label,i)=>{
      const reveal=ease(u,6.28+i*.49,7.1+i*.55);
      return <div key={label} style={{display:'flex',alignItems:'center',gap:17,marginBottom:17,fontSize:24,color:'#C4D0D6',opacity:reveal}}>
       <Glyph kind={i===0?'text':'preview'} size={31}/><span>{label}</span>
       <div style={{flex:1,height:13,borderRadius:9,background:i===0?'linear-gradient(90deg,#61C2F5,#667EEC)':'linear-gradient(90deg,#51DCA9,#4CABDF)',transform:'scaleX('+reveal+')',transformOrigin:'left'}}/>
      </div>;
     })}
     <div style={{display:'grid',justifyItems:'center',gap:20,marginTop:portrait?61:30,textAlign:'center',opacity:result}}><ReadyIcon/><div style={{fontSize:39}}>文稿与画面已就绪</div><div style={{fontSize:24,color:'#A8B1B5'}}>接下来确认预览</div></div>
    </div>
   </div>
  </div>
  <svg width={width} height={height} style={{position:'absolute',inset:0,opacity:trace,pointerEvents:'none',filter:'drop-shadow(0 0 12px #63BCFF)'}}>
   <defs><linearGradient id="prism-trace"><stop stopColor="#64BBFF"/><stop offset=".5" stopColor="#A394FF"/><stop offset="1" stopColor="#62F3BC"/></linearGradient></defs>
   {[2,14,26].map((inset,i)=><rect key={inset} x={panelX-inset} y={panelY-inset} width={panelWidth+2*inset} height={panelHeight+2*inset} rx={31+inset} pathLength={100} strokeDasharray="100" strokeDashoffset={(1-ease(u,4.78+i*.14,5.89+i*.14))*100} fill="none" stroke="url(#prism-trace)" strokeWidth={i===0?3:2} opacity={1-i*.23}/>)}
  </svg>
  <Pointer x={panelX+panelWidth-76+(1-aim)*(portrait?83:90)} y={panelY+panelHeight-47+(1-aim)*(portrait?207:170)} press={click} opacity={ease(u,2.73,3.2)*(1-ease(u,4.68,4.94))}/>
 </>;
}

function Action({u}:{u:number}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const hit=ease(u,2.08,2.23),q=ease(u,.44,2.15),move=ease(u,.2,1.96),end=ease(u,3.2,3.55);
 return <>
  <Spectrum t={u+7} full/>
  <div style={{...center,whiteSpace:'nowrap',padding:portrait?'24px 42px 29px':'24px 56px 29px',fontSize:portrait?66:75,fontWeight:560,background:hit>.44?'white':'#222326',color:hit>.44?'#161719':'white',borderRadius:49,transform:'translate(-50%,-50%) scale('+(.52+1.04*q-.17*end)+')',opacity:ease(u,0,.38)}}>继续预览</div>
  <Pointer x={portrait?902-297*move:1330-307*move} y={portrait?1280-298*move:790-230*move} press={hit*(1-end)} opacity={1-end}/>
 </>;
}

const pale='#EFF1F2';
function Confirm({u,project}:{u:number;project:string}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const appear=ease(u,0,.47),focus=ease(u,1.1,2.25)*(1-ease(u,3.2,4)),aim=ease(u,3.63,5.02),press=ease(u,4.9,5.09)*(1-ease(u,5.09,5.33));
 return <AbsoluteFill style={{opacity:appear*(1-ease(u,5.55,6)),transform:'scale('+(1+(portrait?.15:.25)*focus)+')'}}>
  <div style={{...center,width:portrait?842:1030,height:portrait?930:744,borderRadius:27,background:'#fff',color:'#151718',padding:56,boxSizing:'border-box',boxShadow:'0 24px 105px #0009'}}>
   <div style={{display:'flex',alignItems:'center',gap:17,fontSize:29}}><DotIcon size={44} glow={false}/> 口播工作台</div>
   <div style={{fontSize:portrait?54:53,marginTop:portrait?50:32,letterSpacing:-1,fontWeight:600}}>{project}可以开始预览</div>
   <div style={{marginTop:portrait?37:28,fontSize:portrait?32:28,color:'#585C61'}}>检查字幕、画面和横竖屏输出设置。</div>
   <div style={{marginTop:portrait?64:44,borderTop:'1px solid #E4E5E8',paddingTop:28,fontSize:portrait?34:29,lineHeight:1.8}}>
    <div>字幕已同步</div><div>画面卡已加入时间轴</div><div>{portrait?'竖屏预览 · 1080 × 1920':'横屏预览 · 1920 × 1080'}</div>
   </div>
   <div style={{position:'absolute',left:58,right:58,bottom:76,display:'flex',justifyContent:'space-between',gap:20,fontSize:28,textAlign:'center'}}>
    <span style={{flex:1,color:'#2A60B1',padding:16}}>返回</span><span style={{flex:1,color:'#204A8C',padding:16,background:press>.1?'#DCE8FC':pale,borderRadius:40}}>确认预览</span>
   </div>
  </div>
  <Pointer x={portrait?949-229*aim:1510-262*aim} y={portrait?1475-164*aim:942-129*aim} press={press} opacity={ease(u,3.65,4.02)}/>
 </AbsoluteFill>;
}

function Result({u,project}:{u:number;project:string}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const show=ease(u,0,.55),slide=ease(u,1.46,2.55);
 return <AbsoluteFill style={{opacity:show*(1-ease(u,4.15,4.55))}}>
  <Spectrum t={u}/>
  <div style={{...center,marginLeft:(portrait?-76:-150)*slide,marginTop:portrait?-113*slide:0,width:portrait?824:1100,height:portrait?1160:675,borderRadius:28,border:'1px solid #4B4F54',background:'#15171A',padding:35,boxSizing:'border-box',opacity:.18+.65*slide}}>
   <div style={{fontSize:26}}>口播工作台 · 流程示意</div>
   {[86,64,78,55,91,45].map((w,i)=><div key={i} style={{width:w+'%',height:11,borderRadius:9,background:'#44484D',marginTop:25}}/>)}
  </div>
  <div style={{...center,marginLeft:(portrait?73:144)*slide,marginTop:portrait?83*slide:0,width:portrait?771:936,height:portrait?1080:587,borderRadius:22,background:'#FFF',boxSizing:'border-box',color:'#101314',padding:'27px 32px',boxShadow:'0 20px 75px #0009'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:26}}><b>{project}</b><span style={{fontSize:17,color:'#5A6063'}}>成片预览 · 示意</span></div>
   <div style={{height:portrait?800:370,width:portrait?450:'100%',margin:portrait?'27px auto 0':'21px 0 0',background:'linear-gradient(150deg,#DDEBFF,#DDF8EB)',borderRadius:16,display:'grid',placeItems:'center'}}>
    <div style={{textAlign:'center',display:'grid',justifyItems:'center',gap:20,fontSize:portrait?36:43,fontWeight:650}}><DotIcon index={0} size={83} glow={false}/>{portrait?<span>从一段口播<br/>到一条成片</span>:<span>从一段口播，到一条成片</span>}</div>
   </div>
   <div style={{marginTop:24,borderRadius:13,height:73,background:pale,padding:'16px 23px',boxSizing:'border-box',display:'flex',alignItems:'center',gap:18,fontSize:25}}><Glyph kind="check" size={30}/> 预览已就绪<span style={{marginLeft:'auto',fontSize:20,color:'#656D71'}}>MP4 · {portrait?'9:16':'16:9'}</span></div>
  </div>
 </AbsoluteFill>;
}

function Outro({u,closing,brand}:{u:number;closing:string;brand:string}){
 const {width,height}=useVideoConfig(),portrait=height>width;
 const end=ease(u,1.28,1.86);
 return <AbsoluteFill style={{alignItems:'center',justifyContent:'center'}}>
  <div style={{...center,whiteSpace:'nowrap',fontSize:portrait?98:109,letterSpacing:-5,opacity:(1-end)*ease(u,0,.45)}}>{closing}</div>
  <div style={{...center,whiteSpace:'nowrap',fontSize:65,letterSpacing:-2,background:rainbow,backgroundClip:'text',color:'transparent',opacity:end}}>{brand}</div>
 </AbsoluteFill>;
}

export const PrismPromo:React.FC<PrismProps>=({brand,prompt,project,action,closing,audio=true})=>{
 const {fps}=useVideoConfig(),t=useCurrentFrame()/fps;
 return <AbsoluteFill style={{background:'#000000',color:'#F5F7F7',fontFamily:font,overflow:'hidden'}}>
  <FontGate text={brand+prompt+project+action+closing+'把口播做成视频从一段到一条成片流程示意字幕轨画面轨文稿与画面已就绪接下来确认预览继续检查字幕画面和横竖屏输出设置同步卡已加入时间轴返回确认可以开始预览'}/>
  {audio?<Audio src={staticFile('prism-promo/music.m4a')}/>:null}
  {t<4?<Intro u={t} brand={brand}/>:t<14.5?<PromptToBuild u={t-4} prompt={prompt} action={action}/>:t<18.5?<Action u={t-14.5}/>:t<24.5?<Confirm u={t-18.5} project={project}/>:t<29?<Result u={t-24.5} project={project}/>:<Outro u={t-29} closing={closing} brand={brand}/>}
 </AbsoluteFill>;
};
