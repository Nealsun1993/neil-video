/** 展示设计层：标题、章节角标、深浅配色；内容仍由原 Remotion 模板绘制。 */
import React from 'react';
import type {Episode, Shot} from './types';
import {C, FONT, MONO} from './tokens';
import {clamp01, mix, rise} from './motion';
import {layoutFor} from './layout';
export const isShowcaseDesign = (ep: Episode) => ep.presentation === 'showcase';
export const presentationColors = (dark: number) => ({
  ink: mix(C.ink, '#FFFFFF', dark),
  secondary: mix(C.secondary, '#B4C7E8', dark),
  accent: mix(C.voice, '#A7B9FF', dark),
});
export const EditorialTitle: React.FC<{lines: string[]; dark: number; t: number; at: number; size?: number; centered?: boolean; accent?: 'blue'|'coral'}> = ({lines,dark,t,at,size=76,centered,accent='blue'}) => {
 const c=presentationColors(dark);
 return <div style={{fontFamily:FONT,fontSize:size,fontWeight:700,lineHeight:1.28,letterSpacing:-1,textAlign:centered?'center':'left'}}>
  {lines.map((line,i)=><div key={i} style={{color:i===lines.length-1?(accent==='coral'?C.problem:c.accent):c.ink,...rise(t,at+i*.12,24)}}>{line}</div>)}
 </div>;
};
export const PresentationChrome: React.FC<{ep:Episode;shot:Shot;t:number;dark:number}> = ({ep,shot,t,dark}) => {
 const l=layoutFor(ep.format), c=presentationColors(dark), wide=ep.format==='landscape', is34=ep.format==='3:4';
 const brand=(ep as any).brand??ep.app?.title??ep.title??'内容展示';
 const tagline=(ep as any).tagline??'让画面跟着讲解走';
 const badge=(ep as any).badge??(ep as any).brand??ep.app?.title??'SHOWCASE';
 const index=ep.shots.indexOf(shot), label=shot.props.editorial?.label??shot.props.kicker??brand;
 return <div style={{position:'absolute',inset:0,pointerEvents:'none',fontFamily:FONT}}>
  <div style={{position:'absolute',left:wide?72:80,top:wide?42:is34?50:68,fontSize:wide?22:is34?25:28,color:c.secondary,display:'flex',alignItems:'center',gap:18}}>
   <span style={{fontFamily:MONO,color:c.accent}}>{String(index+1).padStart(2,'0')}</span><span>{label}</span>
  </div>
  {wide?<div style={{position:'absolute',right:72,top:18,fontSize:18,fontFamily:MONO,color:c.secondary,letterSpacing:1}}>{badge}</div>:null}
  <div style={{position:'absolute',left:wide?72:80,bottom:wide?40:is34?42:64,fontSize:wide?20:is34?23:26,color:c.secondary}}>{brand}{tagline?` / ${tagline}`:''}</div>
  <div style={{position:'absolute',bottom:0,left:0,width:l.width*clamp01(t/ep.duration),height:4,background:c.accent,opacity:.55}} />
 </div>;
};
export const EditorialRail: React.FC<{ep:Episode;shot:Shot;t:number;dark:number}> = ({ep,shot,t,dark}) => {
 const wide=ep.format==='landscape', is34=ep.format==='3:4', l=layoutFor(ep.format), e=shot.props.editorial, c=presentationColors(dark);
 if(!e)return null;
 return <div style={{position:'absolute',left:wide?l.rail.x:80,top:wide?290:is34?128:190,width:wide?l.rail.w:920,opacity:shot.props.launch?clamp01((t-shot.start-.6)/.25):1}}>
  <EditorialTitle lines={e.lines} dark={dark} t={t} at={shot.start+.12} size={wide?76:is34?72:88}/>
  <div style={{fontSize:wide?30:is34?30:34,lineHeight:is34?1.42:1.5,color:c.secondary,marginTop:wide?36:is34?14:22,...rise(t,shot.start+.3)}}>{e.sub}</div>
  {wide && e.tag?<div style={{display:'inline-block',fontSize:21,color:c.accent,marginTop:60,padding:'12px 16px',background:dark>.5?'#152540':'#E8EFFD',borderRadius:8,...rise(t,shot.start+.45)}}>{e.tag}</div>:null}
 </div>;
};
