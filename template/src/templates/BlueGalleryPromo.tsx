import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {ease,font,Glyph,Mark,Traffic} from './CleanUiDemo';

export type GalleryProps={brand:string;prompt:string;audio?:boolean};
const labels=['口播封面','章节卡','字幕预览','画面配卡','剪辑时间轴','成片预览'] as const;
const center:React.CSSProperties={position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'};
const title:React.CSSProperties={fontSize:84,fontWeight:650,letterSpacing:-3,whiteSpace:'nowrap',lineHeight:1.12};

function BlueField({t,dim=0}:{t:number;dim?:number}){
 const x=28+Math.sin(t*.24)*9,y=64+Math.sin(t*.23)*7;
 return <AbsoluteFill style={{background:
  'radial-gradient(ellipse at '+x+'% '+y+'%, #155FAE 0%, transparent 64%),'+
  'radial-gradient(ellipse at '+(68+Math.cos(t*.27)*10)+'% '+(16+Math.sin(t*.31)*7)+'%, #60A6D7 0%, transparent 29%),'+
  'radial-gradient(ellipse at '+(69+Math.cos(t*.27)*10)+'% 72%, #145B99 0%, transparent 50%),'+
  'linear-gradient(132deg,#081A2D,#112F51 64%,#081827)'}}>
  <AbsoluteFill style={{background:'linear-gradient(110deg,#02101E55,transparent 40%,#02101E77)',opacity:.75}}/>
  <AbsoluteFill style={{background:'#000810',opacity:dim}}/>
 </AbsoluteFill>;
}

function Wave({color='#298CCF'}:{color?:string}){
 return <svg width="100%" height="100%" viewBox="0 0 680 116" preserveAspectRatio="none" aria-hidden>{Array.from({length:115},(_,i)=>{
  const h=8+Math.abs(Math.sin(i*.166)*Math.cos(i*.63))*100;
  return <rect key={i} x={6*i} y={(116-h)/2} width={3.7} height={h} rx={1.8} fill={color} opacity={i%10===0?1:.64}/>;
 })}</svg>;
}

function Artwork({variant}:{variant:number}){
 if(variant===0||variant===1)return <div style={{height:'100%',position:'relative',padding:32,boxSizing:'border-box',background:variant===0?'#101B2E':'#EBF4FC',color:variant===0?'white':'#23252B',overflow:'hidden'}}>
  <div style={{fontSize:19,letterSpacing:3,fontWeight:650}}>TALK WORKBENCH / 01</div>
  <svg viewBox="0 0 420 285" width="64%" height="92%" style={{position:'absolute',right:-12,bottom:-16}}>
   <defs><linearGradient id={'blue-art-'+variant} x2="1" y2="1"><stop stopColor={variant===0?'#456BCB':'#8CBDE5'}/><stop offset="1" stopColor={variant===0?'#529CCD':'#457EB6'}/></linearGradient></defs>
   <circle cx={257} cy={159} r={105} fill={'url(#blue-art-'+variant+')'}/>
   <circle cx={257} cy={159} r={123} fill="none" stroke={variant===0?'#83A9DD':'#8CAECD'}/>
   <path d="M33 183Q194 25 348 98T403 171Q250 271 61 237Z" fill="none" stroke={variant===0?'#98BEDF':'#6F9CC7'} strokeWidth="2"/>
  </svg>
  <div style={{position:'absolute',left:32,top:'29%',fontSize:55,fontWeight:730,lineHeight:1.22,letterSpacing:-1}}>{variant===0?<>把想法<br/>讲清楚</>:<>01<br/>从一段声音开始</>}</div>
 </div>;
 if(variant===3)return <div style={{height:'100%',position:'relative',background:'#EFF5FB',padding:28,boxSizing:'border-box',color:'#292343'}}>
  <div style={{fontSize:30,fontWeight:700}}>关键词与画面</div>
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginTop:22}}>
   {(['sound','text','preview','check'] as const).map((kind,i)=><div key={kind} style={{height:102,background:['#DBE8F6','#E2EFFC','#D4E6F6','#DDECF8'][i],borderRadius:14,display:'grid',placeItems:'center',color:['#305A86','#2C6398','#39688E','#2D6E9E'][i]}}><Glyph kind={kind} size={44}/></div>)}
  </div>
 </div>;
 if(variant===5)return <div style={{height:'100%',position:'relative',background:'linear-gradient(130deg,#182E50,#244775 63%,#37749C)',color:'white',display:'grid',placeItems:'center'}}>
  <div style={{display:'grid',justifyItems:'center',gap:12,fontSize:35,fontWeight:700}}><div style={{background:'#FFFFFF22',padding:14,borderRadius:20}}><Glyph kind="preview" size={48}/></div>从一段口播，到一条成片</div>
 </div>;
 return <div style={{height:'100%',background:variant===4?'#F3F8FC':'#EFF6FF',padding:29,boxSizing:'border-box',color:'#1D2633'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:28,fontWeight:700}}>{variant===4?'剪辑时间轴':'字幕校对'}<span style={{fontSize:17,color:'#657386'}}>00:12 / 00:30</span></div>
  <div style={{height:75,marginTop:21,background:variant===4?'#E1ECF6':'#DBEBFD',borderRadius:12,padding:'8px 13px',boxSizing:'border-box'}}><Wave color={variant===4?'#3C80B4':'#3A8BD2'}/></div>
  {variant===4?<div style={{display:'flex',gap:10,marginTop:17}}>{[31,21,26].map((w,i)=><div key={w} style={{height:46,width:w+'%',background:['#CBDCF4','#D9E8F8','#C8DFF4'][i],borderRadius:9}}/>)}</div>:
   <div style={{background:'white',borderRadius:12,marginTop:17,padding:'16px 20px',fontSize:22}}>今天来讲<span style={{color:'#116CC6'}}>口播工作台</span>。</div>}
 </div>;
}

