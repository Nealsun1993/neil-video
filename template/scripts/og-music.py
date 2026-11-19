"""Original 24s flat-collage groove, 120BPM, no voice or paid generation."""
from pathlib import Path
import numpy as np,subprocess,wave,tempfile,json
root=Path(__file__).resolve().parents[1];out=root/'public/episodes/og-collage';sr=48000;seconds=24
mix=np.zeros((sr*seconds,2));rng=np.random.default_rng(87)
def note(at,midi,dur,amp,pan=0):
 n=min(int(dur*sr),len(mix)-int(at*sr));t=np.arange(n)/sr;f=440*2**((midi-69)/12)
 v=sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(3+k*1.3))/k**1.7 for k in range(1,5))*np.minimum(1,t/.005)*np.clip((dur-t)/.08,0,1)
 i=int(at*sr);mix[i:i+n,0]+=v*amp*(1-pan*.25);mix[i:i+n,1]+=v*amp*(1+pan*.25)
def drum(at,kind,amp):
 dur=.22 if kind=='kick' else .09;n=min(int(dur*sr),len(mix)-int(at*sr));t=np.arange(n)/sr
 if kind=='kick':v=np.sin(2*np.pi*(48*t+12*(1-np.exp(-t*35))/35))*np.exp(-t*20)
 else:
  noise=rng.normal(0,1,n);v=(noise-np.convolve(noise,np.ones(9)/9,mode='same'))*np.exp(-t*(90 if kind=='hat' else 45))*.3
 i=int(at*sr);mix[i:i+n]+=v[:,None]*amp
chords=[[41,48,53,57],[48,55,60,64],[45,52,57,60],[46,53,58,62]]
for bar in range(12):
 at=bar*2;c=chords[bar%4]
 for beat in range(4):
  sec=at+beat*.5;drum(sec,'kick',.12 if beat%2==0 else .05)
  if beat%2:drum(sec,'clap',.11)
  drum(sec+.25,'hat',.065)
  note(sec,c[0],.42,.11)
 for off in [.25,.75,1.25,1.5]:
  for m in c[1:]:note(at+off,m,.4,.035,(-1)**bar*.3)
 if bar%2==0:
  for off,m in zip([0,.5,1,1.5],[c[2]+12,c[3]+12,c[1]+12,c[2]+12]):note(at+off,m,.5,.035,.5)
t=np.arange(len(mix))/sr;mix*=np.minimum(1,t/.1)[:,None]*np.clip((24-t)/1.4,0,1)[:,None]
with tempfile.TemporaryDirectory() as td:
 wav=Path(td)/'og.wav'
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-14.8:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);stats=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.8:TP=-2:LRA=12:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t','24',str(out/'music.m4a')],check=True)
(out/'music-source.json').write_text(json.dumps({'kind':'original local instrumental','bpm':120,'duration':24,'voice':False,'paidCalls':0,'inputStats':stats},ensure_ascii=False,indent=2)+'\n')
print(out/'music.m4a')
