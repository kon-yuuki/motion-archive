"""Source/render phase comparison. Assets differ: compare plane, seam and stage geometry.
Run after verify.mjs. Original source video is evidence only, never app input.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,numpy as np
base=Path('../motion-benchmark-correction/slider-corrections/vertical-aperture')
seams={0:634,200:502,600:471,800:718,1000:687,1200:683,1600:661,1800:496,2000:517,2200:745,2400:640,2600:453,3000:554,3200:576,3400:630,3600:509,3800:593}
measurements=[]
for i in range(20):
 t=i*200; src=Image.open(base/f'source-{i+1:02d}.jpg');a=np.asarray(src).astype(float)
 m=np.max(abs(a[350:775,420:1170]-a[350:775,300,None,:]),axis=2)>30
 ys=np.where(m.sum(1)>300)[0];top=int(ys[0]+350);bottom=int(ys[-1]+350)
 row=[]
 for u in [.01,.5,.99]:
  y=round(top+(bottom-top)*u);xx=np.where(m[y-350])[0];row.append([int(xx[0]+420),int(xx[-1]+420)])
 render=Image.open(base/f'render-{t:04d}.png');r=np.asarray(render).astype(float)
 # same plane crop, normalized to original page coordinates
 rm=np.max(abs(r[116:541,225:975]-r[116:541,105,None,:]),axis=2)>30
 ry=np.where(rm.sum(1)>300)[0];rtop=int(ry[0]+350);rbottom=int(ry[-1]+350)
 source_seam=seams.get(t); found=None
 if source_seam:
  expected=source_seam-234;g=abs(np.diff(r[:,335:875],axis=0)).mean((1,2));lo=max(0,expected-8);hi=min(len(g),expected+9)
  found=int(g[lo:hi].argmax()+lo+234)
 measurements.append({'milliseconds':t,'source':{'top':top,'bottom':bottom,'edge_left_right_at_1_50_99_percent':row,'seam':source_seam},'render':{'top':rtop,'bottom':rbottom,'seam_near_source':found},'seam_delta_px':None if found is None else found-source_seam})
(base/'measurements.json').write_text(json.dumps({'coordinate_system':'1600×1200 original video; render source-page crop offset +195,+234','method':'Plane mask:RGB deviation>30 from same-row page background. Seam:strongest horizontal row discontinuity within±8px of measured source boundary; this local search is not a global similarity score. Asset substitution prevents pixelwise appearance equivalence.','phases':measurements},indent=2))
chosen=[0,600,1000,1800,2400,2600,3200,3800]
cellW=640;cellH=445;out=Image.new('RGB',(cellW*2,cellH*len(chosen)), '#f7f7f7');d=ImageDraw.Draw(out)
for j,t in enumerate(chosen):
 src=Image.open(base/f'source-{t//200+1:02d}.jpg').crop((195,234,1405,965));render=Image.open(base/f'render-{t:04d}.png')
 for k,(im,label) in enumerate([(src,'SOURCE / official recording'),(render,'RENDER / original generated stills')]):
  im.thumbnail((620,375));x=k*cellW+10;y=j*cellH+42;out.paste(im,(x,y));d.text((x,j*cellH+12),f'{label} | {t/1000:.1f}s',fill='#171717')
 d.text((10,j*cellH+420),'Compare window proportions, corners, side bow and moving seam. Imagery is substituted; fidelity remains WIP.',fill='#333333')
out.save(base/'comparison.jpg',quality=92)
# Compact four-phase comparison overview.
thumb=out.resize((768,round(out.height*768/out.width)));thumb.save(base/'comparison-overview.jpg',quality=90)
print(json.dumps(measurements,indent=2))
