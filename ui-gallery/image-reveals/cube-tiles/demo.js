const photos = [new URL('./assets/original-speakers.webp', import.meta.url).href, new URL('./assets/original-portrait.webp', import.meta.url).href];
const clamp = x => Math.max(0, Math.min(1, x));

/** Two offset photographic surfaces, each assembled in a directional 4×3 cascade.
 * Grid/axis/timing are estimates from the video, not recovered source internals.
 */
export function createDemo(root, {signal, reducedMotion=false} = {}) {
  const grids = photos.map((photo, block) => `<div class="cube-tiles__picture cube-tiles__picture--${block}" style="--photo:url('${photo}')" role="img" aria-label="${block ? '淡いピンクの服のモデル' : 'セージ色の壁の前のスピーカー'}">${Array.from({length:12},(_,i)=>{
    const col=i%4,row=Math.floor(i/4);
    return `<div class="cube-tiles__tile" style="left:${col*25}%;top:${row*100/3}%;--photo:url('${photo}');--bx:${col*100/3}%;--by:${row*50}%" data-block="${block}" data-column="${col}" data-row="${row}"><div class="cube-tiles__front"></div><div class="cube-tiles__side cube-tiles__side--${block}"></div><div class="cube-tiles__bottom-face"></div></div>`;
  }).join('')}</div>`).join('');
  root.innerHTML=`<section class="cube-tiles" aria-label="高さの異なる二枚の写真を立体的に組み立てるデモ"><div class="cube-tiles__scene"><div class="cube-tiles__nav" aria-hidden="true"><b>SOUND / STUDIO</b><span>INTRO　 SAND　 TANGERINE　 <u>CHARCOAL</u>　 <i>BUY</i></span><b>≡</b></div><div class="cube-tiles__field">${grids}</div></div><div class="cube-tiles__controls"><button type="button">写真を組み立てる</button><span role="status" aria-live="polite"></span></div></section>`;
  const stage=root.firstElementChild,scene=root.querySelector('.cube-tiles__scene'),tiles=[...root.querySelectorAll('.cube-tiles__tile')],status=root.querySelector('[role=status]');
  const lifecycle=new AbortController();let frame=0,elapsed=-200,start=0,destroyed=false,observer;
  function render(ms){
    elapsed=ms;const time=ms/1000+.11;
    tiles.forEach(tile=>{
      const block=Number(tile.dataset.block),col=Number(tile.dataset.column),row=Number(tile.dataset.row);
      const lane=block?col:3-col;
      const delays=[[-.30,0,.18,.46],[0,.26,.50,.68],[.26,.53,.78,.95]];
      const durations=[[.60,.60,.60,.42],[.62,.60,.65,.60],[.70,.70,.65,.50]];
      const delay=delays[row][lane]+(block?-.04:0);
      const p=ms<0?0:clamp((time-delay)/durations[row][lane]);
      const progress=p*p*(3-2*p);
      const direction=block?-1:1;
      const width=scene.clientWidth/918;
      const aroundX=(row+lane)%2===0;
      tile.style.transformOrigin=aroundX?'center top':(block?'left top':'right top');
      const yaw=aroundX?0:direction*(1-progress)*88;
      const pitch=aroundX?(1-progress)*88:0;
      tile.style.opacity=String(clamp(p*7));
      tile.style.transform=`translate3d(0px,${(1-progress)*3*width}px,${(1-progress)*12*width}px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;
      tile.style.setProperty('--shade',String((1-progress)*.12));
      tile.dataset.progress=p.toFixed(3);
    });
    stage.dataset.elapsed=String(Math.round(ms));stage.dataset.phase=ms<0?'blank':time<1.48?'assembling':'complete';
  }
  function stop(){cancelAnimationFrame(frame);frame=0;observer?.disconnect();}
  function reset(){if(destroyed)return;stop();render(reducedMotion?1500:-200);status.textContent=reducedMotion?'動きを省いて二枚の写真を表示':'上から下へ、二枚の写真を組み立てます';}
  function tick(now){if(destroyed)return;render(Math.min(1500,now-start));if(elapsed<1500)frame=requestAnimationFrame(tick);else{frame=0;status.textContent='高さの異なる二枚の写真が揃いました';}}
  function replay(){if(destroyed)return;reset();if(reducedMotion)return;start=performance.now();frame=requestAnimationFrame(tick);}
  function seek(ms){if(destroyed)return;stop();render(ms);}
  function destroy(){if(destroyed)return;destroyed=true;stop();resize.disconnect();lifecycle.abort();signal?.removeEventListener('abort',destroy);}
  const resize=new ResizeObserver(()=>{if(!destroyed)render(elapsed);});resize.observe(scene);
  root.querySelector('button').addEventListener('click',replay,{signal:lifecycle.signal});signal?.addEventListener('abort',destroy,{once:true});reset();
  if(!reducedMotion){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))replay();},{threshold:.25});observer.observe(stage);}
  if(signal?.aborted)destroy();return {replay,reset,destroy,seek};
}
