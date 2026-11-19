import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig,CalculateMetadataFunction} from 'remotion';
import {MaterialSet,validateMaterials,fittedOgSize} from '../kit/ogMaterials';
import {FontGate} from '../kit/frame';
export type OgConfig={brand:string;headline:string;duration:number;audio:string;materials?:MaterialSet;scenes:{start:number;end:number;lines:string[]}[]};
const C={mint:'#DDE8CA',cream:'#F4F0DF',green:'#103F2D',orange:'#FA743B',pink:'#D83087',blue:'#2858D8',white:'#FFFFFF'};
const FONT='"MiSans VF","PingFang SC",sans-serif';
const clamp=(x:number)=>Math.max(0,Math.min(1,x)),smooth=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);},ease=(x:number)=>1-(1-clamp(x))**3;
type Pose={x:number;y:number;s:number;r:number};
function pose(t:number,states:Pose[]){const p={...states[0]};for(let i=1;i<states.length;i++){const q=smooth((t-(i*4-.35))/.8);for(const k of ['x','y','s','r']as const)p[k]+=(states[i][k]-states[i-1][k])*q;}return p;}
const seated:Pose[]=[{x:-95,y:430,s:1.06,r:-4},{x:-180,y:390,s:1.2,r:2},{x:-280,y:585,s:.86,r:-8},{x:-235,y:590,s:.82,r:-4},{x:-110,y:430,s:1.08,r:-4},{x:-125,y:445,s:1.08,r:-3}];
const standing:Pose[]=[{x:1420,y:170,s:1.15,r:5},{x:1300,y:120,s:1.3,r:-3},{x:1540,y:480,s:.9,r:4},{x:1490,y:445,s:.96,r:-4},{x:1410,y:160,s:1.25,r:4},{x:1460,y:150,s:1.24,r:6}];
const pink:Pose[]=[{x:1030,y:-135,s:1.05,r:-12},{x:990,y:-230,s:1.12,r:7},{x:1160,y:-590,s:.92,r:17},{x:1140,y:-590,s:1.08,r:-13},{x:1050,y:-150,s:1.1,r:9},{x:770,y:-210,s:1.2,r:11}];
export function Person({color,t,standing=false}:{color:string;t:number;standing?:boolean}){
 return <svg width={500} height={720} viewBox="0 0 500 720" style={{overflow:'visible'}}>
  <path fill={color} d="M162 128C153 64 202 22 252 29C294 32 320 74 314 110L340 133L315 146C314 185 291 208 265 210L265 244L202 247L205 194C176 185 160 157 162 128Z"/>
  <path fill={color} d="M161 124C137 66 183 12 229 13C258 -4 309 19 318 58L281 72L276 100L242 95L223 128L207 112L193 139Z"/>
  <path fill={color} d={standing?'M199 229Q266 210 302 254L350 444L329 520L377 720H281L248 520L219 720H117L174 459L145 300Q152 247 199 229Z':'M177 240Q223 214 271 238Q311 257 325 315L350 464L430 519L408 592L288 566L263 479L274 720H-15L37 419Q69 279 177 240Z'}/>
  <g transform={`rotate(${Math.sin(t*1.8)*3},270,280)`}><path fill={color} d={standing?'M281 260Q306 243 324 272L384 369L437 314L467 339L404 432Q381 458 355 427L273 315Z':'M270 280Q296 262 316 292L372 379L428 322L461 349L392 438Q368 464 343 434L259 328Z'}/><path fill={color} d="M420 330L432 298L444 285L453 293L448 310L474 296L484 307L476 321L451 353Z"/></g>
  {!standing?<path d="M7 574Q68 479 162 547L204 720" fill="none" stroke={C.mint} strokeWidth={9}/>:null}
 </svg>;
}
export function Leaves({color,t}:{color:string;t:number}){return <svg width={510} height={650} viewBox="0 0 510 650" style={{overflow:'visible'}}><path d="M190 650Q230 400 350 70" stroke={color} strokeWidth={16} fill="none"/>{[0,1,2,3,4,5,6].map(i=><g key={i} transform={`translate(${215+i*18},${570-i*72}) rotate(${(i%2?22:-115)+Math.sin(t*1.3+i)*4})`}><path d="M0 0C-35 -90 -10 -175 15 -212C85 -144 86 -64 0 0Z" fill={color}/></g>)}</svg>;}
function Media({t}:{t:number}){return <svg width={700} height={530} viewBox="0 0 700 530"><rect width={700} height={530} fill={C.pink}/><path d="M50 345L120 270L185 313L263 222L322 345Z" fill="#9E1D61"/><circle cx={100} cy={220} r={24} fill={C.cream}/><rect x={370} y={65} width={265} height={235} fill="#EA77B0"/><path d="M400 260V183H445V260M469 260V140H514V260M538 260V105H583V260" fill="#9E1D61"/>{Array.from({length:29},(_,i)=><rect key={i} x={52+i*21} y={420-(16+Math.sin(t*4+i*.8)*12)*(1+i%3)} width={10} height={(16+Math.sin(t*4+i*.8)*12)*(2+i%3)} fill="#9E1D61"/>)}</svg>;}
function Icon({kind,t}:{kind:number;t:number}){return <svg width={270} height={200} viewBox="0 0 270 200" fill="none" stroke={C.cream} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
 {kind===0?<><path d="M62 33H151L197 79V171H62Z"/><path d="M151 33V79H197M86 106H169M86 135H153"/></>:kind===1?<><rect x={104} y={24} width={62} height={102} rx={30}/><path d="M78 94V104A57 57 0 0 0 192 104V94M135 161V185M104 185H166"/>{[0,1,2].map(i=><path key={i} d={`M${45-i*14} ${80-i*8}V${130+i*8}`} opacity={.35+.35*Math.sin(t*4+i)**2}/>)}</>:<><rect x={34} y={36} width={202} height={135}/><path d="M111 75L162 105L111 135Z"/></>}
 </svg>;}
