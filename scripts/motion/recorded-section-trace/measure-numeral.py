"""Trace recording silhouette and fit similarity transforms; no source code extraction."""
from pathlib import Path
import json, os
os.environ['MPLCONFIGDIR']='/tmp/section-matplotlib'
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.optimize import differential_evolution, minimize
from scipy.interpolate import splprep,splev
import matplotlib.pyplot as plt
folder=Path('../motion-benchmark-correction/section-corrections/numeral-mask')
a=np.array(Image.open(folder/'source-0.000.png').convert('RGB'))
mask=(a.max(2)<80).astype(float);mask[:10]=0
cs=plt.contour(gaussian_filter(mask,1.2),levels=[.5]); paths=[]
for pts in cs.allsegs[0]:
 if len(pts)<20:continue
 # Smooth a raster-measured outline, then periodic cubic interpolation.
 tck,u=splprep(pts.T,s=20,per=True); p=np.array(splev(np.linspace(0,1,100,endpoint=False),tck)).T
 d=f'M{p[0,0]:.3f},{p[0,1]:.3f}'
 for i in range(len(p)):
  p0,p1,p2,p3=p[(i-1)%len(p)],p[i],p[(i+1)%len(p)],p[(i+2)%len(p)]
  c1=p1+(p2-p0)/6;c2=p2-(p3-p1)/6
  d+=f'C{c1[0]:.3f},{c1[1]:.3f} {c2[0]:.3f},{c2[1]:.3f} {p2[0]:.3f},{p2[1]:.3f}'
 paths.append(d+'Z')
assets=Path('ui-gallery/section-transitions/numeral-mask/assets');assets.mkdir(exist_ok=True)
(assets/'numeral-outline.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><path fill="black" fill-rule="evenodd" d="'+''.join(paths)+'"/></svg>')
# A slightly softened source mask permits gradient-free registration of the enlarged shape.
soft=gaussian_filter(mask,2)
y,x=np.mgrid[20:1200:8,0:1600:8];cx=x-800;cy=y-600
measure=[]
prev=np.array([0.,0.,0.,0.])
for f in sorted(folder.glob('source-*.png')):
 t=float(f.stem.split('-')[-1]);
 if t>3.574:continue
 target=np.array(Image.open(f).convert('RGB'))[y,x].max(2)<80
 def loss(v):
  scale=np.exp(v[0]);theta=v[1];dx=(cx-v[2])/scale;dy=(cy-v[3])/scale
  coords=[(-np.sin(theta)*dx+np.cos(theta)*dy+600).ravel(),(np.cos(theta)*dx+np.sin(theta)*dy+800).ravel()]
  out=map_coordinates(soft,coords,order=1,mode='constant').reshape(x.shape)
  return np.mean((out-target)**2)
 if t==0:v=prev
 else:
  bounds=[(max(-.1,prev[0]-.1),min(4,prev[0]+1.4)),(max(-1.4,prev[1]-.6),min(1.4,prev[1]+.6)),(-300,300),(-300,300)]
  res=differential_evolution(loss,bounds,popsize=12,maxiter=150,tol=.0003,seed=3,polish=True);v=res.x
 prev=v
 measure.append({'time':t,'scale':round(float(np.exp(v[0])),5),'rotationDegrees':round(float(np.rad2deg(v[1])),4),'translateX':round(float(v[2]),3),'translateY':round(float(v[3]),3),'maskMeanSquareError':round(float(loss(v)),6)})
 print(measure[-1],flush=True)
result={'method':'Threshold full-resolution recording black pixels (<80), Gaussian boundary smoothing 1.2px, periodic vector trace. Fit uniform scale + rotation + translation to 8px sampled recording masks. Values are measured image-registration fits, not original CSS parameters. Top recording progress line excluded. Later almost-all-black frames underdetermine transform.','sourceDimensions':[1600,1200],'initialBlackBounds':[int(np.where(mask)[1].min()),int(np.where(mask)[0].min()),int(np.where(mask)[1].max()),int(np.where(mask)[0].max())],'yellowSample':a[100,100].tolist(),'transforms':measure}
(folder/'measurements.json').write_text(json.dumps(result,indent=2))
(assets/'trace.js').write_text('/** Image-registered estimates from recording; original input/easing unknown. */\nexport const trace = '+json.dumps(measure,separators=(',',':'))+';\n')
