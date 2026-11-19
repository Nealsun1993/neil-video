import{test}from'node:test';import assert from'node:assert/strict';import{existsSync,readFileSync}from'node:fs';
import{validateTalk,musicGainAt,speakingAt,talkAsset,talkFormatDims,resolveTalkClip,BLUE_SCENES}from'../src/kit/talk';
import{bluePushRect,blueTalkMetadata}from'../src/templates/BlueTalk';
const load=(id:string)=>JSON.parse(readFileSync(`public/episodes/${id}/episode.json`,'utf8'));
const demo=load('blue-talk-demo'),copy=()=>structuredClone(demo);
test('口播版两期演示配置通过，配音、音乐和片源文件都在',()=>{for(const id of['blue-talk-demo','blue-talk-short']){const ep=load(id);validateTalk(ep);
 for(const p of[ep.audio,ep.music.src,...Object.values(ep.sources??{}).map((s:any)=>s.src)])assert(existsSync('public/'+talkAsset(ep,p)),p);}});
test('口播版镜头跟着配音：每条字幕都落在某个镜头里，按 at 出现的东西落在对应那句话附近',()=>{
 for(const c of demo.captions)assert(demo.shots.some((s:any)=>c.start>=s.start-.01&&c.start<s.end),c.text);
 const cues=demo.shots.flatMap((s:any)=>[...(s.props.cards??[]),...(s.props.styles??[]),...(s.props.items??[])].map((x:any)=>x.at).filter((x:any)=>typeof x==='number'));
 assert(cues.length>=6);for(const at of cues)assert(demo.captions.some((c:any)=>Math.abs(c.start-at)<.3),`at=${at} 附近没有字幕`);});
test('口播版音乐只是铺底：说话时压低，停顿和结尾抬起，首尾淡入淡出',()=>{
 const c=demo.captions[8],mid=(c.start+c.end)/2;assert.equal(speakingAt(demo,mid),1);assert(Math.abs(musicGainAt(demo,mid)-demo.music.voiceVolume)<1e-9);
 assert(Math.abs(musicGainAt(demo,28.5)-demo.music.volume)<1e-9);assert.equal(musicGainAt(demo,0),0);assert(musicGainAt(demo,demo.duration-.1)<.05);
 for(let f=1;f<demo.duration*60;f++)assert(Math.abs(musicGainAt(demo,f/60)-musicGainAt(demo,(f-1)/60))<.02,`${f/60}秒音量跳变`);
 const x=copy();delete x.music;assert.equal(musicGainAt(x,5),0);validateTalk(x);});
test('口播版写错会报错，并说明怎么改',()=>{
 let x=copy();x.shots[0].end=1;x.shots[1].start=1;assert.throws(()=>validateTalk(x),/\[s01\].*至少要 1\.5 秒.*合并/);
 x=copy();x.shots[4].template='blue.title';x.shots[4].props={lines:['真实页面']};x.shots[4].end=17.1;x.shots.splice(5,1);assert.throws(()=>validateTalk(x),/最多撑 5 秒.*拆成两个镜头/);
 x=copy();x.shots[3].template='blue.row';assert.throws(()=>validateTalk(x),/连续两个镜头/);
 x=copy();x.shots[1].template='TODO';assert.throws(()=>validateTalk(x),/没有这个场景.*blue\.title/);
 x=copy();x.shots[2].start=6.3;assert.throws(()=>validateTalk(x),/镜头不连续/);
 x=copy();x.shots[2].props.cards[1].at=9;assert.throws(()=>validateTalk(x),/不在这个镜头里/);
 x=copy();x.shots[1].props.items[0].lines[0]='这一行大字写得实在是太长了';assert.throws(()=>validateTalk(x),/特写大字每行/);
 x=copy();x.shots[4].props.media='nothing';assert.throws(()=>validateTalk(x),/没登记/);
 x=copy();x.sources={storyVid:{src:'/blue-gallery/media/story.mp4',length:13.45}};x.clips.story={src:'storyVid',at:12,label:'连续叙事'};assert.throws(()=>validateTalk(x),/片源不够长/);
 x=copy();x.shots[8].props.title='发到小红书';assert.throws(()=>validateTalk(x),/平台名/);
 x=copy();x.shots.at(-1).end=29;assert.throws(()=>validateTalk(x),/对不上/);});
test('每个场景都有时长范围，最短不少于1.5秒',()=>{for(const[k,s]of Object.entries(BLUE_SCENES))assert(s.min>=1.5&&s.max>s.min&&s.max<=10,k);});

