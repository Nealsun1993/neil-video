import React from 'react';
import {AbsoluteFill,Audio,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction} from 'remotion';
import {FontGate} from '../kit/frame';
import {ease,font,Mark,Traffic} from './CleanUiDemo';
import {PrismChatConfig,ChatScene,ChatMessage,CHAT_FPS,CARD_W,CHAT_TEXT,sceneAt,darkAt,validatePrismChat} from '../kit/prismChat';

// 虹彩对话版：虹彩底场全程铺满，白色对话卡直接浮在上面并叠出景深；暗场是中间黑、四角留虹彩。
export type PrismChatProps={config?:PrismChatConfig;audio?:boolean};
const INK='#14161C',MUTED='#8A8F9C',BLUE='#1D6BF3',RAINBOW='linear-gradient(100deg,#FF8A3D,#FF3D77 45%,#8C5BFF 80%,#3E8BFF)';
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q;

function Field({t,dark}:{t:number;dark:number}){
 const dx=Math.sin(t*.8)*14,dy=Math.cos(t*.62)*12;
 return <AbsoluteFill style={{background:`radial-gradient(ellipse at ${14+dx}% ${86+dy}%, #FFB03A 0%, transparent 42%),radial-gradient(ellipse at ${78-dx}% ${68+dy}%, #FF2D55 0%, transparent 55%),radial-gradient(ellipse at ${16-dx}% ${14+dy}%, #3A7BFF 0%, transparent 60%),radial-gradient(ellipse at ${84+dx}% ${10-dy}%, #FF6A2B 0%, transparent 46%),linear-gradient(140deg,#5B6CFF,#C13CCB 45%,#FF4B4B 80%)`}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse 80% 92% at 50% 50%, #000 44%, #000000d8 62%, transparent 100%)',opacity:dark}}/>
 </AbsoluteFill>;
}
// 镂空品牌标：放在虹彩上时中间透出底色。
function HollowMark({size}:{size:number}){
 return <svg width={size} height={size} viewBox="0 0 40 40"><defs><mask id="prism-mark-hole"><rect x={3} y={3} width={34} height={34} rx={11} fill="#fff"/>{[9,20,31].flatMap(a=>[[a,6],[a,34],[6,a],[34,a]]).map(([x,y],i)=><circle key={i} cx={x} cy={y} r={6} fill="#fff"/>)}<rect x={12} y={12} width={16} height={16} rx={3.4} fill="#000"/></mask></defs><rect width={40} height={40} fill="#fff" mask="url(#prism-mark-hole)"/></svg>;
}
function Play({size,color='#fff'}:{size:number;color?:string}){
 return <svg width={size} height={size} viewBox="0 0 40 40"><rect x={3} y={6} width={34} height={28} rx={8} fill={color}/><path d="M17 14.5v11l9-5.5z" fill="#000"/></svg>;
}
// 进出场都用推焦：模糊加轻微缩放。
const focus=(t:number,s:ChatScene,inDur=.3,outDur=.28)=>{const a=ease(t,s.start,s.start+inDur),b=1-ease(t,s.end-outDur,s.end);return {opacity:Math.min(a,b),filter:`blur(${(1-a)*14+(1-b)*16}px)`,k:lerp(.94,1,a)*lerp(1.06,1,b)};};

function Logo({t,s,brand}:{t:number;s:ChatScene;brand:string}){
 const f=focus(t,s,.35,.25);
 return <AbsoluteFill style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:22,fontSize:72,fontWeight:650,opacity:f.opacity,filter:f.filter,transform:`scale(${f.k*(1+(t-s.start)*.02)})`}}><Mark size={78} cutout="#000"/>{brand}</AbsoluteFill>;
}
function Icons({t,s}:{t:number;s:ChatScene}){
 const u=t-s.start,a=ease(u,0,.4),split=ease(u,.35,.75),out=ease(t,s.end-.25,s.end);
 return <AbsoluteFill style={{opacity:1-out,filter:`blur(${out*14}px)`}}>
  <div style={{position:'absolute',left:960-90-split*120,top:450,transform:`scale(${lerp(.3,1,a)*(1+u*.05)})`,opacity:a}}><HollowMark size={180}/></div>
  <div style={{position:'absolute',left:960-90+split*120,top:450,transform:`scale(${lerp(.3,1,split)*(1+u*.05)})`,opacity:split}}><Play size={180}/></div>
 </AbsoluteFill>;
}
function Headline({t,s}:{t:number;s:ChatScene}){
 const lines=s.lines as string[],out=ease(t,s.end-.25,s.end);
 return <AbsoluteFill style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:200,fontWeight:700,letterSpacing:-6,lineHeight:1.12,opacity:1-out,filter:`blur(${out*16}px)`,transform:`scale(${1+(t-s.start)*.025})`}}>
  {lines.map((l,i)=>{const q=ease(t,s.start+.05+i*.22,s.start+.5+i*.22);return <div key={i} style={{display:'flex',alignItems:'center',gap:30,opacity:q,filter:`blur(${(1-q)*16}px)`,transform:`translateY(${(1-q)*50}px)`}}>{i===0?<Mark size={170} cutout="#000"/>:null}{l}{i===lines.length-1?<Play size={170}/>:null}</div>;})}
 </AbsoluteFill>;
}

