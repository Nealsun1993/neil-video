"""每秒画面运动量：10fps、160×90灰度相邻帧平均差。用法：python3 scripts/check-motion.py 成片.mp4 [参考片.mp4] [--min 1.0]
低于 --min 的秒视为“几乎静止”，有则退出码1。数值只用于同类片之间比较节奏，不是通用质量评分。"""
import sys,subprocess,numpy as np
def per_second(path):
 w,h=160,90;raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-vf',f'fps=10,scale={w}:{h},format=gray','-f','rawvideo','-'],capture_output=True,check=True).stdout
 a=np.frombuffer(raw,np.uint8).reshape(-1,h,w).astype(float);d=np.abs(np.diff(a,axis=0)).mean(axis=(1,2))
 return [float(d[i*10:(i+1)*10].mean()) for i in range(len(d)//10)]
args=[x for x in sys.argv[1:]];low=1.0
if '--min' in args:i=args.index('--min');low=float(args[i+1]);del args[i:i+2]
bad=False
for k,p in enumerate(args):
 v=per_second(p);still=[i for i,x in enumerate(v) if x<low]
 print(('成片' if k==0 else '参考'),p);print('  每秒:',' '.join(f'{x:4.1f}' for x in v));print(f'  平均 {np.mean(v):.2f}，低于{low}的秒：{still or "无"}')
 if k==0 and still:bad=True
sys.exit(1 if bad else 0)
