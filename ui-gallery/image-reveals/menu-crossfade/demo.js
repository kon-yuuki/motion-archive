import work from '../../../src/assets/images/warm-neutral-tailoring/camel-tailored-seated-close.webp';
import studio from '../../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-09.webp';
import news from '../../../src/assets/images/sculptural-still-lifes/neutral-stone-monuments.webp';
import contact from '../../../src/assets/images/warm-neutral-tailoring/ivory-cream-leaning-column.webp';

/** Source geometry + measured transform/opacity relationship, with original local photos. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const items = [{label:'Work', image:work}, {label:'Studio', image:studio}, {label:'News', image:news}, {label:'Contact', image:contact}];
  root.innerHTML = `<section class="menu-crossfade" data-reduced="${reducedMotion}" aria-label="Exo Ape メニュー画像の切り替えスタディ">
    <span class="menu-crossfade__reference">Exo Ape / image transition</span>
    <figure class="menu-crossfade__frame" aria-hidden="true">${items.map((item,i)=>`<div class="menu-crossfade__image" data-image="${i}"><img src="${item.image}" alt="" /></div>`).join('')}</figure>
    <div class="menu-crossfade__content"><div class="menu-crossfade__menu">${items.map(item=>`<button type="button" class="menu-crossfade__choice"><span class="menu-crossfade__label">${item.label}</span></button>`).join('')}</div><div class="menu-crossfade__social" aria-hidden="true"><span>Behance</span><span>Dribbble</span><span>Linkedin</span><span>Instagram</span></div></div>
    <div class="menu-crossfade__lower" aria-hidden="true"><span>Play Reel</span><span>Our Story</span><span>Now Hiring!</span></div><span class="menu-crossfade__status" role="status" aria-live="polite">Work の画像を表示</span></section>`;
  const stage=root.firstElementChild, images=[...root.querySelectorAll('[data-image]')], buttons=[...root.querySelectorAll('button')], status=root.querySelector('[role="status"]');
  const lifecycle=new AbortController();
  let active=0, frame=0, previewTimer=0, destroyed=false, transition=null;
  let states=images.map((_,i)=>({opacity:i===0?1:0,scale:1,rotation:0}));
  const draw=()=>states.forEach((state,i)=>{images[i].style.opacity=String(state.opacity); images[i].style.transform=`scale(${state.scale}) rotate(${state.rotation}deg)`;});
  const stopPreview=()=>{clearTimeout(previewTimer);previewTimer=0;};
  // A 1s cubic-out fit to the live samples, NOT an extracted source duration/ease.
  function tick(now) {
    if(destroyed || !transition) return;
    const p=Math.max(0,Math.min(1,(now-transition.start)/1000)), e=1-Math.pow(1-p,3);
    states=transition.from.map((s,i)=>({opacity:s.opacity+(Number(i===active)-s.opacity)*e,scale:s.scale+(1-s.scale)*e,rotation:s.rotation*(1-e)}));
    stage.dataset.traceTime=String(Math.round(now-transition.start)); draw();
    if(p<1) frame=requestAnimationFrame(tick); else {frame=0;transition=null;}
  }
  function select(index, highlight=true) {
    if(destroyed) return;
    buttons.forEach((b,i)=>b.classList.toggle('is-active',highlight && i===index));
    if(index===active) return;
    cancelAnimationFrame(frame); frame=0;
    const old=active; active=index;
    images.forEach((img,i)=>img.style.zIndex=String(i===active?3:i===old?2:1));
    status.textContent=`${items[index].label} の画像を表示`; stage.dataset.active=String(active);
    if(reducedMotion) {states=states.map((_,i)=>({opacity:Number(i===active),scale:1,rotation:0})); transition=null;draw();return;}
    // The scale/angle match all captured opacity samples: scale=1+.3*(1-opacity), angle=7*(1-opacity).
    // 1.3 and 7deg at an unseen zero-opacity start are inferred from that relationship.
    states[active]={...states[active],scale:1+.3*(1-states[active].opacity),rotation:7*(1-states[active].opacity)};
    transition={start:performance.now(),from:states.map(s=>({...s}))}; draw(); frame=requestAnimationFrame(tick);
  }
  buttons.forEach((button,i)=>{
    button.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;stopPreview();select(i);},{signal:lifecycle.signal});
    button.addEventListener('pointerleave',()=>button.classList.remove('is-active'),{signal:lifecycle.signal});
    button.addEventListener('focus',()=>{stopPreview();select(i);},{signal:lifecycle.signal});
    button.addEventListener('blur',()=>button.classList.remove('is-active'),{signal:lifecycle.signal});
    button.addEventListener('click',()=>{stopPreview();select(i);},{signal:lifecycle.signal});
  });
  function reset(){if(destroyed)return;stopPreview();cancelAnimationFrame(frame);frame=0;transition=null;active=0;states=images.map((_,i)=>({opacity:Number(i===0),scale:1,rotation:0}));images.forEach((img,i)=>img.style.zIndex=String(i===0?3:1));buttons.forEach(b=>b.classList.remove('is-active'));stage.dataset.active='0';stage.dataset.traceTime='0';status.textContent='Work の画像を表示';draw();}
  function replay(){if(destroyed)return;reset();select(1);previewTimer=setTimeout(()=>select(2),1400);}
  function destroy(){if(destroyed)return;destroyed=true;stopPreview();cancelAnimationFrame(frame);frame=0;transition=null;lifecycle.abort();stage.getAnimations({subtree:true}).forEach(a=>a.cancel());signal?.removeEventListener('abort',destroy);}
  reset();signal?.addEventListener('abort',destroy,{once:true});if(signal?.aborted)destroy();return{replay,reset,destroy};
}