function Avatar({from,initial}:{from:'user'|'bench';initial:string}){
 return from==='user'?<div style={{width:84,height:84,borderRadius:'50%',flex:'none',display:'grid',placeItems:'center',fontSize:40,fontWeight:650,color:'#fff',background:'linear-gradient(140deg,#5B8CFF,#8C5BFF)'}}>{initial}</div>:
  <div style={{width:84,height:84,borderRadius:22,flex:'none',display:'grid',placeItems:'center',background:'#0E1016',color:'#fff'}}><Mark size={52} cutout="#0E1016"/></div>;
}
function Rich({text,handle,count}:{text:string;handle:string;count:number}){
 const shown=Array.from(text).slice(0,count).join(''),parts=shown.split(handle);
 return <>{parts.map((p,i)=><React.Fragment key={i}>{i?<span style={{color:BLUE}}>{handle}</span>:null}{p}</React.Fragment>)}</>;
}
function Clip({src,at,from}:{src:string;at:number;from:number}){
 return <Sequence from={Math.round(from*CHAT_FPS)} layout="none"><OffthreadVideo src={staticFile(src)} trimBefore={Math.round(at*CHAT_FPS)} muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></Sequence>;
}
function Card({m,t,at,sceneStart,c}:{m:ChatMessage;t:number;at:number;sceneStart:number;c:PrismChatConfig}){
 const n=Array.from(m.text).length,count=m.typed?Math.floor(n*ease(t,at+.3,at+1.1)):n,media=m.media?c.media[m.media]:null,mAt=sceneStart+(m.mediaAt??0),mq=media?ease(t,mAt,mAt+.5):0;
 return <div style={{width:CARD_W,boxSizing:'border-box',padding:'30px 36px',borderRadius:32,background:'#fff',color:INK,boxShadow:'0 30px 80px #2A004D55,0 2px 0 #fff inset'}}>
  <div style={{display:'flex',gap:26,alignItems:'flex-start'}}><Avatar from={m.from} initial={c.user.initial}/>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:30,fontWeight:650}}>{m.from==='user'?c.user.name:c.brand}<span style={{marginLeft:16,fontWeight:400,color:MUTED,fontSize:26}}>{m.time}</span></div>
    <div style={{fontSize:CHAT_TEXT,lineHeight:1.4,marginTop:6,minHeight:CHAT_TEXT*1.4,whiteSpace:'nowrap'}}><Rich text={m.text} handle={c.handle} count={count}/></div>
    {m.list?m.list.map((item,i)=>{const q=ease(t,at+.55+i*.42,at+.9+i*.42);return <div key={item} style={{height:q*62,opacity:q,overflow:'hidden',fontSize:38,lineHeight:'62px',color:'#30343F'}}>{i+1}. {item}</div>;}):null}
   </div></div>
  {media?<div style={{height:mq*450,marginTop:mq*24,opacity:mq,borderRadius:20,overflow:'hidden',background:'#0E1016'}}><div style={{height:450}}><Clip src={media.src} at={media.at} from={mAt}/></div></div>:null}
 </div>;
}
// 一段对话：新卡在前，旧卡上移、缩小、变虚。
function Chat({t,s,c}:{t:number;s:ChatScene;c:PrismChatConfig}){
 const ms=s.messages!,f=focus(t,s,.01,.28);
 return <AbsoluteFill style={{opacity:f.opacity,filter:f.filter,transform:`scale(${f.k*(1+(t-s.start)*.012)})`,willChange:'transform'}}>
  {ms.map((m,j)=>{const at=s.start+m.at;if(t<at)return null;const q=ease(t,at,at+.45),depth=ms.slice(j+1).reduce((v,k)=>v+ease(t,s.start+k.at,s.start+k.at+.45),0),ahead=ms.length-1-j;
   return <div key={j} style={{position:'absolute',left:960,top:540+ahead*18,zIndex:j,opacity:q*(1-Math.min(.75,depth*.38)),filter:`blur(${(1-q)*14+depth*5}px)`,transform:`translate(-50%,-50%) translateY(${(1-q)*130-depth*150}px) scale(${lerp(.9,1,q)*(1-depth*.07)})`,willChange:'transform'}}><Card m={m} t={t} at={at} sceneStart={s.start} c={c}/></div>;})}
 </AbsoluteFill>;
}
function Window({t,s,c}:{t:number;s:ChatScene;c:PrismChatConfig}){
 const f=focus(t,s,.45,.35),m=c.media[s.media!];
 return <AbsoluteFill style={{opacity:f.opacity,filter:f.filter,transformOrigin:'42% 52%',transform:`scale(${f.k*(1+(t-s.start)*.1)}) translate(${-(t-s.start)*34}px,${-(t-s.start)*14}px)`,willChange:'transform'}}>
  <div style={{position:'absolute',left:210,top:110,width:1500,height:860,borderRadius:26,overflow:'hidden',background:'#fff',boxShadow:'0 40px 110px #2A004D77'}}>
   <div style={{height:64,display:'flex',alignItems:'center',gap:22,padding:'0 28px',background:'#F6F7F9',borderBottom:'1px solid #E6E8EC',color:'#5E6472',fontSize:24}}><Traffic color/>{s.title}</div>
   <div style={{position:'absolute',left:0,right:0,top:65,bottom:0}}><Clip src={m.src} at={m.at} from={s.start}/></div>
  </div>
 </AbsoluteFill>;
}
function Punch({t,s}:{t:number;s:ChatScene}){
 const lines=s.lines as string[][],step=(s.end-s.start)/lines.length;
 return <AbsoluteFill>{lines.map(([a,b],i)=>{const st=s.start+i*step,q=ease(t,st,st+.28),out=ease(t,st+step-.22,st+step),white=ease(t,st+.45,st+.75);if(t<st||t>=st+step)return null;
  return <AbsoluteFill key={i} style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',fontSize:170,fontWeight:700,letterSpacing:-5,opacity:q*(1-out),filter:`blur(${(1-q)*16+out*16}px)`,transform:`scale(${lerp(.95,1,q)+(t-st)*.03})`}}>
   <span>{a}</span><span style={{position:'relative',marginLeft:10}}><span style={{background:RAINBOW,WebkitBackgroundClip:'text',color:'transparent',opacity:1-white}}>{b}</span><span style={{position:'absolute',left:0,top:0,opacity:white}}>{b}</span></span>
  </AbsoluteFill>;})}</AbsoluteFill>;
}

