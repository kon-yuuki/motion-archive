const outgoingURL = new URL('./assets/original-film-set.webp', import.meta.url).href;
const incomingURL = new URL('./assets/original-lunch-film.webp', import.meta.url).href;
const clamp = value => Math.max(0, Math.min(1, value));
// Sampled source-time key states. Intermediate interpolation is an estimate, not source easing.
function sample(time, points) {
  if (time <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (time <= points[i][0]) {
      const [a, b] = [points[i - 1], points[i]], p = (time - a[0]) / (b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * (p * p * (3 - 2 * p));
    }
  }
  return points.at(-1)[1];
}
/** Recording-derived page transition. Photographs and text mark are original substitutes. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `<section class="gradient-frame-wipe"><div class="gradient-frame-wipe__scene" role="group" aria-label="写真、グラデーションの枠、白い幕でつなぐ場面転換"><div class="gradient-frame-wipe__destination" aria-hidden="true"><div class="gradient-frame-wipe__nav"><span>FILM ROOM</span><span>WORKS</span><span>ABOUT</span><span>CONTACT</span></div><canvas class="gradient-frame-wipe__film" width="1210" height="730" aria-label="色鮮やかなテーブルを囲む場面のオリジナル写真"></canvas><div class="gradient-frame-wipe__film-label">SUMMER TABLE · ORIGINAL FILM STUDY</div></div><div class="gradient-frame-wipe__transition"><div class="gradient-frame-wipe__inset"><div class="gradient-frame-wipe__outgoing"><img src="${outgoingURL}" alt="映画撮影のカメラと二人の撮影スタッフのオリジナル写真"><div class="gradient-frame-wipe__nav"><span>FILM ROOM</span><span>CREATIVE STORIES</span><span>ABOUT US</span><span>CONTACT</span></div><div class="gradient-frame-wipe__news"><img src="${incomingURL}" alt=""><span>NEW WORK<br>DISCOVER OUR STORIES</span></div></div><div class="gradient-frame-wipe__cover"><div class="gradient-frame-wipe__mark" aria-hidden="true"><span>film</span><b>room</b></div></div></div></div></div><footer><div role="group" aria-label="場面を切り替える"><button type="button" data-scene="0" aria-pressed="true">01 / Film set</button><button type="button" data-scene="1" aria-pressed="false">02 / Summer table</button></div><span data-status role="status" aria-live="polite">Film set</span></footer></section>`;
  const section = root.firstElementChild, scene = root.querySelector('.gradient-frame-wipe__scene');
  const transition = root.querySelector('.gradient-frame-wipe__transition'), inset = root.querySelector('.gradient-frame-wipe__inset');
  const cover = root.querySelector('.gradient-frame-wipe__cover'), mark = root.querySelector('.gradient-frame-wipe__mark');
  const outgoing = root.querySelector('.gradient-frame-wipe__outgoing'), destination = root.querySelector('.gradient-frame-wipe__destination');
  const nav = destination.querySelector('.gradient-frame-wipe__nav'), label = root.querySelector('.gradient-frame-wipe__film-label');
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), status = root.querySelector('[data-status]');
  const buttons = [...root.querySelectorAll('[data-scene]')], events = new AbortController(), picture = new Image();
  let raf = 0, elapsed = 0, destroyed = false, target = 0, lastPhase = '';
  picture.src = incomingURL;
  const ready = Promise.all([picture.decode(), ...[...root.querySelectorAll('img')].map(img => img.decode())]).then(() => { if (!destroyed) render(elapsed); }).catch(() => { if (!destroyed) status.textContent = '画像を読み込めませんでした'; });
  // Original mesh approximation of the observed curved incoming film plane. The original shader is unknown.
  function film(time) {
    ctx.clearRect(0, 0, 1210, 730);
    if (!picture.complete || !picture.naturalWidth || time < 2.93) return;
    const size = sample(time, [[2.93, .05], [3, .36], [3.151, .87], [3.438, 1.1], [3.75, 1.02], [4.1, 1]]);
    const bend = sample(time, [[2.93, 1], [3.151, .65], [3.438, .08], [3.75, 0]]), w = 656 * size, h = 369 * size;
    const opacity = sample(time, [[2.93, 0], [3, .18], [3.151, .56], [3.438, 1]]);
    canvas.style.opacity = String(opacity);
    ctx.globalAlpha = 1;
    if (bend < .001) { ctx.drawImage(picture, 605-w/2, 350-h/2, w, h);return; }
    const columns = 28, rows = 18;
    const point = (u, v) => [605 + (u - .5) * w * (1 + bend * (.18 * (v - .5) ** 2 - .025)) + bend * 13 * Math.sin(v * Math.PI), 350 + (v - .5) * h - bend * 49 * (u - .5) * (1 - v) + bend * 12 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI)];
    function triangle(uv, xy) {
      const [a, b, c] = uv.map(([u, v]) => [u * picture.naturalWidth, v * picture.naturalHeight]);
      const [d, e, f] = xy, denominator = a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
      const solve = k => [(d[k]*(b[1]-c[1])+e[k]*(c[1]-a[1])+f[k]*(a[1]-b[1]))/denominator,(d[k]*(c[0]-b[0])+e[k]*(a[0]-c[0])+f[k]*(b[0]-a[0]))/denominator,(d[k]*(b[0]*c[1]-c[0]*b[1])+e[k]*(c[0]*a[1]-a[0]*c[1])+f[k]*(a[0]*b[1]-b[0]*a[1]))/denominator];
      const x = solve(0), y = solve(1);
      const center = [xy.reduce((sum,p)=>sum+p[0],0)/3,xy.reduce((sum,p)=>sum+p[1],0)/3];
      ctx.save();ctx.beginPath();xy.forEach(([px, py], i) => {const dx=px-center[0],dy=py-center[1],length=Math.hypot(dx,dy),factor=(length+.8)/length;px=center[0]+dx*factor;py=center[1]+dy*factor;i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);});ctx.closePath();ctx.clip();ctx.setTransform(x[0], y[0], x[1], y[1], x[2], y[2]);ctx.drawImage(picture, 0, 0);ctx.restore();
    }
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const u = col / columns, v = row / rows, a = [u, v], b = [u + 1 / columns, v], c = [u + 1 / columns, v + 1 / rows], d = [u, v + 1 / rows];
      triangle([a,b,c], [point(...a),point(...b),point(...c)]);triangle([a,c,d], [point(...a),point(...c),point(...d)]);
    }
    ctx.globalAlpha = 1;
  }
  function render(ms) {
    if (destroyed) return;
    elapsed = Math.max(0, Math.min(3720, ms));
    const t = elapsed / 1000 + .78;
    const scale = sample(t, [[.78,1],[.86,.991],[1,.895],[1.146,.806],[1.3,.8],[1.432,.814],[1.58,.867],[1.719,.959],[1.85,.991],[1.98,1]]);
    const coverProgress = sample(t, [[1.3,0],[1.432,.251],[1.58,.887],[1.68,1]]);
    const curtain = sample(t, [[2.58,0],[2.72,.266],[2.865,.606],[3,.8],[3.151,.919],[3.3,1]]);
    const visible = elapsed < 3000;
    transition.style.visibility = visible ? 'visible' : 'hidden';
    inset.style.transform = `scale(${scale})`;
    cover.style.clipPath = t < 2.58 ? `inset(${(1-coverProgress)*100}% 0 0)` : `inset(0 0 ${curtain*100}% 0)`;
    cover.style.opacity = String(coverProgress > 0 ? 1 : 0);
    mark.style.opacity = String(sample(t, [[1.49,0],[1.719,1]]));
    mark.style.transform = `translate(-50%, ${-50-curtain*390}%)`;
    outgoing.style.visibility = t < 1.68 ? 'visible' : 'hidden';
    destination.style.visibility = t >= 2.58 ? 'visible' : 'hidden';
    transition.style.background = t >= 2.58 ? 'transparent' : '';
    nav.style.opacity = String(sample(t, [[3.3,0],[3.5,1]]));
    label.style.opacity = String(sample(t, [[3.8,0],[4.3,1]]));
    destination.style.setProperty('--sunset', sample(t, [[4,0],[4.5,1]]));
    film(t);
    const phase = t < .82 ? 'outgoing' : t < 1.3 ? 'inset' : t < 1.68 ? 'bottom-cover' : t < 1.98 ? 'frame-clear' : t < 2.58 ? 'logo-hold' : t < 3.3 ? 'curtain' : 'destination';
    section.dataset.phase = phase;section.dataset.elapsed = elapsed.toFixed(1);root.dataset.scene = phase === 'destination' ? '2' : '1';
    if (phase !== lastPhase) { status.textContent = ({outgoing:'Film set',destination:'Summer table'})[phase] || '場面を切り替えています';lastPhase = phase; }
  }
  function stop() { cancelAnimationFrame(raf);raf = 0; }
  function setControls(index) { target = index;buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index))); }
  function reset() { stop();setControls(0);render(0); }
  function replay() {
    stop();setControls(1);render(0);
    if (reducedMotion) { render(3720);return; }
    const began = performance.now();
    const tick = now => { if (destroyed) return;render(now-began);if (elapsed < 3720) raf = requestAnimationFrame(tick);else raf = 0; };
    raf = requestAnimationFrame(tick);
  }
  buttons[0].addEventListener('click', reset, {signal:events.signal});
  buttons[1].addEventListener('click', replay, {signal:events.signal});
  function seek(ms) { stop();setControls(ms > 0 ? 1 : 0);render(ms); }
  function destroy() { if (destroyed) return;destroyed = true;stop();events.abort();signal?.removeEventListener('abort', destroy); }
  signal?.addEventListener('abort', destroy, {once:true});
  reset();
  return {replay,reset,destroy,seek,ready};
}
