"""Measured visible pixels, not source CSS values or a fidelity score."""
from pathlib import Path
from PIL import Image
import numpy as np,json
from collections import Counter
root=Path('../motion-benchmark-correction/text-corrections')
def image(slug,name):return np.array(Image.open(root/slug/name).convert('RGB'))
def inkbox(a,roi,threshold=150,light=False):
 x0,y0,x1,y1=roi;rgb=a[y0:y1,x0:x1];mask=(rgb.mean(2)>threshold) if light else (rgb.max(2)<threshold); yy,xx=np.where(mask)
 return [int(xx.min()+x0),int(yy.min()+y0),int(xx.max()+x0),int(yy.max()+y0)] if len(xx) else None
out={'scope':'Measured encoded source and independently rendered pixels. Cursor, compression, font substitutions and approximate input alignment prevent treating this as a fidelity certificate.','proximity-weight':{},'blur-dissolve':{},'scan-band-reveal':{}}
for label,name in [('source','source/0.000.png'),('replica','replica/rest.png')]:
 a=image('proximity-weight',name);out['proximity-weight'][label]={'line_ink_bounds':[inkbox(a,(100,y0,1500,y1)) for y0,y1 in [(370,483),(490,602),(603,716),(720,835)]],'background_mode':Counter(map(tuple,a[100:250,100:250].reshape(-1,3))).most_common(1)[0][0]}
for s,r in [('0.000','rest'),('1.150','time-280'),('1.500','time-650'),('2.000','time-1130'),('2.600','time-1730')]:
 v=[]
 for name in [f'source/{s}.png',f'replica/{r}.png']:
  a=image('blur-dissolve',name)[260:450,330:595];v.append({'total_luminance':round(float(a.mean(2).sum()),2),'peak_luminance':round(float(a.mean(2).max()),2)})
 out['blur-dissolve'][s]={'source':v[0],'replica':v[1]}
for label,name in [('source','source/3.220.png'),('replica','replica/time-3220.png')]:
 a=image('scan-band-reveal',name);out['scan-band-reveal'][label]={'fine':inkbox(a,(900,470,1483,735),150,True),'thought':inkbox(a,(400,735,1483,980),100,True)}
(root/'measurements.json').write_text(json.dumps(out,indent=2,default=lambda o:int(o)))
print(json.dumps(out,indent=2,default=lambda o:int(o)))
