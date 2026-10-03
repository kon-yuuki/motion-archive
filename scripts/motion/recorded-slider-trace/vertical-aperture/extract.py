"""Extract true 0.2s sample times from the 60fps official recording.
Using fps=5 would select centered frames and shift the inspected timeline.
"""
from pathlib import Path
import subprocess
source = Path('../motion-benchmark-correction/remaining-recorded-audit/vertical-aperture/source.mp4')
out = Path('../motion-benchmark-correction/slider-corrections/vertical-aperture')
out.mkdir(parents=True, exist_ok=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-vf',"select='not(mod(n,12))'",'-fps_mode','vfr','-q:v','2',str(out/'source-%02d.jpg')],check=True)
