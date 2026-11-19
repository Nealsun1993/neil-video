import{test}from'node:test';import assert from'node:assert/strict';import{existsSync,readFileSync}from'node:fs';
import{CLEAN_CAMERA,cameraAt,validateCleanLive}from'../src/kit/cleanLive';
const c=JSON.parse(readFileSync('public/clean-ui-workflow/live.json','utf8')),copy=()=>structuredClone(c);
test('纯白镜头：时间递增、起止回到全景、推近后画面不露出边界外的空白',()=>{for(const[name,keys]of Object.entries(CLEAN_CAMERA)){keys.forEach((k,i)=>{if(i)assert(k[0]>keys[i-1][0],name);assert(k[1]>=1&&k[1]<=2.6);});
 assert.deepEqual(keys[0].slice(1),[1,960,540]);assert.deepEqual(keys.at(-1)!.slice(1),[1,960,540]);
 for(let f=0;f<15*60;f++){const c=cameraAt(f/60,keys);assert(c.x-960/c.s>=-1&&c.x+960/c.s<=1921&&c.y-540/c.s>=-1&&c.y+540/c.s<=1081,`${name} ${f/60} ${JSON.stringify(c)}`);}}});
test('纯白镜头每个场景至少三次推近，镜头停留不超过3秒',()=>{for(const[name,keys]of Object.entries(CLEAN_CAMERA)){assert(keys.filter(k=>k[1]>1.05).length>=3,name);keys.forEach((k,i)=>{if(i&&k.slice(1).join()===keys[i-1].slice(1).join())assert(k[0]-keys[i-1][0]<=4.8,name);});}
});
test('纯白镜头版配置通过检查、素材存在；写错会报错',()=>{validateCleanLive(c);if(existsSync('public/clean-ui-workflow/media'))assert(existsSync('public/'+c.phone.src));assert(existsSync('public/'+c.audio));
 let x=copy();x.sample.keyword='这个关键词太长了';assert.throws(()=>validateCleanLive(x),/关键词/);
 x=copy();x.sample.after='工作台';assert.throws(()=>validateCleanLive(x),/错字和改字/);
 x=copy();x.phone.clipAt=33;assert.throws(()=>validateCleanLive(x),/不够长/);
 x=copy();x.search='小红书 模板';assert.throws(()=>validateCleanLive(x),/平台名/);});
