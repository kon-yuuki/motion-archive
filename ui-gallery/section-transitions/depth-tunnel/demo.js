import { createDepthScene, sceneAt } from './scene.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};

/** One progress coordinate drives camera, physical rooms, astronaut and typography. */
export function createDemo(root,{signal,reducedMotion=false}={}) {
  root.innerHTML=`<section class="depth-tunnel">
    <div class="depth-tunnel__scroller" role="region" tabindex="0" aria-label="奥行きの場面を進む。上下キー、Page Up、Page Down、Home、Endで操作できます">
      <div class="depth-tunnel__runway"><div class="depth-tunnel__sticky">
        <canvas class="depth-tunnel__canvas" aria-hidden="true"></canvas>
        <div class="depth-tunnel__lens" aria-hidden="true"></div>
        <div class="depth-tunnel__nav" aria-hidden="true"><span>DEPTH</span><div><i>−</i><b>LET’S TALK ·</b><em>MENU ••</em></div></div>
        <div class="depth-tunnel__entry" aria-hidden="true">STEP INTO A NEW WORLD<br>AND LET YOUR<br>IMAGINATION RUN WILD</div>
        <div class="depth-tunnel__contact" aria-hidden="true"><p>IS YOUR BIG IDEA READY TO GO WILD?</p><h2>Let’s work<br>together!</h2><span>↓ &nbsp; CONTINUE TO SCROLL &nbsp; ↓</span></div>
        <span class="depth-tunnel__loading" role="status">3Dシーンを準備しています</span>
      </div></div>
    </div>
    <footer class="depth-tunnel__controls"><button type="button" data-next>次の場面へ →</button><label>進み具合 <input type="range" min="0" max="1000" step="1" value="0" aria-label="シーンの進み具合"></label><output data-progress>0%</output><span data-scene role="status" aria-live="polite">宇宙飛行士と巨大文字</span></footer>
    <p class="depth-tunnel__warning">調整中: クラウドでの連続再生は途中の場面が飛び、止まることがあります。滑らかな連続動作は未達です。進み具合のスライダーで各場面を確認できます。</p>
    <p class="depth-tunnel__credit">3D suit: <a href="https://science.nasa.gov/3d-resources/extravehicular-mobility-unit/" target="_blank" rel="noopener noreferrer">NASA / Michael D. Carbajal</a> · 材質を変更した代替モデル。元の人物アニメーションとは異なります</p>
  </section>`;
  const scroller=root.querySelector('.depth-tunnel__scroller'),runway=root.querySelector('.depth-tunnel__runway'),stage=root.querySelector('.depth-tunnel__sticky'),canvas=root.querySelector('canvas'),entry=root.querySelector('.depth-tunnel__entry'),contact=root.querySelector('.depth-tunnel__contact'),lens=root.querySelector('.depth-tunnel__lens'),range=root.querySelector('input'),output=root.querySelector('[data-progress]'),status=root.querySelector('[data-scene]'),next=root.querySelector('[data-next]'),loading=root.querySelector('.depth-tunnel__loading');
  const events=new AbortController();let scene,raf=0,travelRaf=0,disposed=false,oldLabel='',savedProgress=0;let width=0,height=0;
  const stops=[0,.21,.32,.47,.56,.735,.80,.84,1];
  const distance=()=>Math.max(1,runway.offsetHeight-scroller.clientHeight);
  function render(){
    cancelAnimationFrame(raf);raf=0;if(disposed)return;
    const p=clamp(scroller.scrollTop/distance()),visual=reducedMotion?(p<.5?0:1):p;savedProgress=p;
    root.dataset.progress=p.toFixed(4);root.dataset.visualProgress=visual.toFixed(4);root.dataset.scene=sceneAt(visual);
    scene?.render(visual);
    const introOpacity=smooth(.015,.047,visual)*(1-smooth(.172,.205,visual));const scale=1+Math.pow(smooth(.105,.198,visual),2.1)*28;
    entry.style.opacity=String(introOpacity);entry.style.transform=`translate(-50%,-50%) scale(${scale})`;
    lens.style.opacity=String(smooth(.10,.19,visual)*(1-smooth(.228,.28,visual))*.44);
    lens.style.transform=`translate(-50%,-50%) scale(${.84+smooth(.13,.24,visual)*.30})`;
    const end=smooth(.9,.94,visual);contact.style.opacity=String(end);contact.setAttribute('aria-hidden',String(end<.5));
    range.value=String(Math.round(p*1000));range.setAttribute('aria-valuetext',`${Math.round(p*100)}%、${sceneAt(visual)}`);output.value=`${Math.round(p*100)}%`;
    const label=sceneAt(visual);if(label!==oldLabel){status.textContent=label;oldLabel=label;}
    next.textContent=p>.99?'入口へ戻る →':'次の場面へ →';
  }
  function requestRender(){if(!raf&&!disposed)raf=requestAnimationFrame(render);}
  function stop(){cancelAnimationFrame(travelRaf);travelRaf=0;root.dataset.playing='false';}
  function seek(p){scroller.scrollTop=clamp(p)*distance();render();}
  function travel(to,duration=2400){
    stop();if(reducedMotion){seek(to);return;}
    const from=scroller.scrollTop/distance(),start=performance.now();root.dataset.playing='true';
    function tick(now){if(disposed)return;const t=clamp((now-start)/duration),e=t*t*(3-2*t);seek(from+(to-from)*e);if(t<1)travelRaf=requestAnimationFrame(tick);else stop();}
    travelRaf=requestAnimationFrame(tick);
  }
  scroller.addEventListener('scroll',requestRender,{passive:true,signal:events.signal});
  ['wheel','pointerdown','touchstart'].forEach(type=>scroller.addEventListener(type,stop,{passive:true,signal:events.signal}));
  scroller.addEventListener('keydown',event=>{
    stop();const key=event.key;if(!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(key))return;
    event.preventDefault();const p=scroller.scrollTop/distance();seek(key==='Home'?0:key==='End'?1:p+(key==='ArrowUp'?-.018:key==='ArrowDown'?.018:key==='PageUp'?-.11:event.shiftKey&&key===' '?-.11:.11));
  },{signal:events.signal});
  range.addEventListener('input',()=>{stop();seek(Number(range.value)/1000);},{signal:events.signal});
  range.addEventListener('pointerdown',stop,{signal:events.signal});
  range.addEventListener('keydown',stop,{signal:events.signal});
  next.addEventListener('click',()=>{const p=scroller.scrollTop/distance();travel(stops.find(v=>v>p+.01)??0,1600);},{signal:events.signal});
  function reset(){stop();seek(0);}
  function replay(){reset();travel(1,12000);}
  function resize(){if(disposed)return;const rect=stage.getBoundingClientRect();if(rect.width===width&&rect.height===height)return;width=rect.width;height=rect.height;scene?.resize(Math.round(width),Math.round(height));scroller.scrollTop=savedProgress*distance();requestRender();}
  try{scene=createDepthScene(canvas,{onReady(){if(disposed)return;root.dataset.assetsReady='true';loading.hidden=true;resize();requestRender();},onError(error){if(disposed)return;root.dataset.assetsReady='error';loading.textContent='3Dモデルを読み込めませんでした。ページを再読み込みしてください';console.error('[Depth tunnel]',error);}});}catch(error){root.dataset.webgl='unavailable';loading.textContent='この環境では3D表示を利用できません。出典と再現範囲は下で確認できます';console.warn('[Depth tunnel]',error);}
  const observer=new ResizeObserver(resize);observer.observe(stage);
  const contextLost=event=>{event.preventDefault();stop();loading.hidden=false;loading.textContent='3D表示が中断されました。復帰を待っています';root.dataset.webgl='lost';};
  const contextRestored=()=>{if(disposed)return;root.dataset.webgl='ready';loading.hidden=!scene?.ready;scene?.render(reducedMotion?(savedProgress<.5?0:1):savedProgress,true);resize();requestRender();};
  canvas.addEventListener('webglcontextlost',contextLost,{signal:events.signal});canvas.addEventListener('webglcontextrestored',contextRestored,{signal:events.signal});
  function destroy(){if(disposed)return;disposed=true;stop();cancelAnimationFrame(raf);raf=0;observer.disconnect();events.abort();scene?.destroy();signal?.removeEventListener('abort',destroy);root.dataset.destroyed='true';}
  signal?.addEventListener('abort',destroy,{once:true});if(signal?.aborted)destroy();else{resize();render();}
  return{replay,reset,destroy};
}
