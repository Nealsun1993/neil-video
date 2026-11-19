import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
import{validatePrismChat,darkAt,messageTimes,sceneAt}from'../src/kit/prismChat';
const c=JSON.parse(readFileSync('public/prism-promo/chat.json','utf8'));
test('虹彩对话版分段连续、消息放得下、素材存在',()=>{validatePrismChat(c);if(existsSync('public/prism-promo/media'))for(const m of Object.values(c.media) as any[])assert(existsSync('public/'+m.src),m.src);});
test('虹彩底场大部分时间可见，暗场只在配置标记的段落',()=>{let dark=0;for(let f=0;f<c.duration*60;f++){const t=f/60,v=darkAt(t,c);assert(v>=0&&v<=1);if(v>.5){dark++;assert(sceneAt(Math.min(c.duration-.01,Math.max(0,t)),c).dark||v<1,`${t}`);}}assert(dark/(c.duration*60)<.4);});
test('每条消息都有到达时间，文案不出现平台名和仓库地址',()=>{const times=messageTimes(c);assert(times.length>=8);times.forEach((t:number,i:number)=>{if(i)assert(t>times[i-1]);});assert(!/github|gitee|抖音|小红书|douyin|bilibili|B站/i.test(JSON.stringify(c)));});
