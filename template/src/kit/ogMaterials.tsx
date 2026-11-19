import React from 'react';
import {Img,staticFile} from 'remotion';
export const SLOT_NAMES=['listener','filmmaker','landscape','portrait','character','decoration'] as const;
export type SlotName=typeof SLOT_NAMES[number];
export type MaterialKind='waveform'|'frames'|'grid'|'orbit'|'image';
export type Material={kind:MaterialKind;src?:string};
export type MaterialSet={slots?:Partial<Record<SlotName,Material>>;cards?:{label:string;icon:'document'|'audio'|'play'|'grid'|'check'|'spark'}[];caption?:string;windowLabels?:[string,string]};
const DEFAULTS:Record<SlotName,Material>={listener:{kind:'waveform'},filmmaker:{kind:'frames'},landscape:{kind:'grid'},portrait:{kind:'frames'},character:{kind:'orbit'},decoration:{kind:'frames'}};
export function resolveMaterial(set:MaterialSet,slot:SlotName):Material{const m=set.slots?.[slot];return !m||(m.kind==='image'&&!m.src?.trim())?DEFAULTS[slot]:m;}
export function validateMaterials(set:MaterialSet){
 for(const [key,m]of Object.entries(set.slots??{})){
  if(!SLOT_NAMES.includes(key as SlotName)||!['waveform','frames','grid','orbit','image'].includes(m.kind))throw Error('OG素材槽位或类型无效');
  if(m.kind==='image'&&m.src&&(/^(?:\/|https?:)|\.\./.test(m.src)))throw Error('OG替换图须为public目录内的相对路径');
 }
 if(set.cards&&(set.cards.length!==3||set.cards.some(c=>!c.label||c.label.length>8||!['document','audio','play','grid','check','spark'].includes(c.icon))))throw Error('OG需要3张卡片，每张标签最多8字，图标使用素材库名称');
 if((set.caption?.length??0)>26||set.windowLabels?.some(l=>l.length>10))throw Error('OG辅助文案过长');
}
export function fittedOgSize(lines:string[],width:number,max:number,min=64){const units=Math.max(1,...lines.map(s=>Array.from(s).reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?1:.58),0)));return Math.max(min,Math.min(max,width*.93/units));}
export function MaterialIcon({name}:{name:string}){return <svg width={270} height={200} viewBox="0 0 270 200" fill="none" stroke="#F4EFDD" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
 {name==='document'?<><path d="M65 30H155L200 75V175H65Z"/><path d="M155 30V75H200M90 110H170M90 140H150"/></>:name==='audio'?<><rect x={104} y={25} width={62} height={100} rx={30}/><path d="M80 94V104A55 55 0 0 0 190 104V94M135 159V185M105 185H165"/></>:name==='play'?<><rect x={35} y={35} width={200} height={140}/><path d="M112 74L165 105L112 137Z"/></>:name==='grid'?<>{[0,1,2,3].map(i=><rect key={i} x={70+i%2*75} y={35+Math.floor(i/2)*75} width={55} height={55}/>)}</>:name==='check'?<><rect x={60} y={25} width={150} height={150} rx={10}/><path d="M90 103L122 132L180 70"/></>:<path d="M135 20L156 78L215 100L156 121L135 180L114 121L55 100L114 78Z"/>}
 </svg>;}
export function OgMaterial({material,t}:{material:Material;t:number}){
 if(material.kind==='image'&&material.src)return <Img src={staticFile(material.src)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>;
 return <svg width="100%" height="100%" viewBox="0 0 600 650" preserveAspectRatio="xMidYMid meet">
 {material.kind==='waveform'?<><circle cx={300} cy={315} r={245} fill="#FFC8B5"/>{Array.from({length:11},(_,i)=>{const h=65+(1+Math.sin(t*3+i*.75))*115;return <rect key={i} x={93+i*37} y={315-h/2} width={22} height={h} rx={11} fill={i%3===0?'#12251D':'#EF3E36'}/>})}</>:null}
 {material.kind==='frames'?<>{[0,1,2].map(i=><g key={i} transform={`translate(${90+i*35},${100+i*100}) rotate(${[-12,7,-4][i]+Math.sin(t+i)*2} 180 105)`}><rect width={360} height={210} fill={['#3155C8','#F192C6','#FF8248'][i]}/><path d="M155 66L224 106L155 146Z" fill="none" stroke="#F4EFDD" strokeWidth={8}/></g>)}</>:null}
 {material.kind==='grid'?<>{[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${45+i%2*260},${75+Math.floor(i/2)*180})`}><rect width={230} height={150} rx={6} fill={['#F192C6','#3155C8','#FF8248'][i%3]}/>{i%2?<circle cx={115} cy={75} r={40+Math.sin(t+i)*6} fill="#F4EFDD"/>:<path d="M40 113L115 35L190 113Z" fill="#12251D"/>}</g>)}</>:null}
 {material.kind==='orbit'?<g transform={`translate(300,325) rotate(${t*7})`}><circle r={180} fill="none" stroke="#3155C8" strokeWidth={55}/><rect x={-110} y={-110} width={220} height={220} fill="#FF8248" transform="rotate(25)"/><circle r={62} fill="#F192C6"/><circle cx={180} r={35} fill="#F4EFDD"/></g>:null}
 </svg>;
}
