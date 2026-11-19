// 一期视频 = episode.json。本文件只负责“按时间把模板排起来”，不含任何单期专用代码。
// 两类镜头：
//   · 卡片模板（host / tools / evidence / steps / voice / media / outro）—— 每个镜头独立流入流出
//   · App 模板（app.*，方案 C 产品演示）—— 连续的 app 镜头共用一个示意 App 窗口
import React from 'react';
import {Audio, CalculateMetadataFunction, staticFile, useCurrentFrame, useVideoConfig, Sequence} from 'remotion';
import {Episode as Ep, Envelope, assetPath} from './kit/types';
import {Canvas, FontGate, Header, Layer, Subtitle} from './kit/frame';
import {clamp01} from './kit/motion';
import {TEMPLATES} from './templates';
import {AppStage, sessionsOf, appMoving, camOf} from './app/AppStage';
import {Backdrop} from './kit/Backdrop';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {LayoutContext} from './kit/LayoutContext';
import {layoutFor, stageFor, type Format} from './kit/layout';
import {prepareEpisode, rhythmOf} from './kit/timing';
import {isShowcaseDesign, PresentationChrome, EditorialRail} from './kit/Presentation';
import {PixelFonts} from './kit/PixelFonts';
import {C, T} from './kit/tokens';

export type EpisodeProps = {episode: string; ep?: Ep; env?: Envelope; audio?: boolean; format?: Format};

export const Episode: React.FC<EpisodeProps> = ({ep, env, audio = true}) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (!ep || !env) return null;
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots[ep.shots.length - 1];
  const darkOf = (s: any) => (s?.dark ? 1 : 0);
  const idx = ep.shots.indexOf(cur), prev = ep.shots[idx - 1];
  const dark = prev && darkOf(prev) !== darkOf(cur) ? darkOf(prev) + (darkOf(cur) - darkOf(prev)) * clamp01((t - cur.start) / (isShowcaseDesign(ep) ? 0.18 : 0.35)) : darkOf(cur);
  // 画面（不含字幕）：快速运动的帧用 180° 快门的运动模糊，其余帧照常
  const picture = <Picture ep={ep} env={env} />;
  const blur = (ep as any).motionBlur !== false && (appMoving(ep, t) || ep.shots.some((s) => t >= s.start && t < s.end && (TEMPLATES[s.template] as any)?.moving?.(s, t)));
  return (
    <LayoutContext.Provider value={layoutFor(ep.format)}>
      <FontGate text={JSON.stringify(ep)} />
      {ep.presentation==='pixel'?<PixelFonts text={JSON.stringify(ep)}/>:null}
      {audio && ep.audio ? <Sequence from={Math.round((ep.audioOffset ?? 0) * fps)} layout="none"><Audio src={staticFile(assetPath(ep, ep.audio))} /></Sequence> : null}
      {audio && ep.sfx ? <Audio src={staticFile(assetPath(ep,ep.sfx.src))} volume={ep.sfx.volume ?? .6}/> : null}
      {audio && ep.music ? <Audio src={staticFile(assetPath(ep, ep.music.src))} volume={frame => musicGainAt(ep, frame / fps)} /> : null}
      {blur ? <CameraMotionBlur shutterAngle={180} samples={6}>{picture}</CameraMotionBlur> : picture}
      {/* 整屏色块章节卡盖住时：字幕改白字；字幕念的就是卡上那几个字时不再重复显示 */}
      {(() => {
        const fl = (cur.props?.pieces ?? []).find((d: any) => d.kind === 'flood' && t >= d.at + 0.1 && (d.out == null || t < d.out + 0.1));
        if (!fl) return <Subtitle t={t} ep={ep} dark={dark} />;
        const c = ep.captions.find((x) => t >= x.start && t < x.end), card = `${fl.kicker ?? ''}${fl.title}`;
        return c && card.includes(c.text.replace(/[\s，。、]/g, '')) ? null : <Subtitle t={t} ep={ep} dark={1} />;
      })()}
    </LayoutContext.Provider>
  );
};

