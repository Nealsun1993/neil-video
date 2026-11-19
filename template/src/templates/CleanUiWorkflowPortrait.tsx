import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {button, CaptionCorrection, ease, font, Glyph, Hand, ink, Mark, subtitleFocus, Traffic} from './CleanUiDemo';
import {Art, CleanUiWorkflowProps, Wave} from './CleanUiWorkflow';

const blue='#0797F4', light='#F3F6F6', muted='#697575';
const headings=['导入口播','校对文稿','给关键词配画面','预览与导出'];
const iconRow=['sound','text','preview'] as const;
const box:React.CSSProperties={background:light,borderRadius:24,padding:'26px 30px',fontSize:30};
const cue:React.CSSProperties={color:muted,fontSize:27};
function useTime(){const {fps}=useVideoConfig();return useCurrentFrame()/fps;}

function Bookend({closing=false}:{closing?:boolean}){
 const t=useTime();
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:ease(t,0,.55)*(closing?1:1-ease(t,3.45,4))}}>
  <Mark size={118}/>
  <div style={{fontSize:96,fontWeight:750,letterSpacing:-4,marginTop:24}}>口播工作台</div>
  {closing?<div style={{...cue,marginTop:36,opacity:ease(t,1.55,2.35)}}>从口播素材到成片</div>:
   <div style={{display:'flex',gap:62,marginTop:53}}>{iconRow.map((kind,i)=><span key={kind} style={{opacity:ease(t,1+i*.32,1.6+i*.32)}}><Glyph kind={kind} size={55}/></span>)}</div>}
 </AbsoluteFill>;
}

function Chapter({step,t}:{step:number;t:number}){
 const opacity=ease(t,0,.42)*(1-ease(t,1.35,1.86));
 return <div style={{position:'absolute',left:92,right:82,top:716,opacity,transform:'translateY('+((1-opacity)*19)+'px)'}}>
  <div style={{display:'inline-block',border:'3px solid #7D8383',borderRadius:60,padding:'8px 25px 10px',fontSize:41,color:muted}}>Step {step}</div>
  <div style={{fontSize:98,fontWeight:700,letterSpacing:-4,marginTop:53,lineHeight:1.13}}>{headings[step-1]}</div>
 </div>;
}

function Window({project,action,children,surround}:{project:string;action:string;children:React.ReactNode;surround?:React.CSSProperties}){
 return <div style={{position:'absolute',left:64,right:64,top:285,height:1260,border:'1px solid #E9EEEE',borderRadius:28,background:'white',boxShadow:'0 22px 66px #1A282816',overflow:'hidden'}}>
  <div style={{position:'relative',height:65,padding:'0 25px',display:'flex',alignItems:'center',borderBottom:'1px solid #EDF0F0',...surround}}>
   <Traffic/><div style={{position:'absolute',left:'25%',width:'50%',textAlign:'center',borderRadius:30,padding:'8px 0',fontSize:20,background:light}}>{project} · 流程示意</div>
  </div>
  <div style={{position:'absolute',left:37,right:37,top:99,display:'flex',alignItems:'center',gap:19,...surround}}>
   <div style={{width:82,height:82,borderRadius:'50%',background:ink,color:'white',display:'grid',placeItems:'center'}}><Glyph kind="sound" size={52}/></div>
   <div style={{fontSize:38,fontWeight:700}}>口播工作台</div>
   <div style={{...button,marginLeft:'auto',width:160,height:58,fontSize:24,borderRadius:14}}>{action}</div>
  </div>
  <div style={{position:'absolute',left:37,right:37,top:222,bottom:38}}>{children}</div>
 </div>;
}

function Modal({opacity,title,children}:{opacity:number;title:string;children:React.ReactNode}){
 if(opacity<=0)return null;
 return <>
  <AbsoluteFill style={{background:'#121816',opacity:.36*opacity}}/>
  <div style={{position:'absolute',left:151,right:151,top:648,height:554,borderRadius:35,background:'white',boxShadow:'0 25px 70px #16242138',opacity,transform:'translateY('+((1-opacity)*18)+'px)'}}>
   <div style={{position:'absolute',left:26,top:22}}><Traffic color/></div>
   <div style={{textAlign:'center',marginTop:75}}><Mark size={63}/><div style={{fontSize:38,fontWeight:700,marginTop:15}}>{title}</div></div>
   {children}
  </div>
 </>;
}

