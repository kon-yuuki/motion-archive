"""Evidence sheets: unwarped source/local crops at the same 1180px viewport width."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[4]/'motion-benchmark-correction'
src=root/'remaining-live-audit';out=root/'dennis-content-corrections'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
def panel(name,pairs,notes):
 width=2360;height=sum(max(a[1][3]-a[1][1],b[1][3]-b[1][1])+66 for _,a,b in pairs)+70
 sheet=Image.new('RGB',(width,height),'#ededed');draw=ImageDraw.Draw(sheet);y=0
 for title,(sf,sc),(lf,lc) in pairs:
  draw.text((18,y+10),title+' | Source',fill='black',font=font);draw.text((1198,y+10),'Reconstruction | repository photos / Arial substitute',fill='black',font=font)
  a=Image.open(src/sf).convert('RGB').crop(sc);b=Image.open(out/lf).convert('RGB').crop(lc)
  y+=42;sheet.paste(a,(0,y));sheet.paste(b,(1180,y));y+=max(a.height,b.height)+24
 draw.text((18,y+6),notes,fill='black',font=small);sheet.save(out/name)
panel('word-source-vs-local.png',[
 ('Reveal in progress (phase comparison, not synchronized captures)',('dennis-word-native-0.png',(0,276,1180,757)),('local-word-307.png',(0,0,1180,481))),
 ('Near settled',('dennis-word-native-16.png',(0,116,1180,640)),('local-word-766.png',(0,0,1180,524))),
 ('Settled',('dennis-word-native-35.png',(0,104,1180,629)),('local-word-1260.png',(0,0,1180,525)))
], 'Source white-section origins are cropped only; no scaling/warping. Source words, dimensions and composition retained. Copy at right is substituted.')
panel('cursor-source-vs-local.png',[
 ('Second-row preview (source captured during follow)',('dennis-preview-switch.png',(0,0,1180,651)),('local-cursor-source-aligned.png',(0,0,1180,651))),
 ('Three independent followers (different pointer paths / phases)',('dennis-preview-row-hover.png',(0,0,1180,651)),('local-cursor-follow-80.png',(0,140,1180,757)))
], 'First-row crop aligned to source -44.1875px. Photo content is a declared substitute. Source follower and slide constants are not recovered.')
print(out/'word-source-vs-local.png');print(out/'cursor-source-vs-local.png')
