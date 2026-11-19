"""实际MP4交接点回归：检查102、286帧是否出现突发像素变化。需Pillow与FFmpeg。"""
import subprocess,json,sys
from PIL import Image,ImageChops,ImageStat
path=sys.argv[1]
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate','-of','json',path]))['streams'][0]
w,h=meta['width'],meta['height']
assert meta['r_frame_rate']=='30/1','检查器针对本实验30fps'
nums=[101,102,285,286]
raw=subprocess.check_output(['ffmpeg','-v','error','-i',path,'-vf','select='+ '+'.join(f'eq(n\\,{n})'for n in nums),'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])
size=w*h*3;assert len(raw)==size*4
frames=[Image.frombytes('RGB',(w,h),raw[i*size:(i+1)*size])for i in range(4)]
regions=[(700,530,1260,750),(600,850,1900,947)]if w>h else[(250,890,830,1130),(80,1620,1000,1690)]
fail=False
for label,a,b,roi,limit in [('keyword-to-window',0,1,regions[0],5),('window-to-result',2,3,regions[1],1.5)]:
 diff=ImageChops.difference(frames[a].crop(roi),frames[b].crop(roi));mad=sum(ImageStat.Stat(diff).mean)/3
 print(json.dumps({'seam':label,'frames':[nums[a],nums[b]],'meanPixelDelta':round(mad,4),'limit':limit,'pass':mad<limit}))
 fail|=mad>=limit
sys.exit(1 if fail else 0)
