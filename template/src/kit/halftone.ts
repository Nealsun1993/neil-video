export type LaunchProof={heading:string;caption:string;portraitLabel:string;landscapeLabel:string;portrait?:string;landscape?:string;context?:string};
export type Launch={title:string;proof?:LaunchProof;duration:number;audio:string;thesis:string;surface:string;problem:string;ask:string;asks:string[];asksSource:string;reframe:string[];brand:string;url:string;beats:{id:string;start:number;end:number}[]};
export const HALFTONE={deep:'#071317',paper:'#F5EEDC',amber:'#DDB366',rasterA:'#4FC6A4',rasterB:'#39AAC1',lead:.1};
export const launchSmooth=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const states=[{x:0,y:0,scale:1,warm:0,dark:.12},{x:-300,y:0,scale:1.35,warm:0,dark:.16},{x:-670,y:0,scale:1.15,warm:0,dark:.38},{x:-680,y:0,scale:1.15,warm:.12,dark:.25},{x:-1040,y:0,scale:.88,warm:.17,dark:.08},{x:-1390,y:0,scale:1.05,warm:.04,dark:.62},{x:-1390,y:-190,scale:.95,warm:.14,dark:.12},{x:-1600,y:-190,scale:1,warm:0,dark:.12}];
export function fieldState(t:number,launch:Launch){const a={...states[0]};for(let i=1;i<states.length;i++){const q=launchSmooth((t-(launch.beats[i].start-HALFTONE.lead))/.7);for(const k of Object.keys(a)as(keyof typeof a)[])a[k]+=(states[i][k]-states[i-1][k])*q;}
 a.x-=t*6;
 if(t>=9.5&&t<12.6){const phase=(t-9.5)/3.1,fade=Math.sin(Math.PI*phase);a.x+=Math.sin(phase*Math.PI*16)*2.8*fade;a.y+=Math.sin(phase*Math.PI*12)*1.8*fade;}
 return a;
}
export const launchBeat=(t:number,l:Launch)=>l.beats.find(b=>t>=b.start&&t<b.end)??l.beats.at(-1)!;
export const launchEase=(x:number)=>{const p=Math.max(0,Math.min(1,x));return 1-(1-p)**3;};
export const askTimes=[0,.45,.85,1.19,1.46,1.65];
export function validateLaunch(l:Launch){let end=0;if(l.duration!==24||l.beats.length!==8||l.asks.length!==askTimes.length)throw Error('半调片需要24秒、8拍和6条真实请求');for(const b of l.beats){if(b.start!==end||b.end<=b.start)throw Error('半调节拍不连续');end=b.end;}if(end!==l.duration||!l.audio||!l.asksSource)throw Error('半调片缺少音轨或请求来源');if(l.thesis.length>34||l.problem.length>22||l.asks.some(a=>a.length>26))throw Error('半调文案超出容量');}

// Absolute-time deformation: seek-safe, no scene reset or accumulated simulation.
export function rippleDot(t:number,x:number,y:number){
 const wave=Math.sin(x*.006+y*.004-t*1.65);
 const crossing=Math.cos(x*.003-y*.008+t*.92);
 const swell=.5+.5*Math.sin(x*.002+y*.0015-t*.8);
 const power=(wave+1)*.5;
 return {x:x+Math.sin(y*.008-t*.8)*10,y:y+wave*12,
  radius:1.6+5.4*power*power+1.3*swell,
  alpha:.13+.36*power+.10*(crossing+1)*.5,cool:crossing>0};
}

export const genericProof:LaunchProof={heading:"同一内容，独立横竖构图。",caption:"版式示意",portraitLabel:"竖屏版式",landscapeLabel:"横屏版式"};
