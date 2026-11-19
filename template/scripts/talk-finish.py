#!/usr/bin/env python3
"""口播版收尾：量成片响度，整体调到 -14.5 LUFS（真峰值不超过 -1 dBTP），画面不重新编码。
用法：python3 scripts/talk-finish.py <导出的.mp4> <交付的.mp4>"""
import json,subprocess,sys
src,dst=sys.argv[1:3]
def measure(p):
 e=subprocess.run(['ffmpeg','-hide_banner','-i',p,'-af','loudnorm=print_format=json','-f','null','-'],capture_output=True,text=True).stderr
 m=json.loads(e[e.rfind('{'):]);return float(m['input_i']),float(m['input_tp'])
i,tp=measure(src);gain=min(-14.5-i,-1-tp)
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-c:v','copy','-af',f'volume={gain:.2f}dB','-c:a','aac','-b:a','256k',dst],check=True)
i2,tp2=measure(dst);print(f'原始 {i:.1f} LUFS / {tp:.1f} dBTP，调整 {gain:+.1f} dB，交付 {i2:.1f} LUFS / {tp2:.1f} dBTP')
if not(-15<=i2<=-14 and tp2<=-1):sys.exit('响度不在 -15 到 -14 LUFS 之间：配音本身动态太大，需要回到配音环节处理')
