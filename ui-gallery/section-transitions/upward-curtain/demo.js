/** A stationary menu is clipped by its moving lower edge. No page scroll is intercepted. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="upward-curtain"><div class="upward-curtain__stage"><header><span>FRAME / STUDIO</span><button type="button" data-toggle aria-expanded="false">Menu <span aria-hidden="true">＋</span></button></header><div class="upward-curtain__home"><div class="upward-curtain__intro"><p>INDEPENDENT DESIGN PRACTICE</p><h2>Room for<br>new ideas.</h2><p>よいアイデアに、<br>ひらく場所を。</p><span class="upward-curtain__seal" aria-hidden="true">→</span></div><div class="upward-curtain__strips" aria-hidden="true"><div><span>01 / FORM</span><svg viewBox="0 0 100 220"><circle cx="50" cy="85" r="39" fill="#e4fa8a"/><rect x="11" y="85" width="78" height="115" rx="39" fill="#313c6a"/></svg></div><div><span>02 / SPACE</span><svg viewBox="0 0 100 220"><path d="M0 200 50 30 100 200Z" fill="#ede7fc"/><path d="M20 200 50 100 80 200Z" fill="#493b61"/></svg></div><div><span>03 / OBJECT</span><svg viewBox="0 0 100 220"><circle cx="50" cy="115" r="42" fill="#723a28"/><circle cx="50" cy="115" r="21" fill="#f4dacf"/></svg></div></div></div><div class="upward-curtain__menu" role="dialog" aria-label="デモ内メニュー" aria-modal="false" aria-hidden="true" inert><div class="upward-curtain__menu-top"><p>WHAT WOULD YOU LIKE<br>TO EXPLORE?</p><nav aria-label="デモの場面"><button type="button" data-item="Work"><span>01</span>Selected work →</button><button type="button" data-item="Approach"><span>02</span>Our approach →</button><button type="button" data-item="Hello"><span>03</span>Say hello →</button></nav></div><div class="upward-curtain__word" aria-hidden="true">FRAME.</div><p class="upward-curtain__menu-note">下の境界だけが動き、文字はその場で隠れます</p></div></div><footer><span data-state role="status" aria-live="polite">Menu closed</span><span>Menu → close / Esc</span></footer></section>`;
  const stage = root.querySelector(".upward-curtain__stage");
  const home = root.querySelector(".upward-curtain__home");
  const menu = root.querySelector(".upward-curtain__menu");
  const toggle = root.querySelector("[data-toggle]");
  const status = root.querySelector("[data-state]");
  const items = [...root.querySelectorAll("[data-item]")];
  const events = new AbortController();
  let open = false,
    animation = null,
    timer = 0,
    generation = 0;
  const clip = (value) => `inset(0px 0px ${value ? 0 : 100}% 0px)`;
  function cancel() {
    clearTimeout(timer);
    timer = 0;
    generation++;
    if (animation) {
      animation.cancel();
      animation = null;
    }
  }
  function setOpen(
    next,
    { instant = false, focus = false, message = "" } = {},
  ) {
    const current = getComputedStyle(menu).clipPath;
    cancel();
    open = next;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = `${open ? "Close" : "Menu"} <span aria-hidden="true">${open ? "−" : "＋"}</span>`;
    home.inert = open;
    menu.inert = !open;
    menu.setAttribute("aria-hidden", String(!open));
    menu.style.clipPath = clip(open);
    status.textContent =
      message || (open ? "Menu open / Escで閉じる" : "Menu closed");
    root.dataset.state = open ? "open" : "closed";
    if (!instant && !reducedMotion) {
      const token = generation;
      animation = menu.animate(
        [{ clipPath: current }, { clipPath: clip(open) }],
        { duration: 760, easing: "cubic-bezier(.76,0,.24,1)" },
      );
      animation.finished
        .then(() => {
          if (token === generation) animation = null;
        })
        .catch(() => {});
    }
    if (focus || (!open && menu.contains(document.activeElement)))
      (open ? items[0] : toggle).focus({ preventScroll: true });
  }
  toggle.addEventListener("click", () => setOpen(!open, { focus: true }), {
    signal: events.signal,
  });
  items.forEach((item) =>
    item.addEventListener(
      "click",
      () =>
        setOpen(false, {
          focus: true,
          message: `${item.dataset.item} selected / デモ内の場面へ戻りました`,
        }),
      { signal: events.signal },
    ),
  );
  stage.addEventListener(
    "keydown",
    (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false, { focus: true });
      }
      if (event.key === "Tab") {
        const focusables = [toggle, ...items];
        const first = focusables[0],
          last = focusables.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    { signal: events.signal },
  );
  function reset() {
    const hadFocus = menu.contains(document.activeElement);
    setOpen(false, { instant: true, focus: hadFocus });
  }
  function replay() {
    setOpen(true, { instant: true });
    timer = window.setTimeout(() => setOpen(false), reducedMotion ? 0 : 450);
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
