"""仅为 hybrid-demo 的首尾生成低密度节拍；正文留空，默认产品不添加配乐。"""
import math, wave, struct, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'public/episodes/hybrid-demo'
ep=json.loads((p/'episode.json').read_text());sr=24000
samples=[0.0]*round(ep['duration']*sr)
def add(start,duration,f):
 for j in range(round(duration*sr)):
  i=round(start*sr)+j
  if i<len(samples):samples[i]+=f(j/sr)
for start in [0, ep['shots'][-1]['start']]:
 for n in range(8):
  add(start+n*.5,.28,lambda t: .4*math.sin(2*math.pi*(48*t+2*(1-math.exp(-t*35))))*math.exp(-t*18))
  if n%2:add(start+n*.5,.12,lambda t:.08*(math.sin(2*math.pi*1379*t)+math.sin(2*math.pi*2113*t))*math.exp(-t*42))
 for hz in [110,130.81,164.81]:
  add(start,4,lambda t,hz=hz:.04*math.sin(2*math.pi*hz*t)*min(1,t/.1,(4-t)/.3))
peak=max(abs(x) for x in samples) or 1
with wave.open(str(p/'score.wav'),'wb') as out:
 out.setparams((1,2,sr,0,'NONE','not compressed'))
 out.writeframes(b''.join(struct.pack('<h',round(x/peak*26000)) for x in samples))
print(p/'score.wav')
