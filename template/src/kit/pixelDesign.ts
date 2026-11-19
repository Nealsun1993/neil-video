import type {Format,Rect} from './layout';
import type {FlowCues} from './storyFlow';
export const PIXEL_FONT='"Workbench Pixel CN",monospace';
export const PIXEL_MONO='"Workbench Pixel Mono","Workbench Pixel CN",monospace';
export const PIXEL={bg:'#06070b',panel:'#111b2b',inset:'#0b1220',edge:'#344661',ink:'#eef0f4',muted:'#a0aec4',accent:'#ff7a1a',warm:'#ffcb86',ok:'#3ddc84'};
export const pixelEase=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const mixRect=(a:Rect,b:Rect,p:number):Rect=>({x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,w:a.w+(b.w-a.w)*p,h:a.h+(b.h-a.h)*p});
export function pixelLayout(format:Format,n:number){
 if(!Number.isInteger(n)||n<1||n>3)throw Error('pixel.story 当前支持1–3个模块');
 const portrait=format!=='landscape',is34=format==='3:4';
 const cards=Array.from({length:n},(_,i)=>is34?{x:44,y:186+i*38,w:182,h:30}:portrait?{x:44,y:262+i*44,w:182,h:32}:{x:Math.round(335-(n*68+(n-1)*12)/2+i*80),y:136,w:68,h:46});
 const targets=Array.from({length:n},(_,i)=>portrait?{x:Math.round(135-(n*60+(n-1)*5)/2+i*65),y:is34?204:282,w:60,h:60}:{...cards[i],y:128});
 return {portrait,is34,width:portrait?270:480,height:is34?360:portrait?480:270,frame:is34?{x:24,y:120,w:222,h:184}:portrait?{x:24,y:180,w:222,h:210}:{x:210,y:58,w:250,h:164},result:is34?{x:24,y:152,w:222,h:144}:portrait?{x:24,y:224,w:222,h:160}:{x:210,y:82,w:250,h:106},cards,targets};
}
export function pixelState(t:number,c:FlowCues,format:Format,items:{at:number}[],orchAt:number){
 const l=pixelLayout(format,items.length),p=pixelEase(t-c.liftAt);
 const appear=items.map((_,i)=>pixelEase((t-c.openAt-i*.12)/.4));
 const cards=l.cards.map((r,i)=>{const target=l.targets[i];const a=l.portrait?{x:(r.x+r.w/2-30)+(target.x-(r.x+r.w/2-30))*pixelEase((p-.3)/.25),y:r.y+(target.y-r.y)*pixelEase((p-.55)/.25),w:r.w+(60-r.w)*pixelEase(p/.3),h:r.h+(60-r.h)*pixelEase((p-.8)/.2)}:mixRect(r,target,p);if(l.portrait&&p<.3)a.x=r.x+(r.w-a.w)/2;return {...a,y:a.y+Math.round((1-appear[i])*6)}});
 return {layout:l,phase:t<c.openAt?'voice':t<c.boxAt?'modules':'result',progress:p,
  frame:mixRect(l.frame,l.result,p),cards,appear,contentAlpha:l.portrait?1-pixelEase(p/.12)+pixelEase((p-.85)/.15):1,geometry:cards.map(r=>pixelItemGeometry(r,l.portrait,p)),
  active:items.map(it=>t>=it.at),connected:items.map((_,i)=>t>=orchAt+.75+i*.14),
 };
}
export const pixelTyped=(line:string,t:number,at:number)=>[...line].slice(0,Math.max(0,Math.floor((t-at)/.075))).join('');

export function validatePixelProps(p:any){
 for(const phase of ['voice','modules','result']){
  const lines=p?.pixelLines?.[phase];
  if(!Array.isArray(lines)||lines.length<1||lines.length>2||lines.some((line:any)=>typeof line!=='string'||!line.trim()||[...line].reduce((n,ch)=>n+(ch.charCodeAt(0)<128?.5:1),0)>8))throw Error('pixel.story 每段需要1–2行像素标题，每行不超过8个汉字宽度');
 }
}

export function pixelItemGeometry(r:Rect,portrait:boolean,progress:number){
 const q=portrait?pixelEase(progress/.3):1, vertical=portrait?pixelEase((progress-.8)/.2):1;
 return {icon:{x:r.x+12*(1-q)+(r.w/2-8)*q,y:r.y+9*(1-q)+7*q},label:{x:r.x+38*(1-q),y:r.y+8*(1-vertical)+31*vertical,w:r.w-45*(1-q),h:portrait?12:9}};
}
