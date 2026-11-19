import {test}from'node:test';
import assert from'node:assert/strict';
import {readFileSync}from'node:fs';
import {worldCards,worldNarrative}from'../src/kit/pixelWorld';
import {validatePromo,promoSceneAt}from'../src/kit/pixelPromo';
const world=JSON.parse(readFileSync('public/episodes/pixel-world/story.json','utf8'));
const old=JSON.parse(readFileSync('public/episodes/pixel-minute/story.json','utf8'));
const ep=JSON.parse(readFileSync('public/episodes/pixel-demo/episode.json','utf8'));
test('像素世界保留60秒音轨和已确认片尾，独立场景替代工作台演示',()=>{
 validatePromo(world);assert.equal(world.audio,old.audio);assert.deepEqual(world.scenes.at(-1),old.scenes.at(-1));
 assert.equal(promoSceneAt(world,16).kind,'narrative');assert(!world.scenes.some(s=>s.kind==='demo'||s.kind==='editor'));
 for(let frame=0;frame<1800;frame++){const t=frame/30,s=promoSceneAt(world,t);assert(t>=s.start&&t<s.end);}
});
test('卡片隧道可倒放，深度为正且每帧按远到近绘制',()=>{
 for(let f=0;f<135;f++){
  const c=worldCards(f/30);assert.equal(c.length,12);assert.equal(new Set(c.map(x=>x.id)).size,12);
  c.forEach((x,i)=>{assert(x.z>=120&&x.scale>0&&x.scale<=2.75&&Number.isFinite(x.x+x.y));if(i)assert(c[i-1].z>=x.z);});
 }
 const a=worldCards(2);worldCards(4);assert.deepEqual(worldCards(2),a);
});
test('重新编排保留真实配音中的模块激活与连接时间',()=>{
 const items=ep.shots[0].props.modules.items;
 assert.deepEqual(worldNarrative(5.1,items).map(x=>x.active),[true,false,false]);
 assert.deepEqual(worldNarrative(8.9,items).map(x=>x.connected),[true,true,true]);
 for(const at of [3.4,4.8,9.82,11.32]){const a=worldNarrative(at-1e-6,items),b=worldNarrative(at+1e-6,items);a.forEach((x,i)=>assert(Math.abs(x.x-b[i].x)<.01&&Math.abs(x.y-b[i].y)<.01));}
});
