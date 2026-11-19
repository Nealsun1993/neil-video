import React from 'react';
import {Img,staticFile} from 'remotion';

export function ProofLayer({src,opacity}:{src?:string;opacity:number}){
 const style={position:'absolute',inset:0,width:'100%',height:'100%',opacity} as const;
 if(src)return <Img src={staticFile(src)} style={{...style,objectFit:'contain'}}/>;
 return <svg style={{...style,background:'#102522'}} viewBox="0 0 300 220">
  <rect x="24" y="32" width="252" height="156" rx="8" fill="#173b34" stroke="#8fa59a"/>
  <path d="M24 61h252M115 61v127" stroke="#8fa59a"/>
  <path d="M42 46h8m8 0h8m8 0h8M42 85h47m-47 20h34m-34 20h42" stroke="#b4cbc6" strokeWidth="4"/>
  <path d="M134 133l20-12 18 12 22-39 19 52 18-30 24 13" stroke="#f1b775" strokeWidth="4" fill="none"/>
 </svg>;
}

export const proofWindow = {
 landscape: {left:1040,top:250,width:270,height:480},
 portrait: {left:325,top:590,width:430,height:764},
};

export function ProofCarry({time,portrait=false}:{time:number;portrait?:boolean}){
 if(time<-.55||time>=.6)return null;
 const box=proofWindow[portrait?'portrait':'landscape'];
 const extend=carryEase((time+.55)/.55);
 const fold=carryEase(time/.42);
 const height=box.height*fold;
 const y=box.top+(box.height-height)/2;
 const left=box.left+box.width*(1-extend)/2;
 const right=box.left+box.width*(1+extend)/2;
 return <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
  <path d={`M${left} ${y} H${right} V${y+height} H${left} V${y}`} fill="none"
   stroke="#DDB366" strokeWidth={3} opacity={extend*(1-carryEase((time-.42)/.18))}/>
 </svg>;
}

function carryEase(value:number){
 const p=Math.max(0,Math.min(1,value));
 return p*p*(3-2*p);
}
