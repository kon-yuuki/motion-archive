import { createOrbit } from './orbit.js';

/** Separate footer text/background counter-translations, measured from the live page. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML=`<section class="underlapping-footer" data-reduced="${reducedMotion}"><div class="underlapping-footer__scroller" tabindex="0" role="region" aria-label="白い面の下から現れるフッター"><div class="underlapping-footer__stack"><article class="underlapping-footer__sheet"><h2>Spread<br>the News</h2><p>Find out more about our work on these<br>leading design and technology platforms.</p><span>Browse all news</span></article><div class="underlapping-footer__backdrop"><div class="underlapping-footer__background" aria-hidden="true"><canvas></canvas></div><div class="underlapping-footer__scene"><h2>Our<br>Story</h2><p class="underlapping-footer__body">The story behind this study is one of<br>exploration, creativity and curiosity.</p><div class="underlapping-footer__divider"></div><div class="underlapping-footer__columns"><p>Original motion study<br>Local material recreation<br>Source: Exo Ape</p><p>Work<br>Studio<br>News<br>Contact</p><p>Behance<br>Dribbble<br>Linkedin<br>Instagram</p><span>Our Story</span></div></div></div></div></div><footer><span data-progress>00%</span><label>Reveal <input type="range" min="0" max="100" value="0" aria-label="フッターの見える範囲"></label></footer></section>`;
  const stage=root.firstElementChild,scroller=root.querySelector('.underlapping-footer__scroller'),backdrop=root.querySelector('.underlapping-footer__backdrop'),scene=root.querySelector('.underlapping-footer__scene'),background=root.querySelector('.underlapping-footer__background'),range=root.querySelector('input'),progress=root.querySelector('[data-progress]');
  const lifecycle=new AbortController();let frame=0,destroyed=false;
  const orbit=createOrbit(root.querySelector('canvas'),{reducedMotion});
  const distance=()=>backdrop.clientHeight;
  function render(){if(destroyed)return;const p=Math.max(0,Math.min(1,scroller.scrollTop/distance())),remaining=(1-p)*distance();scene.style.transform=reducedMotion?'none':`translateY(${-remaining*.5}px)`;background.style.transform=reducedMotion?'none':`translateY(${-remaining/2.2}px)`;range.value=String(Math.round(p*100));progress.textContent=`${String(Math.round(p*100)).padStart(2,'0')}%`;stage.dataset.progress=p.toFixed(4);root.dataset.progress=p.toFixed(4);}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  const on=(el,type,cb,options={})=>el.addEventListener(type,cb,{...options,signal:lifecycle.signal});
  on(scroller,'scroll',render,{passive:true});['wheel','pointerdown','keydown','touchstart'].forEach(t=>on(scroller,t,stop,{passive:true}));on(range,'input',()=>{stop();scroller.scrollTop=+range.value/100*distance();render();});
  const resize=new ResizeObserver(render);resize.observe(scroller);
  function reset(){if(destroyed)return;stop();scroller.scrollTop=0;render();}
  function replay(){if(destroyed)return;reset();if(reducedMotion){scroller.scrollTop=distance();render();return;}const start=performance.now();function tick(t){if(destroyed)return;const p=Math.min(1,(t-start)/1800);scroller.scrollTop=p*distance();render();if(p<1)frame=requestAnimationFrame(tick);else frame=0;}frame=requestAnimationFrame(tick);}
  function destroy(){if(destroyed)return;destroyed=true;stop();resize.disconnect();orbit.destroy();lifecycle.abort();signal?.removeEventListener('abort',destroy);}
  render();signal?.addEventListener('abort',destroy,{once:true});if(signal?.aborted)destroy();return{replay,reset,destroy};
}
