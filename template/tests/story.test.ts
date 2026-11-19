import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyFlowLayout,storyFlowState,storyLaunchRect,validateStoryFlowProps} from '../src/kit/storyFlow';
import {PORTRAIT_STAGE,stageFor} from '../src/kit/layout';
import {prepareEpisode} from '../src/kit/timing';
const ep=JSON.parse(readFileSync('public/episodes/story-demo/episode.json','utf8')),p=ep.shots[0].props,c=p.cues;
for(const format of ['portrait','3:4','landscape'] as const){
 test(`${format}：窗口在退字后开始收束，结论在变形结束后出现`,()=>{
  const l=storyFlowLayout(format),a=storyFlowState(c.boxAt,c,format),b=storyFlowState(c.liftAt,c,format),end=storyFlowState(12,c,format);
  assert.equal(a.appOpacity,1);assert.equal(a.resultOpacity,0);assert.equal(b.appOpacity,0);assert.deepEqual(b.rect,l.window);
  assert.equal(storyFlowState(c.liftAt+.99,c,format).resultOpacity,0);assert.deepEqual(end.rect,l.result);assert.equal(end.resultOpacity,1);
  for(const t of [9.82,10,10.3,10.7,11]){const r=storyFlowState(t,c,format).rect;assert(Object.values(r).every(Number.isFinite));assert(r.w>0&&r.h>0);}
  const times=[12,2.3,10,9.52,12];assert.deepEqual(storyFlowState(times[0],c,format),storyFlowState(times[4],c,format));
  assert.equal(prepareEpisode(ep,format).shots[0].template,'story.flow');
 });
}
test('竖屏（9:16 与 3:4）启动卡片在舞台变换后仍与原卡片重合，且主底板无弹簧回弹',()=>{
 for(const fmt of ['portrait','3:4'] as const){
  const r=storyLaunchRect(fmt),k=storyFlowLayout(fmt).keyword,s=stageFor(fmt);
  assert(Math.abs(r.x*s.scale+s.x-k.x)<.001);assert(Math.abs(r.y*s.scale+s.y-k.y)<.001);assert(Math.abs(r.w*s.scale-k.w)<.001);
 }
 assert.equal(stageFor('portrait'),PORTRAIT_STAGE);
 assert(!/popUp/.test(readFileSync('src/templates/StoryFlow.tsx','utf8')),'StoryFlow 主底板不应使用欠阻尼回弹 popUp');
});
test('阻止动作重叠、未连接就给结论及过长标题',()=>{
 assert.doesNotThrow(()=>validateStoryFlowProps(p,0,13.5));
 for(const patch of [{cues:{...c,liftAt:c.boxAt}},{modules:{...p.modules,orchestrator:{...p.modules.orchestrator,at:9.4}}},{resultLines:['这是一条超过九个字的标题']}])assert.throws(()=>validateStoryFlowProps({...p,...patch},0,13.5),/story.flow/);
});

for(const format of ['portrait','3:4','landscape'] as const){
 test(`${format}：开窗保留关键词，两个交接点的底板和圆角连续`,()=>{
  const eps=1e-6;
  for(const at of [c.openAt,c.boxAt]){
   const before=storyFlowState(at-eps,c,format),after=storyFlowState(at+eps,c,format);
   assert(Math.max(...Object.keys(before.rect).map(k=>Math.abs(before.rect[k as keyof typeof before.rect]-after.rect[k as keyof typeof after.rect])))<.01);
   assert(Math.abs(before.radius-after.radius)<.01);
  }
  assert.equal(storyFlowState(c.openAt,c,format).keywordOpacity,1);
  assert(storyFlowState(c.openAt+1/30,c,format).keywordOpacity>.7);
  assert.equal(storyFlowState(c.openAt+.25,c,format).keywordOpacity,0);
 });
}
