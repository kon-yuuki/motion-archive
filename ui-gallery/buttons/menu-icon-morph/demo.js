import { gsap } from "gsap";

let nextMenuId = 0;

/** A bounded trace of Dennis's drawer, not a second gallery navigation system. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const id = `dennis-menu-${++nextMenuId}`;
  root.innerHTML = `
    <section class="menu-icon-morph" aria-label="Dennis Snellenberg のメニュー再現">
      <button class="menu-icon-morph__backdrop" type="button" tabindex="-1" aria-label="メニューを閉じる" disabled></button>
      <div class="menu-icon-morph__panel" id="${id}" role="dialog" aria-label="Navigation / 移動しない操作デモ" aria-hidden="true" inert>
        <div class="menu-icon-morph__curve" aria-hidden="true"><div class="menu-icon-morph__curve-width"><div class="menu-icon-morph__ellipse"></div></div></div>
        <div class="menu-icon-morph__inner">
          <nav class="menu-icon-morph__nav" aria-label="デモ用ナビゲーション（移動しません）">
            <p class="menu-icon-morph__eyebrow">Navigation</p>
            <div class="menu-icon-morph__stripe" aria-hidden="true"></div>
            <ul class="menu-icon-morph__links">
              ${["Home", "Work", "About", "Contact"].map((label, index) => `<li class="menu-icon-morph__item" style="--item-index:${index}"><a class="menu-icon-morph__link${index === 0 ? " is-current" : ""}" role="link" tabindex="0" aria-disabled="true"${index === 0 ? ' aria-current="page"' : ""}><span>${label}</span></a></li>`).join("")}
            </ul>
          </nav>
          <div class="menu-icon-morph__socials">
            <div class="menu-icon-morph__stripe" aria-hidden="true"></div>
            <p class="menu-icon-morph__eyebrow">Socials</p>
            <div class="menu-icon-morph__social-links">${["Awwwards", "Instagram", "Twitter", "LinkedIn"].map(label => `<a role="link" tabindex="0" aria-disabled="true">${label}</a>`).join("")}</div>
          </div>
        </div>
      </div>
      <button class="menu-icon-morph__toggle" type="button" aria-expanded="false" aria-controls="${id}" aria-label="メニューを開く">
        <span class="menu-icon-morph__fill" aria-hidden="true"></span>
        <span class="menu-icon-morph__magnet" aria-hidden="true"><span class="menu-icon-morph__glyph"><i></i><i></i></span></span>
      </button>
      <span class="menu-icon-morph__sr-only" role="status" aria-live="polite"></span>
    </section>`;

  const stage = root.querySelector(".menu-icon-morph");
  const trigger = stage.querySelector(".menu-icon-morph__toggle");
  const magnet = stage.querySelector(".menu-icon-morph__magnet");
  const fill = stage.querySelector(".menu-icon-morph__fill");
  const panel = stage.querySelector(".menu-icon-morph__panel");
  const backdrop = stage.querySelector(".menu-icon-morph__backdrop");
  const status = stage.querySelector('[role="status"]');
  const links = [...panel.querySelectorAll('[role="link"]')];
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const lifecycle = new AbortController();
  const on = (element, type, callback) => element.addEventListener(type, callback, { signal: lifecycle.signal });
  let open = false;
  let hovering = false;
  let focused = false;
  let filled = false;
  let destroyed = false;
  const magneticEnabled = () => !reducedMotion && pointer.matches && stage.clientWidth > 540;
  const tween = (element, values) => gsap.to(element, { overwrite: true, ...values });

  function paintFill(active, immediate = false) {
    if (active === filled && !immediate) return;
    filled = active;
    gsap.killTweensOf(fill);
    if (reducedMotion || immediate) {
      gsap.set(fill, { yPercent: active ? 0 : -76 });
    } else if (active) {
      gsap.set(fill, { yPercent: 76 });
      tween(fill, { yPercent: 0, duration: 0.6, ease: "power2.inOut" });
    } else {
      tween(fill, { yPercent: -76, duration: 0.6, ease: "power2.inOut" });
    }
  }

  function returnHome(immediate = false) {
    for (const element of [trigger, magnet]) {
      if (reducedMotion || immediate) {
        gsap.killTweensOf(element);
        gsap.set(element, { x: 0, y: 0 });
      } else tween(element, { x: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" });
    }
  }

  function setOpen(value, { immediate = false, restoreFocus = false } = {}) {
    if (destroyed) return;
    if (immediate) stage.classList.add("is-immediate");
    if (!value && panel.contains(document.activeElement)) restoreFocus = true;
    // Return focus before making the panel inert/aria-hidden.
    if (restoreFocus) trigger.focus({ preventScroll: true });
    open = value;
    stage.classList.toggle("is-open", open);
    stage.dataset.state = open ? "open" : "closed";
    panel.inert = !open;
    panel.setAttribute("aria-hidden", String(!open));
    backdrop.disabled = !open;
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    status.textContent = open ? "メニューを開きました。デモ内のリンクは移動しません。Escape で閉じます" : "メニューを閉じました";
    paintFill(open || hovering || focused, immediate);
    if (immediate) {
      // Flush this state before restoring transitions. No timeout can outlive reset.
      void panel.offsetWidth;
      stage.classList.remove("is-immediate");
    }
  }

  on(trigger, "click", () => setOpen(!open));
  on(backdrop, "click", () => setOpen(false, { restoreFocus: true }));
  // Gallery keyboard fallback. Source keyboard behavior has not been claimed.
  on(stage, "keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, { restoreFocus: true });
    } else if (event.key === "Tab") {
      const order = [trigger, ...links];
      const current = order.indexOf(document.activeElement);
      event.preventDefault();
      order[(current + (event.shiftKey ? -1 : 1) + order.length) % order.length].focus({ preventScroll: true });
    }
  });
  // Inert navigation is explicit. It never creates a made-up selected state.
  links.forEach(link => on(link, "click", event => event.preventDefault()));
  on(stage, "focusout", (event) => {
    if (open && event.relatedTarget && !stage.contains(event.relatedTarget)) setOpen(false);
  });
  on(trigger, "pointerenter", (event) => {
    if (event.pointerType === "touch" || !pointer.matches) return;
    hovering = true;
    paintFill(true);
  });
  on(trigger, "pointermove", (event) => {
    if (event.pointerType === "touch" || !magneticEnabled()) return;
    const bounds = trigger.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / trigger.offsetWidth - 0.5;
    const y = (event.clientY - bounds.top) / trigger.offsetHeight - 0.5;
    tween(trigger, { x: x * 50, y: y * 50, duration: 1.5, ease: "power4.out" });
    tween(magnet, { x: x * 25, y: y * 25, duration: 1.5, ease: "power4.out" });
  });
  const leave = () => { hovering = false; returnHome(); paintFill(open || focused); };
  on(trigger, "pointerleave", leave);
  on(trigger, "pointercancel", leave);
  on(trigger, "focus", () => {
    focused = trigger.matches(":focus-visible");
    if (focused) paintFill(true, true);
  });
  on(trigger, "blur", () => { focused = false; paintFill(open || hovering); });
  on(pointer, "change", () => { hovering = false; returnHome(true); paintFill(open || focused, true); });
  const resize = new ResizeObserver(() => { if (!magneticEnabled()) returnHome(true); });
  resize.observe(stage);

  function reset() {
    hovering = false;
    focused = false;
    returnHome(true);
    setOpen(false, { immediate: true });
    paintFill(false, true);
  }
  function replay() {
    reset();
    // Remain open until the next input. A replay never closes while someone reads.
    setOpen(true);
  }
  function destroy() {
    if (destroyed) return;
    reset();
    destroyed = true;
    lifecycle.abort();
    resize.disconnect();
    gsap.killTweensOf([trigger, magnet, fill]);
    stage.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    signal?.removeEventListener("abort", destroy);
  }
  stage.dataset.state = "closed";
  stage.dataset.reducedMotion = String(reducedMotion);
  gsap.set(fill, { y: 0, yPercent: -76 });
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
