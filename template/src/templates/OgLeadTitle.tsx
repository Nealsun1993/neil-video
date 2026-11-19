import React from 'react';
import {fittedOgSize} from '../kit/ogMaterials';

export function OgLeadTitle({lines,u,left,top,width,size,color,lineHeight}:{
 lines:string[];u:number;left:number;top:number;width:number;size:number;color:string;lineHeight:number;
}){
 const fontSize=fittedOgSize(lines,width,size);
 const fit=fittedOgSize(lines.slice(0,1),width,Math.round(fontSize*1.85),fontSize);
 const settle=ease((u-.15)/.9);
 const rest=ease((u-.66)/.5);
 const out=Math.min(1,Math.max(0,(u-3.55)/.45));
 return <div style={{position:'absolute',left,top,width,fontSize,color,lineHeight,fontWeight:850,letterSpacing:-2,opacity:1-out}}>
  <div style={{transformOrigin:'left center',transform:`scale(${1+(fit/fontSize-1)*(1-settle)})`}}>{lines[0]}</div>
  {lines.slice(1).map((line,i)=><div key={i} style={{opacity:rest,transform:`translateY(${(1-rest)*38}px)`}}>{line}</div>)}
 </div>;
}

function ease(value:number){
 const p=Math.min(1,Math.max(0,value));
 return 1-(1-p)**3;
}
