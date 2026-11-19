"""Original continuous soft instrumental, 45s / 80 BPM. No paid service, voice or SFX."""
from pathlib import Path
import numpy as np,subprocess,wave,tempfile,json
root=Path(__file__).resolve().parents[1];out=root/'public/episodes/paper-story';sr=48000;seconds=45
mix=np.zeros((sr*seconds,2));rng=np.random.default_rng(29)
def note(at,midi,dur,amp,kind='pluck',pan=0):
 n=min(int(dur*sr),len(mix)-int(at*sr));t=np.arange(n)/sr;f=440*2**((midi-69)/12)
 if kind=='pad':v=(np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t))*np.minimum(1,t/.45)*np.minimum(1,(dur-t)/.6)*.5
 else:
  # Rounded, damped harmonics give a gentle plucked-string colour.
  v=sum((1/k**1.8)*np.sin(2*np.pi*f*k*t+(.15 if k%2 else 0))*np.exp(-t*(1.7+k*.7)) for k in range(1,5))*np.minimum(1,t/.009)*np.minimum(1,(dur-t)/.1)
 i=int(at*sr);mix[i:i+n,0]+=v*amp*(1-pan*.25);mix[i:i+n,1]+=v*amp*(1+pan*.25)
chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]]
for bar in range(15):
 at=bar*3;ch=chords[bar%4]
 for m in ch:note(at,m,3.4,.023,'pad')
 for b in range(4):
  note(at+b*.75,ch[[0,2,1,3][b]],1.8,.11,'pluck',(-1)**b*.5)
 if bar%2==0:
  for b in [0,2]:note(at+b*.75,ch[2]+12,1.6,.027,'pluck',.35)
t=np.arange(len(mix))/sr;mix*=np.minimum(1,t/.5)[:,None]*np.clip((45-t)/2.3,0,1)[:,None]
with tempfile.TemporaryDirectory() as td:
 wav=Path(td)/'paper.wav'
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-14.8:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);stats=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.8:TP=-2:LRA=12:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t','45',str(out/'music.m4a')],check=True)
(out/'music-source.json').write_text(json.dumps({'kind':'original local instrumental','bpm':80,'duration':45,'voice':False,'soundEffects':False,'paidCalls':0,'inputStats':stats},ensure_ascii=False,indent=2)+'\n')
print(out/'music.m4a')
