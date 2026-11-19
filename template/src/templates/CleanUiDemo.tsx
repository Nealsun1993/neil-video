import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';

export const ink='#090B0B', blue='#0797F4', mist='#F3F6F6', muted='#697575';
export const font='Arial,"MiSans VF","PingFang SC",sans-serif';

export type CleanUiProps={project:string;prefix:string;before:string;after:string;cue:string;workflow?:boolean};

export function ease(t:number,start:number,end:number){
 return interpolate(t,[start,end],[0,1],{easing:Easing.bezier(.22,.7,.22,1),extrapolateLeft:'clamp',extrapolateRight:'clamp'});
}

export function Mark({size=44,cutout="white"}:{size?:number;cutout?:string}){
 return <svg width={size} height={size} viewBox="0 0 40 40" fill="currentColor" aria-hidden>
  <rect x={3} y={3} width={34} height={34} rx={11}/>
  {[9,20,31].flatMap((a)=>[[a,6],[a,34],[6,a],[34,a]]).map(([x,y],i)=><circle key={i} cx={x} cy={y} r={6}/>)}
  <rect x={12} y={12} width={16} height={16} rx={3.4} fill={cutout}/>
 </svg>;
}

export function Glyph({kind,size=30}:{kind:'text'|'sound'|'preview'|'check';size?:number}){
 const paths={text:'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',sound:'M3 12h2m3-5v10m4-14v18m4-15v12m3-6h2',preview:'M3 5h18v13H3zM8 22h8m-6-12 5 2.5-5 2.5z',check:'m5 12 4 4L19 6'};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={paths[kind]}/></svg>;
}

export function Hand({x,y,press,opacity}:{x:number;y:number;press:number;opacity:number}){
 return <svg width={53} height={61} viewBox="0 0 32 36" style={{position:'absolute',left:x-12,top:y-3,opacity,overflow:'visible',transformOrigin:'12px 3px',transform:'rotate(-12deg) scale('+(1-.13*press)+')',filter:'drop-shadow(0 2px 2px #1115)'}} aria-hidden>
  <path d="M9 19V5a2.3 2.3 0 0 1 4.6 0v10-3.3a2.3 2.3 0 0 1 4.6 0v3.8-2.7a2.3 2.3 0 0 1 4.6 0v3.4-1.8a2.3 2.3 0 0 1 4.6 0v6.3c0 4.3-1.4 7.3-4.4 10v3H12v-3c-3.2-2.2-5.5-4.9-7.6-8.7-1.3-2.6 1.5-4.6 3.4-2.7L9 21Z" fill="white" stroke={ink} strokeWidth="1.6" strokeLinejoin="round"/>
  <path d="M15 21v5m4-5v5m4-5v4" stroke={ink} strokeWidth="1.4" strokeLinecap="round"/>
 </svg>;
}

export function Traffic({color=false}:{color?:boolean}){
 return <div style={{display:'flex',gap:9,alignItems:'center'}}>{(color?['#FF595C','#F7BE3D','#27C857']:['#E9EEEE','#E9EEEE','#E9EEEE']).map((c,i)=><span key={i} style={{display:'block',width:13,height:13,borderRadius:13,background:c}}/>)}</div>;
}

export const button:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'center',gap:12,background:blue,color:'#fff',borderRadius:18,fontSize:27,fontWeight:550};

export function CaptionCorrection({t,prefix,before,after}:{t:number;prefix:string;before:string;after:string}){
 const change=ease(t,7.27,7.43);
 const accent=ease(t,7.38,7.78)*(1-ease(t,8.62,9.15));
 return <span>{prefix}<span style={{display:'inline-grid',verticalAlign:'baseline',borderRadius:3,
  backgroundColor:'rgba(56,155,255,'+(.45*accent)+')',
  boxShadow:'0 0 0 '+(3*accent)+'px rgba(56,155,255,'+(.33*accent)+')'}}>
  <span style={{gridArea:'1 / 1',opacity:1-change}}>{before}</span>
  <span style={{gridArea:'1 / 1',opacity:change,color:'rgb('+Math.round(255-84*accent)+','+Math.round(255-32*accent)+',255)'}}>{after}</span>
 </span>。</span>;
}

