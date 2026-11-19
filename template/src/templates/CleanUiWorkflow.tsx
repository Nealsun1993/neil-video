import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {button, CleanUiDemo, CleanUiProps, ease, font, Glyph, Hand, ink, Mark, Traffic} from './CleanUiDemo';

const light='#F3F6F6', blue='#0797F4', muted='#697575';
export const cleanUiSample:CleanUiProps={
 project:'口播样稿',prefix:'今天来讲口播工作',before:'抬',after:'台',cue:'字幕预览已同步更新',
};

export type CleanUiWorkflowProps=CleanUiProps & {fileName:string;keyword:string;audio?:boolean};
const copy='导入口播配画面预览导出文件拖到这里识别文稿音频已导入将这一句添加画面插入时间轴素材库字幕画面轨音频轨横屏竖屏导出设置生成导出文件已就绪工作流口播工作台流程示意';
const fade=(t:number,d:number)=>ease(t,0,.42)*(1-ease(t,d-.5,d));
export function useTime(){const {fps}=useVideoConfig();return useCurrentFrame()/fps;}

export function Chapter({number,title,opacity}:{number:number;title:string;opacity:number}){
 return <div style={{position:'absolute',left:192,top:350,opacity,transform:'translateY('+((1-opacity)*16)+'px)'}}>
  <div style={{display:'inline-block',border:'4px solid #7D8383',borderRadius:80,padding:'9px 32px 11px',fontSize:54,color:'#767D7D'}}>Step {number}</div>
  <div style={{fontSize:120,fontWeight:700,letterSpacing:-5,marginTop:72,lineHeight:1.04}}>{title}</div>
 </div>;
}

export function Browser({project,action,children}:{project:string;action:string;children:React.ReactNode}){
 return <div style={{position:'absolute',left:270,top:136,width:1380,height:880,background:'#fff',border:'1px solid #EDF0F0',borderRadius:25,boxShadow:'0 12px 55px #1A282813',overflow:'hidden'}}>
  <div style={{height:65,borderBottom:'1px solid #F0F2F2',display:'flex',alignItems:'center',padding:'0 27px',position:'relative'}}>
   <Traffic/><div style={{position:'absolute',left:'34%',width:'32%',textAlign:'center',borderRadius:30,padding:'7px 0',fontSize:17,background:light}}>{project} · 流程示意</div>
  </div>
  <div style={{position:'absolute',left:112,right:112,top:104,display:'flex',alignItems:'center',gap:25}}>
   <div style={{background:ink,color:'white',display:'grid',placeItems:'center',width:84,height:84,borderRadius:'50%'}}><Glyph kind="sound" size={55}/></div>
   <div style={{fontSize:34,fontWeight:650}}>口播工作台</div>
   <div style={{...button,marginLeft:'auto',width:167,height:55,borderRadius:12,fontSize:22}}>{action}</div>
  </div>
  <div style={{position:'absolute',left:112,right:112,top:219,bottom:65}}>{children}</div>
 </div>;
}

export function Wave({progress=1}:{progress?:number}){
 return <svg width="100%" height={76} viewBox="0 0 1060 76" preserveAspectRatio="none" style={{display:'block',clipPath:'inset(0 '+(100-progress*100)+'% 0 0)'}}>
  {Array.from({length:132},(_,i)=>{const h=7+Math.abs(Math.sin(i*.26)*Math.cos(i*1.5))*62;return <rect key={i} x={8*i} y={(76-h)/2} width={3} height={h} rx={1.5} fill={i>47&&i<77?blue:'#B4C5CA'}/>;})}
 </svg>;
}

function Opening(){
 const t=useTime();
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:fade(t,4)}}>
  <div style={{display:'flex',alignItems:'center',gap:24,fontSize:83,fontWeight:730,letterSpacing:-3,transform:'translateY('+(-28*ease(t,1.1,1.7))+'px)'}}><Mark size={93}/>口播工作台</div>
  <div style={{height:108,display:'flex',alignItems:'center',gap:70}}>
   {(['sound','text','preview'] as const).map((kind,i)=><span key={kind} style={{opacity:ease(t,1+i*.33,1.55+i*.33),transform:'translateY('+((1-ease(t,1+i*.33,1.55+i*.33))*22)+'px)'}}><Glyph kind={kind} size={57}/></span>)}
  </div>
 </AbsoluteFill>;
}