/** 画面本体：按时间读帧，运动模糊会在不同的时间点多次渲染它 */
const Picture: React.FC<{ep: Ep; env: Envelope}> = ({ep, env}) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots[ep.shots.length - 1];
  const darkOf = (s: any) => (s?.dark ? 1 : 0);
  const idx = ep.shots.indexOf(cur), prev = ep.shots[idx - 1];
  const dark = prev && darkOf(prev) !== darkOf(cur) ? darkOf(prev) + (darkOf(cur) - darkOf(prev)) * clamp01((t - cur.start) / (isShowcaseDesign(ep) ? 0.18 : 0.35)) : darkOf(cur);
  const cardShots = ep.shots.filter((s) => !s.template.startsWith('app.'));
  const headerEp = {...ep, shots: ep.shots.map((s) => (s.template.startsWith('app.') ? {...s, header: undefined} : s))};
  const l = layoutFor(ep.format), st = stageFor(ep.format);
  return (
    <Canvas dark={dark} bg={(ep as any).canvas}>
      <Backdrop t={t} spec={isShowcaseDesign(ep) ? {kind: 'plain'} : (ep as any).backdrop} cam={camOf(ep, t)} dark={dark} />
      {isShowcaseDesign(ep) ? <PresentationChrome ep={ep} shot={cur} t={t} dark={dark}/> : null}
      {isShowcaseDesign(ep) && cur.template === 'scene' ? <EditorialRail ep={ep} shot={cur} t={t} dark={dark}/> : null}
      <Header t={t} ep={headerEp} dark={dark} />
      {(ep.format === 'landscape' || isShowcaseDesign(ep)) && cur.template.startsWith('app.') ? <AppRail ep={ep} shot={cur} dark={dark} t={t} /> : null}
      {cardShots.map((s) => {
        const T = TEMPLATES[s.template];
        const next = ep.shots.find((x) => Math.abs(x.start - s.end) < 0.01);
        return T ? <Layer key={s.id} t={t} shot={s} hold={!!next?.props?.launch}><T t={t} shot={s} ep={ep} env={env} /></Layer> : null;
      })}
      {sessionsOf(ep).map((sess) => isShowcaseDesign(ep) && ep.format !== 'landscape' ? <div key={sess.start} style={{position:'absolute',inset:0,clipPath:`inset(${st.top}px 0 ${l.height-st.bottom}px 0)`}}><div style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:`translate(${st.x}px,${st.y}px) scale(${st.scale})`}}><AppStage t={t} ep={ep} env={env} sess={sess}/></div></div> : <AppStage key={sess.start} t={t} ep={ep} env={env} sess={sess} />)}
    </Canvas>
  );
};

export const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const raw: Ep = await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then((r) => r.json());
  const ep = prepareEpisode(raw, props.format);
  const env: Envelope = await fetch(staticFile(assetPath(ep, ep.envelope))).then((r) => r.json());
  const duration = (ep as any).renderUntil ?? ep.duration;
  const {width, height} = layoutFor(ep.format);
  return {width, height, durationInFrames: Math.round(duration * 30), props: {...props, ep, env}};
};

/** 同一段音乐在讲解区轻放、展示区恢复；默认不添加音乐。 */
export function musicGainAt(ep: Ep, t: number): number {
  if (!ep.music) return 0;
  const i = ep.shots.findIndex(s => t >= s.start && t < s.end);
  const gain = (n: number) => n >= 0 && rhythmOf(ep, ep.shots[n]).mode === 'voice' ? (ep.music!.voiceVolume ?? 0.035) : (ep.music!.volume ?? 0.16);
  const now = gain(i), prev = gain(i-1), p = i > 0 ? clamp01((t-ep.shots[i].start)/0.2) : 1;
  return (prev+(now-prev)*p) * clamp01(t/0.3) * clamp01((ep.duration-t)/0.6);
}
const AppRail: React.FC<{ep: Ep; shot: any; dark: number; t: number}> = ({ep, shot, dark, t}) => {
  if (isShowcaseDesign(ep) && shot.props.editorial) return <EditorialRail ep={ep} shot={shot} t={t} dark={dark}/>;
  const l = layoutFor(ep.format), chapter = [...ep.chapters].reverse().find(c => c.at <= shot.start + 0.01);
  return <div style={{position: 'absolute', left: l.rail.x, top: l.rail.y, width: l.rail.w, opacity: shot.props.launch ? clamp01((t-shot.start-0.6)/0.25) : 1, color: dark ? '#fff' : C.ink}}>
    <div style={{...T.caption, color: dark ? C.dark.secondary : C.secondary}}>{chapter?.label ?? '操作演示'}</div>
    <div style={{fontSize: 64, fontWeight: 600, lineHeight: 1.3, marginTop: 36}}>{shot.header?.title ?? shot.props.title ?? shot.props.name}</div>
    <div style={{...T.body, fontSize: 36, lineHeight: 1.5, color: dark ? C.dark.secondary : C.secondary, marginTop: 38}}>{shot.header?.sub ?? shot.props.sub ?? shot.props.source}</div>
  </div>;
};
