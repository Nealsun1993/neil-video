// 纯白镜头版：示例文案、手机里的竖屏成片、结尾搜索词来自 public/clean-ui-workflow/live.json。
// 场景时间和镜头跟着配乐与界面位置走，固定在这里；换一期只改配置和素材。
export type CleanLiveConfig={audio:string;sample:{project:string;fileName:string;prefix:string;before:string;after:string;cue:string;keyword:string};
 phone:{src:string;clipAt:number;length:number;formats:[string,string][]};search:string};
// 手机在导出场景第12.5秒出现，到场景结束共2.5秒。
export const CLEAN_LIVE={phoneAt:12.5,phoneShown:2.5};
const LIMITS:[string,(c:CleanLiveConfig)=>string[],number][]=[
 ['项目名',c=>[c.sample.project],6],['文件名',c=>[c.sample.fileName],12],['字幕前半句',c=>[c.sample.prefix],10],['错字和改字',c=>[c.sample.before,c.sample.after],2],
 ['提示语',c=>[c.sample.cue],12],['关键词',c=>[c.sample.keyword],6],['规格标签',c=>c.phone.formats.flat(),11],['搜索词',c=>[c.search],10],
];
export function validateCleanLive(c:CleanLiveConfig){
 for(const[name,get,max]of LIMITS)for(const s of get(c)){const n=Array.from(s).length;if(!n||n>max)throw Error(`${name}要1到${max}个字：${s}`);}
 if(Array.from(c.sample.before).length!==Array.from(c.sample.after).length||c.sample.before===c.sample.after)throw Error('错字和改字要字数相同、内容不同');
 if(c.phone.formats.length!==2)throw Error('规格标签要正好2个');
 if(c.phone.clipAt<0||c.phone.clipAt+CLEAN_LIVE.phoneShown>c.phone.length-.05)throw Error('手机里的竖屏成片不够长');
 if(/github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i.test(JSON.stringify([c.sample,c.phone.formats,c.search])))throw Error('文案里不能出现平台名或链接');
}
// 镜头关键帧：[场景内秒数, 放大倍数, 画面中心x, 画面中心y]。相邻两帧之间平滑过渡，数值相同即停留。
export type CameraKey=[number,number,number,number];
export const CLEAN_CAMERA:Record<'import'|'proof'|'picture'|'export',CameraKey[]>={
 // 跟着拖拽 → 落进导入区 → 推到识别出的文稿 → 拉回
 import:[[2.2,1,960,540],[3.2,1.25,1040,480],[5.1,1.5,960,500],[7.3,1.68,960,520],[8.3,1.85,820,775],[9.7,1.98,880,795],[10.5,1,960,540]],
 // 校对场景自带弹窗推近，这里只加缓慢推进，避免长时间停住
 proof:[[1.9,1,960,540],[3.5,1.08,960,530],[8,1.16,960,530],[9,1.2,960,560],[10.2,1.28,960,560],[10.8,1,960,540]],
 // 推到被选中的关键词 → 跟到展开的画面卡 → 跟到落进时间轴 → 拉回
 picture:[[2.2,1,960,540],[3.2,1.85,660,480],[4.4,1.98,680,480],[5.5,1.55,1010,520],[8.2,1.72,1010,540],[9.8,1.68,780,750],[11.4,1.78,940,770],[12.8,1,960,540]],
 // 预览区 → 孤立放大“导出视频”按钮 → 导出弹窗 → 拉回
 export:[[2.3,1,960,540],[3.3,1.4,960,600],[8,1.62,960,610],[9.05,2.5,1440,280],[9.45,2.5,1440,280],[10.1,1.6,960,460],[12.2,1.78,960,460],[13,1,960,540]],
};
const smooth=(p:number)=>{const q=Math.max(0,Math.min(1,p));return q*q*(3-2*q);};
export function cameraAt(t:number,keys:CameraKey[]){
 if(t<=keys[0][0])return {s:keys[0][1],x:keys[0][2],y:keys[0][3]};
 for(let i=1;i<keys.length;i++)if(t<keys[i][0]){const a=keys[i-1],b=keys[i],q=smooth((t-a[0])/(b[0]-a[0]));return {s:a[1]+(b[1]-a[1])*q,x:a[2]+(b[2]-a[2])*q,y:a[3]+(b[3]-a[3])*q};}
 const z=keys.at(-1)!;return {s:z[1],x:z[2],y:z[3]};
}
