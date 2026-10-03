/** Source-like duplicated label layers, animated by one moving checker mask. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const content = '<span>View project</span><svg viewBox="0 0 9 10" width="9" height="10" aria-hidden="true"><path d="M0 5h8M4 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  root.innerHTML = `<section class="checker-dissolve" data-reduced-motion="${reducedMotion}" aria-label="Noomo のチェッカー境界を再現したボタン"><button type="button" class="checker-dissolve__button" aria-label="View project のホバーを再生"><span class="checker-dissolve__base" aria-hidden="true">${content}</span><span class="checker-dissolve__mask" aria-hidden="true">${content}</span></button><span class="checker-dissolve__status" role="status" aria-live="polite">ポインターを重ねて確かめてください</span></section>`;
  const stage = root.querySelector('.checker-dissolve');
  const button = root.querySelector('button');
  const status = root.querySelector('[role="status"]');
  const lifecycle = new AbortController();
  let hovered = false, focused = false, timer = 0, frame = 0, destroyed = false;
  const active = value => stage.classList.toggle('is-active', value);
  function stop() { clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = 0; }
  function snapRest() {
    stage.dataset.snap = 'true'; active(false);
    void button.offsetWidth;
    stage.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    frame = requestAnimationFrame(() => { if (!destroyed) delete stage.dataset.snap; frame = 0; });
  }
  function reset() { if (destroyed) return; stop(); snapRest(); status.textContent = '初期状態へ戻しました'; }
  function replay() {
    if (destroyed) return;
    stop(); snapRest();
    cancelAnimationFrame(frame);
    if (reducedMotion) { delete stage.dataset.snap; active(true); status.textContent = '途中の動きを省いて表示しています'; return; }
    frame = requestAnimationFrame(() => {
      if (destroyed) return;
      delete stage.dataset.snap; active(true); frame = 0;
      timer = setTimeout(() => { if (!destroyed) { active(hovered || focused); status.textContent = '元の状態へ戻ります'; } timer = 0; }, 1200);
    });
    status.textContent = 'チェッカー境界の往復を再生しています';
  }
  const on = (type, handler) => button.addEventListener(type, handler, { signal: lifecycle.signal });
  on('pointerenter', event => { if (event.pointerType !== 'touch') { stop(); delete stage.dataset.snap; hovered = true; active(true); } });
  on('pointerleave', () => { hovered = false; if (!focused) active(false); });
  on('pointercancel', () => { hovered = false; if (!focused) active(false); });
  on('focus', () => { focused = true; if (!hovered) { stop(); delete stage.dataset.snap; active(true); } });
  on('blur', () => { focused = false; if (!hovered) active(false); });
  on('click', replay);
  function destroy() {
    if (destroyed) return;
    stop(); lifecycle.abort();
    stage.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    destroyed = true;
    signal?.removeEventListener('abort', destroy);
  }
  signal?.addEventListener('abort', destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