export function ImportScene({project,fileName,prefix,before}:{project:string;fileName:string;prefix:string;before:string}){
 const t=useTime(),enter=ease(t,1.45,2.12),drag=ease(t,2.9,5.05),drop=ease(t,5.02,5.72),fill=ease(t,5.47,7.4);
 const x=1250-310*drag,y=423+122*drag;
 return <>
  <Chapter number={1} title="导入口播" opacity={fade(t,1.85)}/>
  <AbsoluteFill style={{opacity:enter*(1-ease(t,10.45,11)),transform:'translateY('+((1-enter)*25)+'px)'}}>
   <Browser project={project} action="导入音频">
    <div style={{position:'relative',height:340,background:light,borderRadius:22,border:'2px dashed '+(drag>.3&&drop<.5?blue:'#D7E1E2'),display:'grid',placeItems:'center'}}>
     <div style={{textAlign:'center',opacity:1-drop,color:muted,fontSize:29}}><Glyph kind="sound" size={58}/><div style={{marginTop:15}}>把音频文件拖到这里</div></div>
     <div style={{position:'absolute',left:50,right:50,top:57,opacity:drop}}>
      <div style={{display:'flex',alignItems:'center',gap:15,fontSize:30,fontWeight:650}}><Glyph kind="sound" size={35}/>{fileName}</div>
      <div style={{marginTop:50}}><Wave progress={fill}/></div>
      <div style={{marginTop:32,fontSize:21,color:muted,opacity:ease(t,7.15,7.7)}}>音频已导入</div>
     </div>
    </div>
    <div style={{marginTop:32,padding:'24px 34px',background:light,borderRadius:18,fontSize:26,opacity:ease(t,7.55,8.15)}}><b>识别文稿</b><div style={{marginTop:13}}>{prefix}{before}。</div></div>
   </Browser>
   <div style={{...button,position:'absolute',left:x-90,top:y-60,background:'white',color:ink,border:'1px solid #DDE7E7',boxShadow:'0 12px 40px #19232626',width:240,height:83,opacity:ease(t,2.24,2.8)*(1-drop)}}><Glyph kind="sound"/>{fileName}</div>
   <Hand x={x+70} y={y-13} opacity={ease(t,2.4,2.9)*(1-drop)} press={drag*(1-drop)}/>
  </AbsoluteFill>
 </>;
}

export function Art({keyword}:{keyword:string}){
 return <div style={{width:'100%',height:'100%',background:'#EBF5FC',display:'grid',placeItems:'center',borderRadius:'inherit',overflow:'hidden'}}>
  <div style={{display:'grid',justifyItems:'center',gap:12,fontSize:'1em',fontWeight:700}}><div style={{display:'grid',placeItems:'center',borderRadius:24,background:blue,color:'white',width:82,height:82}}><Glyph kind="sound" size={54}/></div>{keyword}</div>
 </div>;
}

export function PictureScene({project,keyword,prefix,after}:{project:string;keyword:string;prefix:string;after:string}){
 const t=useTime(),enter=ease(t,1.48,2.1),select=ease(t,3.3,3.78),open=ease(t,4.45,5.36),land=ease(t,8.3,9.72);
 const left=526+(953-526)*open+(545-953)*land,top=446+(418-446)*open+(796-418)*land;
 const w=204+330*open-176*land,h=66+237*open-226*land;
 return <>
  <Chapter number={3} title="给关键词配画面" opacity={fade(t,1.85)}/>
  <AbsoluteFill style={{opacity:enter*(1-ease(t,13.43,14))}}>
   <Browser project={project} action="添加画面">
    <div style={{display:'grid',gridTemplateColumns:'1fr 1.1fr',gap:26}}>
     <div style={{height:337,background:light,borderRadius:20,padding:29,fontSize:26}}><b>字幕</b><div style={{background:'white',borderRadius:11,padding:'17px 16px',marginTop:25}}>{prefix}{after}。</div>
      <div style={{marginTop:23,color:blue,opacity:select}}>{keyword}</div></div>
     <div style={{height:337,background:light,borderRadius:20,padding:29,fontSize:26}}><b>素材库</b>
      <div style={{display:'flex',gap:14,marginTop:22}}>{[0,1,2].map(i=><div key={i} style={{width:135,height:106,borderRadius:13,background:i===0?'#E0F2FD':'#E9EEEE',display:'grid',placeItems:'center',color:i===0?blue:muted}}><Glyph kind={i===0?'sound':i===1?'text':'preview'} size={41}/></div>)}</div>
     </div>
    </div>
    <div style={{marginTop:20,background:light,borderRadius:18,padding:'20px 24px',height:172,fontSize:21,color:muted}}>
     <div style={{height:51}}>画面轨</div><div>音频轨</div><div style={{position:'absolute',left:117,right:24,bottom:56}}><Wave/></div>
    </div>
   </Browser>
   <div style={{position:'absolute',left,top,width:w,height:h,opacity:select*(1-ease(t,13,13.6)),borderRadius:16,boxShadow:'0 16px 40px #17344C20',fontSize:27,background:'#E1F2FD',display:'grid',placeItems:'center',color:blue,fontWeight:650,overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,opacity:open*(1-land)}}><Art keyword={keyword}/></div><span style={{opacity:1-open+land}}>{keyword}</span>
   </div>
   <Hand x={860-235*ease(t,2.45,3.3)+520*open-290*land} y={530-42*ease(t,2.45,3.3)+114*open+218*land} press={select*(1-open)+ease(t,8.17,8.3)*(1-land)} opacity={ease(t,2.2,2.5)*(1-ease(t,10,10.45))}/>
   <div style={{position:'absolute',left:1070,top:932,color:muted,fontSize:23,opacity:ease(t,10.2,10.7)}}>画面已插入时间轴</div>
  </AbsoluteFill>
 </>;
}