test('蓝光口播版支持竖屏画幅、零视频卡片/图片回退与自定义编辑器标签',async()=>{
 const x=copy();
 x.format='portrait';
 delete x.sources;
 x.clips={
  cardA:{kind:'card',label:'定选题',title:'四个受众方向',lines:['追问真实经历','一屏出标题开头']},
  cardB:{kind:'card',label:'去机器味',title:'还原真人语气',lines:['洗掉生硬排比']},
  imgC:{kind:'image',src:'/episodes/demo/remotion.png',label:'实际页面'},
 };
 x.shots=[
  {id:'p1',template:'blue.title',start:0,end:3,props:{kicker:'竖屏测试',lines:['零视频也能出片']}},
  {id:'p2',template:'blue.feature',start:3,end:7,props:{items:[{media:'cardA',lines:['先定选题，','再出标题。']},{media:'imgC',at:5,lines:['支持截图，','免录屏。']}]}},
  {id:'p3',template:'blue.editor',start:7,end:12,props:{window:'文案改造台',heading:'当前工序',styleLabel:'模块',styles:[{name:'定选题',media:'cardA'},{name:'去机器味',media:'cardB',at:9.2}],fields:[['画幅','9:16'],['素材','内置卡']]}},
  {id:'p4',template:'blue.outro',start:12,end:15,props:{title:'竖屏直接交付'}},
 ];
 x.duration=15;x.captions=[{text:'零视频也能直接出竖屏口播片',start:.5,end:4.2}];
 validateTalk(x);
 assert.equal(resolveTalkClip(x,'cardA')?.kind,'card');
 assert.equal(resolveTalkClip(x,'imgC')?.kind,'image');
 const metaP=await blueTalkMetadata({props:{episode:'custom',ep:x},defaultProps:{episode:'custom'},abortSignal:new AbortController().signal,compositionId:'BlueTalk',isRendering:false});
 assert.equal(metaP.width,1080);assert.equal(metaP.height,1920);
 const metaL=await blueTalkMetadata({props:{episode:'custom',ep:demo},defaultProps:{episode:'custom'},abortSignal:new AbortController().signal,compositionId:'BlueTalk',isRendering:false});
 assert.equal(metaL.width,1920);assert.equal(metaL.height,1080);

 for(const d of [2.5,5,8]){
  for(let f=0;f<=Math.ceil((d+.3)*60);f++){
   const r=bluePushRect(f/60,d,true);
   assert(r.left>=24&&r.left+r.w<=1056,`blue.push 竖屏横向越界 [${r.left}, ${r.left+r.w}]`);
   assert(r.top>=80&&r.top+r.h<=1500,`blue.push 竖屏纵向越界 [${r.top}, ${r.top+r.h}]`);
   assert(r.w/r.h>=1.45&&r.w/r.h<=1.65,`blue.push 竖屏比例异常 ${r.w/r.h}`);
  }
 }
});

test('蓝光口播版支持 3:4 (1080x1440) 主推竖屏，且全画幅清除持续漂移、正弦摇摆与缩放蠕变',async()=>{
 const x=copy();
 x.format='3:4';
 validateTalk(x);
 assert.deepEqual(talkFormatDims('3:4'),{w:1080,h:1440});
 const meta34=await blueTalkMetadata({props:{episode:'blue-talk-demo',ep:x},defaultProps:{episode:'blue-talk-demo'},abortSignal:new AbortController().signal,compositionId:'BlueTalk3x4',isRendering:false});
 assert.equal(meta34.width,1080);assert.equal(meta34.height,1440);

 for(const fmt of ['3:4','portrait','landscape'] as const){
  for(const d of [2.5,5,8]){
   let prevW=0;
   for(let f=0;f<=Math.ceil((d+.3)*60);f++){
    const r=bluePushRect(f/60,d,fmt);
    assert(r.w>=prevW-1e-6,`blue.push ${fmt} 出现倒走拉回`);
    prevW=r.w;
    if(fmt==='3:4'){
     assert(r.left>=24&&r.left+r.w<=1056,`blue.push 3:4 横向越界 [${r.left}, ${r.left+r.w}]`);
     assert(r.top>=80&&r.top+r.h<=1240,`blue.push 3:4 纵向碰撞字幕 [${r.top}, ${r.top+r.h}]`);
    }
   }
   const settledA=bluePushRect(1.1,d,fmt),settledB=bluePushRect(d,d,fmt);
   assert.deepEqual(settledA,settledB,`blue.push ${fmt} 推近到位后仍持续漂移或微爬`);
  }
 }
 const tsx=readFileSync('src/templates/BlueTalk.tsx','utf8');
 assert(!/sway|drift|live\*|1\+u\*/.test(tsx),'BlueTalk.tsx 仍残留漂移、剪刀摇摆或线性缩放蠕变');
});
