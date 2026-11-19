import {pixelEase as E} from './pixelDesign';
export const PORTRAIT_WORLD={width:270,height:480,margin:18,captionY:402,mainBottom:382};
export const portraitHubNodes=[{x:20,y:112,w:66,h:22,name:'文案'},{x:102,y:112,w:66,h:22,name:'配音'},{x:184,y:112,w:66,h:22,name:'时间轴'},{x:20,y:317,w:66,h:22,name:'字幕'},{x:102,y:317,w:66,h:22,name:'横屏'},{x:184,y:317,w:66,h:22,name:'竖屏'}];
export function portraitCards(t:number){
 return Array.from({length:12},(_,i)=>{
  const z=120+((i*137-t*190)%1644+1644)%1644,scale=330/z,a=i%6/6*Math.PI*2+.1*Math.sin(t*.6);
  return {id:i,z,scale,x:135+Math.cos(a)*(145+i%3*18)*scale,y:230+Math.sin(a)*(225+i%2*20)*scale,rotate:(i%2?-1:1)*(3+i%4)};
 }).sort((a,b)=>b.z-a.z);
}
export function portraitNarrative(t:number,items:{at:number}[]){
 const open=E((t-3.4)/.9),gather=E((t-9.82)/1.5),vertical=E(gather/.45),horizontal=E((gather-.45)/.55);
 const starts=[{x:66,y:182},{x:204,y:182},{x:135,y:320}],targets=[{x:135,y:150},{x:135,y:240},{x:135,y:330}];
 return items.map((item,i)=>{const a=starts[i],b=targets[i],x=135+(a.x-135)*open,y=220+(a.y-220)*open;
  return {id:i,x:x+(b.x-x)*horizontal,y:y+(b.y-y)*vertical,scale:1-.1*gather,opacity:E((t-4.3-i*.12)/.35),active:t>=item.at,connected:t>=8.55+i*.14};
 });
}