export function subtitleFocus(t:number){
 const progress=ease(t,7.48,8.16)*(1-ease(t,9.0,9.58));
 return {
  progress,
  surround:progress>0?{filter:'blur('+(5*progress)+'px)',opacity:1-.32*progress}:undefined,
 };
}

export const CleanUiDemo:React.FC<CleanUiProps>=({project,prefix,before,after,cue,workflow=false})=>{
 const {fps}=useVideoConfig(),t=useCurrentFrame()/fps;
 const title=(1-ease(t,1.3,1.83))*ease(t,0,.4),page=ease(t,1.65,2.28)*(1-ease(t,10.48,11.1));
 const modal=ease(t,3.62,4.11)*(1-ease(t,7.27,7.75));
 const focus=ease(t,4.15,4.85)*(1-ease(t,7.3,7.9));
 const final=workflow?0:ease(t,10.82,11.44);
 const applied=t>=7.27,proof=ease(t,7.65,8.25),attention=subtitleFocus(t);
 const current=applied?after:before;
 const reachEdit=ease(t,2.62,3.58),reachApply=ease(t,5.96,7.2);
 const x=1500+(1406-1500)*reachEdit+(965-1406)*reachApply;
 const y=528+(291-528)*reachEdit+(557-291)*reachApply;
 const press=Math.max(ease(t,3.52,3.61)*(1-ease(t,3.62,3.8)),ease(t,7.17,7.27)*(1-ease(t,7.28,7.44)));

 return <AbsoluteFill style={{background:'#FFFFFF',color:ink,fontFamily:font,overflow:'hidden'}}>
  <FontGate text={project+prefix+before+after+cue+'口播工作台校对文稿字幕预览编辑字幕应用更新示意界面同步预览已保存'}/>
  <div style={{position:'absolute',left:192,top:350,opacity:title,transform:'translateY('+((1-title)*18)+'px)'}}>
   <div style={{display:'inline-block',border:'4px solid #7D8383',borderRadius:80,padding:'9px 32px 11px',fontSize:54,color:'#767D7D'}}>Step {workflow?2:1}</div>
   <div style={{fontSize:120,fontWeight:700,letterSpacing:-5,marginTop:72,lineHeight:1.04}}>校对文稿</div>
  </div>
  <AbsoluteFill style={{opacity:page}}>
   <AbsoluteFill style={{transformOrigin:'50% 44%',transform:'scale('+(1+focus*.54)+') translateY('+((1-ease(t,1.65,2.28))*30)+'px)'}}>
    <div style={{position:'absolute',left:270,top:136,width:1380,height:880,background:'#fff',border:'1px solid #EDF0F0',borderRadius:25,boxShadow:'0 12px 55px #1A282813',overflow:'hidden'}}>
     <div style={{height:65,borderBottom:'1px solid #F0F2F2',display:'flex',alignItems:'center',padding:'0 27px',position:'relative',...attention.surround}}>
      <Traffic/><div style={{position:'absolute',left:'34%',width:'32%',textAlign:'center',borderRadius:30,padding:'7px 0',fontSize:17,background:mist}}>{project} · 示意界面</div>
     </div>
     <div style={{position:'absolute',left:112,right:112,top:126,display:'flex',alignItems:'center',gap:33,...attention.surround}}>
      <div style={{background:ink,color:'white',display:'grid',placeItems:'center',width:117,height:117,borderRadius:'50%'}}><Glyph kind="sound" size={73}/></div>
      <div style={{fontSize:36,fontWeight:650}}>口播工作台<div style={{height:18,width:220,background:mist,borderRadius:14,marginTop:16}}/></div>
      <div style={{...button,marginLeft:'auto',alignSelf:'flex-start',width:169,height:55,borderRadius:12,fontSize:22}}>编辑字幕</div>
     </div>
     <div style={{position:'absolute',left:112,right:112,top:303,display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:24}}>
      <section style={{background:mist,borderRadius:18,padding:28,height:330,...attention.surround}}>
       <div style={{display:'flex',alignItems:'center',gap:12,fontSize:25,fontWeight:650}}><Glyph kind="text"/>校对文稿</div>
       <div style={{marginTop:22,background:'white',borderRadius:13,padding:'22px 14px',fontSize:25}}>{prefix}<span style={{color:applied?blue:ink}}>{current}</span>。</div>
       <div style={{height:13,width:'80%',background:'#E9EEEE',borderRadius:9,marginTop:30}}/><div style={{height:13,width:'67%',background:'#E9EEEE',borderRadius:9,marginTop:18}}/>
      </section>
      <section style={{background:mist,borderRadius:18,padding:28,height:330,position:'relative',zIndex:1,
       transformOrigin:'right center',transform:'translateX('+(-18*attention.progress)+'px) scale('+(1+.26*attention.progress)+')',
       boxShadow:'0 13px 40px rgba(23,36,51,'+(.19*attention.progress)+')'}}>
       <div style={{display:'flex',alignItems:'center',gap:12,fontSize:25,fontWeight:650}}><Glyph kind="preview"/>字幕预览</div>
       <div style={{marginTop:17,height:202,borderRadius:12,background:'#E9EEEE',display:'grid',justifyItems:'center',alignContent:'center',gap:16,position:'relative'}}>
        <Glyph kind="sound" size={63}/><span style={{background:ink,color:'white',fontSize:23,padding:'7px 12px',borderRadius:7}}><CaptionCorrection {...{t,prefix,before,after}}/></span>
       </div>
      </section>
      <div style={{gridColumn:'1 / -1',background:mist,borderRadius:16,height:95,display:'grid',placeItems:'center',...attention.surround}}>
       <svg width="93%" height={53} viewBox="0 0 1060 53" preserveAspectRatio="none" aria-hidden>{Array.from({length:132},(_,i)=>{const h=5+Math.abs(Math.sin(i*.26)*Math.cos(i*1.5))*40;return <rect key={i} x={8*i} y={(53-h)/2} width={3} height={h} rx={1.5} fill={i>47&&i<77?blue:'#CED8D8'}/>;})}</svg>
      </div>
     </div>
     <div style={{position:'absolute',left:112,top:756,color:muted,opacity:proof*(1-.65*attention.progress),fontSize:24,display:'flex',alignItems:'center',gap:10}}><Glyph kind="check" size={26}/>{cue}</div>
    </div>
   </AbsoluteFill>
   <AbsoluteFill style={{background:'#121816',opacity:modal*.36}}/>
   <AbsoluteFill style={{transformOrigin:'50% 44%',transform:'scale('+(1+focus*.54)+')'}}>
    <div style={{position:'absolute',left:680,top:204,width:560,height:438,background:'white',borderRadius:30,boxShadow:'0 25px 75px #15211F40',opacity:modal,transform:'translateY('+((1-modal)*16)+'px) scale('+(.97+.03*modal)+')',overflow:'hidden'}}>
     <div style={{position:'absolute',left:24,top:24}}><Traffic color/></div>
     <div style={{position:'absolute',top:60,width:'100%',textAlign:'center'}}><Mark size={54}/><div style={{fontSize:31,fontWeight:680,marginTop:12}}>编辑字幕</div></div>
     <div style={{position:'absolute',left:34,right:34,top:210,borderRadius:17,background:mist,fontSize:26,padding:'22px 18px',whiteSpace:'nowrap'}}>
      {prefix}<span style={{background:t<5.66?'#DDEFFC':'transparent',color:t>=5.66?blue:ink}}>{t>=5.66?after:before}</span>。
     </div>
     <div style={{...button,position:'absolute',left:34,right:34,top:318,height:69}}><Mark size={26} cutout={blue}/>应用更新</div>
    </div>
    <Hand x={x} y={y} press={press} opacity={ease(t,2.22,2.58)*(1-ease(t,7.38,7.62))}/>
   </AbsoluteFill>
  </AbsoluteFill>
  <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:final,transform:'translateY('+((1-final)*15)+'px)'}}>
   <div style={{display:'flex',alignItems:'center',gap:32,fontWeight:750,fontSize:111,letterSpacing:-4}}><Mark size={128}/>口播工作台</div>
  </AbsoluteFill>
 </AbsoluteFill>;
};
