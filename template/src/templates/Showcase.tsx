/** 展示配方：短开场、章节卡、结果页。沿用工作台字体、图标与语义色。 */
import React from 'react';
import {Easing, interpolate} from 'remotion';
import {C, FONT, T} from '../kit/tokens';
import {Icon, textWidth} from '../kit/components';
import {clamp01, smooth} from '../kit/motion';
import {rhythmOf} from '../kit/timing';
import {useEpisodeLayout} from '../kit/LayoutContext';
import {showcaseItemRect} from '../kit/layout';
import {EditorialTitle, isShowcaseDesign} from '../kit/Presentation';
import type {TemplateProps} from './types';

const settleIn = (t: number, at: number, dy = 24): React.CSSProperties => {
  const q = smooth(t, at, 0.38);
  return q >= 0.999 ? {opacity: 1} : {opacity: clamp01(q * 1.8), transform: `translateY(${(1 - q) * dy}px) scale(${0.96 + 0.04 * q})`};
};

export const Showcase: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const l = useEpisodeLayout(), wide = l.format === 'landscape', is34 = l.format === '3:4', p = shot.props;
  const beat = rhythmOf(ep, shot).mode === 'beat', at = p.revealAt ?? shot.start + (beat ? 0.5 : 0.15);
  const progress = beat ? interpolate(t, [at, at + 0.18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}) : smooth(t, at, 0.5);
  const fg = shot.dark ? '#FFFFFF' : C.ink, sub = shot.dark ? C.dark.secondary : C.secondary;
  const designed = isShowcaseDesign(ep);
  const items: any[] = p.items ?? [], chapter = p.variant === 'chapter', centered = chapter || !items.length;
  const area = centered
    ? {x: 80, y: wide ? (designed ? 310 : 230) : is34 ? (designed ? (chapter ? 310 : 350) : 290) : designed ? (chapter ? 430 : 530) : 400, w: l.width - 160}
    : wide ? {x: 80, y: 250, w: 650} : {x: 80, y: is34 ? (designed ? 156 : 210) : (designed ? 240 : 320), w: 920};
  const size = Math.min(wide ? 112 : is34 ? 90 : 100, (area.w / Math.max(1, textWidth(p.title, 100))) * 100);
  return <>
    <div style={{position: 'absolute', left: area.x, top: area.y, width: area.w, textAlign: centered ? 'center' : 'left', color: fg, fontFamily: FONT}}>
      {!designed && p.kicker ? <div style={{...T.caption, color: sub, marginBottom: is34 ? 24 : 36, ...settleIn(t, shot.start, 12)}}>{p.kicker}</div> : null}
      {designed ? <EditorialTitle lines={p.titleLines ?? [p.title]} dark={shot.dark ? 1 : 0} t={t} at={at} size={wide ? (centered ? 106 : 76) : is34 ? (centered ? 92 : 76) : (centered ? 112 : 96)} centered={centered} accent={p.accent}/> : <div style={{fontSize: size, fontWeight: 700, lineHeight: 1.3, opacity: progress, transform: progress >= 0.999 ? undefined : `translateY(${24*(1-progress)}px) scale(${beat ? 1.06-0.06*progress : 1})`, transformOrigin: centered ? 'center' : 'left center'}}>
        <span style={{position: 'relative', zIndex: 0}}><span style={{position: 'absolute', left: -8, top: '61%', height: '26%', width: `${progress*100}%`, background: shot.dark ? '#4269AC' : '#CBD9FA', zIndex: -1}} />{p.title}</span>
      </div>}
      {p.sub ? <div style={{...T.body, fontSize: designed && wide ? 32 : is34 ? 36 : T.body.fontSize, marginTop: is34 ? 26 : 38, lineHeight: 1.5, color: sub, opacity: clamp01((t-at-0.15)/0.3)}}>{p.sub}</div> : null}
      {p.cta ? <div style={{display: 'inline-block', marginTop: is34 ? 36 : 48, padding: is34 ? '18px 30px' : '22px 34px', borderRadius: 22, background: C.problem, color: C.ink, ...T.body, fontWeight: 600, ...settleIn(t, p.ctaAt ?? at + 0.5)}}>{p.cta}</div> : null}
    </div>
    {designed && !wide && p.portraitFlow ? <div style={{position:'absolute',left:80,top:is34?840:1120,width:920,display:'flex',gap:is34?24:28}}>{p.portraitFlow.map((label:string,i:number)=><div key={i} style={{flex:1,padding:is34?'24px 14px':'30px 16px',borderRadius:24,background:'#152944',textAlign:'center',...settleIn(t,at+.5+i*.5)}}><div style={{fontSize:is34?24:26,color:'#A7B9FF',marginBottom:is34?16:22}}>0{i+1}</div><div style={{fontSize:is34?40:44,fontWeight:600,color:'#FFFFFF'}}>{label}</div></div>)}</div>:null}
    {items.map((item, i) => {
      const a = item.at ?? at + i * (beat ? 0.5 : 0.3);
      const {x, y, w, h} = showcaseItemRect(l.format, i, designed);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 30, background: shot.dark ? '#142B48' : '#fff', boxShadow: '0 12px 34px rgba(16,36,58,0.08)', display: 'flex', alignItems: 'center', gap: is34 ? 26 : 30, padding: is34 ? '0 34px' : '0 40px', color: fg, ...settleIn(t, a)}}>
        <div style={{width: is34 ? 78 : 86, height: is34 ? 78 : 86, borderRadius: 22, background: shot.dark ? '#243F65' : C.voiceSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={item.icon ?? 'stack'} size={is34 ? 44 : 48} color={shot.dark ? '#B4C7E8' : C.ink} /></div>
        <div style={{flex: 1, minWidth: 0}}><div style={{...T.heading, fontSize: is34 ? 46 : T.heading.fontSize, fontWeight: 600}}>{item.title}</div>{item.sub ? <div style={{...T.caption, marginTop: 10, color: sub}}>{item.sub}</div> : null}</div>
      </div>;
    })}
  </>;
};
