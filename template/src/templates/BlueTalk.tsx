import React from 'react';
import {AbsoluteFill,Audio,CalculateMetadataFunction,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {ease,font,Mark,Traffic} from './CleanUiDemo';
import {Sweep,Words} from './BlueGalleryLive';
import {musicGainAt,resolveTalkClip,TALK_FPS,TALK_OVERLAP,talkAsset,TalkEpisode,TalkFormat,talkFormatDims,TalkShot,validateTalk} from '../kit/talk';

// 蓝光口播版：镜头起止来自配音，入场利落到位后稳固停驻（无摇晃/漂移/微爬），保留流光底场、切镜光扫与编辑器光边擦除。
// 支持 16:9 横屏 (1920×1080)、3:4 主推竖屏 (1080×1440) 与 9:16 竖屏兼容 (1080×1920)，底部留给字幕。
export type BlueTalkProps={episode:string;ep?:TalkEpisode;format?:TalkFormat;audio?:boolean};
type S={t:number;u:number;d:number;p:any;s:TalkShot;ep:TalkEpisode;fmt:TalkFormat;portrait:boolean;is34:boolean};
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q,CY=470,CYP=810,CY34=610,light='#9FD3FF';
const fitSize=(txt:string,base:number,maxW:number)=>Math.min(base,Math.floor(maxW/Math.max(1,Array.from(txt).length)));

function GlassCardSurface({ep,id,w,h}:{ep:TalkEpisode;id:string;w:number;h:number}){
 const c=ep.clips[id],unit=Math.max(160,Math.min(w,h)),pad=Math.round(unit*.1),titleSize=Math.max(18,Math.round(unit*.115)),lineSize=Math.max(13,Math.round(unit*.062)),badgeSize=Math.max(11,Math.round(unit*.052));
 const title=c?.title??c?.label??'',badge=c?.badge??ep.brand,lines=c?.lines;
 return <div style={{width:'100%',height:'100%',boxSizing:'border-box',padding:pad,display:'flex',flexDirection:'column',justifyContent:'space-between',color:'#F4FAFF',background:'radial-gradient(circle at 84% 18%,#3E9BF748 0%,transparent 52%),radial-gradient(circle at 14% 88%,#1C6FD138 0%,transparent 56%),linear-gradient(145deg,#0E233B 0%,#091728 58%,#06101D 100%)'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
   <span style={{display:'inline-flex',alignItems:'center',gap:Math.max(6,badgeSize*.45),padding:`${Math.max(4,badgeSize*.32)}px ${Math.max(10,badgeSize*.75)}px`,borderRadius:999,background:'#56B2FF22',border:'1px solid #7CC8FF44',fontSize:badgeSize,color:'#A9DAFF',fontWeight:600}}>
    <span style={{width:Math.max(6,badgeSize*.42),height:Math.max(6,badgeSize*.42),borderRadius:'50%',background:'#66C0FF',boxShadow:'0 0 10px #66C0FF'}}/>{badge}
   </span>
  </div>
  <div style={{marginTop:'auto',marginBottom:lines?.length?Math.round(unit*.06):'auto'}}>
   <div style={{fontSize:titleSize,fontWeight:700,lineHeight:1.22,letterSpacing:-.5,textShadow:'0 4px 20px #00112688'}}>{title}</div>
  </div>
  {lines?.length?<div style={{display:'flex',flexDirection:'column',gap:Math.max(6,Math.round(unit*.032))}}>
   {lines.map((l,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:Math.max(8,lineSize*.55),padding:`${Math.max(6,lineSize*.48)}px ${Math.max(10,lineSize*.72)}px`,borderRadius:Math.max(8,Math.round(unit*.034)),background:'#FFFFFF0D',border:'1px solid #8AD0FF26',fontSize:lineSize,color:'#D7ECFF'}}>
    <span style={{width:Math.max(6,lineSize*.38),height:Math.max(6,lineSize*.38),borderRadius:'50%',background:'#7BD0FF',flexShrink:0}}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l}</span>
   </div>)}
  </div>:<div style={{display:'flex',gap:Math.max(8,Math.round(unit*.03)),opacity:.72}}>
   <div style={{height:Math.max(6,Math.round(unit*.026)),width:'46%',borderRadius:99,background:'linear-gradient(90deg,#5FB7FF,#247CE0)'}}/>
   <div style={{height:Math.max(6,Math.round(unit*.026)),width:'28%',borderRadius:99,background:'#FFFFFF26'}}/>
  </div>}
 </div>;
}

function MediaClip({ep,m,from,w=960,h=600}:{ep:TalkEpisode;m:string;from:number;w?:number;h?:number}){
 const r=resolveTalkClip(ep,m);if(!r)return null;
 if(r.kind==='card')return <GlassCardSurface ep={ep} id={m} w={w} h={h}/>;
 if(r.kind==='image')return <Img src={staticFile(r.asset)} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>;
 return <Sequence from={Math.round(from*TALK_FPS)} layout="none"><OffthreadVideo src={staticFile(r.asset)} trimBefore={Math.round((r.clip.at??0)*TALK_FPS)} muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></Sequence>;
}

function MediaCard({ep,m,from,w,h,chrome=true,style}:{ep:TalkEpisode;m:string;from:number;w:number;h:number;chrome?:boolean;style?:React.CSSProperties}){
 const bar=chrome?Math.max(22,Math.round(Math.min(w*.062,h*.075))):0;
 return <div style={{position:'absolute',width:w,height:h,borderRadius:Math.max(10,Math.min(28,w*.018)),overflow:'hidden',background:'#0B1624',boxShadow:'0 24px 70px #00102a99',border:'1px solid #FFFFFF3a',...style}}>
  {chrome?<div style={{height:bar,display:'flex',alignItems:'center',gap:bar*.4,padding:`0 ${bar*.5}px`,background:'#F6F8FB',borderBottom:'1px solid #E3E8EE'}}><div style={{transform:`scale(${bar/56})`,transformOrigin:'left center',width:bar*1.4}}><Traffic/></div><div style={{fontSize:bar*.42,color:'#5E6B7C',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ep.clips[m]?.label}</div></div>:null}
  <div style={{position:'absolute',top:bar,left:0,right:0,bottom:0}}><MediaClip ep={ep} m={m} from={from} w={w} h={Math.max(60,h-bar)}/></div>
 </div>;
}

// 只有大字的画面：后面放一团柔和游走的背景光，文字入场到位后稳固停驻。
function Glow({u,opacity=1}:{u:number;opacity?:number}){
 return <div style={{position:'absolute',left:`${50+Math.sin(u*1.5+.6)*32}%`,top:`${46+Math.cos(u*1.2)*14}%`,width:1000,height:1000,marginLeft:-500,marginTop:-500,borderRadius:'50%',background:'radial-gradient(circle,#4FA3F5bb 0%,transparent 62%)',opacity:opacity*ease(u,0,.5)}}/>;
}
function Title({u,p,fmt,portrait,is34}:S){
 const {h}=talkFormatDims(fmt),cy=is34?CY34:portrait?CYP:CY,padB=h-cy*2,enter=ease(u,0,.45);
 return <AbsoluteFill><Glow u={u}/><AbsoluteFill style={{alignItems:'center',justifyContent:'center',paddingBottom:padB,transform:enter>=.999?undefined:`scale(${lerp(.96,1,enter)})`}}>
  {p.kicker?<Words text={p.kicker} t={u} at={.1} size={is34?38:portrait?40:44} style={{opacity:.75,marginBottom:22,letterSpacing:2}}/>:null}
  {p.lines.map((l:string,i:number)=><Words key={i} text={l} t={u} at={.2+i*.4} size={is34?fitSize(l,86,900):portrait?fitSize(l,88,900):112} style={i?{color:light}:undefined}/>)}
 </AbsoluteFill></AbsoluteFill>;
}
// 特写：横屏左卡右字，竖屏上卡下字；卡片入场落位后三脚架锁死，多项时按 at 依次切换。
function Feature({t,p,s,ep,portrait,is34}:S){
 const at=(k:number)=>p.items[k].at??s.start;
 return <AbsoluteFill>{p.items.map((x:any,k:number)=>{const a=at(k),next=k+1<p.items.length?at(k+1):1e6,inQ=ease(t,a,a+.48),q=inQ*(1-ease(t,next-.2,next+.25));
  if(q<=0)return null;
  if(portrait){
   const cardTop=is34?156:280,cardH=is34?556:575,textTop=is34?786:955,textBase=is34?80:84;
   return <React.Fragment key={k}>
    <div style={{position:'absolute',left:80,top:cardTop,opacity:q,transform:inQ>=.999?undefined:`translateX(${(1-inQ)*-48}px) scale(${.96+.04*inQ})`,transformOrigin:'50% 50%'}}><MediaCard ep={ep} m={x.media} from={s.start} w={920} h={cardH} style={{position:'relative'}}/></div>
    <div style={{position:'absolute',left:is34?88:90,right:is34?88:90,top:textTop,opacity:q}}><Words text={x.lines[0]} t={t} at={a+.2} size={fitSize(x.lines[0],textBase,890)}/><Words text={x.lines[1]} t={t} at={a+.5} size={fitSize(x.lines[1],textBase,890)} style={{color:light,marginTop:8}}/></div>
   </React.Fragment>;
  }
  return <React.Fragment key={k}>
   <div style={{position:'absolute',left:120,top:CY-300,opacity:q,transform:inQ>=.999?undefined:`translateX(${(1-inQ)*-64}px) scale(${.96+.04*inQ})`,transformOrigin:'50% 50%'}}><MediaCard ep={ep} m={x.media} from={s.start} w={960} h={600} style={{position:'relative'}}/></div>
   <div style={{position:'absolute',left:1150,top:CY-125,opacity:q}}><Words text={x.lines[0]} t={t} at={a+.2} size={88}/><Words text={x.lines[1]} t={t} at={a+.5} size={88} style={{color:light}}/></div>
  </React.Fragment>;})}</AbsoluteFill>;
}
// 几张卡并排：横屏横向排列，竖屏纵向排列，入场到位后静止停驻无漂移。
function Row({t,u,p,s,ep,portrait,is34}:S){
 const n=p.cards.length;
 if(portrait){
  const titleTop=is34?104:155,top0=p.title?(is34?210:285):(is34?140:205),avail=(is34?1216:1510)-top0;
  const gap=is34?(n>=5?18:n===4?24:32):(n>=5?22:n===4?30:42),h=Math.min(is34?256:300,Math.floor((avail-(n-1)*gap)/n)),w=Math.round(h*1.62);
  const stackH=n*h+(n-1)*gap,yStart=p.title?top0:Math.round(top0+(avail-stackH)*.38);
  return <AbsoluteFill>
   {p.title?<Words text={p.title} t={u} at={.15} size={fitSize(p.title,is34?44:48,912)} style={{position:'absolute',left:84,top:titleTop,opacity:.92}}/>:null}
   {p.cards.map((x:any,i:number)=>{const a=x.at??s.start+.1+i*.18,q=ease(t,a,a+.48),label=x.label??ep.clips[x.media].label;
    return <div key={i} style={{position:'absolute',left:84,right:72,top:yStart+i*(h+gap),height:h,display:'flex',alignItems:'center',gap:34,opacity:q,transform:q>=.999?undefined:`translate(${(1-q)*64}px,${(1-q)*24}px)`}}>
     <MediaCard ep={ep} m={x.media} from={s.start} w={w} h={h} style={{position:'relative',flexShrink:0}}/>
     <div style={{fontSize:n>=5?(is34?34:36):(is34?40:42),fontWeight:650,lineHeight:1.3,color:'#F4FAFF'}}>{label}</div>
    </div>;})}
  </AbsoluteFill>;
 }
 const gap=n>=5?32:n===4?38:48,w=n<=3?540:Math.floor((1716-(n-1)*gap)/n),h=n<=3?338:Math.round(w*.626),total=n*(w+gap)-gap,x0=Math.round((1920-total)/2),top=p.title?270:CY-h/2-30;
 return <AbsoluteFill>
  {p.title?<Words text={p.title} t={u} at={.15} size={56} style={{position:'absolute',left:x0,top:130,opacity:.9}}/>:null}
  {p.cards.map((x:any,i:number)=>{const a=x.at??s.start+.1+i*.18,q=ease(t,a,a+.48);return <div key={i} style={{position:'absolute',left:x0+i*(w+gap),top,opacity:q,transform:q>=.999?undefined:`translate(${(1-q)*96}px,${(1-q)*32}px)`}}>
   <MediaCard ep={ep} m={x.media} from={s.start} w={w} h={h} style={{position:'relative'}}/><div style={{marginTop:22,fontSize:n<=3?38:32,fontWeight:600}}>{x.label??ep.clips[x.media].label}</div></div>;})}
 </AbsoluteFill>;
}
// 模板墙：横屏 4 列、竖屏 2 列依次升起，落定整数网格后完全静止（无正弦摇摆与缩放蠕变）。
function Wall({u,p,s,ep,portrait,is34}:S){
 if(portrait){
  const rows=Math.ceil(p.cards.length/2),w=436,h=is34?(rows>=4?196:236):(rows>=4?246:280),gx=36,ry=h+(is34?(rows>=4?46:54):62);
  const x0=Math.round((1080-(w*2+gx))/2),y0=is34?Math.max(96,Math.round((1230-rows*ry)/2+42)):Math.max(175,Math.round((1520-rows*ry)/2+70));
  return <AbsoluteFill>{p.cards.map((m:string,i:number)=>{const col=i%2,row=Math.floor(i/2),a=.08+col*.09+row*.11,q=ease(u,a,a+.55);
   return <div key={i} style={{position:'absolute',left:x0+col*(w+gx),top:y0+row*ry,opacity:q,transform:q>=.999?undefined:`translateY(${(1-q)*96}px) scale(${lerp(.95,1,q)})`}}>
    <MediaCard ep={ep} m={m} from={s.start} w={w} h={h} style={{position:'relative'}}/><div style={{marginTop:is34?8:10,fontSize:is34?23:25,color:'#D4E8FA',opacity:ease(u,.55,1.05)}}>{ep.clips[m].label}</div></div>;})}</AbsoluteFill>;
 }
 const w=520,h=325,gx=44,x0=64;
 return <AbsoluteFill>{p.cards.map((m:string,i:number)=>{const col=i%4,row=Math.floor(i/4),a=.08+col*.08+row*.12,q=ease(u,a,a+.58);
  return <div key={i} style={{position:'absolute',left:x0+col*(w+gx),top:50+row*(h+84),opacity:q,transform:q>=.999?undefined:`translateY(${(1-q)*120}px) scale(${lerp(.95,1,q)})`}}>
   <MediaCard ep={ep} m={m} from={s.start} w={w} h={h} style={{position:'relative'}}/><div style={{marginTop:12,fontSize:26,color:'#D4E8FA',opacity:ease(u,.6,1.1)}}>{ep.clips[m].label}</div></div>;})}</AbsoluteFill>;
}
// 一张卡单向推近到位后静止驻留（横屏推满全幅，竖屏在安全区内稳固推近且不裁切窗口内容）。
export function bluePushRect(u:number,_d:number,fmtOrPortrait:boolean|TalkFormat=false){
 const fmt:TalkFormat=typeof fmtOrPortrait==='boolean'?(fmtOrPortrait?'portrait':'landscape'):fmtOrPortrait;
 const q=ease(u,.15,1);
 if(fmt==='3:4'){
  const w=Math.round(lerp(800,948,q)),h=Math.round(w*.66);
  return {w,h,left:Math.round(540-w/2),top:Math.round(lerp(CY34+16,CY34,q)-h/2),radius:lerp(24,20,q)};
 }
 if(fmt==='portrait'){
  const w=Math.round(lerp(820,960,q)),h=Math.round(w*.66);
  return {w,h,left:Math.round(540-w/2),top:Math.round(lerp(CYP+16,CYP-12,q)-h/2),radius:lerp(24,20,q)};
 }
 const w=lerp(960,2050,q),h=w*.625;
 return {w,h,left:960-w/2,top:lerp(CY,540,q)-h/2,radius:lerp(18,0,q)};
}
function Push({u,d,p,s,ep,fmt,portrait}:S){
 const r=bluePushRect(u,d,fmt);
 return <AbsoluteFill>
  {portrait?<Glow u={u} opacity={.82}/>:null}
  <MediaCard ep={ep} m={p.media} from={s.start} w={r.w} h={r.h} style={{left:r.left,top:r.top,borderRadius:r.radius,opacity:ease(u,0,.35)}}/>
 </AbsoluteFill>;
}
// 提示词框：入场落位后三脚架完全静止完成打字，结尾点一下按钮冲出。
function Prompt({u,d,p,portrait,is34}:S){
 const b=p.title?1.25:.2,box=ease(u,b,b+.48),go=ease(u,d-.42,d+TALK_OVERLAP),chars=Array.from(p.text as string),count=Math.floor(chars.length*ease(u,b+.3,d-1.3)),press=u>d-.8&&u<d-.6,cy=is34?CY34+10:portrait?CYP+20:CY;
 const scale=lerp(.95,1,box)*lerp(1,2.2,go),still=box>=.999&&go<=.001;
 return <AbsoluteFill>
  <div style={{position:'absolute',left:`${50+Math.sin(u*1.6)*30}%`,top:`${50+Math.cos(u*1.3)*12}%`,width:900,height:900,marginLeft:-450,marginTop:-450,borderRadius:'50%',background:'radial-gradient(circle,#3F95F0aa 0%,transparent 65%)',opacity:box*(1-go)}}/>
  {p.title?<div style={{position:'absolute',left:0,right:0,top:cy-60,display:'flex',justifyContent:'center',opacity:1-ease(u,b-.2,b+.2),filter:`blur(${ease(u,b-.2,b+.2)*12}px)`}}><Words text={p.title} t={u} at={.1} size={portrait?fitSize(p.title,is34?78:82,920):92}/></div>:null}
  <div style={{position:'absolute',left:'50%',top:cy,width:portrait?920:1160,height:is34?330:portrait?350:260,padding:portrait?'36px 40px':'36px 42px',boxSizing:'border-box',background:`linear-gradient(#0E1620,#0E1620) padding-box,conic-gradient(from ${u*140}deg,#1B95F5,#9FD3FF 18%,#0E1620 36%,#0E1620 64%,#7DD0FF 82%,#1B95F5) border-box`,border:'3px solid transparent',boxShadow:'0 20px 70px #00101FAA,0 0 54px #3D93E855',borderRadius:36,opacity:box*(1-go),filter:go>.001?`blur(${go*18}px)`:undefined,transform:still?'translate(-50%,-50%)':`translate(-50%,-50%) scale(${scale})`}}>
   <div style={{fontSize:is34?36:portrait?38:40,lineHeight:1.48}}>{chars.slice(0,count).join('')}<span style={{color:'#76CAFF',opacity:Math.floor(u*4)%2?1:0}}>▏</span></div>
   <div style={{position:'absolute',bottom:28,left:34,fontSize:34,color:'#91A4B4'}}>＋</div>
   <div style={{position:'absolute',bottom:24,right:26,padding:'12px 28px',borderRadius:30,fontSize:30,fontWeight:650,background:u>d-.8?'#7DD0FF':'#1B95F5',transform:press?'scale(0.94)':undefined}}>{p.button} →</div>
  </div>
 </AbsoluteFill>;
}
// 编辑器：入场落定后窗口 100% 静止锁死（消除表格细线闪烁），预览按 at 用带光边的擦除换画面。
function Editor({t,u,p,s,ep,portrait,is34}:S){
 const land=ease(u,0,.52),k=p.styles.filter((x:any,i:number)=>i&&t>=x.at+.2).length,styleLabel=p.styleLabel??'风格';
 const rows:[string,string][]=[[styleLabel,p.styles[k].name],...(p.fields??[])];
 const swapping=p.styles.some((x:any,j:number)=>j&&t>x.at-.3&&t<x.at+.6);
 if(portrait){
  const winTop=is34?82:145,winH=is34?1142:1365,barH=is34?62:68,vidTop=is34?88:96,vidH=is34?590:720,setTop=is34?706:848;
  return <AbsoluteFill style={{opacity:Math.min(1,land*1.4),filter:land>=.999?undefined:`blur(${(1-land)*16}px)`,transform:land>=.999?undefined:`scale(${lerp(1.08,1,land)})`,transformOrigin:`50% ${is34?CY34:CYP}px`}}>
   <div style={{position:'absolute',left:64,top:winTop,width:952,height:winH,borderRadius:26,overflow:'hidden',background:'#111922',border:'1px solid #FFFFFF3a',boxShadow:'0 30px 90px #001C3CAA'}}>
    <div style={{height:barH,display:'flex',alignItems:'center',gap:22,padding:'0 28px',borderBottom:'1px solid #FFFFFF22'}}><Traffic/><span style={{fontSize:is34?23:24,color:'#CAD5E0'}}>{p.window}</span></div>
    <div style={{position:'absolute',left:28,right:28,top:vidTop,height:vidH,borderRadius:16,overflow:'hidden',background:'#000'}}>
     {p.styles.map((x:any,i:number)=>{const wipe=i?ease(t,x.at,x.at+.5):1;return wipe>0?<div key={i} style={{position:'absolute',inset:0,clipPath:`inset(0 ${(1-wipe)*100}% 0 0)`}}><MediaClip ep={ep} m={x.media} from={s.start} w={896} h={vidH}/>
      {wipe<1?<div style={{position:'absolute',top:0,bottom:0,left:`${wipe*100}%`,width:6,marginLeft:-3,background:'#BFE6FF',boxShadow:'0 0 40px 16px #7DD0FFaa'}}/>:null}</div>:null;})}
    </div>
    <div style={{position:'absolute',top:setTop,left:32,right:32,fontSize:is34?26:28,color:'#D6E0EA',fontWeight:600}}>{p.heading}
     <div style={{display:'grid',gridTemplateColumns:rows.length>3?'1fr 1fr':'1fr',gap:is34?12:14,marginTop:is34?14:18,fontWeight:400}}>
      {rows.map(([a,b],i)=><div key={`${i}-${a}`} style={{border:`1px solid ${i===0&&swapping?'#7DD0FF':'#FFFFFF28'}`,borderRadius:14,padding:is34?'15px 20px':'18px 22px',fontSize:is34?24:25,display:'flex',justifyContent:'space-between',background:i===0?'#FFFFFF08':'transparent'}}>{a}<span style={{color:'#A3CFEF',fontWeight:600}}>{b}</span></div>)}
     </div>
    </div>
   </div>
  </AbsoluteFill>;
 }
 return <AbsoluteFill style={{opacity:Math.min(1,land*1.4),filter:land>=.999?undefined:`blur(${(1-land)*16}px)`,transform:land>=.999?undefined:`scale(${lerp(1.08,1,land)})`,transformOrigin:`50% ${CY}px`}}>
  <div style={{position:'absolute',left:150,top:60,width:1620,height:800,borderRadius:24,overflow:'hidden',background:'#111922',border:'1px solid #FFFFFF3a',boxShadow:'0 30px 90px #001C3CAA'}}>
   <div style={{height:70,display:'flex',alignItems:'center',gap:24,padding:'0 30px',borderBottom:'1px solid #FFFFFF22'}}><Traffic/><span style={{fontSize:24,color:'#CAD5E0'}}>{p.window}</span></div>
   <div style={{position:'absolute',top:110,left:36,width:330,fontSize:26,color:'#D6E0EA'}}>{p.heading}
    {rows.map(([a,b],i)=><div key={`${i}-${a}`} style={{border:`1px solid ${i===0&&swapping?'#7DD0FF':'#FFFFFF28'}`,borderRadius:12,padding:'16px 18px',marginTop:20,fontSize:22,display:'flex',justifyContent:'space-between'}}>{a}<span style={{color:'#A3CFEF'}}>{b}</span></div>)}</div>
   <div style={{position:'absolute',left:400,right:36,top:104,bottom:36,borderRadius:14,overflow:'hidden',background:'#000'}}>
    {p.styles.map((x:any,i:number)=>{const wipe=i?ease(t,x.at,x.at+.5):1;return wipe>0?<div key={i} style={{position:'absolute',inset:0,clipPath:`inset(0 ${(1-wipe)*100}% 0 0)`}}><MediaClip ep={ep} m={x.media} from={s.start} w={1184} h={660}/>
     {wipe<1?<div style={{position:'absolute',top:0,bottom:0,left:`${wipe*100}%`,width:6,marginLeft:-3,background:'#BFE6FF',boxShadow:'0 0 40px 16px #7DD0FFaa'}}/>:null}</div>:null;})}
   </div>
  </div>
 </AbsoluteFill>;
}
function Outro({u,p,s,ep,portrait,is34}:S){
 const at=p.line?p.titleAt-s.start:0,a=1-ease(u,at-.4,at),b=ease(u,at,at+.58),cy=is34?CY34:portrait?CYP:CY;
 return <AbsoluteFill>
  {p.line?<Glow u={u} opacity={a}/>:null}
  {p.line?<div style={{position:'absolute',left:0,right:0,top:cy-60,display:'flex',justifyContent:'center',opacity:a,filter:a<.999?`blur(${(1-a)*12}px)`:undefined}}><Words text={p.line} t={u} at={.15} size={portrait?fitSize(p.line,is34?80:84,900):96}/></div>:null}
  <div style={{position:'absolute',left:0,right:0,top:cy-150,textAlign:'center',opacity:b,transform:b>=.999?undefined:`translateY(${lerp(32,0,b)}px) scale(${lerp(.96,1,b)})`}}>
   <Words text={p.title} t={u} at={at} size={portrait?fitSize(p.title,is34?92:98,900):120} step={.06} style={{display:'flex',justifyContent:'center'}}/>
   <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,fontSize:portrait?(is34?38:42):40,marginTop:36,opacity:ease(u,at+.8,at+1.4)}}><Mark size={46} cutout="#1684D9"/>{ep.brand}</div>
  </div>
 </AbsoluteFill>;
}
const SCENES:Record<string,React.FC<S>>={'blue.title':Title,'blue.feature':Feature,'blue.row':Row,'blue.wall':Wall,'blue.push':Push,'blue.prompt':Prompt,'blue.editor':Editor,'blue.outro':Outro};

