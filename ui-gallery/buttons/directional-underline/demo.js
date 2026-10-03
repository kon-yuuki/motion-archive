import portrait from '../../../src/assets/images/warm-neutral-tailoring/camel-tailored-seated-close.webp';

/** Exo Ape main-menu rule: measured 2px, 500ms cubic-bezier(1,0,0,1). */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const items = ['Work', 'Studio', 'News', 'Contact'];
  root.innerHTML = `<section class="directional-underline" data-reduced="${reducedMotion}" aria-label="Exo Ape メニューの下線スタディ">
    <span class="directional-underline__reference">Exo Ape / main-menu rule</span>
    <figure class="directional-underline__frame" aria-hidden="true"><div class="directional-underline__image"><img src="${portrait}" alt="" /></div></figure>
    <div class="directional-underline__content"><div class="directional-underline__menu">${items.map(label => `<button type="button" class="directional-underline__choice"><span class="directional-underline__label">${label}</span></button>`).join('')}</div><div class="directional-underline__social" aria-hidden="true"><span>Behance</span><span>Dribbble</span><span>Linkedin</span><span>Instagram</span></div></div>
    <div class="directional-underline__lower" aria-hidden="true"><span>Play Reel</span><span>Our Story</span><span>Now Hiring!</span></div><span class="directional-underline__status" role="status" aria-live="polite">Hover・Tab・タップで下線を確認</span></section>`;
  const lifecycle = new AbortController();
  const stage = root.firstElementChild;
  const buttons = [...root.querySelectorAll('button')];
  const status = root.querySelector('[role="status"]');
  let hovered = -1, focused = -1, preview = -1, tapped = -1, timers = [], destroyed = false;
  function render() {
    if (destroyed) return;
    buttons.forEach((button, i) => button.classList.toggle('is-active', i === hovered || i === focused || i === preview || i === tapped));
  }
  function stopPreview() { timers.forEach(clearTimeout); timers = []; preview = -1; }
  const on = (target, type, callback) => target.addEventListener(type, callback, { signal: lifecycle.signal });
  buttons.forEach((button, i) => {
    on(button, 'pointerenter', e => { if(e.pointerType === 'touch') return; stopPreview(); tapped = -1; hovered = i; render(); });
    on(button, 'pointerleave', () => { hovered = -1; render(); });
    on(button, 'pointercancel', () => { hovered = -1; render(); });
    on(button, 'focus', () => { stopPreview(); focused = i; render(); });
    on(button, 'blur', () => { focused = -1; tapped = -1; render(); });
    on(button, 'click', () => { stopPreview(); tapped = i; render(); status.textContent = `${items[i]} の下線を表示。デモ内では移動しません`; });
  });
  function reset() { if(destroyed) return; stopPreview(); hovered = focused = tapped = -1; render(); status.textContent='Hover・Tab・タップで下線を確認'; }
  function replay() {
    if(destroyed) return; reset(); preview = 1; render();
    timers.push(setTimeout(() => { preview=2; render(); }, 900), setTimeout(() => { preview=-1; render(); }, 1800));
  }
  function destroy() { if(destroyed) return; stopPreview(); destroyed=true; lifecycle.abort(); stage.getAnimations({subtree:true}).forEach(a=>a.cancel()); signal?.removeEventListener('abort',destroy); }
  signal?.addEventListener('abort', destroy, {once:true}); if(signal?.aborted) destroy();
  return {replay,reset,destroy};
}