function Import({project,fileName,prefix,before}:CleanUiWorkflowProps){
 const t=useTime(),drag=ease(t,2.9,5.05),drop=ease(t,5.02,5.72);
 const x=760-220*drag,y=648+190*drag;
 return <>
  <Window project={project} action="导入音频">
   <div style={{...box,position:'relative',height:500,border:'2px dashed '+(drag>.3&&drop<.5?blue:'#D6DFDF'),display:'grid',placeItems:'center'}}>
    <div style={{...cue,textAlign:'center',opacity:1-drop}}><Glyph kind="sound" size={66}/><div style={{marginTop:17}}>把音频文件拖到这里</div></div>
    <div style={{position:'absolute',left:36,right:36,top:100,opacity:drop}}>
     <div style={{display:'flex',alignItems:'center',gap:16,fontWeight:700}}><Glyph kind="sound" size={35}/>{fileName}</div>
     <div style={{marginTop:73}}><Wave progress={ease(t,5.47,7.4)}/></div>
     <div style={{...cue,marginTop:43,opacity:ease(t,7.15,7.7)}}>音频已导入</div>
    </div>
   </div>
   <div style={{...box,marginTop:25,opacity:ease(t,7.55,8.15)}}><b>识别文稿</b><p style={{margin:'14px 0 3px'}}>{prefix}{before}。</p></div>
  </Window>
  <div style={{...button,position:'absolute',left:x-134,top:y-51,width:268,height:90,background:'white',color:ink,border:'1px solid #DDE7E7',boxShadow:'0 12px 40px #19232626',opacity:ease(t,2.24,2.8)*(1-drop)}}><Glyph kind="sound"/>{fileName}</div>
  <Hand x={x+81} y={y-13} opacity={ease(t,2.4,2.9)*(1-drop)} press={drag*(1-drop)}/>
 </>;
}

function Edit({project,prefix,before,after,cue:status}:CleanUiWorkflowProps){
 const t=useTime(),modal=ease(t,3.62,4.11)*(1-ease(t,7.27,7.75)),focus=ease(t,4.15,4.85)*(1-ease(t,7.3,7.9));
 const attention=subtitleFocus(t);
 const applied=t>=7.27,current=applied?after:before,first=ease(t,2.62,3.58),second=ease(t,5.96,7.2);
 const press=Math.max(ease(t,3.52,3.61)*(1-ease(t,3.62,3.8)),ease(t,7.17,7.27)*(1-ease(t,7.28,7.44)));
 return <>
  <Window project={project} action="编辑字幕" surround={attention.surround}>
   <div style={{...box,...attention.surround}}><b>校对文稿</b><div style={{background:'white',padding:'19px 17px',borderRadius:12,marginTop:18}}>{prefix}<span style={{color:applied?blue:ink}}>{current}</span>。</div></div>
   <div style={{...box,marginTop:23,position:'relative',zIndex:1,
    transform:'scale('+(1+.09*attention.progress)+')',
    boxShadow:'0 14px 46px rgba(23,36,51,'+(.2*attention.progress)+')'}}><b>字幕预览</b><div style={{background:'#E7EEEE',height:290,borderRadius:18,marginTop:18,display:'grid',justifyItems:'center',alignContent:'center',gap:26}}>
    <Glyph kind="sound" size={69}/><div style={{background:ink,color:'white',padding:'8px 13px',borderRadius:7}}><CaptionCorrection {...{t,prefix,before,after}}/></div>
   </div></div>
   <div style={{...box,marginTop:23,...attention.surround}}><Wave/></div>
   <div style={{...cue,display:'flex',alignItems:'center',gap:10,marginTop:25,opacity:ease(t,7.65,8.25)*(1-.65*attention.progress)}}><Glyph kind="check"/>{status}</div>
  </Window>
  <AbsoluteFill style={{zIndex:2,transformOrigin:'50% 49%',transform:'scale('+(1+focus*.15)+')'}}>
   <Modal opacity={modal} title="编辑字幕">
    <div style={{...box,position:'absolute',left:37,right:37,top:250,whiteSpace:'nowrap'}}>{prefix}<span style={{background:t<5.66?'#DDEFFC':'transparent',color:t>=5.66?blue:ink}}>{t>=5.66?after:before}</span>。</div>
    <div style={{...button,position:'absolute',left:37,right:37,top:387,height:81}}><Mark size={30} cutout={blue}/>应用更新</div>
   </Modal>
   <Hand x={957-112*first-295*second} y={530-104*first+650*second} opacity={ease(t,2.22,2.58)*(1-ease(t,7.38,7.62))} press={press}/>
  </AbsoluteFill>
 </>;
}

