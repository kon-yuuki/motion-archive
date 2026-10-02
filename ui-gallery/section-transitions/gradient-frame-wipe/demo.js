/** A gradient border gives way to a growing paper cover; content swaps only under cover. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="gradient-frame-wipe"><header><span>FIELD NOTES / TWO SCENES</span><span>Click a scene below ↓</span></header><div class="gradient-frame-wipe__stage"><article class="gradient-frame-wipe__page gradient-frame-wipe__page--a"><svg class="gradient-frame-wipe__architecture" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="frame-wipe-concrete" x2="1" y2="1"><stop stop-color="#dadcd7"/><stop offset="1" stop-color="#929b94"/></linearGradient></defs><rect width="900" height="600" fill="#a6aea7"/><path d="M0 600V0h900v600H705V190a255 255 0 0 0-510 0v410Z" fill="url(#frame-wipe-concrete)"/><path d="M195 600V210a255 255 0 0 1 510 0v390Z" fill="#3e4a42"/><path d="M255 600V230a195 195 0 0 1 390 0v370Z" fill="#879188"/><path d="M315 600V250a135 135 0 0 1 270 0v350Z" fill="#253b31"/><path d="M367 600V270a83 83 0 0 1 166 0v330Z" fill="#d2d8c6"/><path d="M0 530 900 440v160H0Z" fill="#172d2480"/><path d="M20 0v600M140 0v600M760 0v600M880 0v600" stroke="#eef3eb" opacity=".2"/></svg><div class="gradient-frame-wipe__page-caption"><p>01 / SPACES BETWEEN</p><h2>See what<br>stays quiet.</h2><span>Original architectural study</span></div></article><article class="gradient-frame-wipe__page gradient-frame-wipe__page--b" hidden><div class="gradient-frame-wipe__editorial"><p>02 / ANOTHER PERSPECTIVE</p><h2>Small forms.<br>New stories.</h2><svg viewBox="0 0 640 360" aria-label="重なる三つの抽象的な石の図形" role="img"><rect width="640" height="360" fill="#c0cdc5"/><ellipse cx="322" cy="306" rx="189" ry="19" fill="#334b3d" opacity=".2"/><rect x="152" y="198" width="333" height="92" rx="46" fill="#506d57"/><path d="M246 199V143a77 77 0 0 1 154 0v56Z" fill="#e7dfb0"/><circle cx="323" cy="87" r="39" fill="#b2836d"/><path d="M0 0h640v20H0Z" fill="#c9d4cd"/></svg><div><span>SCULPTURE / STUDY 002</span><span>→</span></div></div></article><div class="gradient-frame-wipe__overlay" aria-hidden="true"><div class="gradient-frame-wipe__cover"><div class="gradient-frame-wipe__mark"><svg viewBox="0 0 80 80"><path d="M12 52 40 14l28 38-28 14Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 52h56M40 14v52" stroke="currentColor" stroke-width="1"/></svg><span>FIELD NOTES</span></div></div></div></div><footer><div class="gradient-frame-wipe__tabs" role="group" aria-label="表示する場面"><button type="button" data-scene="0" aria-pressed="true">01 / Space</button><button type="button" data-scene="1" aria-pressed="false">02 / Form</button></div><span data-status role="status" aria-live="polite">Scene 01</span></footer></section>`;
  const pages = [...root.querySelectorAll(".gradient-frame-wipe__page")],
    overlay = root.querySelector(".gradient-frame-wipe__overlay"),
    cover = root.querySelector(".gradient-frame-wipe__cover");
  const buttons = [...root.querySelectorAll("[data-scene]")],
    status = root.querySelector("[data-status]");
  const events = new AbortController();
  let current = 0,
    target = 0,
    animations = [],
    timers = [],
    generation = 0;
  function cancel() {
    generation++;
    animations.forEach((a) => a.cancel());
    animations = [];
    timers.forEach(clearTimeout);
    timers = [];
  }
  function show(index) {
    current = index;
    pages.forEach((page, i) => (page.hidden = i !== index));
    root.dataset.scene = String(index + 1);
  }
  function controls(index) {
    buttons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
  }
  function navigate(index, { instant = false, force = false } = {}) {
    if (index === target && !force && !animations.length) return;
    const oldOpacity = getComputedStyle(overlay).opacity;
    const oldClip = getComputedStyle(cover).clipPath;
    cancel();
    target = index;
    controls(target);
    if (instant || reducedMotion) {
      show(index);
      overlay.style.opacity = "0";
      cover.style.clipPath = "inset(8% 6%)";
      status.textContent = `Scene 0${index + 1}`;
      return;
    }
    const token = generation;
    overlay.style.opacity = "0";
    cover.style.clipPath = "inset(0% 0%)";
    status.textContent = "場面を切り替えています";
    animations.push(
      overlay.animate(
        [
          { opacity: Number(oldOpacity), offset: 0 },
          { opacity: 1, offset: 0.11 },
          { opacity: 1, offset: 0.76 },
          { opacity: 0, offset: 1 },
        ],
        { duration: 1280, easing: "linear" },
      ),
    );
    animations.push(
      cover.animate(
        [
          {
            clipPath: Number(oldOpacity) > 0.15 ? oldClip : "inset(9% 7%)",
            offset: 0,
          },
          {
            clipPath: Number(oldOpacity) > 0.15 ? oldClip : "inset(9% 7%)",
            offset: 0.1,
          },
          { clipPath: "inset(0% 0%)", offset: 0.58 },
          { clipPath: "inset(0% 0%)", offset: 1 },
        ],
        { duration: 1280, easing: "cubic-bezier(.65,0,.25,1)" },
      ),
    );
    timers.push(
      setTimeout(() => {
        if (token === generation) show(index);
      }, 830),
    );
    timers.push(
      setTimeout(() => {
        if (token === generation) {
          animations = [];
          status.textContent = `Scene 0${index + 1}`;
        }
      }, 1280),
    );
  }
  buttons.forEach((button, index) =>
    button.addEventListener("click", () => navigate(index), {
      signal: events.signal,
    }),
  );
  function reset() {
    navigate(0, { instant: true, force: true });
  }
  function replay() {
    navigate(1 - target, { force: true });
  }
  function destroy() {
    cancel();
    events.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  reset();
  return { replay, reset, destroy };
}
