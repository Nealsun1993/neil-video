"""为示意动作生成低音量短提示；无 BGM，不改变输入配音。"""
import math,wave,struct,json
from pathlib import Path
p=Path(__file__).resolve().parent.parent/'public/episodes/story-demo'
ep=json.loads((p/'episode.json').read_text());props=ep['shots'][0]['props'];c=props['cues'];rate=48000
samples=[0.] * round(ep['duration']*rate)
def tone(at,hz,dur,gain):
 for i in range(round(dur*rate)):
  t=i/rate;n=round(at*rate)+i
  if n<len(samples):samples[n]+=gain*math.sin(2*math.pi*hz*t)*min(1,t/.008)*math.exp(-t*32)
for at in [c['at'],c['openAt']]+[i['at']-.12 for i in props['modules']['items']]:tone(at,440,.1,.13)
tone(props['modules']['orchestrator']['at']+.5,660,.14,.15)
for hz in [523.25,659.25,783.99]:tone(c['liftAt']+1,hz,.36,.08)
with wave.open(str(p/'actions.wav'),'wb') as f:
 f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767))for x in samples))
print(p/'actions.wav')
