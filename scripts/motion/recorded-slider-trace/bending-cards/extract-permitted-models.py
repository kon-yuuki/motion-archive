"""Prune ONLY independently verified CC-BY models and their binary resources.
No paid cake, NC sandwich or unknown-license ramen bytes are copied.
"""
import json,struct,pathlib,copy
repo=pathlib.Path(__file__).resolve().parents[4]
src=repo.parent/'motion-benchmark-correction/slider-corrections/bending-cards/source-model-reference.glb'
b=src.read_bytes();jl=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+jl]);binary=b[28+jl:]
for name in ['fish-a','hotdog-a','fungus-a']:
 d=copy.deepcopy(j); keep={k:set() for k in ['nodes','meshes','skins','materials','textures','images','samplers','accessors','bufferViews']}
 root=next(i for i,n in enumerate(d['nodes']) if n.get('name')==name)
 def node(i):
  if i in keep['nodes']:return
  keep['nodes'].add(i)
  for k in d['nodes'][i].get('children',[]):node(k)
 node(root)
 for i in list(keep['nodes']):
  n=d['nodes'][i]
  if 'mesh'in n:keep['meshes'].add(n['mesh'])
  if 'skin'in n:keep['skins'].add(n['skin'])
 for i in keep['skins']:
  s=d['skins'][i]
  for n in s['joints']:node(n)
  if 'skeleton'in s:node(s['skeleton'])
  if 'inverseBindMatrices'in s:keep['accessors'].add(s['inverseBindMatrices'])
 for i in keep['meshes']:
  for p in d['meshes'][i]['primitives']:
   keep['accessors'].update(p['attributes'].values())
   if 'indices'in p:keep['accessors'].add(p['indices'])
   if 'material'in p:keep['materials'].add(p['material'])
 def textures(obj,remap=False):
  if isinstance(obj,dict):
   for k,v in obj.items():
    if k.endswith('Texture') and isinstance(v,dict) and 'index'in v:
     if remap:v['index']=maps['textures'][v['index']]
     else:keep['textures'].add(v['index'])
    else:textures(v,remap)
  elif isinstance(obj,list):
   for v in obj:textures(v,remap)
 for i in keep['materials']:textures(d['materials'][i])
 for i in keep['textures']:
  for k,cat in [('source','images'),('sampler','samplers')]:
   if k in d['textures'][i]:keep[cat].add(d['textures'][i][k])
 for i in keep['images']:keep['bufferViews'].add(d['images'][i]['bufferView'])
 for i in keep['accessors']:
  if 'bufferView'in d['accessors'][i]:keep['bufferViews'].add(d['accessors'][i]['bufferView'])
 maps={k:{old:new for new,old in enumerate(sorted(v))} for k,v in keep.items()}
 out={'asset':d['asset'],'scene':0,'scenes':[{'nodes':[maps['nodes'][root]]}],**{k:[d[k][i] for i in sorted(v)] for k,v in keep.items()}}
 out['extensionsUsed']=d.get('extensionsUsed',[])
 for n in out['nodes']:
  if 'children'in n:n['children']=[maps['nodes'][i]for i in n['children']]
  for k,cat in [('mesh','meshes'),('skin','skins')]:
   if k in n:n[k]=maps[cat][n[k]]
 for s in out['skins']:
  s['joints']=[maps['nodes'][i] for i in s['joints']]
  for k,cat in [('skeleton','nodes'),('inverseBindMatrices','accessors')]:
   if k in s:s[k]=maps[cat][s[k]]
 for m in out['meshes']:
  for p in m['primitives']:
   p['attributes']={k:maps['accessors'][v]for k,v in p['attributes'].items()}
   for k,cat in [('indices','accessors'),('material','materials')]:
    if k in p:p[k]=maps[cat][p[k]]
 for m in out['materials']:textures(m,True)
 for t in out['textures']:
  for k,cat in [('source','images'),('sampler','samplers')]:
   if k in t:t[k]=maps[cat][t[k]]
 for cat in ['images','accessors']:
  for a in out[cat]:
   if 'bufferView'in a:a['bufferView']=maps['bufferViews'][a['bufferView']]
 chunks=[];offset=0
 for v in out['bufferViews']:
  segment=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];segment+=b'\0'*(-len(segment)%4)
  v['byteOffset']=offset;v['buffer']=0;chunks.append(segment);offset+=len(segment)
 blob=b''.join(chunks);out['buffers']=[{'byteLength':len(blob)}]
 jb=json.dumps(out,separators=(',',':')).encode();jb+=b' '*(-len(jb)%4)
 result=struct.pack('<III',0x46546c67,2,28+len(jb)+len(blob))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(blob),0x004e4942)+blob
 target=repo/'ui-gallery/sliders/bending-cards/assets'/f'{name}.glb';target.write_bytes(result);print(name,len(result),len(out['images']))
