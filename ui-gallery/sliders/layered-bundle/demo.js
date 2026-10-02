import { listen } from "../../_motion/demo-helpers.js";

// Draw each piece independently, so the bundle can overlap without copied assets.
function product(color, accent, word, small = false) {
  return `<svg viewBox="0 0 200 250" aria-hidden="true"><ellipse cx="100" cy="228" rx="72" ry="11" fill="#231f24" opacity=".12"/><path d="M38 46Q100 25 162 46L170 210Q100 235 30 210Z" fill="${color}"/><ellipse cx="100" cy="47" rx="62" ry="14" fill="${accent}"/><path d="M42 67q58 17 116 0" fill="none" stroke="#fff" stroke-width="2" opacity=".45"/><path d="M49 88H151V181H49Z" fill="${accent}"/><circle cx="100" cy="122" r="24" fill="${color}"/><path d="m86 121 10 10 19-24" fill="none" stroke="${accent}" stroke-width="7"/><text x="100" y="168" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${small ? 16 : 18}" fill="${color}">${word}</text></svg>`;
}

export function createDemo(root, { signal, reducedMotion }) {
  const items = [
    {
      title: "BERRY / BRIGHT",
      caption: "A little color for your everyday.",
      color: "#be4b6c",
      accent: "#f7c6d3",
    },
    {
      title: "COCOA / CALM",
      caption: "A quieter kind of afternoon.",
      color: "#624068",
      accent: "#d2b3d7",
    },
    {
      title: "VANILLA / GOLD",
      caption: "A warm note to carry with you.",
      color: "#ba8435",
      accent: "#f5dfa0",
    },
    {
      title: "CITRUS / CLEAR",
      caption: "Make a little space for fresh ideas.",
      color: "#4f8064",
      accent: "#c6e6b9",
    },
  ];
  root.innerHTML = `<section class="layered-bundle"><header><p>THE DAILY MIX / AN OBJECT STUDY</p><h2>A small change.<br>A new combination.</h2></header><div class="layered-bundle__stage" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="ベースはそのまま、右側の組み合わせを選ぶ"><div class="layered-bundle__base">${product("#347964", "#cbe2bb", "BASE")}<span>THE EVERYDAY BASE</span></div><span class="layered-bundle__plus" aria-hidden="true">+</span><div class="layered-bundle__variants">${items.map((item, i) => `<div class="layered-bundle__variant" data-variant="${i}" aria-hidden="${i !== 0}"><div class="layered-bundle__objects"><div class="layered-bundle__piece layered-bundle__piece--back">${product(item.color, item.accent, "MIX", true)}</div><div class="layered-bundle__piece layered-bundle__piece--front">${product(item.color, item.accent, "MIX", true)}</div><div class="layered-bundle__piece layered-bundle__piece--main">${product(item.color, item.accent, "STUDY")}</div></div><h3>${item.title}</h3><p>${item.caption}</p></div>`).join("")}</div></div><footer><button type="button" data-previous aria-label="前の組み合わせ">←</button><span data-status role="status" aria-live="polite">01 / 04 · BERRY / BRIGHT</span><button type="button" data-next aria-label="次の組み合わせ">→</button></footer><p class="layered-bundle__hint">右の形とタイトルを、重ねながら切り替えます</p></section>`;
  const stage = root.querySelector(".layered-bundle__stage");
  const variants = [...root.querySelectorAll("[data-variant]")];
  const status = root.querySelector("[data-status]");
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  let selected = 0,
    frame = 0,
    pointer = null,
    startX = 0,
    startY = 0;
  let weights = items.map((_, i) => (i === 0 ? 1 : 0));
  let offsets = items.map(() => 0);
  function render() {
    variants.forEach((variant, i) => {
      variant.style.opacity = String(weights[i]);
      variant.style.visibility = weights[i] < 0.001 ? "hidden" : "visible";
      variant.style.zIndex = i === selected ? "2" : "1";
      variant.querySelector("h3").style.transform =
        `translateY(${offsets[i] * 22}px)`;
      variant.querySelector("p").style.transform =
        `translateY(${offsets[i] * 15}px)`;
      const pieces = variant.querySelectorAll(".layered-bundle__piece");
      pieces.forEach((piece, j) => {
        const baseRotation = j === 0 ? -18 : j === 1 ? 16 : 0;
        piece.style.transform = `translate(${offsets[i] * (j === 2 ? 38 : 24)}px,${Math.abs(offsets[i]) * (j === 2 ? 16 : 34)}px) rotate(${baseRotation + offsets[i] * (j === 2 ? 9 : -14)}deg)`;
      });
    });
    root.dataset.position = String(selected);
  }
  function updateState() {
    status.textContent = `${String(selected + 1).padStart(2, "0")} / 04 · ${items[selected].title}`;
    previous.disabled = selected === 0;
    next.disabled = selected === items.length - 1;
    variants.forEach((variant, i) =>
      variant.setAttribute("aria-hidden", String(i !== selected)),
    );
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function go(index) {
    const target = Math.max(0, Math.min(items.length - 1, index));
    if (target === selected) return;
    stop();
    const direction = Math.sign(target - selected);
    selected = target;
    updateState();
    if (reducedMotion) {
      weights = items.map((_, i) => (i === selected ? 1 : 0));
      offsets.fill(0);
      render();
      return;
    }
    // Capture every visible layer: rapid clicks continue from the current blend.
    const fromWeights = [...weights],
      fromOffsets = [...offsets],
      start = performance.now();
    if (weights[selected] < 0.001) fromOffsets[selected] = direction;
    function tick(time) {
      const p = Math.min(1, (time - start) / 760),
        ease = 1 - Math.pow(1 - p, 3);
      weights = fromWeights.map(
        (weight, i) => weight + ((i === selected ? 1 : 0) - weight) * ease,
      );
      offsets = fromOffsets.map(
        (offset, i) =>
          offset + ((i === selected ? 0 : -direction) - offset) * ease,
      );
      render();
      if (p < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    }
    frame = requestAnimationFrame(tick);
  }
  listen(previous, "click", () => go(selected - 1), signal);
  listen(next, "click", () => go(selected + 1), signal);
  listen(
    stage,
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
    stage,
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      pointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    },
    signal,
  );
  listen(
    stage,
    "pointerup",
    (event) => {
      if (pointer !== event.pointerId) return;
      const dx = event.clientX - startX,
        dy = event.clientY - startY;
      pointer = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
        go(selected + (dx < 0 ? 1 : -1));
    },
    signal,
  );
  listen(
    stage,
    "pointercancel",
    () => {
      pointer = null;
    },
    signal,
  );
  listen(
    stage,
    "pointerleave",
    () => {
      pointer = null;
    },
    signal,
  );
  function reset() {
    stop();
    pointer = null;
    selected = 0;
    weights = items.map((_, i) => (i === 0 ? 1 : 0));
    offsets.fill(0);
    updateState();
    render();
  }
  function replay() {
    reset();
    go(1);
  }
  function destroy() {
    stop();
    pointer = null;
  }
  signal.addEventListener("abort", destroy, { once: true });
  updateState();
  render();
  return { replay, reset, destroy };
}
