from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
root=Path('../motion-benchmark-correction/checker-correction');out=Image.new('RGB',(1000,155+7*130),'#f6f5f0');d=ImageDraw.Draw(out);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
d.text((18,15),'Noomo / View project — source recording and reconstructed CSS mask',font=font,fill='#111');d.text((18,44),'Source left. Replica right. 3× enlarged crops; matching phases estimated, not event-synchronized.',font=small,fill='#444');d.text((18,66),'Source NeueMachina / replica Space Mono. Current public CSS corroborates600ms mask + delayed300ms base fade.',font=small,fill='#444');d.text((18,88),'Original mask bitmap not bundled: reconstructed vector edge may differ in antialiasing. WIP.',font=small,fill='#444')
# Approximate recording enter0.20s, exit1.40s; the event origin is not directly recorded.
frames=[(1,'rest.png','Rest'),(13,'enter-200.png','Entering / phase~200ms'),(15,'enter-250.png','Entering / phase~250ms'),(17,'enter-350.png','Entering / phase~350ms'),(25,'enter-600.png','Hover endpoint'),(50,'exit-250.png','Exit / phase~250ms'),(56,'exit-400.png','Exit / phase~400ms')]
# Exit250 wasn't captured; retain nearest recorded local200 to avoid fabrication.
frames[5]=(48,'exit-250.png','Exit / phase~250ms')
frames[6]=(53,'exit-400.png','Exit / phase~400ms')
for i,(fi,name,label) in enumerate(frames):
 src=Image.open(root/f'source/frame-{fi:03}.png').convert('RGB').crop((718,877,883,932));rep=Image.open(root/'replica'/name).convert('RGB').crop((118,93,283,148));y=122+i*130;d.text((18,y),f'{label}; source frame{fi} ({(fi-1)/30:.3f}s)',font=small,fill='#333');out.paste(src.resize((495,165)),(0,y+18));out.paste(rep.resize((495,165)),(505,y+18))
# Rows use exact isotropic3×, so expand spacing before output if needed.
out2=Image.new('RGB',(1000,122+len(frames)*190),'#f6f5f0');out2.paste(out.crop((0,0,1000,115)),(0,0));dd=ImageDraw.Draw(out2)
for i,(fi,name,label) in enumerate(frames):
 y=122+i*190;dd.text((18,y),f'{label}; source frame{fi} ({(fi-1)/30:.3f}s)',font=small,fill='#333');src=Image.open(root/f'source/frame-{fi:03}.png').convert('RGB').crop((718,877,883,932));rep=Image.open(root/'replica'/name).convert('RGB').crop((118,93,283,148));out2.paste(src.resize((495,165)),(0,y+18));out2.paste(rep.resize((495,165)),(505,y+18))
out2.save(root/'comparison.png')
