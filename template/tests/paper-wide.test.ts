import{test}from'node:test';
import assert from'node:assert/strict';
import{PAPER_WIDE as L}from'../src/kit/paperWide';
test('横屏剪纸步骤与插画使用独立横向几何，三张卡片互不相交',()=>{
 assert.deepEqual([L.width,L.height],[1920,1080]);
 for(const group of [L.stepCards,L.pictureCards])group.forEach((r,i)=>{assert(r.x>=80&&r.y>=440&&r.x+r.w<=1840&&r.y+r.h<=900);group.slice(i+1).forEach(b=>assert(r.x+r.w<=b.x||b.x+b.w<=r.x));});
 assert(L.titleLeft.x+L.titleLeft.w<1000);
});
