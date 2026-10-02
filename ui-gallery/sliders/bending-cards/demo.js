import { listen } from "../../_motion/demo-helpers.js";

// Original vector objects stay separate from the flexible panel behind them.
function sculpture(index, color) {
  const forms = [
    `<ellipse cx="150" cy="188" rx="92" ry="34" fill="${color}"/><ellipse cx="150" cy="162" rx="92" ry="34" fill="#fff1cb"/><ellipse cx="150" cy="135" rx="92" ry="34" fill="${color}"/><ellipse cx="150" cy="109" rx="92" ry="34" fill="#fff1cb"/><ellipse cx="150" cy="82" rx="92" ry="34" fill="${color}"/><ellipse cx="150" cy="79" rx="38" ry="13" fill="#361e38"/>`,
    `<path d="M74 161 97 64 157 29 220 80 232 167 151 211Z" fill="${color}"/><path d="m97 64 60 46 63-30-63-51Z" fill="#fff1cb"/><path d="m157 110-6 101 81-44-12-87Z" fill="#2b263f" opacity=".5"/>`,
    `<rect x="68" y="77" width="164" height="134" rx="66" fill="${color}"/><ellipse cx="150" cy="77" rx="82" ry="34" fill="#fff1cb"/><ellipse cx="150" cy="78" rx="49" ry="19" fill="${color}"/><path d="M99 116v42M124 131v56M149 130v59M174 129v50M199 115v44" stroke="#fff1cb" stroke-width="9" opacity=".65"/>`,
    `<circle cx="115" cy="89" r="52" fill="#fff1cb"/><circle cx="185" cy="91" r="52" fill="${color}"/><circle cx="110" cy="163" r="52" fill="${color}"/><circle cx="183" cy="161" r="52" fill="#fff1cb"/><circle cx="148" cy="126" r="31" fill="#2b263f"/>`,
    `<path d="M66 195 149 30 234 195Z" fill="${color}"/><path d="m149 30 10 165h75Z" fill="#2b263f" opacity=".45"/><ellipse cx="149" cy="194" rx="84" ry="22" fill="#fff1cb"/><circle cx="149" cy="125" r="26" fill="#fff1cb"/>`,
  ];
  return `<svg viewBox="0 0 300 260" aria-hidden="true"><ellipse cx="150" cy="231" rx="90" ry="12" fill="#242134" opacity=".13"/>${forms[index]}</svg>`;
}

