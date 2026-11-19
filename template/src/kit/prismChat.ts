// 虹彩对话版：全片内容来自 public/prism-promo/chat.json。换一期只改配置和素材。
export type ChatMessage={at:number;from:'user'|'bench';time:string;text:string;typed?:boolean;media?:string;mediaAt?:number;list?:string[]};
export type ChatScene={kind:'logo'|'icons'|'headline'|'chat'|'window'|'punch';start:number;end:number;dark?:boolean;lines?:(string|string[])[];messages?:ChatMessage[];media?:string;title?:string};
export type ChatMedia={src:string;at:number;length:number};
export type PrismChatConfig={brand:string;handle:string;user:{name:string;initial:string};audio:string;duration:number;media:Record<string,ChatMedia>;scenes:ChatScene[]};
export const CHAT_FPS=60,CARD_W=1020,CHAT_TEXT=44;
export const sceneAt=(t:number,c:PrismChatConfig)=>c.scenes.find(s=>t>=s.start&&t<s.end)??c.scenes.at(-1)!;
// 暗场强度：进出各0.35秒，暗场是“中间黑、四角留虹彩”。
export function darkAt(t:number,c:PrismChatConfig){
 let v=0;for(const s of c.scenes)if(s.dark){const a=Math.min(1,Math.max(0,(t-s.start+.18)/.35)),b=Math.min(1,Math.max(0,(s.end+.18-t)/.35));v=Math.max(v,Math.min(a,b));}
 return v;
}
// 每条消息到达的绝对时间，配乐在这些时刻加提示音。
export const messageTimes=(c:PrismChatConfig)=>c.scenes.flatMap(s=>(s.messages??[]).map(m=>+(s.start+m.at).toFixed(3)));
export function validatePrismChat(c:PrismChatConfig){
 let end=0;for(const s of c.scenes){if(Math.abs(s.start-end)>1e-9||s.end<=s.start)throw Error(`虹彩对话版分段不连续：${s.kind}@${s.start}`);end=s.end;
  for(const m of s.messages??[]){if(m.at<0||m.at>s.end-s.start-.4)throw Error(`消息出现得太晚：${m.text}`);
   if(Array.from(m.text).length*CHAT_TEXT>CARD_W-190)throw Error(`消息超出一行：${m.text}`);
   if(m.media&&!c.media[m.media])throw Error(`缺少素材：${m.media}`);
   for(const item of m.list??[])if(Array.from(item).length>14)throw Error(`列表项过长：${item}`);}
  if(s.kind==='window'){const x=c.media[s.media??''];if(!x||x.at+(s.end-s.start)>x.length-.05)throw Error('窗口素材不够长');}
  if(s.kind==='headline'&&(s.lines??[]).some(l=>Array.from(l as string).length>6))throw Error('大标题每行最多6个字');
  if(s.kind==='punch'&&(s.lines??[]).some(l=>(l as string[]).join('').length>7))throw Error('结尾短句最多7个字');}
 if(Math.abs(end-c.duration)>1e-9)throw Error('虹彩对话版总长不符');
 if(c.scenes.every(s=>s.end-s.start<=4)===false)throw Error('单段不超过4秒');
}
