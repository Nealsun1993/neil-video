import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction} from 'remotion';
import {PixelFonts} from '../kit/PixelFonts';
import {PIXEL as P,PIXEL_FONT,PIXEL_MONO,pixelEase as E,pixelTyped} from '../kit/pixelDesign';
import {promoSceneAt,validatePromo,PromoStory} from '../kit/pixelPromo';
import {PixelStory} from './PixelStory';
import type {Episode,Envelope} from '../kit/types';
const R:React.FC<any>=({x,y,w,h,fill,...rest})=><rect x={Math.round(x)} y={Math.round(y)} width={Math.round(w)} height={Math.round(h)} fill={fill??P.ink} {...rest}/>;
const Txt:React.FC<any>=({x,y,children,size=12,fill=P.ink,anchor='start',...rest})=><text x={x} y={y} fill={fill} fontSize={size} fontFamily={PIXEL_FONT} textAnchor={anchor} {...rest}>{children}</text>;
const Panel:React.FC<any>=({x,y,w,h,light=false,children})=><g><R x={x+3} y={y+4} w={w} h={h} fill="#020408"/><R x={x} y={y} w={w} h={h} fill={light?'#f0eadd':P.edge}/><R x={x+2} y={y+2} w={w-4} h={h-4} fill={light?'#fffaf0':P.panel}/><R x={x+2} y={y+2} w={w-4} h={10} fill={light?'#ded5c2':'#22334d'}/>{[0,1,2].map(i=><R key={i} x={x+7+i*6} y={y+5} w={3} h={3} fill={i?P.muted:P.accent}/>)}{children}</g>;
const Doc:React.FC<any>=({x,y,w=34,h=44,tone=P.accent})=><g><R x={x+2} y={y+3} w={w} h={h} fill="#020408"/><R x={x} y={y} w={w} h={h} fill={tone}/><R x={x+2} y={y+2} w={w-4} h={h-4} fill={P.panel}/>{[0,1,2,3].map(i=><R key={i} x={x+6} y={y+8+i*7} w={w-12-(i%2)*6} h={2} fill={i?P.muted:tone}/>)}</g>;
const Line:React.FC<any>=({x1,y1,x2,y2,color=P.edge})=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} shapeRendering="crispEdges"/>;
const Cursor:React.FC<any>=({x,y})=><path d={`M${Math.round(x)} ${Math.round(y)}v14l4-3 3 7 3-2-3-7h6z`} fill={P.ink} stroke={P.bg} strokeWidth={1}/>;
function Wave({x,y,w,h,t,active=true}:any){return <g>{Array.from({length:Math.floor(w/3)},(_,i)=>{const a=(.25+.75*Math.abs(Math.sin(i*2.13)*Math.sin(i*.43)))*(active? .8+.2*Math.cos(t*4-i*.14):1);return <R key={i} x={x+i*3} y={y+h/2-h*a/2} w={2} h={Math.max(1,h*a)} fill={active?P.accent:P.muted}/>})}</g>;}
function Stage({kind,u}: {kind:string;u:number}){
 const packet=(u*.28)%1;
 if(kind==='hook')return <g>{[0,1,2].map(i=>{const p=E((u-.35-i*.25)/.6),x=181+i*62,y=167+Math.round((1-p)*70);return <g key={i} opacity={p}><Doc x={x} y={y} w={36} h={44}/><Txt x={x+18} y={y+60} anchor="middle" size={10}>{['文案','配音','画面'][i]}</Txt>{i<2&&u>1.5?<Line x1={x+40} y1={y+22} x2={x+58} y2={y+22} color={P.ok}/>:null}</g>;})}<R x={190+Math.round(150*E((u-1.4)/1.8))} y={187} w={4} h={4} fill={P.warm}/></g>;
 if(kind==='split'){
 const q=E((u-1.3)/1.1);return <g><Panel x={207} y={61} w={246} h={164}/>{[0,1,2,3].map(i=>{const xs=[226,302,250,360],ys=[100,86,156,143],x=xs[i]+(228+i*55-xs[i])*q,y=ys[i]+(118-ys[i])*q;return <g key={i}><Doc x={x} y={y} w={34} h={44} tone={q>.9?P.ok:P.accent}/>{i<3?<Line x1={x+35} y1={y+22} x2={x+50} y2={y+22} color={P.ok}/>:null}</g>;})}<Txt x={330} y={208} size={10} anchor="middle" fill={P.muted}>{q<.9?'素材散落在不同位置':'按表达顺序组织起来'}</Txt></g>;
 }
 if(kind==='voice')return <g><Panel x={204} y={60} w={250} h={165}/><Txt x={219} y={88} size={10} fill={P.muted}>VOICE INPUT / 声音输入</Txt><R x={218} y={101} w={222} h={62} fill={P.inset}/><Wave x={225} y={112} w={206} h={40} t={u}/><R x={224+Math.round((u%3)/3*207)} y={106} w={1} h={51} fill={P.warm}/><R x={219} y={181} w={218*E((u-.5)/2)} h={3} fill={P.accent}/><Txt x={219} y={206} size={10}>{u<2?'保留真实发音与停顿':'画面从声音里开始'}</Txt></g>;
 if(kind==='timeline')return <g><Panel x={204} y={60} w={250} h={165}/><Wave x={220} y={91} w={218} h={28} t={u}/>{[0,1,2].map(i=><g key={i}><R x={220+i*68} y={133+i*18} w={58*E((u-i*.6)/.5)} h={12} fill={[P.accent,'#354f77',P.ok][i]}/><Txt x={225+i*68} y={142+i*18} size={8} fill={i===0?P.bg:P.ink}>{['关键词','出现','连接'][i]}</Txt></g>)}<R x={220+Math.round(E(u/3.6)*218)} y={82} w={1} h={115} fill={P.warm}/><Txt x={220} y={214} size={9} fill={P.muted}>声音的落点，也是动作的起点</Txt></g>;
 if(kind==='devices')return <g><Panel x={179} y={90} w={181} h={102}/><R x={242} y={196} w={55} h={6} fill={P.edge}/><Panel x={384} y={58} w={65} h={145}/>{[0,1,2].map(i=><g key={i}><R x={190+i*51} y={132} w={43} h={35} fill={i===Math.floor(u)%3?P.accent:'#263b57'}/><R x={393} y={84+i*33} w={47} h={26} fill={i===Math.floor(u)%3?P.accent:'#263b57'}/></g>)}<Line x1={361} y1={141} x2={382} y2={141} color={P.ok}/><R x={361+packet*20} y={139} w={3} h={3} fill={P.warm}/><Txt x={270} y={223} size={12} anchor="middle">16:9</Txt><Txt x={417} y={223} size={12} anchor="middle">9:16</Txt></g>;
 if(kind==='styles')return <g><Panel x={194} y={72} w={121} h={143} light/><Panel x={331} y={72} w={121} h={143}/>{[0,1,2].map(i=><g key={i}><R x={204} y={102+i*29} w={101} h={22} fill={i===Math.floor(u)%3?'#315efb':'#e1e6f4'}/><R x={341} y={102+i*29} w={101} h={22} fill={i===Math.floor(u)%3?P.accent:'#263b57'}/><Txt x={212} y={118+i*29} size={10} fill={i===Math.floor(u)%3?'#ffffff':'#20304b'}>{['文案','配音','画面'][i]}</Txt><Txt x={350} y={118+i*29} size={10}>{['文案','配音','画面'][i]}</Txt></g>)}<Txt x={254} y={238} size={10} anchor="middle">基础版式</Txt><Txt x={391} y={238} size={10} anchor="middle" fill={P.accent}>夜色像素</Txt></g>;
 if(kind==='editor')return <g><Panel x={190} y={61} w={267} h={165}/><R x={194} y={75} w={107} h={147} fill={P.inset}/><Txt x={201} y={93} size={10} fill={P.muted}>EDIT / 本地编辑</Txt>{['标题','配音','时间','版式'].map((v,i)=><g key={v}><R x={201} y={107+i*25} w={89} h={18} fill={Math.floor(u)%4===i?'#343a46':'#152238'}/><Txt x={208} y={120+i*25} size={10}>{v}</Txt></g>)}<Doc x={347} y={104} w={60} h={74} tone={P.ok}/><Txt x={377} y={204} size={10} anchor="middle">{u<2.4?'保留原片':'保存新版本'}</Txt><Cursor x={258+Math.round(20*E(u/3))} y={115+Math.floor(u)%4*25}/></g>;
 if(kind==='render')return <g><Panel x={204} y={61} w={250} h={165}/><R x={219} y={88} w={220} h={87} fill={P.inset}/>{[0,1,2].map(i=><Doc key={i} x={243+i*56} y={107} w={32} h={44} tone={P.ok}/>)}<R x={219} y={188} w={220} h={9} fill={P.edge}/><R x={220} y={189} w={218*E(u/3.2)} h={7} fill={P.accent}/><Txt x={219} y={214} size={10}>{u<3.2?'预览中 / 效果示意':'另存为新的成片'}</Txt><Cursor x={416} y={207-Math.round(5*E((u-2.6)/.3))}/></g>;
 if(kind==='payoff')return <g>{[0,1,2,3].map(i=>{const x=85+i*94,y=150-Math.round(12*E((u-i*.3)/.6));return <g key={i}><Doc x={x} y={y} w={44} h={54} tone={i===3?P.ok:P.accent}/><Txt x={x+22} y={y+73} size={12} anchor="middle">{['声音','模块','工作流','成片'][i]}</Txt>{i<3?<Line x1={x+49} y1={y+27} x2={x+88} y2={y+27} color={u>i*.5+1?P.ok:P.edge}/>:null}</g>;})}<R x={100+Math.round(E((u-1.3)/2.7)*302)} y={161} w={4} h={4} fill={P.warm}/></g>;
 if(kind==='end')return <g>{Array.from({length:25},(_,i)=>{const row=Math.floor(i/5),col=i%5;if(!((row===0||row===4||col===0||col===4)||(row===2&&col===2)))return null;const q=E((u-i*.015)/.65),x=223+col*7,y=43+row*7;return <R key={i} x={x+(col-2)*100*(1-q)} y={y+(row-2)*60*(1-q)} w={5} h={5} fill={P.accent}/>;})}</g>;
 return null;
}
export type PixelPromoProps={story?:PromoStory;ep?:Episode;env?:Envelope;audio?:boolean};
export const PixelPromo:React.FC<PixelPromoProps>=({story,ep,env,audio=true})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;if(!story||!ep||!env)return null;
 const s=promoSceneAt(story,t),u=t-s.start,centered=['hook','payoff','end'].includes(s.kind),demo=s.kind==='demo';
 const intro=E(u/.45),exit=E((t-59)/1),phaseIndex=story.scenes.indexOf(s);
 const local=demo?t-16:0,caption=demo?ep.captions.find(c=>local>=c.start&&local<c.end):null;
 const camera=1+.045*E(u/.8)*(1-E((u-2.5)/1)),cx=centered?240:330,cy=140;
 const wipe=E(u/.24),curtain=u<.24&&!['hook','demo'].includes(s.kind);
 return <AbsoluteFill style={{background:P.bg,color:P.ink,fontFamily:PIXEL_FONT}}>
  <PixelFonts text={JSON.stringify(story)+JSON.stringify(ep)}/>
  {audio?<Audio src={staticFile(story.audio)}/>:null}
  {demo?<><PixelStory t={local} ep={ep} env={env} shot={ep.shots[0]}/>{caption?<div style={{position:'absolute',left:80,top:950,width:1760,textAlign:'center',fontSize:48}}>{caption.text}</div>:null}</>:<>
   <svg viewBox="0 0 480 270" width="1920" height="1080" style={{position:'absolute',inset:0}} shapeRendering="crispEdges">
    <defs><pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#17253a"/></pattern></defs>
    <R x={0} y={156} w={480} h={114} fill="url(#dots)"/>
    <g transform={`translate(${Math.round((1-intro)*(phaseIndex%2?-12:12))} 0)`} opacity={intro}><g transform={`translate(${Math.round(cx*(1-camera))} ${Math.round(cy*(1-camera))}) scale(${camera})`}><Stage kind={s.kind} u={u}/></g></g>
   </svg>
   <div style={{position:'absolute',left:80,top:48,fontFamily:PIXEL_MONO,fontSize:24,color:P.muted}}>{s.label}</div>
   <div style={{position:'absolute',left:centered?100:80,top:s.kind==='end'?348:centered?170:260,width:centered?1720:650,textAlign:centered?'center':'left',fontSize:s.kind==='end'?100:centered?88:72,lineHeight:1.5,translate:`0 ${Math.round(6*(1-intro))*4}px`,opacity:intro}}>
    <div>{pixelTyped(s.title,u,.15)}</div><div style={{color:P.accent}}>{pixelTyped(s.accent,u,.45)}</div>
    <div style={{fontFamily:s.kind==='end'?PIXEL_MONO:PIXEL_FONT,fontSize:s.kind==='end'?28:32,color:P.muted,marginTop:24}}>{u>.8?s.detail:''}</div>
   </div>
   <div style={{position:'absolute',left:80,bottom:54,fontFamily:PIXEL_MONO,fontSize:20,color:P.muted}}>TALK-WORKBENCH / DESIGN & MOTION STUDY</div>
  </>}
  <div style={{position:'absolute',right:80,bottom:50,fontFamily:PIXEL_MONO,fontSize:20,color:P.muted}}>{String(phaseIndex+1).padStart(2,'0')} / 11</div>
  <div style={{position:'absolute',left:0,bottom:0,height:4,width:`${Math.min(100,t/60*100)}%`,background:P.accent}}/>
  {curtain?(phaseIndex%3===0?<svg viewBox="0 0 480 270" width="1920" height="1080" style={{position:'absolute',inset:0}} shapeRendering="crispEdges">{Array.from({length:240},(_,i)=>((i*37)%241)/241>wipe?<R key={i} x={(i%20)*24} y={Math.floor(i/20)*24} w={24} h={24} fill={P.bg}/>:null)}</svg>:<div style={{position:'absolute',inset:0,background:phaseIndex%3===1?P.accent:P.bg,clipPath:phaseIndex%3===1?`inset(0 0 0 ${Math.round(wipe*100)}%)`:`inset(${Math.round(wipe*100)}% 0 0 0)`}}/>):null}
  {exit>0?<AbsoluteFill style={{background:P.bg,opacity:exit}}/>:null}
 </AbsoluteFill>;
};
export const pixelPromoMetadata:CalculateMetadataFunction<PixelPromoProps>=async()=>{
 const story=await fetch(staticFile('episodes/pixel-minute/story.json')).then(r=>r.json());validatePromo(story);
 const ep=await fetch(staticFile('episodes/pixel-demo/episode.json')).then(r=>r.json());ep.format='landscape';
 const env=await fetch(staticFile('episodes/story-demo/envelope.json')).then(r=>r.json());
 return {durationInFrames:1800,props:{story,ep,env}};
};
