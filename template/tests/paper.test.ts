import{test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync,existsSync}from'node:fs';
import{paperAt,paperGuide,paperPlacement,paperPop,validatePaper}from'../src/kit/paperDesign';
const story=JSON.parse(readFileSync('public/episodes/paper-story/paper.json','utf8'));
const assets=JSON.parse(readFileSync('public/paper-cutout/manifest.json','utf8')).props;
test('剪纸样片45秒/1350帧连续，纸张、世界、步骤与片尾交替编排',()=>{
 validatePaper(story);assert.equal(story.duration,45);assert.equal(story.scenes.length,9);
 for(let frame=0;frame<1350;frame++){const t=frame/30,s=paperAt(story,t);assert(t>=s.start&&t<s.end);}
 assert(existsSync('public/'+story.audio));assert.equal(paperAt(story,39).kind,'end');
});
test('素材保留纸片内容底部锚点，滤镜留白不改变站立位置',()=>{
 for(const a of [...Object.values(assets),paperGuide] as typeof paperGuide[]){const r=paperPlacement(a,540,1480,420),k=420/a.h;assert.equal(r.left+(a.pad+a.w/2)*k,540);assert(Math.abs(r.top+(a.pad+a.h)*k-1480)<1e-8);assert(existsSync('public/'+a.src));}
 assert(Math.abs(paperPop(0))<1e-8);assert.equal(paperPop(1),1);for(let f=0;f<30;f++)assert(paperPop(f/30)>=0&&paperPop(f/30)<1.06);
});
test('剪纸配置拦截分镜间隙、重复ID和标题溢出',()=>{
 const gap=structuredClone(story);gap.scenes[1].start+=.1;assert.throws(()=>validatePaper(gap),/连续/);
 const dup=structuredClone(story);dup.scenes[1].id=dup.scenes[0].id;assert.throws(()=>validatePaper(dup),/唯一/);
 const text=structuredClone(story);text.scenes[0].lines=['这个标题非常长已经超过竖屏纸条的容量'];assert.throws(()=>validatePaper(text),/12字/);
});

test('通用纸偶可切换为原版或按期使用透明人物素材',()=>{
 validatePaper({...story,character:'original'});
 validatePaper({...story,character:paperGuide});
 assert.throws(()=>validatePaper({...story,character:{...paperGuide,src:'../guide.svg'}}),/素材路径/);
 assert.throws(()=>validatePaper({...story,character:{...paperGuide,h:0}}),/正宽高/);
});
