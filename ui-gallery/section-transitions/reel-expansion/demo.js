import reel from '../../../src/assets/video/between-air-veiled-portrait-motion.mp4';
import poster from '../../../src/assets/images/hover-video-cards/between-air-veiled-portrait-first-frame.jpg';

/** Measured source mapping: 2 viewport runway; .25→1 uniform scale; ±20vw→0 title. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML=`<section class="reel-expansion" data-reduced="${reducedMotion}"><div class="reel-expansion__scroller" tabindex="0" role="region" aria-label="スクロールでリールを広げる"><div class="reel-expansion__runway"><div class="reel-expansion__sticky"><video class="reel-expansion__media" muted loop playsinline disablepictureinpicture poster="${poster}" aria-hidden="true"><source src="${reel}" type="video/mp4"></video><span class="reel-expansion__label">✦&nbsp; Work in motion</span><h2><span data-left>Play</span><span data-right>Reel</span></h2><p class="reel-expansion__caption">Our work is best experienced in motion. Don’t<br>forget to put on your headphones.</p></div></div></div><footer><span data-progress>00%</span><label>Scroll progress <input type="range" min="0" max="100" value="0" aria-label="展開の進み具合"></label></footer></section>`;
  const stage=root.firstElementChild,scroller=root.querySelector('.reel-expansion__scroller'),runway=root.querySelector('.reel-expansion__runway'),media=root.querySelector('video'),left=root.querySelector('[data-left]'),right=root.querySelector('[data-right]'),progress=root.querySelector('[data-progress]'),range=root.querySelector('input');
  const lifecycle=new AbortController();let frame=0,destroyed=false;
  const distance=()=>Math.max(1,runway.clientHeight-scroller.clientHeight);
  function render(){if(destroyed)return;const p=Math.max(0,Math.min(1,scroller.scrollTop/distance())),v=reducedMotion?1:p,offset=scroller.clientWidth*.2*(1-v);media.style.transform=`scale(${.25+.75*v})`;left.style.transform=`translateX(${-offset}px)`;right.style.transform=`translateX(${offset}px)`;progress.textContent=`${String(Math.round(p*100)).padStart(2,'0')}%`;range.value=String(Math.round(p*100));stage.dataset.progress=p.toFixed(4);root.dataset.progress=p.toFixed(4);}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  const on=(el,type,cb,options={})=>el.addEventListener(type,cb,{...options,signal:lifecycle.signal});
  on(scroller,'scroll',render,{passive:true});['wheel','pointerdown','keydown','touchstart'].forEach(type=>on(scroller,type,stop,{passive:true}));
  on(range,'input',()=>{stop();scroller.scrollTop=+range.value/100*distance();render();});
  const resize=new ResizeObserver(render);resize.observe(scroller);
  function reset(){if(destroyed)return;stop();scroller.scrollTop=0;render();}
  function replay(){if(destroyed)return;reset();if(reducedMotion){scroller.scrollTop=distance();render();return;}const start=performance.now();function tick(t){if(destroyed)return;const p=Math.min(1,(t-start)/1800);scroller.scrollTop=p*distance();render();if(p<1)frame=requestAnimationFrame(tick);else frame=0;}frame=requestAnimationFrame(tick);}
  function play(){if(!destroyed&&!reducedMotion&&!document.hidden)media.play().catch(()=>{});}
  const visibility=new IntersectionObserver(entries=>{entries[0]?.isIntersecting?play():media.pause();});visibility.observe(stage);
  on(document,'visibilitychange',()=>document.hidden?media.pause():play());
  function destroy(){if(destroyed)return;destroyed=true;stop();media.pause();resize.disconnect();visibility.disconnect();lifecycle.abort();signal?.removeEventListener('abort',destroy);}
  render();signal?.addEventListener('abort',destroy,{once:true});if(signal?.aborted)destroy();return{replay,reset,destroy};
}
