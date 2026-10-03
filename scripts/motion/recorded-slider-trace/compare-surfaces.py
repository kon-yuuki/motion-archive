"""Normalize only the recorded inner page bounds; do not pixel-diff substitute art."""
from pathlib import Path
from PIL import Image, ImageDraw
repo=Path(__file__).resolve().parents[3]
base=repo.parent/'motion-benchmark-correction'
entries=[('bending-cards',[('slider-corrections/bending-cards/source-rest.png','surface-rest.png','Settled rail / independent objects'),('remaining-recorded-audit/bending-cards/source-keyframe.png','surface-bent.png','Moving rail / concave mesh phase')],(102,152,1512,1027)),('ferris-wheel',[('slider-corrections/ferris-wheel/source-broad.png','surface-broad.png','Broad resting painting / neighbors'),('slider-corrections/ferris-wheel/source-narrow.png','surface-narrow.png','Narrow cylindrical phase')],(128,222,1472,978))]
for slug,pairs,bounds in entries:
    out=Image.new('RGB',(1400,920),'white');draw=ImageDraw.Draw(out)
    for row,(source,local,label) in enumerate(pairs):
        a=Image.open(base/source).crop(bounds)
        b=Image.open(base/'slider-corrections'/slug/local)
        for col,im in enumerate([a,b]):out.paste(im.resize((700,430)),(col*700,row*460+28))
        draw.text((8,row*460+8),'SOURCE: '+label,fill='black')
        draw.text((708,row*460+8),'REPLICA: equivalent phase, disclosed asset substitutions',fill='black')
    out.save(base/'slider-corrections'/slug/'comparison.jpg')
