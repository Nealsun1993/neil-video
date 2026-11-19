import {pixelEase as E} from './pixelDesign';
// Positive depth, bounded scale and stable IDs let the camera revisit any frame.
export function worldCards(t:number){
 return Array.from({length:12},(_,i)=>{
  const z=120+((i*137-t*190)%1644+1644)%1644;
  const scale=330/z,lane=i%6,angle=(lane/6*Math.PI*2)+.12*Math.sin(t*.6);
  const x=240+Math.cos(angle)*(250+(i%3)*45)*scale;
  const y=135+Math.sin(angle)*(125+(i%2)*15)*scale;
  return {id:i,z,scale,x,y,rotate:(i%2?-1:1)*(3+i%4)};
 }).sort((a,b)=>b.z-a.z);
}
export function worldNarrative(t:number,items:{at:number}[]){
 const unfold=E((t-3.4)/1.4),gather=E((t-9.82)/1.5);
 return items.map((it,i)=>({id:i,active:t>=it.at,opacity:E((t-3.4-i*.14)/.4),
  x:240+(-145+i*145)*unfold*(1-.18*gather),y:132+(i===1?-22:20)*unfold*(1-gather),
  connected:t>=8.55+i*.14,scale:1-.15*gather}));
}
export const worldHash=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
