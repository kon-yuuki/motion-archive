import { trace } from './assets/trace.js';
import numeralSVG from './assets/numeral-outline.svg?raw';
const drawerURL = new URL('./assets/original-drawer.webp', import.meta.url).href;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value);return p*p*(3-2*p); };
function sample(time, points) {
  if (time <= points[0][0]) return points[0][1];
  for(let i=1;i<points.length;i++) if(time<=points[i][0]) {const [a,b]=[points[i-1],points[i]], p=smooth((time-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*p;}
  return points.at(-1)[1];
}
// Source-fit transforms become underdetermined when virtually all pixels are black.
// Keep the measured trajectory through 3.176s, then continue into full coverage explicitly.
const trajectory = [...trace.filter(frame => frame.time <= 3.176), {time:3.573,scale:18.47407,rotationDegrees:79.50701,translateX:-216.67844,translateY:-3}, {time:3.78,scale:21,rotationDegrees:90,translateX:-248,translateY:0}];
function transformAt(time, key) { return sample(time, trajectory.map(frame => [frame.time, frame[key]])); }
/** Frame-traced 8 zoom/rotation plus a dark photographic drawer reveal; scroll mapping is a demo choice. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `<section class="numeral-mask"><div class="numeral-mask__scroller" tabindex="0" role="region" aria-label="数字の8から製品へ。中でスクロール、または上下キーで操作"><div class="numeral-mask__runway"><div class="numeral-mask__scene"><div class="numeral-mask__start" aria-label="黄色い背景に黒い8"><div class="numeral-mask__glyph" aria-hidden="true">${numeralSVG}</div></div><div class="numeral-mask__destination" aria-hidden="true"><img class="numeral-mask__product" src="${drawerURL}" alt="細い黒い側面と金属の縁を持つ引き出しのオリジナル製品レンダー"><div class="numeral-mask__copy"><h2>8 millimetres that<br>change the furniture<br>world.</h2><p>A narrower side. A larger space within.<br>A study in precision, material and movement.<br>Dark surfaces bring the fine metal edge<br>into focus as the next story appears.</p><span>FIND OUT MORE <b>＋</b></span></div></div><div class="numeral-mask__source-progress" aria-hidden="true"></div></div></div></div><footer><button type="button" data-next>次のセクションへ →</button><label>進み具合 <input type="range" min="0" max="1000" step="1" value="0" aria-label="数字の拡大から製品表示までの進み具合"></label><span data-state role="status" aria-live="polite">Numeral</span></footer></section>`;
  const section=root.firstElementChild, scroller=root.querySelector('.numeral-mask__scroller'),runway=root.querySelector('.numeral-mask__runway'),scene=root.querySelector('.numeral-mask__scene');
  const start=root.querySelector('.numeral-mask__start'),glyph=root.querySelector('.numeral-mask__glyph path'),destination=root.querySelector('.numeral-mask__destination'),product=root.querySelector('.numeral-mask__product'),copy=root.querySelector('.numeral-mask__copy'),line=root.querySelector('.numeral-mask__source-progress');
  const range=root.querySelector('input'),status=root.querySelector('[data-state]'),next=root.querySelector('[data-next]'),events=new AbortController();
  let raf=0,progress=0,destroyed=false,lastState='',automatic=false;
  const distance=()=>Math.max(1,runway.clientHeight-scroller.clientHeight);
  const ready=Promise.all([...root.querySelectorAll('img')].map(img=>img.decode())).catch(()=>{if(!destroyed)status.textContent='画像を読み込めませんでした';});
  function render(p) {
    if(destroyed)return;
    progress=clamp(p);const t=progress*6.75,scale=transformAt(t,'scale'),rotation=transformAt(t,'rotationDegrees');
    const tx=transformAt(t,'translateX')/1600*100,ty=transformAt(t,'translateY')/1200*100;
    glyph.setAttribute('transform',reducedMotion?'':`translate(${800+tx*16} ${600+ty*12}) rotate(${rotation}) scale(${scale}) translate(-800 -600)`);
    const productY=sample(t,[[3.573,95],[3.970,64],[4.367,47],[4.764,35],[5.161,23],[5.558,10],[5.955,1],[6.352,0]]);
    const copyY=sample(t,[[4.85,55],[5.161,25.92],[5.558,8.25],[5.955,.083],[6.352,0]]);
    const isNext=reducedMotion?progress>=.5:t>=3.78;
    start.style.visibility=isNext?'hidden':'visible';start.setAttribute('aria-hidden',String(isNext));
    destination.style.visibility=(reducedMotion?isNext:t>=3.45)?'visible':'hidden';
    destination.style.background=(reducedMotion||t>=3.78)?'#000':'transparent';
    destination.setAttribute('aria-hidden',String(!isNext));
    product.style.transform=`translate(-3.9%,${reducedMotion?-2.5:-2.5+productY}%) skewY(-2.5deg)`;
    product.style.opacity=reducedMotion?'1':String(sample(t,[[3.45,0],[3.7,1]]));
    copy.style.transform=reducedMotion?'none':`translateY(${copyY/100*scene.clientHeight}px)`;
    copy.style.visibility=(reducedMotion?isNext:t>=4.85)?'visible':'hidden';
    line.style.width=`${32.5+progress*4}%`;
    const phase=reducedMotion?(isNext?'destination':'numeral'):t<.15?'numeral':t<3.5?'zoom':t<3.97?'black-hold':t<4.85?'product':t<6.352?'copy':'destination';
    section.dataset.phase=phase;section.dataset.elapsed=(t*1000).toFixed(1);root.dataset.progress=progress.toFixed(3);
    range.value=String(Math.round(progress*1000));
    if(lastState!==phase){status.textContent=({numeral:'Numeral',zoom:'Growing 8', 'black-hold':'Black hold',product:'Drawer',copy:'Product story',destination:'Next section'})[phase];lastState=phase;}
    next.textContent=progress>.98?'数字へ戻る →':'次のセクションへ →';
  }
  function stop(){cancelAnimationFrame(raf);raf=0;automatic=false;if(!destroyed)render(scroller.scrollTop/distance());}
  function setProgress(p){progress=clamp(p);scroller.scrollTop=progress*distance();render(progress);}
  function travel(target){
    stop();const from=progress;
    if(reducedMotion){setProgress(target);return;}
    automatic=true;const began=performance.now(),duration=Math.max(300,Math.abs(target-from)*6750);
    const tick=now=>{if(destroyed)return;const p=clamp((now-began)/duration);setProgress(from+(target-from)*p);if(p<1)raf=requestAnimationFrame(tick);else{raf=0;automatic=false;}};
    raf=requestAnimationFrame(tick);
  }
  scroller.addEventListener('scroll',()=>{if(!automatic)render(scroller.scrollTop/distance());},{signal:events.signal,passive:true});
  ['wheel','pointerdown','touchstart'].forEach(type=>scroller.addEventListener(type,stop,{signal:events.signal,passive:true}));
  scroller.addEventListener('keydown',event=>{
    const moves={ArrowDown:.045,ArrowUp:-.045,PageDown:.16,PageUp:-.16,' ':.16};
    if(event.key in moves||event.key==='Home'||event.key==='End'){event.preventDefault();stop();setProgress(event.key==='Home'?0:event.key==='End'?1:progress+moves[event.key]);}
  },{signal:events.signal});
  range.addEventListener('input',()=>{stop();setProgress(Number(range.value)/1000);},{signal:events.signal});
  next.addEventListener('click',()=>travel(progress>.98?0:1),{signal:events.signal});
  const resize=new ResizeObserver(()=>{if(!destroyed)setProgress(progress);});resize.observe(scroller);
  function reset(){stop();setProgress(0);}
  function replay(){reset();travel(1);}
  function seek(ms){stop();setProgress(ms/6750);}
  function destroy(){if(destroyed)return;destroyed=true;stop();resize.disconnect();events.abort();signal?.removeEventListener('abort',destroy);}
  signal?.addEventListener('abort',destroy,{once:true});reset();
  return {replay,reset,destroy,seek,ready};
}
