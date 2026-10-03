from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json
root=Path('../motion-benchmark-correction/icon-audit'); samples=json.loads((root/'replica/samples.json').read_text()); times=[0,300,600,800,1200,1600,1800]; out=Image.new('RGB',(1180,180+len(times)*235),'#f6f5f0'); d=ImageDraw.Draw(out); font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18); small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
d.text((20,18),'Joseph Berry / Hall of Fame — recorded source vs corrected trace',font=font,fill='#111');d.text((20,49),'Same 918 × 656 recording bounds. Source left, local Chromium right. WIP; glyphs differ by OS.',font=small,fill='#444');d.text((20,73),'30fps source; sampled timings/colors, not original CSS. Source cursor is excluded from the implementation.',font=small,fill='#444');d.text((20,97),'Source yellow, white/blue capsule, four flames and observed sequence restored. No selection toggle.',font=small,fill='#444')
for n,time in enumerate(times):
 s=next((s for s in samples if s['requestedTime']==time),None); actual=time; fi=min(74,1+round(actual*30/1000)); src=Image.open(root/f'source/frame-{fi:03}.png').convert('RGB'); rep=Image.open(root/f'replica/aligned-{time:04}.png').convert('RGB'); y=140+n*235;d.text((20,y),f'{actual}ms: recorded frame {fi} / replica rendered time',font=small,fill='#333')
 for x,img in [(20,src),(610,rep)]: out.paste(img.crop((300,268,620,392)).resize((540,209)),(x,y+25))
out.save(root/'source-replica-sequence.png')
