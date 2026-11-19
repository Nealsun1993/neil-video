"""24s original minimal electronic bed, one rise, subtle typing and cue ticks."""
from pathlib import Path
import numpy as np,subprocess,wave,tempfile,json
root=Path(__file__).resolve().parents[1];out=root/'public/episodes/halftone-launch';sr=48000;n=24*sr;mix=np.zeros((n,2));rng=np.random.default_rng(41)
def tone(at,midi,dur,amp,pan=0):
 start=int(at*sr);count=min(int(dur*sr),n-start);t=np.arange(count)/sr;f=440*2**((midi-69)/12)
 v=(np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t))*np.minimum(1,t/.01)*np.exp(-t*4.5)*amp
 mix[start:start+count,0]+=v*(1-pan*.3);mix[start:start+count,1]+=v*(1+pan*.3)
def tick(at,amp):
 start=int(at*sr);count=int(.045*sr);t=np.arange(count)/sr;v=rng.normal(0,1,count);v=np.convolve(v,np.ones(8)/8,mode='same')*np.exp(-t*95)*amp;mix[start:start+count]+=v[:,None]
chords=[[40,47,52,55],[36,43,48,52],[43,50,55,59],[38,45,50,54]]
for bar in range(12):
 at=bar*2;c=chords[bar%4]
 for beat in range(4):
  sec=at+beat*.5;lift=1.45 if 9.5<=sec<13 else .8 if 13<=sec<17.5 else 1
  tone(sec,c[0],.5,.10*lift)
  if beat%2==0:tone(sec,c[2]+12,.8,.026*lift,(-1)**bar*.4)
  if 9.5<=sec<13:tick(sec,.022)
for t in [7.2,7.32,7.47,7.63,7.82,8.02]:tick(t,.016)
for t in [9.6,10.05,10.45,10.79,11.06,11.25]:tick(t,.027)
tone(14.5,76,.24,.04,.2);tone(20.1,64,1.1,.04,-.2)
t=np.arange(n)/sr;mix*=np.minimum(1,t/.12)[:,None]*np.clip((24-t)/1.3,0,1)[:,None]
with tempfile.TemporaryDirectory()as td:
 wav=Path(td)/'bed.wav'
 with wave.open(str(wav),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-14.8:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);s=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.8:TP=-2:LRA=12:measured_I={s['input_i']}:measured_TP={s['input_tp']}:measured_LRA={s['input_lra']}:measured_thresh={s['input_thresh']}:offset={s['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t','24',str(out/'music.m4a')],check=True)
(out/'audio-source.json').write_text(json.dumps({'original':True,'duration':24,'bpm':120,'voice':False,'cueTimes':[7.2,7.32,7.47,7.63,7.82,8.02,9.6,10.05,10.45,10.79,11.06,11.25,14.5,20.1],'paidCalls':0},indent=2)+'\n');print(out/'music.m4a')
