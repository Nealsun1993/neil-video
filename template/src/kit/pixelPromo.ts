export type PromoScene={start:number;end:number;kind:string;label:string;title:string;accent:string;detail:string};
export type PromoStory={title:string;duration:number;audio:string;scenes:PromoScene[]};
export const promoSceneAt=(story:PromoStory,t:number)=>story.scenes.find(s=>t>=s.start&&t<s.end)??story.scenes[story.scenes.length-1];
export function validatePromo(story:PromoStory){
 if(story.duration!==60||!story.audio||!story.scenes.length)throw Error('一分钟像素片需要60秒和音轨');
 let end=0;
 for(const s of story.scenes){if(s.start!==end||s.end<=s.start||!s.title||!s.accent)throw Error('分镜必须连续且有标题');end=s.end;}
 if(end!==story.duration)throw Error('分镜长度与全片不一致');
}