function Card({variant,w=440,h=325,caption=false}:{variant:number;w?:number;h?:number;caption?:boolean}){
 return <div style={{width:w,height:h,borderRadius:15,overflow:'hidden',background:'white',boxShadow:'0 17px 48px #00142875',border:'1px solid #FFFFFF54',boxSizing:'border-box'}}>
  <div style={{height:31,display:'flex',alignItems:'center',padding:'0 14px',background:'#FAFBFC',borderBottom:'1px solid #E9EEF2'}}>
   <div style={{transform:'scale(.55)',transformOrigin:'left center'}}><Traffic/></div><div style={{fontSize:12,color:'#617084'}}>口播工作台 · 示意</div>
  </div>
  <div style={{height:'calc(100% - 31px)'}}><Artwork variant={variant}/></div>
  {caption?<div style={{position:'absolute',bottom:0,left:0,right:0,height:101,padding:'47px 20px 15px',boxSizing:'border-box',fontSize:34,fontWeight:650,background:'linear-gradient(transparent,#0059BEF5)'}}>{labels[variant]}</div>:null}
 </div>;
}

function Tunnel({t,brand}:{t:number;brand:string}){
 const show=ease(t,.05,.68),travel=ease(t,1.9,3);
 return <AbsoluteFill style={{perspective:1000,opacity:show}}>
  {[-1,1].map(side=>Array.from({length:3},(_,i)=>{
   const z=i+t*.46;
   const s=.38+z*.22, y=side*(204+z*105+220*travel);
   return <div key={side+':'+i} style={{...center,transform:'translate(-50%,-50%) translateY('+y+'px) rotateX('+(-side*59)+'deg) scale('+s+')',opacity:ease(t,i*.11,.46+i*.13)*(1-travel*.72)}}>
    <Card variant={(i+(side>0?2:0))%6}/>
   </div>;
  }))}
  <div style={{...center,textAlign:'center',fontSize:57,letterSpacing:-1,opacity:1-travel,whiteSpace:'nowrap',textShadow:'0 8px 30px #001332'}}>
   <span style={{opacity:1-ease(t,1.4,2.1)}}>发现</span> <b style={{opacity:ease(t,.48,1.18)}}>{brand}模板</b>
  </div>
 </AbsoluteFill>;
}

function Gallery({t}:{t:number}){
 const settle=ease(t,0,.66),pan=ease(t,.55,2.84),focus=ease(t,3.72,5.5),exit=ease(t,8.38,9);
 const variants=[2,0,3,4,1,5],left=748+(318-748)*focus,top=212-43*pan+(96-169)*focus;
 return <AbsoluteFill style={{opacity:settle*(1-exit)}}>
  <div style={{position:'absolute',inset:0,transform:'translateY('+(-43*pan)+'px)',opacity:1-.86*focus,filter:'blur('+(3*focus)+'px)'}}>
   {variants.map((variant,i)=>{
    if(i===1)return null;
    const row=Math.floor(i/3),col=i%3;
    return <div key={variant} style={{position:'absolute',left:264+col*484,top:212+row*369,transform:'scale(.94)',transformOrigin:'0 0'}}>
     <Card variant={variant}/><div style={{fontSize:24,marginTop:13,color:'#D6E8F8'}}>{labels[variant]}</div>
    </div>;
   })}
  </div>
  <div style={{position:'absolute',left,top,width:440,height:325,transform:'scale('+( .94+1.98*focus)+')',transformOrigin:'0 0'}}>
   <Card variant={0}/><div style={{fontSize:24,marginTop:13,color:'#D6E8F8',opacity:1-focus}}>{labels[0]}</div>
  </div>
 </AbsoluteFill>;
}

function Formats({t}:{t:number}){
 return <AbsoluteFill style={{opacity:ease(t,0,.65)*(1-ease(t,3.3,4))}}>
  {[4,3,5].map((variant,i)=>{
   const p=ease(t,.18+i*.22,.96+i*.22);
   return <div key={variant} style={{position:'absolute',left:218+i*506,top:294+(1-p)*42,opacity:p}}>
    <Card variant={variant} w={470} h={465} caption/>
   </div>;
  })}
 </AbsoluteFill>;
}

