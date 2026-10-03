"""Compare sampled browser masks to the recorded source; create temporal evidence.
The source is the same recording used in extraction, not held-out ground truth.
"""
from pathlib import Path
import argparse,json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
p=argparse.ArgumentParser();p.add_argument('--audit',type=Path,required=True);a=p.parse_args();root=a.audit
z=np.load(root/'trace/trace-data.npz');alpha=z['alpha'];res=z['residual'];contrast=z['contrast'];reliable=z['reliable']
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(font_path,14);small=ImageFont.truetype(font_path,11)
def topology(binary,minarea=150):
 labels,n=ndi.label(binary,structure=np.ones((3,3)));sizes=np.bincount(labels.ravel())[1:]
 holemask=ndi.binary_fill_holes(binary)&~binary;labels,n=ndi.label(holemask,structure=np.ones((3,3)));holes=np.bincount(labels.ravel())[1:]
 return {'components_min150px':int((sizes>=minarea).sum()),'enclosed_holes_min150px':int((holes>=minarea).sum())}
def clean_regions(binary):
 out=binary.copy()
 for value in [False,True]:
  labels,n=ndi.label(out==value,structure=np.ones((3,3)));sizes=np.bincount(labels.ravel())
  small=(sizes<150);small[0]=False;out[small[labels]]=not value
 return out
rows=[];images=[]
for k in [0,2,4,6,8,10,12,14,16,18,21,25,27]:
 ms=round(k/30*1000)
 rgba=Image.open(root/f'browser/canvas-{ms}.png').convert('RGBA').resize((375,534),Image.Resampling.LANCZOS)
 actual=np.asarray(rgba)[...,3]>.5*255
 if k==27:actual[:]=True # completed runtime removes canvas and displays normal img
 good=reliable&(res[k]<5)&(abs(alpha[k]-.5)>.2)
 source=alpha[k]>.5
 union=((actual|source)&good).sum();inter=(actual&source&good).sum()
 boundary=source^ndi.binary_erosion(source);repboundary=actual^ndi.binary_erosion(actual)
 interior=ndi.binary_erosion(reliable&(res[k]<5),iterations=2)
 dist=ndi.distance_transform_edt(~repboundary)
 values=dist[boundary&interior]
 # Source topology is estimated independently at each frame, with its own weak-color fill.
 valid=(contrast>5)&(res[k]<5)
 near=ndi.distance_transform_edt(~valid,return_distances=False,return_indices=True)
 segmented=alpha[k][tuple(near)]
 segmented=ndi.gaussian_filter(ndi.median_filter(segmented,size=7),2)>.5
 source_clean=clean_regions(segmented);actual_clean=clean_regions(actual)
 source_edge=source_clean^ndi.binary_erosion(source_clean);actual_edge=actual_clean^ndi.binary_erosion(actual_clean)
 edge_samples=ndi.distance_transform_edt(~actual_edge)[source_edge&interior]
 info={'clean_boundary_p95_px':round(float(np.quantile(edge_samples,.95)),3) if edge_samples.size else None,'clean_boundary_sample_count':int(edge_samples.size),'elapsed_ms':ms,'source_frame':119+k,'source_timestamp_s':(118+k)/30,'confidence_evaluated_fraction':round(float(good.mean()),5),'masked_iou':round(float(inter/union if union else 1),5),'boundary_sample_count':int(values.size),'boundary_p95_px':round(float(np.quantile(values,.95)),3) if values.size else None,'source_segmented_topology':topology(segmented),'browser_topology':topology(actual),'browser_visible_fraction':round(float(actual.mean()),5)}
 rows.append(info)
 # Silhouette evidence: source reconstruction / actual browser / disagreement.
 src=np.uint8(segmented)*255;rep=np.uint8(actual)*255
 diff=np.zeros((*actual.shape,3),dtype='uint8');diff[:]=[250,237,234];diff[segmented&actual]=[53,65,57];diff[segmented&~actual]=[204,82,70];diff[actual&~segmented]=[68,119,174]
 images.append((ms,Image.fromarray(src),Image.fromarray(rep),Image.fromarray(diff)))
