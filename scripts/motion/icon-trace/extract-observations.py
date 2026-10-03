"""Read the official 30fps clip, deriving simple visible component properties.
Not original site source or inferred hidden CSS. No source glyph pixels are shipped.
"""
from PIL import Image
from pathlib import Path
import numpy as np, json
source=Path('../motion-benchmark-correction/icon-audit/source')
frames=np.stack([np.asarray(Image.open(p).convert('RGB')).astype(float) for p in sorted(source.glob('frame-*.png'))])
# Fixed inner capsule patch contains no glyphs or cursor.
colors=np.median(frames[:,305:312,380:500],axis=(1,2))
# Four fixed glyph cells; chroma isolates the colorful flames from the gray first label.
energies=[]
for x0,x1 in [(389,423),(425,459),(461,495),(497,531)]:
 a=frames[:31,310:353,x0:x1]; chroma=np.max(a,axis=3)-np.min(a,axis=3); e=np.maximum(0,chroma-10).sum(axis=(1,2)); energies.append(e/max(e))
# Label's left H is outside flame cells; dark ink against near-white.
a=frames[:16,318:342,370:388]; dark=np.maximum(0,253-np.mean(a,axis=3)).sum(axis=(1,2)); first=dark/dark[0]
# White final label is measured by a fixed high-contrast glyph mask from final frame.
r=frames[:,316:343,399:521]; target=r[-1]; mask=np.mean(target,axis=2)>210
last=[]
for i in range(len(frames)):
 bg=colors[i]; denom=np.mean(253-bg)
 last.append(float(np.clip(np.mean((r[i]-bg)[mask])/denom,0,1)) if denom>10 and i>=30 else 0)
observations={'source':'https://www.awwwards.com/inspiration/joseph-berry-masterclass-hover-button-animation','recording':{'width':918,'height':656,'fps':30,'durationMs':2466.667},'coordinateScope':'encoded video pixels; original CSS pixel scale unknown','bounds':{'x':321,'y':283,'width':278,'height':94},'background':[247,205,73],'samples':[{'time':round(i*1000/30,3),'color':[round(v) for v in colors[i]],'first':round(float(first[i]),4) if i<len(first) else 0,'flames':[round(float(e[i]),4) if i<len(e) else 0 for e in energies],'last':round(last[i],4)} for i in range(len(frames))]}
Path('../motion-benchmark-correction/icon-audit/observations.json').write_text(json.dumps(observations,indent=2))
print(json.dumps(observations['samples'][::3],indent=2))
