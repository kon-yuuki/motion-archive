"""Recover a reveal-time field from the official 30 fps Stuuudio recording.
Source photos/lettering remain audit evidence; only the grayscale mask is shipped.
Run: python scripts/motion/organic-trace/extract.py --audit ../motion-benchmark-correction/organic-audit
"""
from pathlib import Path
import argparse,json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
args=argparse.ArgumentParser();args.add_argument('--audit',type=Path,required=True);a=args.parse_args()
p=a.audit/'analysis';out=a.audit/'trace';out.mkdir(exist_ok=True)
frames=np.array([np.asarray(Image.open(p/'fullframes'/f'frame-{n:03}.png').convert('RGB'),dtype=float) for n in range(119,152)])
bg=np.array([250.,237.,234.]);crops=frames[:,69:603,288:663];H,W=crops.shape[1:3]
# Project away the low-opacity lettering's RGB direction, measured outside the photo.
ink=(frames[-1,330:540,105:278]-bg).reshape(-1,3);ink=ink[np.linalg.norm(ink,axis=-1)>25]
_,_,vh=np.linalg.svd(ink,full_matrices=False);d=vh[0];proj=np.eye(3)-np.outer(d,d)
v=(crops-bg)@proj;ref=v[-1];contrast=np.linalg.norm(ref,axis=-1)
alpha=np.sum(v*ref,axis=-1)/np.maximum(contrast**2,1)
residual=np.linalg.norm(v-alpha[...,None]*ref,axis=-1)
# Median across time rejects codec noise without moving a stable edge.
alphas=ndi.median_filter(np.clip(alpha,0,1),size=(3,1,1),mode='nearest')
# First persistent half-coverage crossing. No assumption of a global easing curve.
monotone=np.maximum.accumulate(alphas,axis=0)
idx=np.argmax(monotone>=.5,axis=0);idx=np.maximum(idx,1);yy,xx=np.indices((H,W))
lo=monotone[idx-1,yy,xx];hi=monotone[idx,yy,xx]
time=(idx-1+np.clip((.5-lo)/np.maximum(hi-lo,1e-6),0,1))/30
cross_res=np.maximum(residual[idx,yy,xx],residual[idx-1,yy,xx])
reliable=(contrast>5)&(cross_res<5)&(idx<29)
# Weak-color/overprinted pixels are filled from nearby reliable observations.
# A local median excludes isolated lettering residuals; holes are spatially interpolated.
nearest=ndi.distance_transform_edt(~reliable,return_distances=False,return_indices=True)
filled=time[tuple(nearest)]
med=ndi.median_filter(filled,size=7)
reliable &= abs(time-med)<.10
nearest=ndi.distance_transform_edt(~reliable,return_distances=False,return_indices=True)
filled=time[tuple(nearest)]
field=ndi.gaussian_filter(ndi.median_filter(filled,size=7),2.0)
# Field contains crossing times in seconds. 1 code value = 0.900/255 s.
DURATION=.9
field=np.clip(field,0,DURATION)
asset=Path('ui-gallery/image-reveals/organic-mask/reveal-time.png')
Image.fromarray(np.uint8(np.rint(field/DURATION*255)),'L').save(asset)
np.savez_compressed(out/'trace-data.npz',field=field,reliable=reliable,alpha=alpha,contrast=contrast,residual=residual)
Image.fromarray((reliable*255).astype('uint8')).save(out/'confidence.png')
# Source binary silhouettes are evaluated only where the RGB estimate is distinguishable.
metrics=[]
for k in [0,2,4,6,8,10,12,14,16,18,21,25,27]:
 good=reliable&(residual[k]<5)&(abs(alpha[k]-.5)>.2)
 source=alpha[k]>.5;rep=field<k/30
 inter=(source&rep&good).sum();union=((source|rep)&good).sum()
 lab,count=ndi.label(rep);sizes=np.bincount(lab.ravel());components=int((sizes[1:]>=20).sum())
 holes=ndi.binary_fill_holes(rep)&~rep;hl,hc=ndi.label(holes);hs=np.bincount(hl.ravel());holes_count=int((hs[1:]>=20).sum())
 metrics.append({'frame':119+k,'source_time_s':(118+k)/30,'elapsed_ms':round(k/30*1000),'coverage':round(float(rep.mean()),5),'high_confidence_iou':round(float(inter/union if union else 1),5),'evaluated_fraction':round(float(good.mean()),5),'components_min20px':components,'holes_min20px':holes_count})
info={'source':'https://www.awwwards.com/inspiration/image-reveal-animation-mask-stuuudio','crop_xywh':[288,69,W,H],'source_frames':[119,151],'reveal_start_s':118/30,'duration_ms':900,'measured_field_max_ms':round(float(field.max()*1000),1),'measured_field_min_ms':round(float(field.min()*1000),1),'reliable_fraction':float(reliable.mean()),'interpolated_fraction':float((~reliable).mean()),'ink_direction':d.tolist(),'encoding':'8-bit grayscale; intensity / 255 * 900 ms = 50% reveal crossing; pixels are a recorded mask trace, not a recovered shader','caveats':['30 fps and H.264 compression limit timing/edge precision.','Pale image regions and overlaid lettering need local interpolation from reliable samples.','IoU is measured against the same recorded source used for tracing, not independent ground truth.','Original noise/shader/easing and source scroll runtime remain unknown.'],'measurements':metrics}
(out/'measurements.json').write_text(json.dumps(info,indent=2))
# Diagnostic source/mask grid.
sel=[0,2,4,6,8,10,12,14,16,18,21,27];cw=166;ch=310;o=Image.new('RGB',(cw*6,ch*4),'white');dr=ImageDraw.Draw(o)
for j,k in enumerate(sel):
 x=(j%6)*cw;y=(j//6)*ch*2
 src=Image.fromarray(np.uint8(crops[k]));src.thumbnail((150,240));o.paste(src,(x,y+25));dr.text((x,y),f'{k/30:.3f}s / frame {119+k}',fill='black')
 mask=Image.fromarray(np.uint8((field<k/30)*255));mask.thumbnail((150,240));o.paste(mask,(x,y+ch+25));dr.text((x,y+ch),f'mask {next(m for m in metrics if m["frame"]==119+k)["high_confidence_iou"]:.3f}',fill='black')
o.save(out/'extraction-contact.png')
print(json.dumps(info,indent=2))
