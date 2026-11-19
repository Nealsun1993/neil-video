import React from 'react';
import {AbsoluteFill,Audio,CalculateMetadataFunction,OffthreadVideo,Sequence,staticFile,useVideoConfig} from 'remotion';
import {FontGate} from '../kit/frame';
import {CleanUiDemo,ease,font,ink,Mark} from './CleanUiDemo';
import {ExportScene,ImportScene,PictureScene,useTime} from './CleanUiWorkflow';
import {CameraKey,cameraAt,CLEAN_CAMERA,CLEAN_LIVE,CleanLiveConfig,validateCleanLive} from '../kit/cleanLive';

// 纯白镜头版：沿用一分钟工作流的四个场景和配乐，外面套一层镜头，按动作推近到操作位置再拉回；
// 开场图标逐个画出，导出后把竖屏成片放进手机，结尾用搜索框打字收束。
const muted='#697575',blue='#0797F4';
const ICONS=['M3 12h2m3-5v10m4-14v18m4-15v12m3-6h2','M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6','M3 5h18v13H3zM8 22h8m-6-12 5 2.5-5 2.5z'];

function Camera({keys,children}:{keys:CameraKey[];children:React.ReactNode}){
 const {s,x,y}=cameraAt(useTime(),keys);
 return <AbsoluteFill style={{transformOrigin:'0 0',transform:`translate(${960-x*s}px,${540-y*s}px) scale(${s})`,willChange:'transform'}}>{children}</AbsoluteFill>;
}
function Opening(){
 const t=useTime(),logoOut=ease(t,1.25,1.6),out=ease(t,3.6,4);
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:1-out}}>
  <div style={{position:'absolute',display:'flex',alignItems:'center',gap:26,fontSize:96,fontWeight:730,letterSpacing:-3,opacity:ease(t,.05,.45)*(1-logoOut),transform:`scale(${1+t*.02})`}}><Mark size={108}/>口播工作台</div>
  <div style={{position:'absolute',display:'flex',gap:190}}>{ICONS.map((d,i)=>{const at=1.45+i*.55,q=ease(t,at,at+.6);return <svg key={i} width={190} height={190} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{opacity:Math.min(1,q*3),transform:`translateY(${(1-q)*24}px)`}}><path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1-q}/></svg>;})}</div>
 </AbsoluteFill>;
}
// 导出完成后：界面退到白幕后，竖屏成片在手机里播放，横竖两个规格标签散开。
function Phone({phone}:{phone:CleanLiveConfig['phone']}){
 const t=useTime(),{fps}=useVideoConfig(),a=CLEAN_LIVE.phoneAt,q=ease(t,a,a+.7),out=ease(t,14.3,14.9);
 if(t<a)return null;
 return <AbsoluteFill style={{opacity:1-out}}>
  <AbsoluteFill style={{background:'#fff',opacity:q*.96}}/>
  <div style={{position:'absolute',left:960-190,top:540-405+(1-q)*260,width:380,height:810,borderRadius:58,background:'#0E1114',padding:14,boxSizing:'border-box',boxShadow:'0 40px 90px #14242340',opacity:q,transform:`scale(${1+(t-a)*.02})`}}>
   <div style={{width:'100%',height:'100%',borderRadius:46,overflow:'hidden',background:'#fff'}}><Sequence from={Math.round(a*fps)} layout="none"><OffthreadVideo src={staticFile(phone.src)} trimBefore={Math.round(phone.clipAt*fps)} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></Sequence></div>
  </div>
  {phone.formats.map(([name,size],i)=>{const side=i?1:-1,p=ease(t,a+.45+i*.2,a+1.05+i*.2);return <div key={name} style={{position:'absolute',left:960+side*(250+p*240)-150,top:470+i*70,width:300,padding:'22px 0',textAlign:'center',borderRadius:22,background:i?blue:'#fff',color:i?'#fff':ink,border:i?'none':'1px solid #E2E8E8',boxShadow:'0 14px 40px #17344C1f',opacity:p,transform:`rotate(${side*4*p}deg)`}}><div style={{fontSize:32,fontWeight:700}}>{name}</div><div style={{fontSize:22,opacity:.75,marginTop:6}}>{size}</div></div>;})}
 </AbsoluteFill>;
}
function Closing({text}:{text:string}){
 const t=useTime(),logoOut=ease(t,1.9,2.3),bar=ease(t,2.1,2.7),count=Math.floor(Array.from(text).length*ease(t,2.6,4));
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:ease(t,0,.5)}}>
  <div style={{position:'absolute',display:'flex',alignItems:'center',gap:32,fontWeight:750,fontSize:111,letterSpacing:-4,opacity:1-logoOut,transform:`scale(${1+t*.015})`}}><Mark size={128}/>口播工作台</div>
  <div style={{position:'absolute',width:1180,height:170,borderRadius:90,border:'3px solid #E3E8E8',boxShadow:'0 18px 60px #1A28281a',display:'flex',alignItems:'center',gap:34,padding:'0 60px',boxSizing:'border-box',fontSize:88,fontWeight:650,letterSpacing:-2,opacity:bar,transform:`scale(${.94+.06*bar+Math.max(0,t-2.7)*.012})`}}>
   <svg width={84} height={84} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7}/><path d="m20 20-3.6-3.6"/></svg>
   <span>{Array.from(text).slice(0,count).join('')}<span style={{color:blue,opacity:Math.floor(t*3)%2?1:0}}>|</span></span>
  </div>
 </AbsoluteFill>;
}

export type CleanLiveProps={config?:CleanLiveConfig;audio?:boolean};
export const cleanLiveMetadata:CalculateMetadataFunction<CleanLiveProps>=async({props})=>{const config:CleanLiveConfig=props.config??await fetch(staticFile('clean-ui-workflow/live.json')).then(r=>r.json());validateCleanLive(config);return {props:{...props,config}};};
export const CleanUiLive:React.FC<CleanLiveProps>=({config,audio=true})=>{
 const {fps}=useVideoConfig();if(!config)return null;
 const {fileName,keyword,...sample}=config.sample;
 return <AbsoluteFill style={{background:'white',fontFamily:font,color:ink,overflow:'hidden'}}>
  <FontGate text={'导入口播配画面预览导出文件拖到这里识别文稿音频已导入将这一句添加画面插入时间轴素材库字幕画面轨音频轨横屏竖屏导出设置生成导出文件已就绪工作流口播工作台流程示意'+config.search+config.phone.formats.flat().join('')+fileName+keyword+Object.values(sample).join('')}/>
  {audio?<Audio src={staticFile(config.audio)}/>:null}
  <Sequence from={0} durationInFrames={4*fps}><Opening/></Sequence>
  <Sequence from={4*fps} durationInFrames={11*fps}><Camera keys={CLEAN_CAMERA.import}><ImportScene {...sample} fileName={fileName}/></Camera></Sequence>
  <Sequence from={15*fps} durationInFrames={11*fps}><Camera keys={CLEAN_CAMERA.proof}><CleanUiDemo {...sample} workflow/></Camera></Sequence>
  <Sequence from={26*fps} durationInFrames={14*fps}><Camera keys={CLEAN_CAMERA.picture}><PictureScene {...sample} keyword={keyword}/></Camera></Sequence>
  <Sequence from={40*fps} durationInFrames={15*fps}><Camera keys={CLEAN_CAMERA.export}><ExportScene {...sample} keyword={keyword}/></Camera><Phone phone={config.phone}/></Sequence>
  <Sequence from={55*fps} durationInFrames={5*fps}><Closing text={config.search}/></Sequence>
 </AbsoluteFill>;
};
