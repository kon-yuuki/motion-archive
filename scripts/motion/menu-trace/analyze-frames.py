"""Compare screenshot silhouettes independently from implementation assertions.
The source screenshots have capture intervals, not synchronized CSS timestamps.
Fit only a global CSS time per screenshot, then measure remaining edge residual.
This is a phase-aligned shape diagnostic, never a whole-page fidelity score.
"""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = ROOT.parent / 'motion-benchmark-correction/menu-audit'

def ease(t):
    t=min(1,max(0,t));lo,hi=0.,1.
    for _ in range(24):
        u=(lo+hi)/2;x=3*(1-u)**2*u*.7+3*(1-u)*u*u*.2+u**3
        if x<t:lo=u
        else:hi=u
    u=(lo+hi)/2
    return 3*(1-u)*u*u+u**3

def edges(path):
    im=np.asarray(Image.open(path).convert('RGB')).astype(int)
    mask=np.max(np.abs(im-[28,29,32]),axis=2)<6
    # Exclude hero and About-me circle. First dark run is the menu edge;
    # the 25px minimum rejects ordinary underlying body-text strokes.
    ys=np.r_[np.arange(170,501,3), np.arange(700,757,3)]
    result=[]
    for y in ys:
        runs=np.convolve(mask[y].astype(int),np.ones(25,dtype=int),'valid')
        candidates=np.where(runs[702:]==25)[0]+702
        result.append(int(candidates[0]) if len(candidates) else 1180)
    return ys,np.array(result)

def predicted(ms,ys):
    p=702.649658203125+548.140625*(1-ease(ms/800))
    c=70.796875*(1-ease(ms/850))
    dy=(ys+.5-757/2)/(757*.75)
    e=np.maximum(0,-.00375*c+3.875*c*(1-np.sqrt(1-dy**2)))
    return np.minimum(1180,np.minimum(p,p+1-c+e))

frames=json.loads((EVIDENCE/'source-open-frames.json').read_text())
fits=[]
for i,frame in enumerate(frames):
    ys,actual=edges(EVIDENCE/f'source-open-{i}.png')
    if np.count_nonzero(actual<1155)<15:continue
    valid=actual<1155
    best=min(np.arange(0,901,.25), key=lambda t:np.median(np.abs(predicted(t,ys)[valid]-actual[valid])))
    residual=predicted(best,ys)[valid]-actual[valid]
    fits.append({'sourceFrame':i,'fittedCssTimeMs':float(best),'captureBeginMs':frame['begin'],'captureEndMs':frame['end'],'shapeResidualMedianPx':float(np.median(np.abs(residual))),'shapeResidual95thPx':float(np.percentile(np.abs(residual),95)),'rows':int(valid.sum())})
result={'method':'Phase-align to source screenshot left-edge shape, then report residual over independent scanlines. Do not treat fitted time as measured wall-clock time; source screenshot capture origin/latency are not synchronized. Dark run length=25, color tolerance=5 per channel, rows170..500 and700..756. Source background/photo/type and cursor excluded. This is not an overall fidelity score.','frames':fits}
(EVIDENCE/'phase-fit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))

# Final pixels, independent of the analytical curve fit used for phase alignment.
if (EVIDENCE/'temporal/replica-phase-5.png').exists():
    comparisons=[]
    for fit in fits:
        i=fit['sourceFrame'];ys,se=edges(EVIDENCE/f'source-open-{i}.png')
        _,re=edges(EVIDENCE/f'temporal/replica-phase-{i}.png')
        _,old=edges(EVIDENCE/f'temporal/replica-before-phase-{i}.png')
        valid=(se<1155)&(re<1155)&(old<1155)
        if not valid.any():continue
        comparisons.append({'sourceFrame':i,'fittedCssTimeMs':fit['fittedCssTimeMs'],'newMedianAbsEdgePx':float(np.median(np.abs(re[valid]-se[valid]))),'new95thAbsEdgePx':float(np.percentile(np.abs(re[valid]-se[valid]),95)),'oldMedianAbsEdgePx':float(np.median(np.abs(old[valid]-se[valid]))),'old95thAbsEdgePx':float(np.percentile(np.abs(old[valid]-se[valid]),95)),'rows':int(valid.sum())})
    (EVIDENCE/'temporal/pixel-comparison.json').write_text(json.dumps({'method':result['method'],'comparisons':comparisons},indent=2)+'\n')
    from PIL import ImageDraw,ImageFont
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
    small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
    cases=[4,5,7,'settled'];w=1200;rowh=416
    canvas=Image.new('RGB',(w,100+rowh*len(cases)), '#fafaf8');draw=ImageDraw.Draw(canvas)
    draw.text((12,10),'Dennis full drawer | source vs corrected replica',fill='#1c1d20',font=font)
    draw.text((12,39),'Same 1180 x 757 viewport. Intermediate frames phase-aligned by silhouette, NOT synchronized wall-clock time.',fill='#444444',font=small)
    draw.text((12,61),'Source background, font and cursor differ. Source at left; replica at right. WIP, no fidelity certification.',fill='#444444',font=small)
    for j,i in enumerate(cases):
        if i=='settled':a=EVIDENCE/'source-open-settled.png';b=EVIDENCE/'temporal/replica-settled.png';label='Settled open'
        else:
            fit=next(x for x in fits if x['sourceFrame']==i)
            a=EVIDENCE/f'source-open-{i}.png';b=EVIDENCE/f'temporal/replica-phase-{i}.png'
            label=f"Source frame {i}: capture {fit['captureBeginMs']}-{fit['captureEndMs']}ms | replica CSS phase {fit['fittedCssTimeMs']:.2f}ms"
        y=100+j*rowh;draw.text((12,y),label,fill='#1c1d20',font=small)
        for k,p in enumerate([a,b]):canvas.paste(Image.open(p).convert('RGB').resize((590,379)),(5+k*600,y+26))
    canvas.save(EVIDENCE/'comparison-menu-timeline.png')
    print('Pixel comparisons:',json.dumps(comparisons,indent=2))