(root/'trace/browser-comparison.json').write_text(json.dumps({'scope':'In-sample comparison against source used for tracing. Color-segmentation confidence exclusions apply; source silhouette topology is an estimate, not hand-labeled ground truth. Component/hole counts and cleaned contour distances ignore regions smaller than 150 source pixels. Raw boundary distances are sensitive to codec speckles and can be very large near completion; see clean_boundary_p95_px for meaningful-region segmentation.','measurements':rows},indent=2))
# Full-layout comparison, three moments per band. Different photographic material is intentional.
selected=[4,8,10,14,21,27];cellw=472;cellh=738
sheet=Image.new('RGB',(cellw*3,90+cellh*2),'#f8f7f4');d=ImageDraw.Draw(sheet)
d.text((20,15),'STUUUDIO / ORGANIC MASK — recorded source vs. browser replica',font=font,fill='#222222')
d.text((20,40),'Same elapsed time and 918 × 656 layout; photograph and lettering replaced. Source 30 fps, start 3.933 s.',font=small,fill='#555555')
d.text((20,58),'Recorded-mask trace: 85.9% direct confidence, 14.1% interpolated. Unknown source shader. WIP.',font=small,fill='#555555')
for j,k in enumerate(selected):
 ms=round(k/30*1000);x=(j%3)*cellw+10;y=90+(j//3)*cellh
 d.text((x,y),f'{ms} ms  ·  source {(118+k)/30:.3f} s',font=font,fill='#222222')
 source=Image.open(root/f'analysis/fullframes/frame-{119+k:03}.png').convert('RGB');source=source.resize((459,328),Image.Resampling.LANCZOS)
 replica=Image.open(root/f'browser/replica-{ms}.png').convert('RGB');replica=replica.resize((459,328),Image.Resampling.LANCZOS)
 d.text((x,y+24),'SOURCE / official Awwwards recording',font=small,fill='#555555');sheet.paste(source,(x,y+42))
 d.text((x,y+383),'REPLICA / recorded mask + local photograph',font=small,fill='#555555');sheet.paste(replica,(x,y+403))
sheet.save(root/'source-vs-replica-contact-sheet.png')
# Quantitative silhouette trace view.
selected_ms=[67,133,267,333,467,700];cw=204;ch=370
sheet=Image.new('RGB',(cw*6,92+ch*3),'white');d=ImageDraw.Draw(sheet)
d.text((12,12),'Temporal silhouettes: source estimate / browser alpha / disagreement',font=font,fill='black')
d.text((12,38),'Dark = agree · red = source only · blue = replica only. Pale/lettering regions are estimated.',font=small,fill='#555555')
d.text((12,58),'Topology counts ignore regions <150px. Source segmentation is not independent ground truth.',font=small,fill='#555555')
for j,ms in enumerate(selected_ms):
 _,*ims=next(im for im in images if im[0]==ms)
 for row,im in enumerate(ims):
  x=j*cw+8;y=92+row*ch;d.text((x,y),f'{ms}ms / '+['source estimate','browser mask','difference'][row],font=small,fill='black');im=im.resize((190,271),Image.Resampling.LANCZOS);sheet.paste(im,(x,y+24))
sheet.save(root/'temporal-contour-comparison.png')
# Larger actual-material crops, using captured browser output without a new run.
sheet=Image.new('RGB',(1284,840),'#f8f7f4');d=ImageDraw.Draw(sheet)
d.text((14,15),'ACTUAL MATERIAL / source-photo crop and captured forest replica',font=font,fill='black')
d.text((14,41),'In-sample recorded-mask trace. 14.1% interpolated; unknown shader. Thin joins and small holes remain approximate.',font=small,fill='#555555')
for j,k in enumerate(selected):
 ms=round(k/30*1000);x=(j%3)*428+12;y=78+(j//3)*380
 d.text((x,y),f'{ms} ms  /  source {(118+k)/30:.3f} s',font=font,fill='black')
 for z,kind in enumerate(['source','replica']):
  path=root/f'analysis/fullframes/frame-{119+k:03}.png' if kind=='source' else root/f'browser/replica-{ms}.png'
  im=Image.open(path).crop((288,69,663,603)).convert('RGB').resize((198,282),Image.Resampling.LANCZOS)
  d.text((x+z*204,y+27),['Source photograph','Replica / local photograph'][z],font=small,fill='#555555');sheet.paste(im,(x+z*204,y+47))
 d.text((x,y+344),'Same 375:534 crop. Source photograph is not shipped.',font=small,fill='#555555')
sheet.save(root/'source-vs-replica-photo-crops.png')
print(json.dumps(rows,indent=2))
