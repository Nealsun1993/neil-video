import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareEpisode, resolveTime} from '../src/kit/timing';
import {layoutFor, PORTRAIT_STAGE, stageFor, showcaseItemRect} from '../src/kit/layout';
import {geometryFor, portraitPresentationCamera} from '../src/app/geom';
import {Modules} from '../src/app/pages/Modules';
import {Browser} from '../src/app/pages/Browser';
import {presentationColors, isShowcaseDesign} from '../src/kit/Presentation';
import {musicGainAt} from '../src/Episode';
import type {Episode} from '../src/kit/types';
const demo = JSON.parse(readFileSync('public/episodes/demo/episode.json', 'utf8')) as Episode;
const hybrid = JSON.parse(readFileSync('public/episodes/hybrid-demo/episode.json', 'utf8')) as Episode;

test('旧片默认竖屏，所有原始绝对时间与内容保持不变', () => {
  const before = JSON.stringify(demo), ep = prepareEpisode(demo);
  assert.equal(ep.format, 'portrait');
  ep.shots.forEach((s, i) => {const {__format, ...props} = s.props; assert.deepEqual(props, demo.shots[i].props);});
  assert.equal(JSON.stringify(demo), before);
  assert.deepEqual(layoutFor().app, {x:72,y:170,w:936,h:1210});
});
test('节拍锚点相对镜头，词锚点相对真实配音；空间坐标不被误改', () => {
  const ep = structuredClone(hybrid); ep._words = [['测试',1.25]];
  ep.shots[0].start=1; ep.shots[0].rhythm={mode:'beat',bpm:90};
  ep.shots[0].props={title:'演示',revealAt:{beat:3},items:[{title:'A',at:{beat:1},x:500}],pieces:[],pages:[{beat:2}]};
  ep.shots[1].props={title:'配音',revealAt:{word:0,offset:0.05}};
  delete ep.shots[2].props.launch;
  const result=prepareEpisode(ep);
  assert.equal(result.shots[0].props.revealAt,3); // revealAt below is also a timing field.
  assert.equal(result.shots[0].props.items[0].at,1+60/90);
  assert.equal(result.shots[0].props.items[0].x,500);
  assert.deepEqual(result.shots[0].props.pages,[1+120/90]);
  assert.equal(result.shots[1].props.revealAt,5.3);
});
test('错误模式、缺词、无效 BPM 与不支持的横屏模板明确报错', () => {
  const s=demo.shots[1];
  assert.throws(()=>resolveTime({beat:1},demo,s),/beat/);
  assert.throws(()=>resolveTime({word:0},demo,s),/_words/);
  const ep=structuredClone(hybrid); ep.shots[0].rhythm={mode:'beat',bpm:0};
  assert.throws(()=>prepareEpisode(ep),/BPM/);
  assert.throws(()=>prepareEpisode(demo,'landscape'),/orb/);
});
test('同一配置可以生成两种独立窗口几何', () => {
  const wide=prepareEpisode(hybrid,'landscape'), tall=prepareEpisode(hybrid,'portrait');
  assert.equal(wide.shots[2].props.__format,'landscape');
  assert.equal(tall.shots[2].props.__format,'portrait');
  assert(geometryFor('landscape').WIN.w > geometryFor().WIN.w);
  assert(geometryFor('landscape').WIN.h < geometryFor().WIN.h);
});
for (const format of ['portrait','3:4','landscape'] as const) {
 test(`${format}：模块行锚点互不重叠、点击落在按钮内、浏览器原文卡不出窗口`, () => {
  const ep=prepareEpisode(hybrid,format), shot=ep.shots.find(s=>s.template==='app.modules')!;
  const g=geometryFor(format), anchors=Modules.anchors!(shot), rows=Object.entries(anchors).filter(([k])=>k.startsWith('item:'));
  for(const [_,a] of rows){assert(a.rect[0]>=0&&a.rect[1]>=0&&a.rect[0]+a.rect[2]<=g.WIN.w&&a.rect[1]+a.rect[3]<=g.WIN.h);}
  for(const a of Modules.acts(shot)) assert(a.x>=0&&a.x<=g.WIN.w&&a.y>=0&&a.y<=g.WIN.h);
  const last=Modules.acts(shot).at(-1)!, orch=anchors.orchestrator.rect;
  assert(last.y>orch[1]&&last.y<orch[1]+orch[3]);
  const browser=ep.shots.find(s=>s.template==='app.browser')!, q=Browser.anchors!(browser).quote.rect;
  assert(q[0]>=0&&q[1]>=0&&q[0]+q[2]<=g.WIN.w&&q[1]+q[3]<=g.WIN.h);
 });
}
test('横屏六项清单分两列，承接与可见行使用同一组锚点', () => {
 const s=structuredClone(prepareEpisode(hybrid).shots[2]);
 s.props.items=[...s.props.items,...s.props.items.map((x:any,i:number)=>({...x,name:`额外${i}`}))];
 const rows=Object.entries(Modules.anchors!(s)).filter(([k])=>k.startsWith('item:')).map(([_,a])=>a.rect);
 for(let i=0;i<rows.length;i++) for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j];assert(a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1]);
 }
});
test('音乐为显式选项，讲解区压低、尾帧归零', () => {
 const ep=prepareEpisode(hybrid); delete ep.music; assert.equal(musicGainAt(ep,2),0);
 ep.music={src:'music.mp3',volume:.2,voiceVolume:.02};
 assert.equal(musicGainAt(ep,2),.2); assert.equal(musicGainAt(ep,8),.02);
 assert.equal(musicGainAt(ep,ep.duration),0);
});