export function Card({i,t,u,styleScene,label,children}:{i:number;t:number;u:number;styleScene:boolean;label?:string;children?:React.ReactNode}){
 const p=ease((u-i*.12)/.6),exit=smooth((t-15.65)/.35),angle=[-8,5,-4][i]+Math.sin(t*1.1+i)*1.3;
 return <div style={{position:'absolute',left:175+i*535,top:380+[0,-30,25][i]+(1-p)*180+exit*450,width:500,height:425,background:[C.pink,C.blue,C.orange][i],transform:`rotate(${angle}deg) scale(${1-exit*.25})`,opacity:p*(1-exit),display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22}}>
 {children??(styleScene?<svg width={290} height={190} viewBox="0 0 290 190">{i===0?<><circle cx={145} cy={95} r={88} fill={C.orange}/><path d="M49 139L140 25L232 139Z" fill={C.green}/></>:i===1?<>{Array.from({length:5},(_,j)=><path key={j} d={`M0 ${40+j*28}Q75 ${j*28-15} 145 ${40+j*28}T290 ${40+j*28}`} fill="none" stroke={C.mint} strokeWidth={14}/>)}</>:<><rect x={40} y={20} width={210} height={150} fill={C.green} transform="rotate(-9 145 95)"/><circle cx={145} cy={95} r={62} fill={C.pink}/></>}</svg>:<Icon kind={i} t={t}/>)}
 <div style={{fontSize:label?fittedOgSize([label],440,70,42):styleScene?60:70,fontWeight:700,color:C.white}}>{label??(styleScene?['大胆一点','自由一点','鲜活一点'][i]:['文字','声音','画面'][i])}</div>
 </div>;
}
export function validateOg(c:OgConfig){let end=0;if(!c.brand||c.brand.length>12||!c.headline||c.headline.length>16)throw Error('OG品牌最多12字，短标题最多16字');if(c.materials)validateMaterials(c.materials);if(c.duration!==24||c.scenes.length!==6||!c.audio)throw Error('OG样片须为24秒六拍并有音轨');for(const s of c.scenes){if(s.start!==end||s.end-s.start!==4||!s.lines.length||s.lines.some(l=>l.length>12))throw Error('OG分镜时间或文案容量错误');end=s.end;}if(end!==24)throw Error('OG总时长错误');}
export const OgCollage:React.FC<{config?:OgConfig;audio?:boolean}>=({config,audio=true})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;if(!config)return null;const index=Math.min(5,Math.floor(t/4)),scene=config.scenes[index],u=t-scene.start,p=ease((u-.12)/.6),out=smooth((u-3.55)/.45),person=pose(t,seated),actor=pose(t,standing),panel=pose(t,pink),cardScene=index===2||index===3;
 const panelProgress=smooth((t-7.6)/.7)*(1-smooth((t-15.6)/.7)),intro=ease(t/.8),panelX=280+50*smooth((t-3.65)/.8)-50*smooth((t-7.65)/.8);
 return <AbsoluteFill style={{background:C.mint,fontFamily:FONT,overflow:'hidden'}}><FontGate text={JSON.stringify(config)}/>{audio?<Audio src={staticFile(config.audio)}/>:null}
 <div style={{position:'absolute',left:-200,top:-300,width:860,height:650,borderRadius:'50%',background:C.cream,transform:`rotate(${-20+t*.4}deg)`}}/>
 <div style={{position:'absolute',left:panel.x,top:panel.y,width:700,height:530,transform:`translateY(${(1-intro)*-500}px) rotate(${panel.r}deg) scale(${panel.s})`}}><Media t={t}/></div>
 <div style={{position:'absolute',left:1440,top:510,transform:`rotate(${-12+Math.sin(t)*2}deg)`}}><Leaves color={C.blue} t={t}/></div>
 <div style={{position:'absolute',left:person.x-(1-intro)*500,top:person.y,transformOrigin:'50% 80%',transform:`rotate(${person.r}deg) scale(${person.s})`}}><Person color={C.green} t={t}/></div>
 <div style={{position:'absolute',left:actor.x+(1-intro)*500,top:actor.y,transformOrigin:'50% 80%',transform:`rotate(${actor.r}deg) scale(${actor.s})`}}><Person standing color={C.orange} t={t}/></div>
 <div style={{position:'absolute',left:panelX,top:235,width:1380,height:550,background:C.green,transform:`translateY(${(1-intro)*130+panelProgress*650}px) rotate(${-3+Math.sin(t*.6)}deg)`,opacity:1-panelProgress}}/>
 {cardScene?<>{[0,1,2].map(i=><Card key={i} i={i} t={t} u={index===3?4+u:u} styleScene={index===3}/>)}</>:null}
 {index<2||index===4?<div style={{position:'absolute',left:index===1?490:440,top:310,width:1140,fontSize:150,lineHeight:1.4,fontWeight:800,color:C.white,transform:`translateY(${(1-p)*110-out*90}px)`,opacity:p*(1-out)}}>{scene.lines.map((line,i)=><div key={i}>{line}</div>)}</div>:null}
 {cardScene?<div style={{position:'absolute',left:150,top:142,width:1620,textAlign:'center',fontSize:118,fontWeight:800,color:C.green,transform:`translateY(${(1-p)*90}px)`,opacity:p*(1-out)}}>{scene.lines[0]}</div>:null}
 {index===5?<div style={{position:'absolute',left:300,top:310,width:1330,textAlign:'center',color:C.white,opacity:p,transform:`translateY(${(1-p)*100}px)`}}><div style={{fontSize:220,fontWeight:850,letterSpacing:-5,lineHeight:1.3}}>{config.brand}</div><div style={{fontSize:72,fontWeight:600,marginTop:32}}>{config.headline}</div></div>:null}
 <div style={{position:'absolute',left:-290,top:680,transform:'rotate(36deg) scale(.8)'}}><Leaves color={C.blue} t={t+.8}/></div>
 <div style={{position:'absolute',left:1460,top:840,width:180,height:170,background:C.orange,transform:`rotate(${12+Math.sin(t*1.3)*4}deg)`}}><svg width={180} height={170} viewBox="0 0 180 170"><path d="M38 70Q64 40 90 70T145 70M38 103Q64 73 90 103T145 103" fill="none" stroke={C.green} strokeWidth={8}/></svg></div>
 </AbsoluteFill>;
};
export const ogMetadata:CalculateMetadataFunction<{config?:OgConfig;audio?:boolean;episode?:string}>=async({props})=>{const config=await fetch(staticFile(`episodes/${props.episode??'og-collage'}/og.json`)).then(r=>r.json());if(props.episode&&props.episode!=='og-collage'&&!config.materials)config.materials={};validateOg(config);return {durationInFrames:720,width:1920,height:1080,props:{...props,config}};};
