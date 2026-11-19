"""Reproducible original 120 BPM score + existing demo voice (16–29.5s).
Requires numpy and FFmpeg. No external generation service or third-party music.
"""
from pathlib import Path
import numpy as np
import subprocess, wave, tempfile
root=Path(__file__).resolve().parents[1]
out=root/'public/episodes/pixel-minute';out.mkdir(parents=True,exist_ok=True)
sr=48000;duration=60
score=np.zeros((duration*sr,2),dtype=np.float64)
rng=np.random.default_rng(27)
def note(at,midi,length,amp,kind='pluck',pan=0):
 n=int(length*sr);t=np.arange(n)/sr;f=440*2**((midi-69)/12)
 if kind=='bass':v=np.sin(2*np.pi*f*t)+.15*np.sin(4*np.pi*f*t);env=np.minimum(1,t/.012)*np.exp(-t*5)
 elif kind=='pad':v=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t);env=np.minimum(1,t/.3)*np.minimum(1,(length-t)/.4)*.5
 else:v=np.sin(2*np.pi*f*t)+.2*np.sin(6*np.pi*f*t);env=np.minimum(1,t/.006)*np.exp(-t*9)*np.minimum(1,(length-t)/.035)
 v=v*env*amp;start=int(at*sr);n=min(n,len(score)-start)
 if n>0:score[start:start+n,0]+=v[:n]*(1-pan*.3);score[start:start+n,1]+=v[:n]*(1+pan*.3)
chords=[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]]
for bar in range(30):
 at=bar*2;ch=chords[bar%4]
 for m in ch[1:]:note(at,m+12,2.2,.021,'pad')
 for b in range(4):
  sec=at+b*.5;note(sec,ch[0],.38,.075,'bass')
  if not 16<=sec<29.5:
   melody=[ch[2]+12,ch[3]+12,ch[1]+24,ch[2]+12][(b+bar)%4]
   note(sec,melody,.34,.04,'pluck',(-1)**b*.6)
  # Rounded kick and soft, band-limited noise percussion.
  n=int(.22*sr);t=np.arange(n)/sr;k=.085*np.sin(2*np.pi*(48*t+42*.025*(1-np.exp(-t/.025))))*np.exp(-t*23)
  start=int(sec*sr);score[start:start+n]+=k[:,None]
  if b%2:
   n=int(.1*sr);noise=rng.normal(0,1,n);noise=np.convolve(noise,np.ones(7)/7,mode='same')*.027*np.exp(-np.arange(n)/sr*48)
   score[start:start+n]+=noise[:,None]
# Soft sonic accents for scene transitions.
for at in [4,8,12,16,29.5,34,39,44,49,54]:
 note(at,81,.13,.032,'pluck',-.4);note(at+.09,88,.18,.025,'pluck',.4)
t=np.arange(len(score))/sr
# Narration protection: gain down before the voice enters, back after it ends.
duck=np.interp(t,[0,15.6,16,29.5,30,58.5,60],[1,1,.22,.22,1,1,0])
fade=np.minimum(1,t/.3)*np.clip((60-t)/1.2,0,1)
score*=duck[:,None]*fade[:,None]
with tempfile.TemporaryDirectory() as tmp:
 wav=Path(tmp)/'score.wav';mix=Path(tmp)/'mix.wav'
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(score,-1,1)*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-i',str(root/'public/episodes/story-demo/narration.m4a'),'-i',str(root/'public/episodes/story-demo/actions.wav'),'-filter_complex','[1:a]atrim=0:13.5,adelay=16000|16000[v];[2:a]atrim=0:13.5,volume=0.6,adelay=16000|16000[s];[0:a][v][s]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.85[a]','-map','[a]','-ar','48000',str(mix)],check=True)
 # Two-pass normalization to avoid the single-pass mode changing dynamics.
 probe=subprocess.run(['ffmpeg','-hide_banner','-i',str(mix),'-af','loudnorm=I=-14.5:TP=-1:LRA=10:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 import json
 stats=json.JSONDecoder().raw_decode(probe.stderr[probe.stderr.rfind('{'):])[0]
 filt=f"loudnorm=I=-14.5:TP=-1:LRA=10:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(mix),'-af',filt,'-ar','48000','-c:a','aac','-b:a','192k','-t','60',str(out/'mix.m4a')],check=True)
 (out/'audio-build.json').write_text(json.dumps({'originalScore':True,'seed':27,'bpm':120,'voiceStart':16,'voiceSource':'story-demo/narration.m4a','normalizationInput':stats},ensure_ascii=False,indent=2)+'\n')
# AAC can create intersample overshoot. Reserve headroom after encoding.
subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'mix.m4a'),'-af','volume=0.45dB,alimiter=limit=0.82:level=false','-c:a','aac','-b:a','192k','-ar','48000','-t','60',str(out/'mix-checked.m4a')],check=True)
(out/'mix-checked.m4a').replace(out/'mix.m4a')
print(out/'mix.m4a')