export function createDemo(root, { signal, reducedMotion }) {
  const items = [
    { title: "Soft layers", panel: "#ddb8eb", object: "#7b439d" },
    { title: "Fresh angles", panel: "#f7ad80", object: "#ee713f" },
    { title: "A little volume", panel: "#c2dceb", object: "#4e90b4" },
    { title: "Better together", panel: "#dbdf8c", object: "#8c9e3b" },
    { title: "New dimensions", panel: "#ecaeb9", object: "#c15578" },
  ];
  root.innerHTML = `<section class="bending-cards"><header><p>OBJECT STUDIES / 01–05</p><h2>A softer way<br>to move.</h2><p>横にドラッグすると、<br>カードと立体が少ししなります。</p></header><div class="bending-cards__viewport" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="しなる5枚のカード"><div class="bending-cards__track">${items.map((item, i) => `<article class="bending-cards__card" aria-label="${i + 1} / 5: ${item.title}"><svg class="bending-cards__surface" viewBox="0 0 280 230" aria-hidden="true"><path fill="${item.panel}" d="M0 0H280V230H0Z"/></svg><div class="bending-cards__object">${sculpture(i, item.object)}</div><h3>${item.title}</h3></article>`).join("")}</div></div><footer><button type="button" data-previous aria-label="前のカード">←</button><div class="bending-cards__positions" aria-label="カードを選ぶ">${items.map((item, i) => `<button type="button" data-index="${i}" aria-label="${i + 1}: ${item.title}" aria-pressed="${i === 0}"><span></span></button>`).join("")}</div><button type="button" data-next aria-label="次のカード">→</button><span class="bending-cards__status" data-status role="status" aria-live="polite">1 / 5 · Soft layers</span></footer></section>`;
  const viewport = root.querySelector(".bending-cards__viewport");
  const track = root.querySelector(".bending-cards__track");
  const cards = [...root.querySelectorAll(".bending-cards__card")];
  const dots = [...root.querySelectorAll("[data-index]")];
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  const status = root.querySelector("[data-status]");
  let position = 0,
    selected = 0,
    bend = 0,
    frame = 0;
  let pointer = null,
    startX = 0,
    startY = 0,
    startPosition = 0,
    dragging = false;
  const clamp = (value) => Math.max(0, Math.min(items.length - 1, value));
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;

  function render() {
    const offset = (viewport.clientWidth - cards[0].offsetWidth) / 2;
    track.style.transform = `translate3d(${offset - position * step()}px,0,0)`;
    cards.forEach((card, index) => {
      const depth = Math.min(1, Math.abs(index - position) / 3);
      const amount = reducedMotion ? 0 : bend * (1 - depth * 0.3);
      const inset = Math.abs(amount) * 25;
      card.querySelector(".bending-cards__surface").style.transform =
        `perspective(650px) rotateY(${-amount * 24}deg) skewY(${amount * 3}deg)`;
      card
        .querySelector("path")
        .setAttribute(
          "d",
          `M${inset} 0 Q${140} ${Math.abs(amount) * 16} ${280 - inset} 0 Q${280 + inset} 115 ${280 - inset} 230 Q140 ${230 - Math.abs(amount) * 16} ${inset} 230 Q${-inset} 115 ${inset} 0Z`,
        );
      card.querySelector(".bending-cards__object").style.transform =
        `translate3d(${amount * 15}px,${-Math.abs(amount) * 9}px,0) rotate(${amount * 9}deg)`;
      card.classList.toggle("is-current", index === selected);
    });
    root.dataset.position = String(selected);
  }
  function updateState() {
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-pressed", String(i === selected)),
    );
    previous.disabled = selected === 0;
    next.disabled = selected === items.length - 1;
    status.textContent = `${selected + 1} / ${items.length} · ${items[selected].title}`;
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function go(index) {
    stop();
    selected = Math.round(clamp(index));
    updateState();
    if (reducedMotion) {
      position = selected;
      bend = 0;
      render();
      return;
    }
    const from = position,
      oldBend = bend,
      direction = Math.sign(selected - from),
      start = performance.now();
    function tick(time) {
      const p = Math.min(1, (time - start) / 780);
      const ease = 1 - Math.pow(1 - p, 3);
      position = from + (selected - from) * ease;
      bend =
        oldBend * (1 - p) +
        Math.sin(p * Math.PI) *
          direction *
          Math.min(1, Math.abs(selected - from));
      render();
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        bend = 0;
        render();
      }
    }
    frame = requestAnimationFrame(tick);
  }
  listen(previous, "click", () => go(selected - 1), signal);
  listen(next, "click", () => go(selected + 1), signal);
  dots.forEach((dot) =>
    listen(dot, "click", () => go(Number(dot.dataset.index)), signal),
  );
  listen(
    viewport,
    "keydown",
    (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      go(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : selected + (event.key === "ArrowRight" ? 1 : -1),
      );
    },
    signal,
  );
  listen(
    viewport,
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      stop();
      pointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startPosition = position;
      dragging = false;
    },
    signal,
  );
  listen(
    viewport,
    "pointermove",
    (event) => {
      if (pointer !== event.pointerId) return;
      const dx = event.clientX - startX,
        dy = event.clientY - startY;
      if (!dragging && Math.abs(dy) > Math.abs(dx) + 8) {
        pointer = null;
        go(selected);
        return;
      }
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        viewport.setPointerCapture(pointer);
        viewport.classList.add("is-dragging");
      }
      if (!dragging) return;
      event.preventDefault();
      const nextPosition = clamp(startPosition - dx / step());
      bend = reducedMotion
        ? 0
        : Math.max(-1, Math.min(1, (nextPosition - position) * 12));
      position = nextPosition;
      render();
    },
    signal,
  );
  function release(event) {
    if (event.pointerId !== pointer) return;
    const id = pointer;
    pointer = null;
    dragging = false;
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
    viewport.classList.remove("is-dragging");
    go(Math.round(position));
  }
  listen(viewport, "pointerup", release, signal);
  listen(viewport, "pointercancel", release, signal);
  listen(viewport, "lostpointercapture", release, signal);
  const resize = new ResizeObserver(render);
  resize.observe(viewport);
  function reset() {
    stop();
    const id = pointer;
    pointer = null;
    dragging = false;
    if (id !== null && viewport.hasPointerCapture(id))
      viewport.releasePointerCapture(id);
    viewport.classList.remove("is-dragging");
    position = selected = bend = 0;
    updateState();
    render();
  }
  function replay() {
    reset();
    go(1);
  }
  function destroy() {
    stop();
    resize.disconnect();
    const id = pointer;
    pointer = null;
    if (id !== null && viewport.hasPointerCapture(id))
      viewport.releasePointerCapture(id);
  }
  signal.addEventListener("abort", destroy, { once: true });
  updateState();
  render();
  return { replay, reset, destroy };
}
