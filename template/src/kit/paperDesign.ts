export const PAPER={cream:'#FBF7EE',ink:'#2A3550',muted:'#5B6476',mint:'#DCEEE6',leaf:'#6DB85C',teal:'#2E8C7C',coral:'#F08A74',gold:'#EDB33F',lilac:'#ECE8F2'};
export type PaperScene={id:string;kind:string;start:number;end:number;lines:string[];highlight:number;note:string};
export type PaperStory={title:string;duration:number;format:'portrait';audio:string;scenes:PaperScene[];character?:PaperAsset | "original"};
export type PaperAsset={w:number;h:number;pad:number;src:string};
export const paperGuide:PaperAsset={w:112,h:200,pad:25,src:'paper-cutout/guide.svg'};
export const paperAt=(story:PaperStory,t:number)=>story.scenes.find(s=>t>=s.start&&t<s.end)??story.scenes.at(-1)!;
export const paperEase=(x:number)=>{const p=Math.max(0,Math.min(1,x));return 1-(1-p)**3;};
export const paperPop=(x:number)=>{const p=Math.max(0,Math.min(1,x));return Math.max(0,1+2.2*(p-1)**3+1.2*(p-1)**2);};
export function paperPlacement(asset:PaperAsset,x:number,bottom:number,h:number){const k=h/asset.h;return{left:x-(asset.w/2+asset.pad)*k,top:bottom-(asset.h+asset.pad)*k,width:(asset.w+2*asset.pad)*k,height:(asset.h+2*asset.pad)*k};}
export function validatePaper(story:PaperStory){let end=0;if(story.format!=='portrait'||!story.audio||story.duration<=0)throw Error('剪纸片需要竖屏、音轨和正时长');
 const character=story.character;
 if(character!==undefined&&character!=='original'&&(!character||typeof character.src!=='string'||!character.src||!/^[^:/\\]+(?:\/[^:/\\]+)*$/.test(character.src)||character.src.split('/').some(part=>part==='..'||part==='.')||![character.w,character.h].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(character.pad)||character.pad<0))throw Error('剪纸人物需要 public 下的素材路径、正宽高和非负留白');
 const kinds=new Set(['title','spark','words','rhythm','picture','steps','growth','meaning','end']);const ids=new Set();
 for(const s of story.scenes){if(s.start!==end||s.end<=s.start||!kinds.has(s.kind)||ids.has(s.id))throw Error('剪纸分镜需连续、唯一并使用支持的场景');if(!s.lines.length||s.lines.length>2||s.lines.some(x=>[...x].length>12))throw Error('剪纸标题每场1–2行，每行最多12字');ids.add(s.id);end=s.end;}
 if(end!==story.duration)throw Error('剪纸分镜总长不一致');
}

// Settle the camera as the sprout grows. Ground and standing props share the same plane.
export const paperGrowthCamera=(u:number)=>paperEase((u-.5)/2.8);
