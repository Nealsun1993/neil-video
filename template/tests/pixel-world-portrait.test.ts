import{test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{portraitCards,portraitHubNodes,portraitNarrative,PORTRAIT_WORLD}from'../src/kit/pixelWorldPortrait';
const ep=JSON.parse(readFileSync('public/episodes/pixel-demo/episode.json','utf8')),items=ep.shots[0].props.modules.items;
test('竖屏像素世界使用270×480独立坐标，六向节点在上下两组内',()=>{
 assert.equal(PORTRAIT_WORLD.width*4,1080);assert.equal(PORTRAIT_WORLD.height*4,1920);
 portraitHubNodes.forEach((p,i)=>{assert(p.x>=18&&p.x+p.w<=252);assert(p.y>=100&&p.y+p.h<=340);portraitHubNodes.slice(i+1).forEach(b=>assert(p.x+p.w<=b.x||b.x+b.w<=p.x||p.y+p.h<=b.y||b.y+b.h<=p.y));});
});
test('竖屏叙事显现后卡片不相交、收束先分层再归中，保留配音词时间',()=>{
 for(let frame=0;frame<405;frame++){
  const cards=portraitNarrative(frame/30,items).filter(c=>c.opacity>.1);
  cards.forEach((c,i)=>{assert(c.x-30*c.scale>=18&&c.x+30*c.scale<=252&&c.y+31*c.scale<382);cards.slice(i+1).forEach(b=>assert(Math.abs(c.x-b.x)>=30*(c.scale+b.scale)||Math.abs(c.y-b.y)>=31*(c.scale+b.scale),JSON.stringify({frame,c,b})));});
 }
 assert.deepEqual(portraitNarrative(5.1,items).map(c=>c.active),[true,false,false]);assert.deepEqual(portraitNarrative(8.9,items).map(c=>c.connected),[true,true,true]);
});
test('纵向卡片隧道深度排序稳定，倒放返回相同画面状态',()=>{
 for(let frame=0;frame<135;frame++){
  const cards=portraitCards(frame/30);cards.forEach((c,i)=>{assert(c.z>=120&&c.scale<=2.75&&Number.isFinite(c.x+c.y));if(i)assert(cards[i-1].z>=c.z);});
 }
 const a=portraitCards(2);portraitCards(4);assert.deepEqual(portraitCards(2),a);
});
