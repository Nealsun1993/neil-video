import {test}from'node:test';
import assert from'node:assert/strict';
import {readFileSync}from'node:fs';
import {pixelLayout,pixelState,pixelTyped,validatePixelProps}from'../src/kit/pixelDesign';
import {prepareEpisode}from'../src/kit/timing';
const ep=JSON.parse(readFileSync('public/episodes/pixel-demo/episode.json','utf8'));
const story=JSON.parse(readFileSync('public/episodes/story-demo/episode.json','utf8'));
const p=ep.shots[0].props;
for(const format of ['portrait','3:4','landscape']as const){
 test(`${format}：像素画布按整数倍输出，1–3模块及文字在独立视口内`,()=>{
  for(const n of [1,2,3]){
   const layout=pixelLayout(format,n);
   assert.equal(layout.width*4,format==='landscape'?1920:1080);
   assert.equal(layout.height*4,format==='3:4'?1440:format==='portrait'?1920:1080);
   for(const t of [3.5,4,6,9.5,9.82,10.1,10.32,10.6,11,12]){
    const state=pixelState(t,p.cues,format,p.modules.items.slice(0,n),p.modules.orchestrator.at),f=state.frame;
    state.cards.forEach((r,i)=>{
     assert(r.x>=f.x&&r.y>=f.y&&r.x+r.w<=f.x+f.w&&r.y+r.h<=f.y+f.h,JSON.stringify({format,n,t,r,f}));
     const label=state.geometry[i].label;assert(label.x>=r.x&&label.y>=r.y&&label.x+label.w<=r.x+r.w+.00001&&label.y+label.h<=r.y+r.h+.00001);
    });
   }
  }
 });
 test(`${format}：模块激活/连接保留原时间，重排跨中点连续`,()=>{
  const state=(t:number)=>pixelState(t,p.cues,format,p.modules.items,p.modules.orchestrator.at);
  assert.deepEqual(state(5.1).active,[true,false,false]);assert.deepEqual(state(8.9).connected,[true,true,true]);
  const a=state(p.cues.liftAt+.5-1e-6),b=state(p.cues.liftAt+.5+1e-6);
  a.geometry.forEach((r,i)=>assert(Math.abs(r.label.x-b.geometry[i].label.x)<.01&&Math.abs(r.icon.x-b.geometry[i].icon.x)<.01));
  assert.deepEqual(state(12),state(12));assert.equal(prepareEpisode(ep,format).presentation,'pixel');
 });
}
test('像素版复用同一段口播和动作配置，长标题/错误组合会报错',()=>{
 assert.deepEqual(p.modules,story.shots[0].props.modules);assert.deepEqual(p.cues,story.shots[0].props.cues);
 assert.throws(()=>pixelLayout('portrait',4),/1–3/);
 assert.throws(()=>validatePixelProps({...p,pixelLines:{...p.pixelLines,voice:['这个标题太长了超过了当前容量']}}),/像素标题/);
 const bad=structuredClone(ep);bad.presentation='showcase';assert.throws(()=>prepareEpisode(bad),/presentation=pixel/);
});
test('像素打字按时间取字，支持倒退而不保留上一帧状态',()=>{
 assert.equal(pixelTyped('口播工作台',1,2),'');assert.equal(pixelTyped('口播工作台',3,2),'口播工作台');assert.equal(pixelTyped('口播工作台',2.075,2),'口');
});

test('竖屏（9:16 与 3:4）重排先收窄、横向分开再归拢，各帧模块不相交且像素画布无非整数缩放回弹',()=>{
 for(const fmt of ['portrait','3:4'] as const){
  for(let frame=0;frame<=30;frame++){
   const s=pixelState(p.cues.liftAt+frame/30,p.cues,fmt,p.modules.items,p.modules.orchestrator.at);
   s.cards.forEach((a,i)=>s.cards.slice(i+1).forEach(b=>assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,JSON.stringify({fmt,frame,a,b}))));
  }
 }
 assert(!/\.035/.test(readFileSync('src/templates/PixelStory.tsx','utf8')),'PixelStory 不应含 3.5% 非整数像素呼吸缩放');
});
