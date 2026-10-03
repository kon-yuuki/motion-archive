from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import subprocess,json,sys
slug=sys.argv[1];base=Path('../motion-benchmark-correction');out=base/'image-corrections'/slug
report=json.loads((out/'verification.json').read_text());pairs=[]
for sample in report['captures']:
 t=sample['sourceTimestamp'];p=out/f'source-{t:.3f}.png'
 if not p.exists():subprocess.run(['ffmpeg','-loglevel','error','-ss',str(t),'-i',str(base/'remaining-recorded-audit'/slug/'source.mp4'),'-frames:v','1',str(p)],check=True)
 pairs.append((t,Image.open(p).convert('RGB'),Image.open(out/f'replica-{t:.3f}.png').convert('RGB')))
w=459;h=round(w*pairs[0][1].height/pairs[0][1].width)
im=Image.new('RGB',(w*2,len(pairs)*(h+28)), '#ffffff');draw=ImageDraw.Draw(im)
for i,(t,source,replica) in enumerate(pairs):
 y=i*(h+28);draw.text((10,y+7),f'SOURCE  {t:.3f}s',fill='#000');draw.text((w+10,y+7),'REPLICA / original photo substitution',fill='#000');im.paste(source.resize((w,h)),(0,y+28));im.paste(replica.resize((w,h)),(w,y+28))
im.save(out/'comparison.png')
