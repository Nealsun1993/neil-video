"""Original bed for PaperLine. Typing ticks, style chimes and section changes are computed from public/paper-line/line.json."""
from pathlib import Path
import numpy as np,subprocess,wave,tempfile,json
root=Path(__file__).resolve().parents[1];cfg=json.loads((root/'public/paper-line/line.json').read_text());T=cfg['timing']
D=int(cfg['duration']);sr=48000;n=D*sr;mix=np.zeros((n,2));rng=np.random.default_rng(23)
def add(at,v,pan=0):
 s=int(at*sr);c=min(len(v),n-s)
 if s>=0 and c>0:mix[s:s+c,0]+=v[:c]*(1-pan*.3);mix[s:s+c,1]+=v[:c]*(1+pan*.3)
def tone(at,midi,dur,amp,pan=0,decay=4.5):
 t=np.arange(int(dur*sr))/sr;f=440*2**((midi-69)/12);add(at,(np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t))*np.minimum(1,t/.008)*np.exp(-t*decay)*amp,pan)
def tick(at,amp,pan=0):
 t=np.arange(int(.03*sr))/sr;v=rng.normal(0,1,len(t));v=v-np.convolve(v,np.ones(5)/5,mode='same');add(at,v*np.exp(-t*160)*amp,pan)
def kick(at,amp):
 t=np.arange(int(.3*sr))/sr;f=46+85*np.exp(-t*30);add(at,np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*10)*amp)
def swell(at,amp):
 t=np.arange(int(.9*sr))/sr;v=rng.normal(0,1,len(t));v=np.convolve(v,np.ones(4)/4,mode='same');add(at,v*np.exp(-t*5)*amp);kick(at,amp*3)
# same schedule as src/kit/paperLine.ts
t=T['lineAt'];chimes=[];k=0
for seg in cfg['line']:
 step=T['styledChar'] if seg.get('style') else T['char']
 for _ in seg['text']:tick(t,.05,(-1)**k*.5);k+=1;t+=step
 if seg.get('style'):chimes.append(t);t+=T['hold']
line_end=t;wall=line_end+T['swarm'];poster=wall+T['wall'];block=poster+T['poster'];outro=block+T['block']
for i,c in enumerate(chimes):tone(c+.08,72+[0,4,7,9,12,7][i%6],.7,.06,(-1)**i*.4,5);tone(c+.16,79+[0,4,7,9,12,7][i%6],.7,.035,(-1)**i*.4,5)
chords=[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]]
for bar in range(D//2+1):
 c=chords[bar%4]
 for beat in range(4):
  s=bar*2+beat*.5
  if s>=D-.3:continue
  if s<wall:
   if beat==0:[tone(s,m+12,2.2,.022,0,1.1) for m in c]
  elif s<poster:
   kick(s,.22+.06*((s-wall)/T['wall']));tone(s,c[0],.5,.07);tick(s+.25,.03)
  elif s<outro:
   kick(s,.42);tone(s,c[0]-12,.5,.11);tone(s,c[0],.5,.06)
   for q in (0,.125,.25,.375):tick(s+q,.035,(-1)**int(q*8)*.5)
   if beat%2==0:tone(s,c[2]+12,.8,.03,(-1)**bar*.4,3)
  else:
   if beat==0:[tone(s,m+12,2.4,.03,0,1) for m in c]
for i in range(int(T['swarm']/.11)):tick(line_end+i*.11,.03+.004*i,(-1)**i*.6);tone(line_end+i*.11,76+i%7,.12,.012+.002*i,(-1)**i*.5,20)
for s in (wall,poster,block,outro):swell(s,.08)
tone(outro+.2,69,2.5,.07,0,1.2);tone(outro+.2,76,2.5,.045,.3,1.2)
tt=np.arange(n)/sr;mix*=np.minimum(1,tt/.05)[:,None]*np.clip((D-tt)/1.4,0,1)[:,None]
out=root/'public'/cfg['audio']
with tempfile.TemporaryDirectory()as td:
 wav=Path(td)/'bed.wav'
 with wave.open(str(wav),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-14.8:TP=-2:LRA=14:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);s=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.8:TP=-2:LRA=14:measured_I={s['input_i']}:measured_TP={s['input_tp']}:measured_LRA={s['input_lra']}:measured_thresh={s['input_thresh']}:offset={s['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t',str(D),str(out)],check=True)
print(out,round(line_end,2),round(wall,2),round(poster,2),round(block,2),round(outro,2))
