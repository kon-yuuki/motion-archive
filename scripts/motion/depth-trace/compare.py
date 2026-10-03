"""Diagnostic comparisons only. Source video pixels never enter runtime assets."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess,json
out=Path('../motion-benchmark-correction/depth-correction')
source=Path('../motion-benchmark-correction/remaining-recorded-audit/depth-tunnel/source.mp4')
checks=[(0,0),(1.6,.1),(2.5,.16),(3.36,.21),(4.8,.30),(7.6,.475),(9,.5625),(10.8,.675),(11.8,.7375),(12.6,.7875),(13.4,.8375),(15,.9375)]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
rows=[]
for t,p in checks:
 src=out/'source'/f'{t}.png'
 if not src.exists():subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(source),'-frames:v','1','-y',str(src)],check=True)
 canvas=Image.new('RGB',(1600,630),'#eeeee8');d=ImageDraw.Draw(canvas)
 d.text((12,7),f'SOURCE / media {t:.2f}s',font=font,fill='#222222');d.text((812,7),f'RECONSTRUCTION / local scroll {p:.4f}',font=font,fill='#222222')
 for x,path in [(0,src),(800,out/f'render-{p:.4f}.png')]:canvas.paste(Image.open(path).convert('RGB').resize((800,600)),(x,30))
 canvas.save(out/f'compare-{p:.4f}.jpg',quality=93);rows.append(canvas.resize((960,378)))
for group in range(3):
 sheet=Image.new('RGB',(960,1512),'white')
 for i,row in enumerate(rows[group*4:group*4+4]):sheet.paste(row,(0,i*378))
 sheet.save(out/f'comparison-sheet-{group+1}.jpg',quality=94)
(out/'comparison-map.json').write_text(json.dumps([{'sourceSeconds':t,'localProgress':p,'status':'Estimated stage alignment; not measured source scroll progress'} for t,p in checks],indent=2))
