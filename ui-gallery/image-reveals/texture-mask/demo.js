let nextId = 0;
const asset = name => new URL(`./assets/${name}.webp`, import.meta.url).href;
const families = [
  {word:'edstal',finish:'Silver',key:'silver',width:980,copy:'Brushed stainless steel brings a quiet, durable surface to everyday spaces. Fine lines catch the light while simple forms keep the details clear. Explore the silver finish across taps, dispensers and wall fittings. A restrained collection for busy shared interiors.',codes:['S-01','S-02','S-03']},
  {word:'koveta',finish:'Black',key:'black',width:1050,copy:'A matte black finish gives each object a clear silhouette. Soft reflections reveal subtle surface details without a high shine. Discover curved taps, angular forms and simple wall fittings in this collection.',codes:['N-01','N-02','N-03']},
  {word:'iflusse',finish:'Brass',key:'brass',width:1050,copy:'Warm brushed brass brings a golden tone to familiar forms. The surface shifts gently between light and shade. Explore refined wall fittings, a compact tap and a curved silhouette in this collection. Each detail keeps the material at the heart of the design.',codes:['L-01','L-02','L-03']},
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** An irregular material ribbon spans most of the word; it is not a pointer ellipse.
 * Broad boundary samples are visually reconstructed from the source recording.
 * The original shader, input mapping and damping are unknown.
 */
export function createDemo(root,{signal,reducedMotion=false}={}) {
 const id=`material-ribbon-${++nextId}`;
 root.innerHTML=`<section class="texture-mask" aria-label="広い不規則な帯を通して文字の金属素材を見るデモ"><div class="texture-mask__scene"><header class="texture-mask__nav" aria-hidden="true"><b>sur<br>face/</b><span>☰</span></header><svg class="texture-mask__word" viewBox="0 0 1600 460" tabindex="0" role="img" aria-label="edstal の文字。左右キーで素材を動かせます"><defs><mask id="${id}-glyph" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="460"><text x="800" y="403" text-anchor="middle" font-family="Arial,sans-serif" font-size="365" font-weight="400" fill="white" stroke="white" stroke-width="7" textLength="980" lengthAdjust="spacingAndGlyphs" data-word>edstal</text></mask><mask id="${id}-band" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="460"><path data-band fill="#fff"/></mask></defs><g mask="url(#${id}-glyph)"><rect width="1600" height="460" fill="#fff"/><image data-material-image x="275" y="130" width="1050" height="330" preserveAspectRatio="xMidYMid slice" href="${asset('original-silver-texture-v2')}" mask="url(#${id}-band)"/></g></svg><hr class="texture-mask__rule"><div class="texture-mask__finishes" aria-label="素材の仕上げ">${families.map((m,i)=>`<button type="button" data-material="${i}" aria-label="${m.finish} の素材" aria-pressed="${i===0}"><span style="background:${['#999','#303235','#c99f20'][i]}"></span></button>`).join('')}</div><p class="texture-mask__copy"></p><div class="texture-mask__products"></div></div><div class="texture-mask__controls"><label>素材 <select aria-label="素材の仕上げを選ぶ">${families.map((m,i)=>`<option value="${i}">${m.finish}</option>`).join('')}</select></label><button type="button" data-hold aria-pressed="false">素材の帯を固定</button><label>帯の位置 <input type="range" min="0" max="100" value="50" aria-label="素材の帯の位置"></label><span role="status" aria-live="polite"></span></div></section>`;
 const stage=root.firstElementChild,svg=root.querySelector('svg'),band=root.querySelector('[data-band]'),texture=root.querySelector('[data-material-image]'),word=root.querySelector('[data-word]'),copy=root.querySelector('.texture-mask__copy'),products=root.querySelector('.texture-mask__products'),status=root.querySelector('[role=status]'),hold=root.querySelector('[data-hold]'),range=root.querySelector('input'),select=root.querySelector('select'),buttons=[...root.querySelectorAll('[data-material]')];
 const lifecycle=new AbortController();let selected=0,x=570,y=216,targetX=x,targetY=y,visibility=0,targetVisibility=0,pinned=false,hovered=false,focused=false,frame=0,last=0,previewStart=null,destroyed=false;
 const on=(el,type,fn)=>el.addEventListener(type,fn,{signal:lifecycle.signal});
 function path(){
  // Base ribbon traces the silver recording near source 1.76 s: broad lower
  // left lobe, narrower central turn, then upper right lobe. Input deforms the
  // whole band smoothly instead of placing a circle under the pointer.
  const centers=[570,1066,300];
  const origin=centers[selected];
  const shift=(x-origin)*(selected===2?.8:.12),phase=selected===2?0:(x-origin)/640,bias=(y-(selected===1?388:selected===2?290:216))*.27+(selected===2?clamp((x-300)/610,0,1)*120:0);
  const shapes=[
    {upper:[[470,255],[530,275],[600,300],[760,318],[880,292],[960,204],[1100,191],[1235,137],[1340,218]],lower:[[470,308],[530,375],[600,405],[760,421],[880,398],[960,370],[1100,289],[1235,309],[1340,351]]},
    {upper:[[280,320],[400,250],[530,180],[680,210],[830,235],[980,205],[1130,190],[1270,270],[1370,210]],lower:[[280,365],[400,400],[530,310],[680,285],[830,325],[980,285],[1130,330],[1270,390],[1370,300]]},
    {upper:[[350,125],[430,105],[525,130],[625,170],[700,225],[745,260],[790,300],[850,350],[900,400]],lower:[[350,220],[430,205],[525,235],[625,320],[700,385],[745,420],[790,440],[850,435],[900,445]]},
  ];
  const {upper,lower}=shapes[selected];
  const change=(p,i,lowerEdge)=>[p[0]+shift,p[1]+bias+Math.sin(phase*3+i*.9)*44+(lowerEdge?1:-1)*Math.sin(phase+i*.8)*12+(selected===1?(lowerEdge?20:-10):0)];
  const a=upper.map((p,i)=>change(p,i,false)),b=lower.map((p,i)=>change(p,i,true)).reverse();
  const points=[...a,...b];
  // Quadratic through-midpoint smoothing gives multiple asymmetric lobes.
  let d=`M${(points[0][0]+points.at(-1)[0])/2},${(points[0][1]+points.at(-1)[1])/2}`;
  points.forEach((p,i)=>{const n=points[(i+1)%points.length];d+=` Q${p[0]},${p[1]} ${(p[0]+n[0])/2},${(p[1]+n[1])/2}`;});return d+'Z';
 }
 function draw(){
  band.setAttribute('d',path());texture.setAttribute('opacity',String(reducedMotion?1:visibility));
  if(reducedMotion)texture.removeAttribute('mask');else texture.setAttribute('mask',`url(#${id}-band)`);
  stage.dataset.bandVisible=String(reducedMotion||visibility>.01);stage.dataset.material=families[selected].key;stage.dataset.position=`${x.toFixed(2)},${y.toFixed(2)}`;
 }
 function wake(){if(!frame&&!destroyed&&!reducedMotion)frame=requestAnimationFrame(tick);else if(reducedMotion)draw();}
 function tick(now){
  if(destroyed)return;const dt=Math.min(48,now-(last||now-16));last=now;
  if(previewStart!==null){const p=clamp((now-previewStart)/1700,0,1);targetX=350+p*850;targetY=210+Math.sin(p*Math.PI*2)*70;targetVisibility=1;if(p===1){previewStart=null;targetVisibility=pinned||hovered||focused?1:0;}}
  const blend=1-Math.exp(-dt/105);x+=(targetX-x)*blend;y+=(targetY-y)*blend;visibility+=(targetVisibility-visibility)*(1-Math.exp(-dt/160));draw();
  if(previewStart!==null||Math.abs(x-targetX)+Math.abs(y-targetY)+Math.abs(visibility-targetVisibility)*100>.05)frame=requestAnimationFrame(tick);else{frame=0;last=0;}
 }
 function move(nx,ny=216){previewStart=null;targetX=clamp(nx,200,1400);targetY=clamp(ny,100,410);targetVisibility=1;wake();}
 function point(event){const r=svg.getBoundingClientRect();return[(event.clientX-r.left)/r.width*1600,(event.clientY-r.top)/r.height*460];}
 function setMaterial(index){selected=index;select.value=String(index);const m=families[index];word.textContent=m.word;word.setAttribute('textLength',String(m.width));texture.setAttribute('href',asset(`original-${m.key}-texture${index===0?'-v2':''}`));svg.setAttribute('aria-label',`${m.word} の文字。左右キーで素材を動かせます`);copy.textContent=m.copy;products.innerHTML=m.codes.map((code,i)=>`<figure><figcaption>${code}</figcaption><img src="${asset(`original-${m.key}-product-${i+1}`)}" alt="${m.finish} のオリジナル製品写真 ${i+1}"></figure>`).join('');buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));status.textContent=`${m.word} / ${m.finish}`;draw();}
 on(svg,'pointerenter',e=>{if(e.pointerType==='touch')return;hovered=true;move(...point(e));});
 on(svg,'pointermove',e=>{if(pinned)return;hovered=true;move(...point(e));});
 const leave=()=>{hovered=false;if(!pinned&&!focused){targetVisibility=0;wake();}};on(svg,'pointerleave',leave);on(svg,'pointercancel',leave);
 on(svg,'click',e=>{if(e.pointerType==='touch'||e.detail){pinned=true;hold.setAttribute('aria-pressed','true');move(...point(e));}});
 on(svg,'focus',()=>{focused=true;targetVisibility=1;wake();});on(svg,'blur',()=>{focused=false;leave();});
 on(svg,'keydown',e=>{if(['ArrowLeft','ArrowRight','Escape',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')move(targetX+(e.key==='ArrowLeft'?-90:90));if(e.key==='Escape'){pinned=false;targetVisibility=0;hold.setAttribute('aria-pressed','false');wake();}if(e.key===' '){pinned=!pinned;hold.setAttribute('aria-pressed',String(pinned));targetVisibility=pinned?1:0;wake();}});
 on(select,'change',()=>{previewStart=null;setMaterial(Number(select.value));targetVisibility=1;wake();});
 buttons.forEach((button,index)=>on(button,'click',()=>{previewStart=null;setMaterial(index);targetVisibility=1;wake();}));
 on(hold,'click',()=>{pinned=!pinned;hold.setAttribute('aria-pressed',String(pinned));targetVisibility=pinned||hovered||focused?1:0;wake();});
 on(range,'input',()=>{pinned=true;hold.setAttribute('aria-pressed','true');move(200+Number(range.value)*12);});
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;previewStart=null;}
 function reset(){if(destroyed)return;stop();pinned=hovered=focused=false;visibility=targetVisibility=0;x=targetX=570;y=targetY=216;hold.setAttribute('aria-pressed','false');range.value='50';setMaterial(0);draw();}
 function replay(){if(destroyed)return;reset();if(reducedMotion)return;previewStart=performance.now();wake();}
 function sample(index=0,nx=570,ny=216,visible=1){if(destroyed)return;stop();setMaterial(index);x=targetX=nx;y=targetY=ny;visibility=targetVisibility=visible;draw();}
 function destroy(){if(destroyed)return;destroyed=true;stop();lifecycle.abort();signal?.removeEventListener('abort',destroy);}
 signal?.addEventListener('abort',destroy,{once:true});reset();if(signal?.aborted)destroy();return {replay,reset,destroy,sample};
}