function Prompt({t,prompt}:{t:number;prompt:string}){
 const p=ease(t,1.22,1.72),count=Math.floor([...prompt].length*ease(t,1.43,3.92));
 return <>
  <div style={{...center,...title,opacity:ease(t,0,.35)*(1-ease(t,1.16,1.55))}}>换一句话，换一套画面</div>
  <div style={{...center,width:1090,height:246,padding:'33px 38px',boxSizing:'border-box',background:'#101820',border:'1px solid #FFFFFF28',boxShadow:'0 14px 55px #00101F80',borderRadius:36,opacity:p*(1-ease(t,4.64,5)),transform:'translate(-50%,-50%) scale('+(.94+.06*p)+')'}}>
   <div style={{fontSize:36,lineHeight:1.42}}>{[...prompt].slice(0,count).join('')}<span style={{color:'#76CAFF',opacity:Math.floor(t*4)%2?1:0}}>▏</span></div>
   <div style={{position:'absolute',bottom:27,left:31,fontSize:31,color:'#91A4B4'}}>＋</div><div style={{position:'absolute',bottom:24,right:25,padding:'11px 24px',borderRadius:30,fontSize:28,fontWeight:650,background:t>4.24?'#75CDFF':'#1B95F5',color:'#FFF'}}>应用样式 →</div>
  </div>
 </>;
}

function Result({t}:{t:number}){
 const show=ease(t,0,.6),swap=ease(t,1.5,2.35),out=ease(t,3.54,4);
 return <AbsoluteFill style={{opacity:show*(1-out)}}>
  <div style={{position:'absolute',left:204,top:141,width:1512,height:796,borderRadius:21,overflow:'hidden',background:'#121921',border:'1px solid #FFFFFF40',boxShadow:'0 30px 85px #001C3C99'}}>
   <div style={{height:69,display:'flex',alignItems:'center',gap:24,padding:'0 29px',borderBottom:'1px solid #FFFFFF25'}}><Traffic/><span style={{fontSize:23,color:'#CAD5E0'}}>口播工作台 · 样式示意</span></div>
   <div style={{position:'absolute',top:106,left:35,width:320,fontSize:24,color:'#D6E0EA',lineHeight:1.55}}>口播封面<div style={{fontSize:18,color:'#A9B7C6',marginTop:21}}>调整标题、主题色与预览画幅。</div>
    {['标题','主题色','预览画幅'].map((s,i)=><div key={s} style={{border:'1px solid #FFFFFF28',borderRadius:10,padding:'12px 16px',marginTop:18,fontSize:18}}>{s}<span style={{float:'right',color:'#A3CFEF'}}>{['短标题','浅蓝色','16:9'][i]}</span></div>)}</div>
   <div style={{position:'absolute',left:391,right:38,top:104,bottom:35,borderRadius:13,overflow:'hidden'}}>
    <AbsoluteFill style={{opacity:1-swap}}><Artwork variant={0}/></AbsoluteFill>
    <AbsoluteFill style={{opacity:swap}}><Artwork variant={1}/></AbsoluteFill>
   </div>
  </div>
 </AbsoluteFill>;
}

export const BlueGalleryPromo:React.FC<GalleryProps>=({brand,prompt,audio=true})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;
 const end=ease(t,26.78,27.45),closing=ease(t,28.17,28.88);
 return <AbsoluteFill style={{background:'#05131F',fontFamily:font,color:'#F7FBFF',overflow:'hidden'}}>
  <FontGate text={brand+prompt+labels.join('')+'把想法讲清楚从一段声音开始关键词与画面剪辑时间轴字幕校对今天来讲发现模板预览换一句话换一套画面应用样式示意调整标题主题色与预览画幅浅蓝色短标题从一个模板开始让口播进入成片'}/>
  {audio?<Audio src={staticFile('blue-gallery/music.m4a')}/>:null}
  <BlueField t={t} dim={end*(1-closing)*.42}/>
  {t<3?<Tunnel t={t} brand={brand}/>:t<12?<Gallery t={t-3}/>:t<16?<Formats t={t-12}/>:t<21?<Prompt t={t-16} prompt={prompt}/>:t<25?<Result t={t-21}/>:<>
   <div style={{...center,...title,fontSize:69,opacity:ease(t,25,25.5)*(1-ease(t,27.35,27.9))}}>让口播进入成片</div>
   <div style={{...center,textAlign:'center',whiteSpace:'nowrap',opacity:closing}}><div style={{...title,fontSize:101}}>从一个模板开始</div><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:13,fontSize:33,marginTop:28}}><Mark size={38} cutout="#1684D9"/>{brand}</div></div>
  </>}
 </AbsoluteFill>;
};