// 底场：蓝色光缓慢游走；提示词镜头压暗，收尾镜头从底部升起一片光。
function Field({t,ep}:{t:number;ep:TalkEpisode}){
 const span=(tpl:string,inn:number)=>Math.max(0,...ep.shots.filter(s=>s.template===tpl).map(s=>ease(t,s.start-.3,s.start+inn)*(1-ease(t,s.end-.2,s.end+.5))));
 const dim=span('blue.prompt',.4)*.78,last=ep.shots.at(-1)!,rise=last.template==='blue.outro'?ease(t,(last.props.line?last.props.titleAt:last.start),ep.duration):0;
 const x=30+Math.sin(t*.55)*14,y=60+Math.sin(t*.47)*10,x2=70+Math.cos(t*.5)*14;
 return <AbsoluteFill style={{background:`radial-gradient(ellipse at ${x}% ${y}%, #1A6CC4 0%, transparent 62%),radial-gradient(ellipse at ${x2}% ${18+Math.sin(t*.6)*8}%, #63ADE6 0%, transparent 30%),linear-gradient(132deg,#071A2E,#123A66 62%,#06182A)`}}>
  <AbsoluteFill style={{background:'#00060E',opacity:dim}}/>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% ${lerp(130,92,rise)}%, #5FB4FF ${lerp(0,8,rise)}%, #1F78D4 ${lerp(10,38,rise)}%, transparent ${lerp(30,72,rise)}%)`,opacity:rise}}/>
 </AbsoluteFill>;
}
function Subtitle({t,ep,fmt}:{t:number;ep:TalkEpisode;fmt:TalkFormat}){
 const c=ep.captions.find(x=>t>=x.start&&t<x.end);if(!c)return null;
 const portrait=fmt!=='landscape',is34=fmt==='3:4',n=Array.from(c.text).length;
 const side=portrait?(is34?48:56):0,top=is34?1292:portrait?1600:930;
 return <div style={{position:'absolute',left:side,right:side,top,display:'flex',justifyContent:'center'}}><div style={{fontSize:portrait?(n>18?38:(is34?42:44)):46,fontWeight:600,lineHeight:1.4,padding:portrait?'10px 28px':'6px 30px',borderRadius:16,background:'#04101EB8',textShadow:'0 2px 10px #00142899',textAlign:'center'}}>{c.text}</div></div>;
}