export const PrismChat:React.FC<PrismChatProps>=({config:c,audio=true})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;if(!c)return null;
 const s=sceneAt(t,c);
 return <AbsoluteFill style={{background:'#000',fontFamily:font,color:'#fff',overflow:'hidden'}}>
  <FontGate text={JSON.stringify(c)+'0123456789.:'}/>
  {audio?<Audio src={staticFile(c.audio)}/>:null}
  <Field t={t} dark={darkAt(t,c)}/>
  {s.kind==='logo'?<Logo t={t} s={s} brand={c.brand}/>:s.kind==='icons'?<Icons t={t} s={s}/>:s.kind==='headline'?<Headline t={t} s={s}/>:s.kind==='chat'?<Chat t={t} s={s} c={c}/>:s.kind==='window'?<Window t={t} s={s} c={c}/>:<Punch t={t} s={s}/>}
 </AbsoluteFill>;
};
export const prismChatMetadata:CalculateMetadataFunction<PrismChatProps>=async({props})=>{const config:PrismChatConfig=props.config??await fetch(staticFile('prism-promo/chat.json')).then(r=>r.json());validatePrismChat(config);return {durationInFrames:Math.round(config.duration*CHAT_FPS),fps:CHAT_FPS,width:1920,height:1080,props:{...props,config}};};
