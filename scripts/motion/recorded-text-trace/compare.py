from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys
slug=sys.argv[1];root=Path('../motion-benchmark-correction/text-corrections')/slug
cases={
 'proximity-weight':[('0.000','rest','rest'),('1.914','active-0','pointer / source vs replica position estimated'),('3.829','active-1','pointer intermediate'),('6.222','active-2','pointer intermediate')],
 'blur-dissolve':[('0.000','rest','rest'),('1.150','time-280','280ms after estimated onset'),('1.500','time-650','650ms after estimated onset'),('2.000','time-1130','1130ms after estimated onset'),('2.600','time-1730','1730ms after estimated onset')],
 'character-xray':[('0.000','rest','rest'),('1.380','active-0','lens / CJK glyph'),('3.450','active-1','lens / a glyph'),('5.510','active-2','lens / @ glyph')],
 'contour-ripple':[('0.000','rest','rest'),('1.535','active-0','left local fold'),('2.303','active-1','center local fold'),('3.071','active-2','right local fold')],
 'scan-band-reveal':[('0.000','time-0','initial'),('0.800','time-800','800ms'),('1.340','time-1340','1340ms'),('1.878','time-1878','1878ms'),('2.415','time-2415','2415ms'),('3.220','time-3220','3220ms')]
}
rows=cases[slug]; cellw=560;cellh=400 if slug=='blur-dissolve' else 420
out=Image.new('RGB',(1160,110+len(rows)*(cellh+35)),'#f6f5f0');d=ImageDraw.Draw(out);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
d.text((20,16),slug+' | source recording (left) vs rebuilt independent demo (right)',font=font,fill='#111');d.text((20,43),'WIP. Scene-normalized frame comparison; matching behavior tests alone do not prove fidelity.',font=small,fill='#333');d.text((20,63),'Source fonts / compression / pointer hardware differ. Measurements are encoded video pixels.',font=small,fill='#333')
for i,(s,r,label) in enumerate(rows):
 y=100+i*(cellh+35);d.text((20,y),label,font=small,fill='#333')
 for x,p in [(20,root/'source'/f'{s}.png'),(590,root/'replica'/f'{r}.png')]:
  im=Image.open(p).convert('RGB');im.thumbnail((cellw,cellh));out.paste(im,(x,y+25))
out.save(root/'source-vs-replica.jpg',quality=94)
