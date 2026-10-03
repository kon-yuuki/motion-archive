from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
base=Path('../motion-benchmark-correction/section-corrections')
for slug,times in [('gradient-frame-wipe',[1.146,1.432,1.719,2.005,2.865,3.151,3.438,4.5]),('numeral-mask',[0,.794,1.588,1.985,2.779,3.573,4.367,5.161,5.955,6.749])]:
 p=base/slug;rows=[];metrics=[]
 for t in times:
  s=Image.open(p/f'source-{t:.3f}.png').convert('RGB');r=Image.open(p/f'replica-{t:.3f}.png').convert('RGB')
  if slug=='gradient-frame-wipe':s=s.crop((195,235,1405,965))
  width=600;height=round(s.height/s.width*width)
  pair=Image.new('RGB',(width*2+12,height+31),'#fafafa');d=ImageDraw.Draw(pair);d.text((8,8),f'SOURCE {t:.3f}s',fill='#111');d.text((width+20,8),'REPLICA / original substitute material',fill='#111');pair.paste(s.resize((width,height)),(0,31));pair.paste(r.resize((width,height)),(width+12,31));rows.append(pair)
  pair.save(p/f'comparison-{t:.3f}.jpg',quality=95)
  if slug=='numeral-mask' and t<=3.573:
   a=np.array(s);b=np.array(r.resize(s.size));mask1=a.max(2)<80;mask2=b.max(2)<80;mask1[:10]=False;mask2[:10]=False
   metrics.append({'sourceTime':t,'blackMaskIntersectionOverUnion':round(float((mask1&mask2).sum()/(mask1|mask2).sum()),5),'blackMaskMismatchFraction':round(float((mask1!=mask2)[10:].mean()),5)})
 sheet=Image.new('RGB',(1212,sum(row.height for row in rows)+10*(len(rows)-1)),'white');y=0
 for row in rows:sheet.paste(row,(0,y));y+=row.height+10
 sheet.save(p/'comparison-sheet.jpg',quality=95)
 if metrics:(p/'comparison-metrics.json').write_text(json.dumps({'method':'Mask comparison of full-resolution source/replica stages, top 10px progress indicator excluded. Not a whole-scene photographic fidelity score.','measurements':metrics},indent=2))
