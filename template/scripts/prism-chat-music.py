"""30s original bed for PrismChat. Scene hits and message pops are read from public/prism-promo/chat.json."""
from pathlib import Path
import numpy as np,subprocess,wave,tempfile,json
root=Path(__file__).resolve().parents[1];cfg=json.loads((root/'public/prism-promo/chat.json').read_text())
D=int(cfg['duration']);sr=48000;n=D*sr;mix=np.zeros((n,2));rng=np.random.default_rng(11)
def add(at,v,pan=0):
 s=int(at*sr);c=min(len(v),n-s)
 if c>0:mix[s:s+c,0]+=v[:c]*(1-pan*.3);mix[s:s+c,1]+=v[:c]*(1+pan*.3)
def tone(at,midi,dur,amp,pan=0,decay=4.5):
 t=np.arange(int(dur*sr))/sr;f=440*2**((midi-69)/12);add(at,(np.sin(2*np.pi*f*t)+.15*np.sin(4*np.pi*f*t))*np.minimum(1,t/.008)*np.exp(-t*decay)*amp,pan)
def kick(at,amp):
 t=np.arange(int(.3*sr))/sr;f=46+85*np.exp(-t*30);add(at,np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*10)*amp)
def hat(at,amp,pan=0):
 t=np.arange(int(.045*sr))/sr;v=rng.normal(0,1,len(t));v=v-np.convolve(v,np.ones(6)/6,mode='same');add(at,v*np.exp(-t*120)*amp,pan)
def swell(at,amp):
 t=np.arange(int(.8*sr))/sr;v=rng.normal(0,1,len(t));v=np.convolve(v,np.ones(4)/4,mode='same');add(at,v*np.exp(-t*6)*amp);kick(at,amp*3.2)
scenes=cfg['scenes'];dark=[(s['start'],s['end']) for s in scenes if s.get('dark')]
chords=[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]]
for bar in range(D//2):
 c=chords[bar%4]
 for beat in range(4):
  sec=bar*2+beat*.5;quiet=any(a<=sec<b for a,b in dark)
  if sec<.9:continue
  if not quiet:kick(sec,.36)
  tone(sec,c[0],.5,.09 if not quiet else .05)
  if beat%2==0:tone(sec,c[2]+12,.9,.03,(-1)**bar*.4,3)
  for k in (0,.25):hat(sec+k,.04 if not quiet else .015,(-1)**int(k*4)*.5)
for s in scenes[1:]:swell(s['start'],.07)
pops=[s['start']+m['at'] for s in scenes for m in s.get('messages',[])]
for i,p in enumerate(pops):tone(p,76+(i%3)*3,.22,.05,(-1)**i*.4,14);tone(p+.07,83+(i%3)*3,.25,.035,(-1)**i*.4,12)
punch=next(s for s in scenes if s['kind']=='punch');step=(punch['end']-punch['start'])/len(punch['lines'])
for i in range(len(punch['lines'])):swell(punch['start']+i*step,.06);tone(punch['start']+i*step,57+i*4,1,.07,0,2.5)
tone(scenes[-1]['start'],69,1.5,.07,0,1.8);tone(scenes[-1]['start'],76,1.5,.045,.3,1.8)
t=np.arange(n)/sr;mix*=np.minimum(1,t/.05)[:,None]*np.clip((D-t)/1.2,0,1)[:,None]
out=root/'public'/cfg['audio']
with tempfile.TemporaryDirectory()as td:
 wav=Path(td)/'bed.wav'
 with wave.open(str(wav),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-14.8:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);s=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.8:TP=-2:LRA=12:measured_I={s['input_i']}:measured_TP={s['input_tp']}:measured_LRA={s['input_lra']}:measured_thresh={s['input_thresh']}:offset={s['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t',str(D),str(out)],check=True)
print(out)
