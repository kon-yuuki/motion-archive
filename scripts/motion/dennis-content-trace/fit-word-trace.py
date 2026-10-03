"""Fit a simple finite ease-out to observed DOM transforms, not source code."""
import json, re, sys
import numpy as np
from scipy.optimize import least_squares
from pathlib import Path
trace=Path(sys.argv[1]); out=Path(sys.argv[2])
a=json.loads(trace.read_text()); rows=[]
for sample in a:
 for i,w in enumerate(sample['data']['words']):
  y=float(w['tf'].split(',')[-1][:-1]); rows.append((sample['t'],i,y/39.34375))
x=np.array(rows)
def residual(v):
 start,duration,stagger,power=v
 return np.maximum(0,1-np.maximum(0,(x[:,0]-start-x[:,1]*stagger)/duration))**power-x[:,2]
fit=least_squares(residual,[290,1200,12,4],bounds=([0,300,0,1],[600,2000,40,8]))
result={'method':'least-squares fit of y / 39.34375 = max(0,1-max(0,(t-start-i*stagger)/duration))^power','parameters':dict(zip(['start_ms','duration_ms','stagger_ms','power'],fit.x.tolist())),'rms_px':float(np.sqrt(np.mean(residual(fit.x)**2))*39.34375),'max_abs_px':float(np.max(np.abs(residual(fit.x)))*39.34375),'samples':len(rows),'limitation':'Source samples begin mid-animation; initial start is extrapolated. Browser DOM sampling and native scroll synchronization jitter are included. These are estimated trace-fit values, not recovered source constants.'}
out.write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
