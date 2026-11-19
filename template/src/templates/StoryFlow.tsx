/** 一句话到一个工作流：复用真实工作台组件，以同一窗口串联输入、操作和结果。 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C,FONT} from '../kit/tokens';
import {clamp01,mix,rise,smooth} from '../kit/motion';
import {Icon,Tile} from '../kit/components';
import {EditorialTitle,presentationColors} from '../kit/Presentation';
import {stageFor} from '../kit/layout';
import {storyFlowLayout,storyFlowState,storyLaunchRect} from '../kit/storyFlow';
import {AppStage} from '../app/AppStage';
import type {Shot} from '../kit/types';
import type {TemplateProps} from './types';
export const StoryFlow:React.FC<TemplateProps>=({t,ep,shot,env})=>{
 const p=shot.props,c=p.cues,format=ep.format??'portrait',l=storyFlowLayout(format),s=storyFlowState(t,c,format),portrait=l.portrait,is34=l.is34,colors=presentationColors(s.dark);
 const src=storyLaunchRect(format),st=stageFor(format);
 const enter=smooth(t,c.at,.42),enterOpacity=clamp01(enter*1.8),enterTransform=enter>=.999?undefined:`translateY(${(1-enter)*28}px) scale(${.96+.04*enter})`;
 const moduleShot:Shot={id:shot.id+'-modules',template:'app.modules',start:c.openAt,end:shot.end,props:{...p.modules,__format:format,zoom:false,launch:{from:[src.x,src.y,src.w,src.h],r:30}}};
 const inner={...ep,shots:[moduleShot],chapters:[{at:c.openAt,label:'工作流',tab:'工作流'}]};
 const introOpacity=1-clamp01((t-c.openAt)/.2), railOpacity=clamp01((t-c.openAt-.1)/.2)*(1-clamp01((t-c.boxAt+.25)/.25));
 return <AbsoluteFill style={{background:mix(C.paper,C.navy,s.dark),fontFamily:FONT}}>
  <div style={{position:'absolute',left:80,top:is34?50:portrait?68:42,fontSize:is34?25:portrait?28:22,color:colors.secondary}}>连续叙事实验 · 组件示意</div>
  <div style={{position:'absolute',left:80,top:is34?196:portrait?260:200,width:portrait?920:1760,textAlign:'center',opacity:introOpacity}}>
   <EditorialTitle lines={p.introLines} dark={0} t={t} at={shot.start+.2} size={is34?92:portrait?108:104} centered/>
   <div style={{fontSize:is34?34:portrait?38:32,color:C.secondary,marginTop:is34?26:36,...rise(t,shot.start+.5)}}>{p.introSub}</div>
  </div>
  {/* 全程共用一块底板，入场无过冲回弹，切换时不更换白底、圆角或阴影。 */}
  <div style={{position:'absolute',left:s.rect.x,top:s.rect.y,width:s.rect.w,height:s.rect.h,borderRadius:s.radius,background:'#FFFFFF',boxShadow:'0 22px 64px rgba(16,36,58,.14)',opacity:enterOpacity,transform:enterTransform}}/>
  {s.keywordOpacity>0?<div style={{position:'absolute',left:l.keyword.x,top:l.keyword.y,width:l.keyword.w,height:l.keyword.h,display:'flex',gap:28,alignItems:'center',justifyContent:'center',opacity:enterOpacity*s.keywordOpacity,transform:enterTransform}}><Tile size={is34?78:86} icon="stack" bg={C.voice} tint="#FFFFFF"/><span style={{fontSize:is34?56:60,fontWeight:650,color:C.ink}}>{p.keyword}</span></div>:null}
  <div style={{position:'absolute',left:80,top:is34?128:portrait?190:300,width:portrait?920:510,opacity:railOpacity}}>
   <EditorialTitle lines={p.actionLines} dark={0} t={t} at={c.openAt+.1} size={is34?72:portrait?88:76}/>
   <div style={{fontSize:is34?30:portrait?34:30,lineHeight:is34?1.42:1.5,color:C.secondary,marginTop:is34?14:28}}>{p.actionSub}</div>
  </div>
  {t>=c.openAt&&s.appOpacity>0?<div style={{position:'absolute',inset:0,opacity:s.appOpacity,...(portrait?{clipPath:`inset(${st.top}px 0 ${l.height-st.bottom}px 0)`}:{})}}><div style={{position:'absolute',inset:0,...(portrait?{transformOrigin:'0 0',transform:`translate(${st.x}px,${st.y}px) scale(${st.scale})`}:{})}}><AppStage surface={false} t={t} ep={inner} env={env} sess={{start:c.openAt,end:shot.end,shots:[moduleShot]}}/></div></div>:null}
  <div style={{position:'absolute',left:80,top:is34?296:portrait?430:130,width:portrait?920:1760,opacity:s.resultOpacity}}>
   <EditorialTitle lines={p.resultLines} dark={1} t={t} at={c.liftAt+.75} size={is34?92:portrait?106:90} centered/>
   <div style={{marginTop:is34?24:32,textAlign:'center',color:C.dark.secondary,fontSize:is34?33:portrait?36:32}}>{p.resultSub}</div>
  </div>
  <div style={{position:'absolute',left:l.result.x,top:l.result.y,width:l.result.w,height:l.result.h,opacity:s.resultOpacity,padding:is34?'34px 34px':portrait?'42px 36px':'28px 36px',boxSizing:'border-box'}}>
   <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,color:C.voice,fontSize:is34?30:32,fontWeight:600,marginBottom:is34?32:portrait?42:30}}><Icon name="check-circle" size={36} color={C.voice}/>{p.resultLabel}</div>
   <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:portrait?28:38}}>{p.modules.items.map((it:any,i:number)=><React.Fragment key={it.name}>{i?<Icon name="arrow-right" size={36} color={C.secondary}/>:null}<div style={{display:'flex',alignItems:'center',gap:18}}><Tile size={is34?66:portrait?70:64} icon={it.icon} bg={C.voice} tint="#FFFFFF"/><span style={{fontSize:is34?38:portrait?40:36,fontWeight:600,color:C.ink}}>{it.name}</span></div></React.Fragment>)}</div>
  </div>
  <div style={{position:'absolute',left:80,bottom:is34?42:portrait?64:40,fontSize:is34?23:portrait?26:20,color:colors.secondary}}>{((ep as any).brand??ep.app?.title??ep.title??'工作流演示')}{(((ep as any).tagline??p.tagline??'从关键词，到可复用的工作流')?` / ${(ep as any).tagline??p.tagline??'从关键词，到可复用的工作流'}`:'')}</div>
 </AbsoluteFill>;
};
