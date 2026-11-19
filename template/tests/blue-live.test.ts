import{test}from'node:test';import assert from'node:assert/strict';import{existsSync,readFileSync}from'node:fs';
import{validateBlueLive,blueShots,BLUE_DURATION,shotsAt}from'../src/kit/blueLive';
const c=JSON.parse(readFileSync('public/blue-gallery/live.json','utf8')),copy=()=>structuredClone(c);
test('蓝光实片版段落无空档、片源长度够用、素材文件存在',()=>{validateBlueLive(c);const shots=blueShots(c);for(let f=0;f<BLUE_DURATION*60;f++)assert(shotsAt(f/60,shots).length>0,`${f/60}秒没有画面`);
 if(existsSync('public/blue-gallery/media'))for(const s of Object.values(c.sources) as any[])assert(existsSync('public/'+s.src),s.src);assert(existsSync('public/'+c.audio));assert(shots.every(s=>s.end>s.start));});
test('蓝光实片版配置写错会报错：文案过长、卡片数量不对、片源不够长、出现平台名',()=>{
 let x=copy();x.wall.features[0].lines[0]='这一行大字写得实在太长了';assert.throws(()=>validateBlueLive(x),/特写大字/);
 x=copy();x.wall.cards.pop();assert.throws(()=>validateBlueLive(x),/8张/);
 x=copy();x.media.story.at=12;assert.throws(()=>validateBlueLive(x),/片源不够长/);
 x=copy();x.formats.cards[0]='nothing';assert.throws(()=>validateBlueLive(x),/没登记/);
 x=copy();x.prompt.text='发到抖音';assert.throws(()=>validateBlueLive(x),/平台名/);});
