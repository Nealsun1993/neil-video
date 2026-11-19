import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {musicGainAt,talkAsset} from '../src/kit/talk';
import {buildSceneCamera,cameraAt,CLEAN_SCENES,cleanGeom,CleanTalkEpisode,focusEase,validateCleanTalk} from '../src/kit/cleanTalk';
import {cleanCardMetrics,cleanTalkMetadata} from '../src/templates/CleanTalk';

const demo=JSON.parse(readFileSync('public/episodes/clean-talk-demo/episode.json','utf8')) as CleanTalkEpisode;
const copy=()=>structuredClone(demo);

test('纯白口播版样片通过校验，真实配音/配乐/音效齐备且零外部 mp4 依赖',()=>{
 validateCleanTalk(demo);
 assert.equal(Object.keys(demo.sources??{}).length,0);
 for(const p of [demo.audio,demo.music!.src,demo.sfx!.src])assert(existsSync('public/'+talkAsset(demo,p)),p);
 for(const c of demo.captions)assert(demo.shots.some(s=>c.start>=s.start-.01&&c.start<s.end),c.text);
 assert.equal(new Set(demo.shots.map(s=>s.template)).size,7);
 assert(musicGainAt(demo,1.2)<demo.music!.volume!);
});

test('动态镜头引擎在横竖、5:8 与 3:4 画幅及弹性时长下严格递增且绝不露出画布外白边',()=>{
 for(const fmt of ['landscape','portrait','5:8','3:4'] as const){
  const g=cleanGeom(fmt);
  for(const shot of demo.shots){
   for(const d of [CLEAN_SCENES[shot.template].min,shot.end-shot.start,CLEAN_SCENES[shot.template].max]){
    const scaledShot={id:shot.id,template:shot.template,start:0,end:d,props:{...shot.props}};
    delete scaledShot.props.dropAt;delete scaledShot.props.resultAt;delete scaledShot.props.openAt;
    delete scaledShot.props.applyAt;delete scaledShot.props.switchAt;delete scaledShot.props.iconsAt;delete scaledShot.props.searchAt;
    if(scaledShot.props.items&&Array.isArray(scaledShot.props.items)&&typeof scaledShot.props.items[0]==='object'){
     scaledShot.props.items=scaledShot.props.items.map((x:any)=>({...x,at:undefined}));
    }
    const keys=buildSceneCamera(scaledShot,fmt);
    assert.deepEqual(keys[0],[0,1,g.cx,g.cy]);
    keys.forEach((k,i)=>{if(i){assert(k[0]>keys[i-1][0],`${fmt} ${shot.template} d=${d}`);assert(k[1]>=keys[i-1][1],`${fmt} ${shot.template} 出现倒走拉回`);}assert(k[1]>=1&&k[1]<=2.4);});
    for(let f=0;f<=Math.ceil(d*60);f++){
     const c=cameraAt(f/60,keys,g.w,g.h);
     assert(c.x-g.cx/c.s>=-.01&&c.x+g.cx/c.s<=g.w+.01,`${fmt} ${shot.template} x out of bounds`);
     assert(c.y-g.cy/c.s>=-.01&&c.y+g.cy/c.s<=g.h+.01,`${fmt} ${shot.template} y out of bounds`);
    }
   }
  }
 }
});

test('支持任意总时长、同场景连续复用、不等长长句校对与图片/视频/内置卡混排',async()=>{
 const x=copy();
 x.format='portrait';
 x.duration=14;
 x.sources={vid:{src:'/blue-gallery/media/clean.mp4',length:60}};
 x.clips={
  ...x.clips,
  shotImg:{kind:'image',src:'/episodes/demo/remotion.png',label:'页面截图'},
  shotVid:{src:'vid',at:4,label:'实机画面'},
 };
 x.captions=[{text:'支持任意时长与连续同场景组合',start:.4,end:3.2}];
 x.shots=[
  {id:'a1',template:'clean.chapter',start:0,end:2,props:{title:'第一部分'}},
  {id:'a2',template:'clean.chapter',start:2,end:4.2,props:{badge:'02',title:'连续章节也合法'}},
  {id:'a3',template:'clean.edit',start:4.2,end:7.4,props:{before:'只有两个字',after:'现在支持任意字数不等的完整短句替换'}},
  {id:'a4',template:'clean.board',start:7.4,end:11,props:{items:[{keyword:'截图',media:'shotImg'},{keyword:'视频',media:'shotVid',at:8.6}]}},
  {id:'a5',template:'clean.closing',start:11,end:14,props:{brand:'测试品牌'}},
 ];
 validateCleanTalk(x);
 const metaP=await cleanTalkMetadata({props:{episode:'clean-talk-demo',ep:x},defaultProps:{episode:'clean-talk-demo'},abortSignal:new AbortController().signal,compositionId:'CleanTalk',isRendering:false});
 assert.equal(metaP.width,1080);assert.equal(metaP.height,1920);assert.equal(metaP.durationInFrames,14*60);
 const metaL=await cleanTalkMetadata({props:{episode:'clean-talk-demo',ep:demo},defaultProps:{episode:'clean-talk-demo'},abortSignal:new AbortController().signal,compositionId:'CleanTalk',isRendering:false});
 assert.equal(metaL.width,1920);assert.equal(metaL.height,1080);assert.equal(metaL.durationInFrames,30*60);
});

