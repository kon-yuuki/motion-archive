import room from "../../../src/assets/images/dummy_1.png";
import retreat from "../../../src/assets/images/dummy_2.png";
import forest from "../../../src/assets/images/nature.jpg";
import studio from "../../../src/assets/images/dummy_3.png";

/** Source proportions and three separate followers; repository photos replace project artwork. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const items = [
    { title: "TWICE", type: "Interaction & Development", image: room, alt: "明るいリビングの代替写真" },
    { title: "The Damai", type: "Design & Development", image: retreat, alt: "植物のある室内の代替写真" },
    { title: "FABRIC™", type: "Design & Development", image: forest, alt: "森の代替写真" },
    { title: "Aanstekelijk", type: "Design & Development", image: studio, alt: "室内の代替写真" },
  ];
  root.innerHTML = `<section class="cursor-preview" aria-label="Dennis Snellenberg の Recent work の動き">
    <div class="cursor-preview__heading">RECENT WORK</div>
    <div class="cursor-preview__list" aria-label="プレビューする作品">
      ${items.map((item, index) => `<button type="button" class="cursor-preview__row" data-index="${index}" aria-pressed="false" aria-label="${item.title} の代替画像を表示"><span class="cursor-preview__title">${item.title}</span><span class="cursor-preview__type">${item.type}</span></button>`).join("")}
    </div>
    <div class="cursor-preview__image-position" aria-hidden="true"><div class="cursor-preview__image"><div class="cursor-preview__track">${items.map((item, index) => `<div class="cursor-preview__slide cursor-preview__slide--${index}"><img src="${item.image}" alt="" draggable="false">${index === 1 ? '<span class="cursor-preview__replacement-panel">THE DAMAI</span>' : ""}</div>`).join("")}</div></div></div>
    <div class="cursor-preview__button-position" aria-hidden="true"><div class="cursor-preview__circle"></div></div>
    <div class="cursor-preview__label-position" aria-hidden="true"><span class="cursor-preview__view">View</span></div>
    <p class="cursor-preview__status" role="status" aria-live="polite">行にポインターを重ねてプレビュー。写真は代替素材です。</p>
  </section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".cursor-preview");
  const list = root.querySelector(".cursor-preview__list");
  const rows = [...root.querySelectorAll(".cursor-preview__row")];
  const track = root.querySelector(".cursor-preview__track");
  const status = root.querySelector('[role="status"]');
  const pointerMedia = matchMedia("(hover: hover) and (pointer: fine)");
  // Deliberately independent positions: the image leads, the disk and text trail.
  // 8/6/5 Hz are fitted approximations, not claimed source constants.
  const followers = [
    { node: root.querySelector(".cursor-preview__image-position"), rate: 8, x: 0, y: 0 },
    { node: root.querySelector(".cursor-preview__button-position"), rate: 6, x: 0, y: 0 },
    { node: root.querySelector(".cursor-preview__label-position"), rate: 5, x: 0, y: 0 },
  ];
  const target = { x: 0, y: 0 };
  let compact = false, visible = false, destroyed = false, selected = -1, active = 0;
  let frame = 0, lastTime = 0, pointerInside = false, replayTimers = [];
  const on = (node, type, callback) => node.addEventListener(type, callback, { signal: lifecycle.signal });
  function stopReplay() { replayTimers.forEach(clearTimeout); replayTimers = []; }
  function stopFrame() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function draw() {
    followers.forEach(({ node, x, y }) => { node.style.transform = compact ? "none" : `translate3d(${x}px,${y}px,0)`; });
  }
  function snap() { stopFrame(); followers.forEach(p => { p.x = target.x; p.y = target.y; }); draw(); }
  function tick(time) {
    if (destroyed) return;
    const dt = Math.min((time - (lastTime || time - 16.667)) / 1000, .05);
    lastTime = time;
    let unsettled = false;
    followers.forEach(p => {
      const blend = 1 - Math.exp(-p.rate * dt);
      p.x += (target.x - p.x) * blend;
      p.y += (target.y - p.y) * blend;
      unsettled ||= Math.abs(target.x - p.x) + Math.abs(target.y - p.y) > .05;
    });
    draw();
    if (unsettled) frame = requestAnimationFrame(tick);
    else snap();
  }
  function locate(event, immediate = false) {
    const rect = stage.getBoundingClientRect();
    const row = rows[active].getBoundingClientRect();
    const follow = event && event.pointerType !== "touch" && !reducedMotion;
    target.x = follow ? event.clientX - rect.left : rect.width * .55;
    target.y = follow ? event.clientY - rect.top : row.top - rect.top + row.height / 2;
    // Source lets the image cross row bounds; only the isolated stage clips it.
    if (compact || reducedMotion || immediate) snap();
    else if (!frame) frame = requestAnimationFrame(tick);
  }
  function show(index, event, announce = false) {
    if (destroyed) return;
    active = index;
    track.style.transform = `translateY(-${index * 25}%)`;
    rows.forEach((row, i) => {
      row.classList.toggle("is-active", i === active);
      row.setAttribute("aria-pressed", String(i === selected));
    });
    locate(event, !visible || !event);
    visible = true;
    stage.classList.add("is-visible");
    if (announce) status.textContent = `${items[index].title}：${items[index].alt}。元サイトの作品画像ではありません。`;
  }
  function hide(force = false) {
    if (!force && (compact || selected >= 0 || list.contains(document.activeElement))) return;
    visible = false;
    stage.classList.remove("is-visible");
    rows.forEach(row => row.classList.remove("is-active"));
  }
  rows.forEach((row, index) => {
    on(row, "pointerenter", event => {
      if (!pointerMedia.matches || event.pointerType === "touch") return;
      stopReplay(); pointerInside = true; show(index, event);
    });
    on(row, "pointermove", event => {
      if (pointerMedia.matches && event.pointerType !== "touch") locate(event);
    });
    on(row, "focus", () => { stopReplay(); show(index, null, true); });
    on(row, "click", () => { stopReplay(); selected = index; show(index, null, true); });
    on(row, "keydown", event => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
        rows[next].focus();
      }
      if (event.key === "Escape") { event.preventDefault(); reset(); }
    });
  });
  on(list, "pointerleave", () => { pointerInside = false; selected < 0 ? hide() : show(selected); });
  on(list, "pointercancel", () => { pointerInside = false; hide(true); });
  on(list, "focusout", event => {
    if (!list.contains(event.relatedTarget) && !pointerInside && selected < 0 && !compact) hide(true);
  });
  function resize() {
    if (destroyed) return;
    compact = stage.clientWidth < 680 || !pointerMedia.matches;
    stage.classList.toggle("is-compact", compact);
    if (compact) show(active);
    else { locate(null, true); if (!pointerInside && selected < 0 && !list.contains(document.activeElement)) hide(true); }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  on(pointerMedia, "change", resize);
  function reset() {
    if (destroyed) return;
    stopReplay(); stopFrame(); selected = -1; active = 0; pointerInside = false;
    // Reset must cancel the in-flight width and track transitions as well as timers.
    stage.classList.add("is-resetting");
    track.style.transform = "translateY(0%)";
    hide(true);
    rows.forEach(row => row.setAttribute("aria-pressed", "false"));
    locate(null, true);
    if (compact) show(0);
    void stage.offsetWidth;
    stage.classList.remove("is-resetting");
    status.textContent = "行にポインターを重ねてプレビュー。写真は代替素材です。";
  }
  function replay() {
    if (destroyed) return;
    reset(); show(0, null, true);
    if (reducedMotion) return;
    replayTimers.push(setTimeout(() => show(1, null, true), 700));
    replayTimers.push(setTimeout(() => { if (!compact) hide(true); }, 1500));
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; stopReplay(); stopFrame(); observer.disconnect(); lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
    stage.classList.add("is-resetting");
    stage.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  }
  stage.classList.toggle("is-reduced", reducedMotion);
  resize();
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
