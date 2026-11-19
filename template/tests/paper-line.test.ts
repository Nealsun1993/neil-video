import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{validatePaperLine,lineSchedule,lineLayout,paperScenes,LINE}from'../src/kit/paperLine';
const c=JSON.parse(readFileSync('public/paper-line/line.json','utf8'));
test('纸感排印：打字时间递增，段落连续到总时长',()=>{validatePaperLine(c);const s=lineSchedule(c);s.forEach((x,i)=>{assert(x.typed>x.start&&x.end>=x.typed);if(i)assert.equal(x.start,s[i-1].end);});
 const sc=paperScenes(c);sc.forEach((x,i)=>{if(i)assert.equal(x.start,sc[i-1].end);assert(x.end>x.start);});assert.equal(sc.at(-1)!.end,c.duration);});
test('镜头始终跟着光标：光标不出画，滚动不回退',()=>{let prev=0;const end=lineSchedule(c).at(-1)!.end;for(let f=Math.round(c.timing.lineAt*60);f<end*60;f++){const l=lineLayout(c,f/60),x=LINE.left+l.caret-l.scroll;assert(x>=LINE.left-1&&x<=LINE.caret+1,`${f/60} ${x}`);assert(l.scroll>=prev-1e-6,`${f/60}`);prev=l.scroll;}});
test('每个带样式的词在变形时把后文平滑推开，没有跳变',()=>{const end=lineSchedule(c).at(-1)!.end;let last=lineLayout(c,c.timing.lineAt).caret;for(let f=Math.round(c.timing.lineAt*60)+1;f<end*60;f++){const v=lineLayout(c,f/60).caret;assert(v-last<LINE.size*1.05&&v>=last-1e-6,`${f/60}`);last=v;}});
test('文案不出现平台名和仓库地址',()=>assert(!/github|gitee|抖音|小红书|douyin|bilibili|B站/i.test(JSON.stringify(c))));
