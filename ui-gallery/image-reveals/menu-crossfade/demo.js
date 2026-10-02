import { makeArt } from "../../_motion/demo-helpers.js";

/** Three original images crossfade in one fixed frame. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const items = [
    {
      label: "Objects",
      caption: "かたちを集める",
      description: "静かな形から、次のアイデアを見つける。",
      art: 2,
    },
    {
      label: "Spaces",
      caption: "余白をつくる",
      description: "光と余白で、見え方を整える。",
      art: 1,
    },
    {
      label: "Outdoors",
      caption: "外へひらく",
      description: "風景の中に、新しい視点を探す。",
      art: 0,
    },
  ];
  root.innerHTML = `<section class="menu-crossfade" aria-label="固定枠で画像を切り替えるデモ">
    <div class="menu-crossfade__top"><span>IMAGE STUDY / 02</span><span>One frame, three perspectives</span></div>
    <div class="menu-crossfade__body"><figure class="menu-crossfade__figure"><div class="menu-crossfade__frame" aria-hidden="true">${items.map((item, index) => `<div class="menu-crossfade__image${index === 0 ? " is-active" : ""}" data-image="${index}">${makeArt(item.art, item.label)}</div>`).join("")}<span class="menu-crossfade__frame-number">01 / 03</span></div><figcaption class="menu-crossfade__caption">${items[0].caption}</figcaption></figure>
    <div class="menu-crossfade__content"><p class="menu-crossfade__eyebrow">Choose a perspective</p><div class="menu-crossfade__menu" aria-label="画像のテーマ">${items.map((item, index) => `<button type="button" class="menu-crossfade__choice${index === 0 ? " is-active" : ""}" aria-pressed="${index === 0}"><span class="menu-crossfade__index">0${index + 1}</span><span>${item.label}</span><span class="menu-crossfade__mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg></span></button>`).join("")}</div><p class="menu-crossfade__description">${items[0].description}</p></div></div>
    <div class="menu-crossfade__bottom"><span>Hover · Focus · Tap</span><span role="status" aria-live="polite">Objects を表示中</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".menu-crossfade");
  const buttons = [...root.querySelectorAll("button")];
  const images = [...root.querySelectorAll("[data-image]")];
  const status = root.querySelector('[role="status"]');
  const caption = root.querySelector("figcaption");
  const description = root.querySelector(".menu-crossfade__description");
  const number = root.querySelector(".menu-crossfade__frame-number");
  let active = 0;
  let timers = [];
  let destroyed = false;
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifecycle.signal });
  function stopPreview() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function select(index, announce = true) {
    active = index;
    buttons.forEach((button, i) => {
      button.classList.toggle("is-active", i === index);
      button.setAttribute("aria-pressed", String(i === index));
    });
    images.forEach((image, i) =>
      image.classList.toggle("is-active", i === index),
    );
    caption.textContent = items[index].caption;
    description.textContent = items[index].description;
    number.textContent = `0${index + 1} / 03`;
    if (announce) status.textContent = `${items[index].label} を表示中`;
  }
  buttons.forEach((button, index) => {
    on(button, "pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      stopPreview();
      select(index);
    });
    on(button, "focus", () => {
      stopPreview();
      select(index);
    });
    on(button, "click", () => {
      stopPreview();
      select(index);
    });
  });
  function reset() {
    stopPreview();
    select(0);
  }
  function replay() {
    stopPreview();
    select((active + 1) % items.length);
    timers.push(
      setTimeout(
        () => select((active + 1) % items.length),
        reducedMotion ? 750 : 1400,
      ),
    );
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPreview();
    lifecycle.abort();
    stage
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
