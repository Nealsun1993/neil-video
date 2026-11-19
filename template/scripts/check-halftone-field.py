"""Detect empty raster bands in a canvas-only study. Not a general motion score."""
import sys,subprocess,json
from pathlib import Path
import numpy as np
video=sys.argv[1];sampling=30 if '--all-frames' in sys.argv[2:] else 2;p=subprocess.run(['ffmpeg','-v','error','-i',video,'-vf',f'fps={sampling},scale=320:180','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True)
frames=np.frombuffer(p.stdout,np.uint8).reshape(-1,180,320,3);values=[]
for i,frame in enumerate(frames):
 bands=[float(np.std(frame[y:y+30].astype(float),axis=1).mean()) for y in range(0,180,30)]
 values.append({'sec':i/sampling,'minBandVariation':min(bands)})
bad=[v for v in values if v['minBandVariation']<.35]
result={'video':video,'samples':len(values),'emptyBands':bad,'minimumVariation':min(v['minBandVariation']for v in values),'purpose':'Detect uniform blank regions in this canvas-only design; not a universal fluidity score.'}
print(json.dumps(result,ensure_ascii=False,indent=2));assert not bad,'Raster coverage failure'
