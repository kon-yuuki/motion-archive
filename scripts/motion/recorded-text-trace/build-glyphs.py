"""Generate permitted substitute outlines and their actual control handles, not source-site glyph assets."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.basePen import BasePen
from pathlib import Path
import json
p=Path('ui-gallery/text-reveals/character-xray/assets')
class Handles(BasePen):
 def __init__(self,gs):super().__init__(gs);self.nodes=[];self.lines=[];self.at=None
 def _moveTo(self,q):self.at=q;self.nodes.append(q)
 def _lineTo(self,q):self.at=q;self.nodes.append(q)
 def _curveToOne(self,c1,c2,q):self.lines.extend([(self.at,c1),(c2,q)]);self.nodes.append(q);self.at=q
 def _qCurveToOne(self,c,q):self.lines.extend([(self.at,c),(c,q)]);self.nodes.append(q);self.at=q
 def _closePath(self):pass
 def _endPath(self):pass
out=[]
for char,filename,box in [('漏','noto-serif-subset.otf',(626,560,350,330)),('a','bodoni-moda-latin.ttf',(650,555,317,338)),('@','cormorant-garamond-italic.ttf',(620,593,380,270)),('b','bodoni-moda-latin.ttf',(667,547,265,355)),('©','bodoni-moda-latin.ttf',(638,555,323,342))]:
 f=TTFont(p/filename)
 if 'fvar' in f:f=instantiateVariableFont(f,{a.axisTag:(96 if a.axisTag=='opsz' else 500 if char=='@' else 400) for a in f['fvar'].axes})
 gs=f.getGlyphSet();g=gs[f.getBestCmap()[ord(char)]];b=BoundsPen(gs);g.draw(b);x0,y0,x1,y1=b.bounds;x,y,w,h=box;sx=w/(x1-x0);sy=h/(y1-y0);t=(sx,0,0,-sy,x-x0*sx,y+y1*sy)
 svg=SVGPathPen(gs);g.draw(TransformPen(svg,t));hand=Handles(gs);g.draw(TransformPen(hand,t));fmt=lambda a:','.join(str(round(v,2)) for v in a)
 out.append({'char':char,'d':svg.getCommands(),'nodes':[[round(v,2) for v in q] for q in hand.nodes],'handles':' '.join('M'+fmt(a)+'L'+fmt(b) for a,b in hand.lines)})
(p/'glyphs.js').write_text('export const glyphs = '+json.dumps(out,separators=(',',':'))+';\n')