test('纯白口播版拦截违禁平台词、链接、越界时间点与不连续镜头',()=>{
 let x=copy();x.shots[6].props.search='发到小红书';assert.throws(()=>validateCleanTalk(x),/平台名或链接/);
 x=copy();x.shots[3].props.result='开源地址 https://example.com';assert.throws(()=>validateCleanTalk(x),/平台名或链接/);
 x=copy();x.brand='bilibili工坊';assert.throws(()=>validateCleanTalk(x),/平台名或链接/);
 x=copy();x.shots[1].start=4.1;assert.throws(()=>validateCleanTalk(x),/镜头不连续/);
 x=copy();x.shots[1].end=4.5;x.shots[2].start=4.5;assert.throws(()=>validateCleanTalk(x),/至少要 1\.5 秒/);
 x=copy();x.shots[5].props.after=x.shots[5].props.before;assert.throws(()=>validateCleanTalk(x),/不能相同/);
 x=copy();x.shots[2].props.items[1].at=19;assert.throws(()=>validateCleanTalk(x),/不在这个镜头里/);
 x=copy();x.shots[0].props.icons=['unknown'];assert.throws(()=>validateCleanTalk(x),/未知图标/);
});

test('新建纯白口播源码不含写死的旧产品品牌或步骤名',()=>{
 for(const f of ['src/kit/cleanTalk.ts','src/templates/CleanTalk.tsx']){
  const src=readFileSync(f,'utf8');
  assert(!/口播工作台|导入口播/.test(src),`${f} 含有写死的旧品牌词`);
 }
});

test('竖屏推镜不裁切窗口与文字左右边缘，且手机预览卡多行要点与底栏永不重叠',()=>{
 const g=cleanGeom('portrait');
 for(const shot of demo.shots){
  const keys=buildSceneCamera(shot,'portrait'),d=shot.end-shot.start;
  for(let f=0;f<=Math.ceil(d*60);f++){
   const c=cameraAt(f/60,keys,g.w,g.h);
   const winLeft=g.cx+(g.win.x-c.x)*c.s,winRight=g.cx+(g.win.x+g.win.w-c.x)*c.s;
   const winTop=g.cy+(g.win.y-c.y)*c.s,winBottom=g.cy+(g.win.y+g.win.h-c.y)*c.s;
   assert(winLeft>=24&&winRight<=1056,`${shot.id} 竖屏推镜横向越界 [${winLeft.toFixed(1)}, ${winRight.toFixed(1)}]`);
   assert(winTop>=40&&winBottom<=1605,`${shot.id} 竖屏推镜纵向越界 [${winTop.toFixed(1)}, ${winBottom.toFixed(1)}]`);
  }
 }
 for(const [w,h] of [[398,790],[370,698],[444,592],[330,670],[720,405],[280,449]] as const){
  const m=cleanCardMetrics(w,h,4,true),gap=Math.max(10,Math.round(m.unit*.04));
  const used=m.pad*2+m.iconBox+(m.tall?Math.round(m.unit*.06):0)+Math.ceil(m.baseTitle*1.3*2)+4*(m.lPadY*2+Math.ceil(m.lSize*1.25)+2)+3*m.lGap+(Math.round(m.fSize*.76)+Math.ceil(m.fSize*1.4))+gap*3;
  assert(used<=h,`${w}x${h} 四条要点加底栏总高 ${used} 超出容器高度 ${h}`);
 }
 const src=readFileSync('src/templates/CleanTalk.tsx','utf8');
 assert.match(src,/footerPill=\{isCardMedia\?p\.caption:undefined\}/);
});

