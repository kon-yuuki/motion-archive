import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** Keep the viewport and ruler still; only the pictures travel through the aperture. */
export function createDemo(root, { signal, reducedMotion }) {
  const names = [
    "A place to begin",
    "The open door",
    "A different shape",
    "In good company",
    "A moment in gold",
    "Another way through",
    "Back to the landscape",
  ];
  root.innerHTML = `<section class="vertical-aperture"><header><p>FRAME BY FRAME</p><h2>Stories in motion.</h2><span>Selected visual studies</span></header><div class="vertical-aperture__viewport" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="縦に送る7枚の映像スタディ"><div class="vertical-aperture__track">${names.map((name, i) => `<article class="vertical-aperture__frame" aria-label="${i + 1} / 7: ${name}"><div class="vertical-aperture__image">${makeArt(i, name)}</div><div class="vertical-aperture__caption"><span>STUDY ${String(i + 1).padStart(2, "0")}</span><h3>${name}</h3></div></article>`).join("")}</div></div><footer><button type="button" data-previous aria-label="前のシーン">↑</button><div class="vertical-aperture__ruler" aria-label="シーンを選ぶ">${names.map((name, i) => `<button type="button" data-index="${i}" aria-label="${i + 1}: ${name}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span></button>`).join("")}</div><button type="button" data-next aria-label="次のシーン">↓</button></footer><p data-status role="status" aria-live="polite">01 / 07 · A place to begin</p></section>`;
  const viewport = root.querySelector(".vertical-aperture__viewport");
  const track = root.querySelector(".vertical-aperture__track");
  const frames = [...root.querySelectorAll(".vertical-aperture__frame")];
  const buttons = [...root.querySelectorAll("[data-index]")];
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  const status = root.querySelector("[data-status]");
  let position = 0,
    selected = 0,
    bow = 0,
    animation = 0;
  let pointer = null,
    startX = 0,
    startY = 0;
  function render() {
    track.style.transform = `translate3d(0,${-position * viewport.clientHeight}px,0)`;
    // An inset curved clip is a light CSS interpretation of the recorded edge bow.
    const inset = reducedMotion ? 0 : bow * 2.2;
    track.style.clipPath = "none";
    viewport.style.borderRadius = `${inset * 2}% / ${inset * 8}%`;
    frames.forEach((frame, i) => {
      frame.setAttribute("aria-hidden", String(i !== selected));
      frame.style.transform = `scaleX(${1 - inset / 100})`;
    });
    root.dataset.position = String(selected);
  }
  function updateState() {
    buttons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === selected)),
    );
    previous.disabled = selected === 0;
    next.disabled = selected === names.length - 1;
    status.textContent = `${String(selected + 1).padStart(2, "0")} / 07 · ${names[selected]}`;
  }
  function stop() {
    cancelAnimationFrame(animation);
    animation = 0;
  }
  function go(index) {
    const target = Math.max(0, Math.min(names.length - 1, index));
    if (target === selected) return;
    stop();
    selected = target;
    updateState();
    if (reducedMotion) {
      position = selected;
      bow = 0;
      render();
      return;
    }
    const from = position,
      oldBow = bow,
      start = performance.now();
    function tick(time) {
      const p = Math.min(1, (time - start) / 680),
        eased = p * p * (3 - 2 * p);
      position = from + (selected - from) * eased;
      bow = Math.max(oldBow * (1 - p), Math.sin(p * Math.PI));
      render();
      if (p < 1) animation = requestAnimationFrame(tick);
      else {
        animation = 0;
        bow = 0;
        render();
      }
    }
    animation = requestAnimationFrame(tick);
  }
  listen(previous, "click", () => go(selected - 1), signal);
  listen(next, "click", () => go(selected + 1), signal);
  buttons.forEach((button) =>
    listen(button, "click", () => go(Number(button.dataset.index)), signal),
  );
  listen(
    viewport,
    "keydown",
    (event) => {
      if (
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      go(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? names.length - 1
            : selected +
              (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1),
      );
    },
    signal,
  );
  listen(
    viewport,
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
    viewport,
    "pointerup",
    (event) => {
      if (pointer !== event.pointerId) return;
      const dx = event.clientX - startX,
        dy = event.clientY - startY;
      pointer = null;
      // Horizontal swipes change the vertical film; vertical gestures keep page scrolling.
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
        go(selected + (dx < 0 ? 1 : -1));
    },
    signal,
  );
  listen(
    viewport,
    "pointercancel",
    () => {
      pointer = null;
    },
    signal,
  );
  listen(
    viewport,
    "pointerleave",
    () => {
      pointer = null;
    },
    signal,
  );
  const resize = new ResizeObserver(render);
  resize.observe(viewport);
  function reset() {
    stop();
    pointer = null;
    position = selected = bow = 0;
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
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  updateState();
  render();
  return { replay, reset, destroy };
}
