/**
 * Joseph Berry's recorded Hall of Fame hover, sampled from the official 30fps clip.
 * Times below are observations, not the original site's unknown CSS/easing values.
 * Browser-native flame emoji deliberately remain text rather than copied artwork.
 */
const FIRST = [[0,1],[100,.699],[200,.309],[300,.120],[400,.025],[500,0]];
const FLAME = [[0,0],[200,0],[233,.281],[267,.646],[300,1],[600,1],[633,.643],[667,.269],[700,0]];
const LAST = [[0,0],[1000,0],[1033,.15],[1067,.54],[1100,.665],[1133,.81],[1167,.82],[1200,.86],[1233,.86],[1267,.89],[1400,.96],[1800,1]];
// The final label also rises into the capsule; measured by frame registration.
const LAST_Y = [[0,32],[1000,32],[1033,23],[1067,18],[1100,13],[1133,9],[1167,6],[1200,4],[1233,2],[1267,1],[1333,0]];
// Median RGB of an empty capsule patch, sampled every 100ms after the flames.
const COLOR = [[0,253,253,253],[900,253,253,253],[1000,252,249,255],[1100,240,240,252],[1200,228,226,246],[1300,207,206,237],[1400,188,187,233],[1500,149,148,221],[1600,84,82,201],[1700,59,59,197],[1800,50,51,193]];
const DURATION = 1800;
function sample(points, time, channel = 1) {
  if (time <= points[0][0]) return points[0][channel];
  for (let i = 1; i < points.length; i += 1) {
    if (time <= points[i][0]) {
      const previous = points[i - 1], next = points[i];
      return previous[channel] + (next[channel] - previous[channel]) * (time - previous[0]) / (next[0] - previous[0]);
    }
  }
  return points.at(-1)[channel];
}
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `<section class="icon-sequence" aria-label="Joseph Berry の Hall of Fame ホバーを観察したデモ"><button type="button" class="icon-sequence__button" aria-label="Hall of Fame のホバーを再生"><span class="icon-sequence__first" aria-hidden="true">Hall of Fame</span><span class="icon-sequence__flames" aria-hidden="true">${[0,1,2,3].map(() => '<span>🔥</span>').join('')}</span><span class="icon-sequence__last" aria-hidden="true">Let's Go</span></button><span class="icon-sequence__status" role="status" aria-live="polite">ボタンにポインターを重ねるか、再生してください</span></section>`;
  const stage = root.querySelector('.icon-sequence');
  const button = root.querySelector('button');
  const first = root.querySelector('.icon-sequence__first');
  const last = root.querySelector('.icon-sequence__last');
  const flames = [...root.querySelectorAll('.icon-sequence__flames > span')];
  const status = root.querySelector('[role="status"]');
  const lifecycle = new AbortController();
  let frame = 0, destroyed = false, hovered = false, focused = false;
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function draw(time) {
    stage.dataset.traceTime = String(Math.round(time));
    stage.dataset.phase = time === 0 ? 'rest' : time < 1000 ? 'flames' : time < DURATION ? 'label' : 'settled';
    first.style.opacity = String(sample(FIRST, time));
    last.style.opacity = String(sample(LAST, time));
    last.style.transform = `translateY(${sample(LAST_Y, time)}px)`;
    flames.forEach((flame, index) => flame.style.opacity = String(sample(FLAME, time - index * 100)));
    button.style.backgroundColor = `rgb(${[1,2,3].map(channel => Math.round(sample(COLOR, time, channel))).join(',')})`;
  }
  function replay() {
    if (destroyed) return;
    stop();
    if (reducedMotion) { draw(DURATION); status.textContent = '演出を省いて最終状態を表示しています'; return; }
    draw(0);
    status.textContent = 'ホバーの順序を再生しています';
    const start = performance.now();
    function tick(now) {
      if (destroyed) return;
      const time = Math.min(DURATION, now - start);
      draw(time);
      if (time < DURATION) frame = requestAnimationFrame(tick);
      else { frame = 0; status.textContent = '最終状態を表示しています'; }
    }
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    if (destroyed) return;
    stop(); draw(0);
    status.textContent = '最初の状態に戻しました';
  }
  const on = (type, handler) => button.addEventListener(type, handler, { signal: lifecycle.signal });
  on('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; replay(); } });
  on('pointerleave', () => { hovered = false; if (!focused) reset(); });
  on('pointercancel', () => { hovered = false; if (!focused) reset(); });
  on('focus', () => { focused = true; if (!hovered) replay(); });
  on('blur', () => { focused = false; if (!hovered) reset(); });
  on('click', replay);
  function seek(time) {
    if (destroyed) return;
    stop(); draw(Math.max(0, Math.min(DURATION, reducedMotion ? DURATION : time)));
  }
  function destroy() {
    if (destroyed) return;
    stop(); lifecycle.abort(); destroyed = true;
    signal?.removeEventListener('abort', destroy);
  }
  draw(0);
  signal?.addEventListener('abort', destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy, seek };
}