export const blueTalkMetadata:CalculateMetadataFunction<BlueTalkProps>=async({props})=>{
 const ep:TalkEpisode=props.ep??await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then(r=>r.json());validateTalk(ep);
 const format:TalkFormat=props.format??ep.format??'landscape',{w,h}=talkFormatDims(format);
 return {durationInFrames:Math.round(ep.duration*TALK_FPS),fps:TALK_FPS,width:w,height:h,props:{...props,ep,format}};
};
export const BlueTalk:React.FC<BlueTalkProps>=({ep,format,audio=true})=>{
 const {fps,width,height}=useVideoConfig(),t=useCurrentFrame()/fps;if(!ep)return null;
 const fmt:TalkFormat=format??ep.format??(height>width?(Math.abs(width/height-3/4)<.03?'3:4':'portrait'):'landscape');
 const portrait=fmt!=='landscape',is34=fmt==='3:4';
 return <AbsoluteFill style={{background:'#05131F',fontFamily:font,color:'#F7FBFF',overflow:'hidden'}}>
  <FontGate text={JSON.stringify([ep.brand,ep.clips,ep.captions,ep.shots])+'风格→＋▏'}/>
  {audio?<Sequence from={Math.round((ep.audioOffset??0)*fps)} layout="none"><Audio src={staticFile(talkAsset(ep,ep.audio))}/></Sequence>:null}
  {audio&&ep.music?<Audio loop src={staticFile(talkAsset(ep,ep.music.src))} volume={f=>musicGainAt(ep,f/fps)}/>:null}
  {audio&&ep.sfx?<Audio src={staticFile(talkAsset(ep,ep.sfx.src))} volume={ep.sfx.volume??.5}/>:null}
  <Field t={t} ep={ep}/>
  {ep.shots.map((s,i)=>{if(t<s.start||t>=s.end+TALK_OVERLAP)return null;const Scene=SCENES[s.template],last=i===ep.shots.length-1,out=last?0:ease(t,s.end-.05,s.end+TALK_OVERLAP);
   return <AbsoluteFill key={s.id} style={{opacity:1-out,filter:out?`blur(${out*14}px)`:undefined}}><Scene t={t} u={t-s.start} d={s.end-s.start} p={s.props} s={s} ep={ep} fmt={fmt} portrait={portrait} is34={is34}/></AbsoluteFill>;})}
  {ep.shots.slice(1).map(s=><Sweep key={s.id} t={t} at={s.start}/>)}
  <Subtitle t={t} ep={ep} fmt={fmt}/>
 </AbsoluteFill>;
};