test('5:8 (1080x1728) 与 3:4 (1080x1440) 正常解析尺寸、窗口放大于视口内且推镜绝不碰撞字幕',async()=>{
 for(const [fmt,expH,maxBottom,compId] of [['5:8',1728,1500,'CleanTalk5x8'],['3:4',1440,1286,'CleanTalk3x4']] as const){
  const g=cleanGeom(fmt);
  assert.equal(g.w,1080);assert.equal(g.h,expH);
  const meta=await cleanTalkMetadata({props:{episode:'clean-talk-demo',ep:copy(),format:fmt},defaultProps:{episode:'clean-talk-demo'},abortSignal:new AbortController().signal,compositionId:compId,isRendering:false});
  assert.equal(meta.width,1080);assert.equal(meta.height,expH);
  for(const shot of demo.shots){
   const keys=buildSceneCamera(shot,fmt),d=shot.end-shot.start;
   for(let f=0;f<=Math.ceil(d*60);f++){
    const c=cameraAt(f/60,keys,g.w,g.h);
    const winLeft=g.cx+(g.win.x-c.x)*c.s,winRight=g.cx+(g.win.x+g.win.w-c.x)*c.s;
    const winTop=g.cy+(g.win.y-c.y)*c.s,winBottom=g.cy+(g.win.y+g.win.h-c.y)*c.s;
    assert(winLeft>=20&&winRight<=1060,`${shot.id} ${fmt} 横向越界 [${winLeft.toFixed(1)}, ${winRight.toFixed(1)}]`);
    assert(winTop>=20&&winBottom<=maxBottom,`${shot.id} ${fmt} 纵向越界或碰撞字幕 [${winTop.toFixed(1)}, ${winBottom.toFixed(1)}]`);
   }
  }
 }
});

test('三脚架去晃动契约：静态演示零往返震荡、重点特写零漂移驻留且弹窗层级严格隔离',()=>{
 // focusEase 单调无过冲
 let prev=0;
 for(let i=1;i<=100;i++){const cur=focusEase(i/100);assert(cur>=prev&&cur<=1,`focusEase 过冲或回退 at ${i}`);prev=cur;}
 for(const fmt of ['landscape','portrait','5:8','3:4'] as const){
  const g=cleanGeom(fmt);
  // board / preview / opening / chapter / closing 默认全程三脚架锁死 (scale=1, cx, cy)
  for(const id of ['s01','s02','s03','s05','s07']){
   const shot=demo.shots.find(s=>s.id===id)!;
   const keys=buildSceneCamera(shot,fmt),d=shot.end-shot.start;
   for(let f=0;f<=Math.ceil(d*60);f++){
    const c=cameraAt(f/60,keys,g.w,g.h);
    assert.equal(c.s,1,`${fmt} ${id} 默认应全程锁死 s=1`);
    assert.equal(c.x,g.cx);assert.equal(c.y,g.cy);
   }
  }
  // drop / edit 交互期完全静止，重点出现后单次单向推近并零漂移静止驻留至镜头结束（绝无倒走拉回，flips === 0）
  for(const id of ['s04','s06']){
   const shot=demo.shots.find(s=>s.id===id)!;
   const keys=buildSceneCamera(shot,fmt),d=shot.end-shot.start;
   let flips=0,dir=0,ps=1,holdFrames=0;
   const peak=Math.max(...keys.map(k=>k[1]));
   assert(peak>=1.09,`${fmt} ${id} 重点特写倍率应明确`);
   for(let f=1;f<=Math.ceil(d*60);f++){
    const c=cameraAt(f/60,keys,g.w,g.h),ds=c.s-ps;
    assert(ds>=-1e-6,`${fmt} ${id} f=${f} 出现倒走拉回 ds=${ds}`);
    if(Math.abs(c.s-peak)<1e-6)holdFrames++;
    const sg=ds>1e-5?1:ds<-1e-5?-1:0;
    if(sg!==0&&dir!==0&&sg!==dir)flips++;
    if(sg!==0)dir=sg;
    ps=c.s;
   }
   assert.equal(flips,0,`${fmt} ${id} 镜头出现方向翻转或倒走 flips=${flips}`);
   assert(holdFrames>=24,`${fmt} ${id} 重点特写缺少零漂移静止驻留段 holdFrames=${holdFrames}`);
   const muted=structuredClone(shot);muted.props.zoom=false;
   assert.equal(buildSceneCamera(muted,fmt).length,2);
  }
 }
 const tsx=readFileSync('src/templates/CleanTalk.tsx','utf8');
 assert(!/\*\s*\.01[24]/.test(tsx),'CleanTalk.tsx 仍残留线性持续微缩放蠕变');
 assert.match(tsx,/isolation:'isolate'/,'CleanWindow 必须隔离层叠上下文防止内部预览卡遮挡弹窗');
 assert.match(tsx,/zIndex:11/,'编辑弹窗必须显式高于遮罩与主窗口');
 assert.match(tsx,/defaultFit="contain"/,'PreviewScene 手机预览框静态图必须默认 contain 防横向裁切');
 const imgOk=copy();
 imgOk.clips={...imgOk.clips,guide:{kind:'image',src:'/episodes/demo/remotion.png',label:'指南截图',fit:'contain'}};
 imgOk.shots[4].props.media='guide';
 validateCleanTalk(imgOk);
 const imgBad=copy();
 imgBad.clips={...imgBad.clips,guide:{kind:'image',src:'/episodes/demo/remotion.png',label:'指南截图',fit:'stretch' as any}};
 imgBad.shots[4].props.media='guide';
 assert.throws(()=>validateCleanTalk(imgBad),/fit 仅支持 cover 或 contain/);
});