test('展示卡片到工作台的启动锚点按画幅解析，错误引用被拦截', () => {
 const wide=prepareEpisode(hybrid,'landscape'), tall=prepareEpisode(hybrid,'portrait');
 assert.deepEqual(wide.shots[2].props.launch.from,[850,170,990,180]);
 const [x,y,w,h]=tall.shots[2].props.launch.from, r=showcaseItemRect('portrait',0,true), st=PORTRAIT_STAGE;
 assert(Math.abs(x*st.scale+st.x-r.x)<.001 && Math.abs(y*st.scale+st.y-r.y)<.001);
 assert(Math.abs(w*st.scale-r.w)<.001 && Math.abs(h*st.scale-r.h)<.001);
 const bad=structuredClone(hybrid);bad.shots[2].props.launch.from={showcaseItem:8};
 assert.throws(()=>prepareEpisode(bad),/上一镜/);
});

test('超出布局容量与非有限时间提前报错', () => {
 const ep=structuredClone(hybrid);
 ep.shots[2].props.items=Array.from({length:7},()=>ep.shots[2].props.items[0]);
 assert.throws(()=>prepareEpisode(ep),/六项/);
 const chapter=structuredClone(hybrid);chapter.shots[1].props.variant='chapter';
 assert.throws(()=>prepareEpisode(chapter),/chapter/);
 const invalid=structuredClone(hybrid);invalid.audioOffset=-1;
 assert.throws(()=>prepareEpisode(invalid),/audioOffset/);
 const s={...demo.shots[1],rhythm:{mode:'voice' as const}};
 assert.throws(()=>resolveTime({word:0,offset:NaN},{...demo,_words:[['词',1]]},s),/_words/);
});

test('展示设计按段落切换深浅底，原示例保留默认工作台设计', () => {
 assert.equal(isShowcaseDesign(demo),false);
 assert.equal(isShowcaseDesign(hybrid),true);
 assert.deepEqual(hybrid.shots.map(s=>!!s.dark),[true,false,false,true,false,true]);
 assert.notEqual(presentationColors(0).ink,presentationColors(1).ink);
 assert.equal(hybrid.shots[3].props.editorial.lines.length,2);
 assert.equal(prepareEpisode(hybrid,'portrait').presentation,'showcase');
});

test('竖屏展示区（3:4 与 9:16）与标题、字幕互不侵占，卡片锚点落在演示视口内', () => {
 for(const [fmt,maxBottom] of [['portrait',1720],['3:4',1292]] as const){
  const s=stageFor(fmt), l=layoutFor(fmt), win=l.app;
  if(fmt==='3:4'){assert.equal(l.width,1080);assert.equal(l.height,1440);}
  assert(win.y*s.scale+s.y >= s.top);
  assert((win.y+win.h)*s.scale+s.y < s.bottom);
  assert(s.bottom<maxBottom);
  const first=showcaseItemRect(fmt,0,true),last=showcaseItemRect(fmt,2,true);
  assert(first.y>=s.top && last.y+last.h<s.bottom);
  const tall=prepareEpisode(hybrid,fmt),[x,y,w,h]=tall.shots[2].props.launch.from;
  assert(Math.abs(x*s.scale+s.x-first.x)<.001 && Math.abs(y*s.scale+s.y-first.y)<.001);
  assert(Math.abs(w*s.scale-first.w)<.001 && Math.abs(h*s.scale-first.h)<.001);
 }
});

test('竖屏重点推镜三脚架锁死（零 3% 微颤）、保留窗口顶栏并给字幕留出空间', () => {
 const w=layoutFor('portrait').app, st=PORTRAIT_STAGE;
 for(const scale of [1,1.16,1.3,1.6]){
  const cam=portraitPresentationCamera({s:scale,tx:0,ty:-500});
  assert.equal(cam.s,1,'portraitPresentationCamera 必须消除 3% 微缩放震颤');
  assert(Math.abs(w.y*cam.s+cam.ty-w.y)<.001);
  assert((cam.ty+(w.y+w.h)*cam.s)*st.scale+st.y<st.bottom);
 }
});