function Picture({project,keyword,prefix,after}:CleanUiWorkflowProps){
 const t=useTime(),select=ease(t,3.3,3.78),open=ease(t,4.45,5.36),land=ease(t,8.3,9.72);
 const x=239-80*open+101*land,y=683+86*open+413*land;
 const width=210+550*open-430*land,height=77+265*open-266*land;
 return <>
  <Window project={project} action="添加画面">
   <div style={box}><b>字幕</b><div style={{background:'white',padding:'18px 16px',borderRadius:12,marginTop:17}}>{prefix}{after}。</div><div style={{height:82}}/></div>
   <div style={{...box,marginTop:24,height:360}}><b>素材库</b><div style={{display:'flex',gap:18,marginTop:26}}>{iconRow.map((kind,i)=><div key={kind} style={{width:133,height:115,display:'grid',placeItems:'center',borderRadius:14,color:i===0?blue:muted,background:i===0?'#DFF1FC':'#E8EEEE'}}><Glyph kind={kind} size={52}/></div>)}</div></div>
   <div style={{...box,marginTop:24,height:232,fontSize:25}}>
    <div>画面轨</div><div style={{marginTop:59}}>音频轨</div><div style={{position:'absolute',left:133,right:26,top:755}}><Wave/></div>
   </div>
   <div style={{...cue,marginTop:19,opacity:ease(t,10.2,10.7)}}>画面已插入时间轴</div>
  </Window>
  <div style={{position:'absolute',left:x,top:y,width,height,opacity:select,borderRadius:19,boxShadow:'0 15px 40px #163B5322',background:'#E1F2FD',color:blue,display:'grid',placeItems:'center',fontSize:30,fontWeight:700,overflow:'hidden'}}>
   <div style={{position:'absolute',inset:0,opacity:open*(1-land)}}><Art keyword={keyword}/></div><span style={{opacity:1-open+land}}>{keyword}</span>
  </div>
  <Hand x={580-219*ease(t,2.45,3.3)+340*open-312*land} y={645-12*ease(t,2.45,3.3)+325*open+247*land} press={select*(1-open)+ease(t,8.17,8.3)*(1-land)} opacity={ease(t,2.2,2.5)*(1-ease(t,10,10.45))}/>
 </>;
}

function Preview({project,keyword,prefix,after}:CleanUiWorkflowProps){
 const t=useTime(),portrait=ease(t,4.25,5.4),open=ease(t,9.27,9.78),ready=ease(t,11.6,12.15),reach=ease(t,8.5,9.23);
 return <>
  <Window project={project} action="导出视频">
   <div style={{...box,height:920,position:'relative',display:'grid',placeItems:'center'}}>
    <div style={{...cue,position:'absolute',top:33,left:32}}>{portrait>.5?'竖屏 9:16':'横屏 16:9'}</div>
    <div style={{width:734-302*portrait,height:413+355*portrait,borderRadius:22,position:'relative',fontSize:44,boxShadow:'0 9px 30px #182E4320',overflow:'hidden'}}>
     <Art keyword={keyword}/><div style={{position:'absolute',left:12,right:12,bottom:29,textAlign:'center',fontSize:27}}><span style={{display:'inline-block',color:'white',background:ink,borderRadius:7,padding:'6px 10px'}}>{prefix}{after}。</span></div>
    </div>
   </div>
  </Window>
  <Modal opacity={open} title={ready>.5?'导出文件已就绪':'正在生成导出文件'}>
   <div style={{...cue,textAlign:'center',marginTop:31}}>MP4 · 1080 × 1920</div>
   <div style={{position:'absolute',left:44,right:44,bottom:123,height:16,borderRadius:12,background:light,overflow:'hidden'}}>
    <div style={{height:'100%',width:(ease(t,9.78,11.6)*100)+'%',background:blue}}/>
   </div>
  </Modal>
  <Hand x={920-75*reach} y={580-154*reach} press={ease(t,9.18,9.27)*(1-ease(t,9.27,9.48))} opacity={ease(t,8.15,8.55)*(1-ease(t,9.35,9.7))}/>
 </>;
}

const scenes=[{start:4,end:15,Scene:Import},{start:15,end:26,Scene:Edit},{start:26,end:40,Scene:Picture},{start:40,end:55,Scene:Preview}];
function Stage({step,duration,children}:{step:number;duration:number;children:React.ReactNode}){
 const t=useTime(),enter=ease(t,1.55,2.22);
 return <>
  <Chapter step={step} t={t}/>
  <AbsoluteFill style={{opacity:enter*(1-ease(t,duration-.55,duration)),transform:'translateY('+((1-enter)*31)+'px)'}}>{children}</AbsoluteFill>
 </>;
}

export const CleanUiWorkflowPortrait:React.FC<CleanUiWorkflowProps>=(props)=>{
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:'#FFFFFF',fontFamily:font,color:ink,overflow:'hidden'}}>
  <FontGate text={headings.join('')+Object.values(props).join('')+'口播工作台流程示意音频已导入识别文稿把音频文件拖到这里编辑字幕应用更新画面轨音频轨素材库已插入时间轴横屏竖屏导出文件已就绪正在生成从口播素材到成片'}/>
  {props.audio!==false?<Audio src={staticFile('clean-ui-workflow/music.m4a')}/>:null}
  <Sequence from={0} durationInFrames={4*fps}><Bookend/></Sequence>
  {scenes.map(({start,end,Scene},i)=><Sequence key={start} from={start*fps} durationInFrames={(end-start)*fps}>
   <Stage step={i+1} duration={end-start}><Scene {...props}/></Stage>
  </Sequence>)}
  <Sequence from={55*fps} durationInFrames={5*fps}><Bookend closing/></Sequence>
 </AbsoluteFill>;
};
