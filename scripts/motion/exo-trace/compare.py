"""Assemble already-captured source and local phases without pixel-fidelity claims."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os

root = Path(os.getenv('EXO_EVIDENCE_ROOT', '../motion-benchmark-correction'))
source = root / 'remaining-live-audit'
local = root / 'exo-corrections'
pairs = [
    ('03-exo-menu-stable.png', 'menu-rest.png', 'Menu / resting frame. Photography and font are substitutions.'),
    ('exo-menu-studio-1.png', 'menu-80.png', 'Menu / incoming rotation + crossfade. Similar phase, NOT synchronized trigger time.'),
    ('exo-menu-studio-5.png', 'menu-1020.png', 'Menu / settled frame. Same aspect and position, different photo.'),
    ('exo-reel-intermediate.png', 'reel-expansion-481.png', 'Reel / p = 0.481: scale 0.611, text converges from both sides.'),
    ('exo-reel-mid.png', 'reel-expansion-981.png', 'Reel / p = 0.981: scale 0.986, text almost joined.'),
    ('exo-footer-mid.png', 'underlapping-footer-431.png', 'Footer / boundary y = 439: separate text and background displacement.'),
    ('exo-footer-enter.png', 'underlapping-footer-994.png', 'Footer / boundary y = 23: original orbital material substitutes source video.'),
]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
for i,(a,b,caption) in enumerate(pairs,1):
    sheet=Image.new('RGB',(1180,445),'#eeeae3')
    draw=ImageDraw.Draw(sheet)
    draw.text((12,8),'SOURCE — exoape.com / 2026-10-02',fill='#161616',font=font)
    draw.text((602,8),'LOCAL — source-mapped study',fill='#161616',font=font)
    for x,p in [(0,source/a),(590,local/b)]:
        im=Image.open(p).convert('RGB').crop((0,0,1180,757)).resize((590,378),Image.Resampling.LANCZOS)
        sheet.paste(im,(x,34))
    draw.text((12,421),caption,fill='#161616',font=font)
    sheet.save(local/f'comparison-{i:02}.jpg',quality=95)
print('Created 7 labeled source/local phase comparisons')