export function ExportScene({project,keyword,prefix,after}:{project:string;keyword:string;prefix:string;after:string}){
 const t=useTime(),enter=ease(t,1.55,2.18),portrait=ease(t,4.25,5.4)*(1-ease(t,7.15,8)),open=ease(t,9.27,9.78),ready=ease(t,11.6,12.15);
 const press=ease(t,9.18,9.27)*(1-ease(t,9.27,9.48));
 return <>
  <Chapter number={4} title="预览与导出" opacity={fade(t,1.92)}/>
  <AbsoluteFill style={{opacity:enter*(1-ease(t,14.4,15))}}>
   <Browser project={project} action="导出视频">
    <div style={{height:480,background:light,borderRadius:20,display:'grid',placeItems:'center',position:'relative'}}>
     <div style={{position:'absolute',left:25,top:21,fontSize:22,color:muted}}>{portrait>.5?'竖屏 9:16':'横屏 16:9'}</div>
     <div style={{position:'relative',width:720-495*portrait,height:405,borderRadius:14,fontSize:38,overflow:'hidden',boxShadow:'0 5px 22px #17344C18'}}>
      <Art keyword={keyword}/><div style={{position:'absolute',bottom:24,left:8,right:8,textAlign:'center',fontSize:24-8*portrait}}><span style={{background:ink,borderRadius:6,color:'white',padding:'5px 8px'}}>{prefix}{after}。</span></div>
     </div>
    </div>
   </Browser>
   <AbsoluteFill style={{background:'#141917',opacity:open*.35}}/>
   <div style={{position:'absolute',left:682,top:248,width:556,height:420,background:'white',borderRadius:28,boxShadow:'0 22px 70px #14242338',textAlign:'center',opacity:open,transform:'translateY('+((1-open)*22)+'px)'}}>
    <div style={{position:'absolute',top:21,left:23}}><Traffic color/></div>
    <div style={{marginTop:63}}>{ready>.5?<Glyph kind="check" size={60}/>:<Mark size={58}/>}</div>
    <div style={{fontSize:34,fontWeight:690,marginTop:12}}>{ready>.5?'导出文件已就绪':'正在生成导出文件'}</div>
    <div style={{color:muted,fontSize:22,marginTop:16}}>MP4 · 1920 × 1080</div>
    <div style={{position:'absolute',left:38,right:38,bottom:72,height:14,borderRadius:10,background:light,overflow:'hidden'}}><div style={{width:(ease(t,9.78,11.6)*100)+'%',height:'100%',background:blue}}/></div>
   </div>
   <Hand x={1520-94*ease(t,8.5,9.23)} y={454-187*ease(t,8.5,9.23)} press={press} opacity={ease(t,8.15,8.55)*(1-ease(t,9.35,9.7))}/>
  </AbsoluteFill>
 </>;
}

function Closing(){
 const t=useTime(),label=ease(t,2,2.7);
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:ease(t,0,.55)}}>
  <div style={{display:'flex',alignItems:'center',gap:32,fontWeight:750,fontSize:111,letterSpacing:-4}}><Mark size={128}/>口播工作台</div>
  <div style={{fontSize:29,color:muted,marginTop:33,opacity:label,transform:'translateY('+((1-label)*13)+'px)'}}>从口播素材到成片</div>
 </AbsoluteFill>;
}

export const CleanUiWorkflow:React.FC<CleanUiWorkflowProps>=({audio=true,fileName,keyword,...sample})=>{
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:'white',fontFamily:font,color:ink,overflow:'hidden'}}>
  <FontGate text={copy+fileName+keyword+Object.values(sample).join('')}/>
  {audio?<Audio src={staticFile('clean-ui-workflow/music.m4a')}/>:null}
  <Sequence from={0} durationInFrames={4*fps}><Opening/></Sequence>
  <Sequence from={4*fps} durationInFrames={11*fps}><ImportScene {...sample} fileName={fileName}/></Sequence>
  <Sequence from={15*fps} durationInFrames={11*fps}><CleanUiDemo {...sample} workflow/></Sequence>
  <Sequence from={26*fps} durationInFrames={14*fps}><PictureScene {...sample} keyword={keyword}/></Sequence>
  <Sequence from={40*fps} durationInFrames={15*fps}><ExportScene {...sample} keyword={keyword}/></Sequence>
  <Sequence from={55*fps} durationInFrames={5*fps}><Closing/></Sequence>
 </AbsoluteFill>;
};
