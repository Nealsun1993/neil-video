import {test}from'node:test';
import assert from'node:assert/strict';
import {readFileSync,existsSync}from'node:fs';
import {promoSceneAt,validatePromo}from'../src/kit/pixelPromo';
const story=JSON.parse(readFileSync('public/episodes/pixel-minute/story.json','utf8'));
test('一分钟像素片1800帧分镜连续且口播片段原速完整',()=>{
 validatePromo(story);for(let frame=0;frame<1800;frame++){const t=frame/30,s=promoSceneAt(story,t);assert(t>=s.start&&t<s.end);}
 const demo=story.scenes.find(s=>s.kind==='demo');assert.equal(demo.start,16);assert.equal(demo.end-demo.start,13.5);
 assert.equal(promoSceneAt(story,29.5).kind,'devices');assert(existsSync('public/'+story.audio));
});
test('分镜的空隙、重叠和错误总时长会被拦截',()=>{
 for(const d of [-.1,.1]){const bad=structuredClone(story);bad.scenes[1].start+=d;assert.throws(()=>validatePromo(bad),/连续/);}
 const bad=structuredClone(story);bad.duration=61;assert.throws(()=>validatePromo(bad),/60秒/);
});
