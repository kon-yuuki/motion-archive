import { easings } from "../src/data/easings.js";
import { easingFunctions } from "../src/scripts/easing-functions.js";
import { initSmoothScroll } from "../src/scripts/smooth-scroll.js";

const catalog = document.querySelector("[data-easing-catalog]");
const summary = document.querySelector("[data-easing-summary]");
const globalControl = document.querySelector(".easing-global-control");
const globalDuration = document.querySelector("[data-global-duration]");
const globalDurationOutput = document.querySelector("[data-global-duration-output]");
const globalDurationCompactOutput = document.querySelector("[data-global-duration-compact-output]");
const globalDurationToggle = document.querySelector("[data-global-duration-toggle]");
const globalDurationReset = document.querySelector("[data-global-duration-reset]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeRuns = new WeakMap();
const tracerRuns = new WeakMap();
const copyTimers = new WeakMap();
const defaultDuration = 1200;
const trackPadding = 0;
let currentDuration = defaultDuration;

const familyLabels = {
  in: "Ease In",
  out: "Ease Out",
  "in-out": "Ease In Out"
};

const smoothScroll = initSmoothScroll({
  lerp: 0.08,
  wheelMultiplier: 0.9
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function copyButton(label, value, language) {
  return `
    <button
      class="easing-row__code"
      type="button"
      data-copy-code
      data-copy-value="${escapeHtml(value)}"
      aria-label="Copy ${label}"
    >
      <span class="easing-row__code-label">${language}</span>
      <code>${escapeHtml(value)}</code>
      <span class="easing-row__copy-tip" data-copy-tip role="status">Click to copy</span>
    </button>
  `;
}

function curveGeometry(easingFunction, samples = 64) {
  const values = [];
  for (let i = 0; i < samples; i += 1) {
    values.push(easingFunction(i / (samples - 1)));
  }

  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const top = 8;
  const bottom = 92;
  const span = bottom - top;
  const mapY = (value) => bottom - ((value - min) / range) * span;

  return { values, mapY };
}

function curveSvg(easingFunction) {
  const { values, mapY } = curveGeometry(easingFunction);

  const path = values
    .map((value, i) => {
      const x = ((i / (values.length - 1)) * 100).toFixed(2);
      const y = mapY(value).toFixed(2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const y0 = mapY(0).toFixed(2);
  const y1 = mapY(1).toFixed(2);

  return `
    <svg class="easing-curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line class="easing-curve__base" x1="0" y1="${y0}" x2="100" y2="${y0}" />
      <line class="easing-curve__base" x1="0" y1="${y1}" x2="100" y2="${y1}" />
      <line class="easing-curve__linear" x1="0" y1="${y0}" x2="100" y2="${y1}" />
      <path class="easing-curve__path" d="${path}" />
      <circle class="easing-curve__dot" r="4" cx="0" cy="${y0}" />
    </svg>
  `;
}

function easingCard(easing, index) {
  const links = easing.uses
    .map(({ label, href }) => `<a href="${href}">${label}</a>`)
    .join("");
  const cssCode = easing.css
    ? copyButton(`${easing.name} CSS code`, easing.css, "CSS")
    : `<p class="easing-row__no-css">CSS cubic-bezierでは再現不可</p>`;

  return `
    <article class="easing-card" id="${easing.id}" data-easing="${easing.id}">
      <button
        class="easing-card__toggle"
        type="button"
        data-toggle
        aria-expanded="false"
        aria-controls="${easing.id}-demo"
      >
        <span class="easing-card__head">
          <span class="easing-card__index">${String(index + 1).padStart(2, "0")}</span>
          <span class="easing-card__name">${easing.name}</span>
          <span class="easing-card__tag">${easing.css ? "CSS" : "JS"}</span>
        </span>
        <span class="easing-card__graph">
          ${curveSvg(easingFunctions[easing.key])}
        </span>
      </button>
      <div class="easing-card__demo" id="${easing.id}-demo" data-demo hidden>
        <div class="easing-demo__track" role="img" aria-label="${easing.name} movement">
          <span class="easing-demo__line" aria-hidden="true"></span>
          <span class="easing-demo__ghost" aria-hidden="true"></span>
          <span class="easing-demo__box" aria-hidden="true"></span>
        </div>
        <button class="easing-demo__action" type="button" data-start>
          <span>Start</span>
          <span aria-hidden="true">→</span>
        </button>
        <div class="easing-row__codes">
          ${copyButton(`${easing.name} JavaScript code`, easing.functionCode, "JavaScript")}
          ${cssCode}
        </div>
        <p class="easing-row__description">${easing.description}</p>
        ${links ? `<div class="easing-row__links" aria-label="${easing.name} usage">${links}</div>` : ""}
      </div>
    </article>
  `;
}

function familySection(family, indexOffset) {
  const items = easings.filter((easing) => easing.family === family);

  return `
    <section class="easing-family" id="${family}">
      <header class="easing-family__header">
        <h2>${familyLabels[family]}</h2>
        <p>${String(items.length).padStart(2, "0")} functions</p>
      </header>
      <div class="easing-grid">
        ${items.map((item, index) => easingCard(item, indexOffset + index)).join("")}
      </div>
    </section>
  `;
}

const families = ["in", "out", "in-out"];
const countFamily = (family) => easings.filter((easing) => easing.family === family).length;
const cssCount = easings.filter((easing) => easing.css).length;

let rowIndex = 0;
catalog.innerHTML = `
  <section class="easing-type">
    <header class="easing-type__header">
      <p>Easings.net catalog</p>
      <h2>${easings.length} Functions</h2>
      <span>公式の数学関数をデモに使用。CSSで表現できる${cssCount}種類は対応するcubic-bezierも併記しています。</span>
    </header>
    ${families.map((family) => {
      const section = familySection(family, rowIndex);
      rowIndex += countFamily(family);
      return section;
    }).join("")}
  </section>
`;

summary.innerHTML = `
  ${families.map((family) =>
    `<a href="#${family}">${familyLabels[family]} <span>${String(countFamily(family)).padStart(2, "0")}</span></a>`
  ).join("")}
  <a href="https://easings.net/ja" target="_blank" rel="noreferrer">Source <span>↗</span></a>
`;
document.querySelector("[data-easing-count]").textContent = String(easings.length).padStart(2, "0");

function syncCurrentEasing({ scroll = true } = {}) {
  document.querySelectorAll("[data-easing][data-current]").forEach((row) => {
    row.removeAttribute("data-current");
  });

  const easingId = decodeURIComponent(window.location.hash.slice(1));
  const target = document.getElementById(easingId);

  if (!target?.matches("[data-easing]")) {
    return;
  }

  target.setAttribute("data-current", "");

  if (scroll) {
    smoothScroll.lenis.resize();
    smoothScroll.scrollTo(target, {
      offset: -24
    });
  }
}

function animateLeg(parts, distance, offset, from, to, duration, easingFunction, run) {
  const { box, ghost, dot, mapY } = parts;

  return new Promise((resolve) => {
    const start = performance.now();

    const tick = (time) => {
      if (run.cancelled) {
        resolve();
        return;
      }

      const progress = Math.min(1, Math.max(0, (time - start) / duration));
      const eased = easingFunction(progress);
      const position = from + (to - from) * eased;
      box.style.transform = `translate(${offset + distance * position}px, -50%)`;

      if (ghost) {
        const linear = from + (to - from) * progress;
        ghost.style.transform = `translate(${offset + distance * linear}px, -50%)`;
      }

      if (dot) {
        dot.setAttribute("cx", (progress * 100).toFixed(2));
        dot.setAttribute("cy", mapY(eased).toFixed(2));
      }

      if (progress < 1) {
        run.frame = requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    run.frame = requestAnimationFrame(tick);
  });
}

function setActionLabel(button, side, running) {
  if (!button) {
    return;
  }

  if (running) {
    button.disabled = true;
    button.innerHTML = "<span>Running</span><span aria-hidden=\"true\">•••</span>";
    return;
  }

  button.disabled = false;
  button.innerHTML = side === "right"
    ? "<span>Back</span><span aria-hidden=\"true\">←</span>"
    : "<span>Start</span><span aria-hidden=\"true\">→</span>";
}

async function playDemo(card) {
  const easing = easings.find((item) => item.id === card.dataset.easing);
  const track = card.querySelector(".easing-demo__track");
  const box = card.querySelector(".easing-demo__box");
  const ghost = card.querySelector(".easing-demo__ghost");
  const dot = card.querySelector(".easing-curve__dot");
  const button = card.querySelector("[data-start]");

  if (!easing || !track || !box) {
    return;
  }

  const previous = activeRuns.get(box);
  if (previous) {
    previous.cancelled = true;
    cancelAnimationFrame(previous.frame);
  }

  const run = { cancelled: false, frame: 0 };
  activeRuns.set(box, run);
  const easingFunction = easingFunctions[easing.key];
  const { mapY } = curveGeometry(easingFunction);
  const distance = Math.max(0, track.clientWidth - box.offsetWidth);
  const from = card.dataset.side === "right" ? 1 : 0;
  const to = from === 0 ? 1 : 0;

  const settle = () => {
    box.style.transform = `translate(${distance * to}px, -50%)`;
    ghost.style.transform = `translate(${distance * to}px, -50%)`;
    dot.setAttribute("cx", "100");
    dot.setAttribute("cy", mapY(1).toFixed(2));
    card.dataset.side = to === 1 ? "right" : "left";
    setActionLabel(button, card.dataset.side, false);
  };

  box.style.transform = `translate(${distance * from}px, -50%)`;
  ghost.style.transform = `translate(${distance * from}px, -50%)`;
  setActionLabel(button, card.dataset.side, true);

  if (reducedMotion.matches) {
    settle();
    return;
  }

  await animateLeg(
    { box, ghost, dot, mapY },
    distance,
    0,
    from,
    to,
    currentDuration,
    easingFunction,
    run
  );

  if (!run.cancelled) {
    settle();
  }
}

function playTracer(card) {
  if (reducedMotion.matches || card.hasAttribute("data-open")) {
    return;
  }

  const easing = easings.find((item) => item.id === card.dataset.easing);
  const dot = card.querySelector(".easing-curve__dot");

  if (!easing || !dot) {
    return;
  }

  stopTracer(card);
  const easingFunction = easingFunctions[easing.key];
  const { mapY } = curveGeometry(easingFunction);
  const run = { cancelled: false, frame: 0 };
  tracerRuns.set(card, run);
  const begin = performance.now();

  const tick = (time) => {
    if (run.cancelled) {
      return;
    }

    const progress = ((time - begin) % currentDuration) / currentDuration;
    dot.setAttribute("cx", (progress * 100).toFixed(2));
    dot.setAttribute("cy", mapY(easingFunction(progress)).toFixed(2));
    run.frame = requestAnimationFrame(tick);
  };

  run.frame = requestAnimationFrame(tick);
}

function stopTracer(card) {
  const run = tracerRuns.get(card);
  if (run) {
    run.cancelled = true;
    cancelAnimationFrame(run.frame);
  }

  if (card.hasAttribute("data-open")) {
    return;
  }

  const easing = easings.find((item) => item.id === card.dataset.easing);
  const dot = card.querySelector(".easing-curve__dot");
  if (easing && dot) {
    const { mapY } = curveGeometry(easingFunctions[easing.key]);
    dot.setAttribute("cx", "0");
    dot.setAttribute("cy", mapY(0).toFixed(2));
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

const flipEasing = "cubic-bezier(0.16, 1, 0.3, 1)";
let activeModal = null;

function stopDemo(card) {
  const box = card.querySelector(".easing-demo__box");
  const run = box && activeRuns.get(box);
  if (run) {
    run.cancelled = true;
    cancelAnimationFrame(run.frame);
  }
}

function openModal(card) {
  if (activeModal) {
    return;
  }

  const toggle = card.querySelector("[data-toggle]");
  const demo = card.querySelector("[data-demo]");
  const first = card.getBoundingClientRect();

  const placeholder = document.createElement("div");
  placeholder.className = "easing-card-placeholder";
  placeholder.style.width = `${first.width}px`;
  placeholder.style.height = `${first.height}px`;
  card.before(placeholder);

  const backdrop = document.createElement("div");
  backdrop.className = "easing-modal-backdrop";
  backdrop.addEventListener("click", closeModal);
  document.body.append(backdrop);

  stopTracer(card);
  card.classList.add("is-modal");
  card.setAttribute("data-open", "");
  card.dataset.side = "left";
  toggle?.setAttribute("aria-expanded", "true");
  if (demo) {
    demo.hidden = false;
  }
  smoothScroll.lenis?.stop();

  // Measure the target (modal) geometry with content laid out.
  // clientWidth excludes the reserved scrollbar gutter, so centring stays put.
  const viewportWidth = document.documentElement.clientWidth;
  const targetWidth = Math.min(620, viewportWidth - 48);
  card.style.width = `${targetWidth}px`;
  card.style.height = "auto";
  card.style.left = "0px";
  card.style.top = "0px";
  let targetHeight = card.getBoundingClientRect().height;
  const maxHeight = window.innerHeight - 48;
  const capped = targetHeight > maxHeight;
  if (capped) {
    targetHeight = maxHeight;
  }
  const targetLeft = (viewportWidth - targetWidth) / 2;
  const targetTop = Math.max(24, (window.innerHeight - targetHeight) / 2);

  activeModal = { card, placeholder, backdrop, capped };

  const settle = () => {
    card.style.left = `${targetLeft}px`;
    card.style.top = `${targetTop}px`;
    card.style.width = `${targetWidth}px`;
    card.style.height = `${targetHeight}px`;
    if (capped) {
      card.style.overflowY = "auto";
    }
    playDemo(card);
  };

  if (reducedMotion.matches) {
    backdrop.style.opacity = "1";
    settle();
    return;
  }

  // Start from the card's original rect, then morph to the modal rect.
  card.style.left = `${first.left}px`;
  card.style.top = `${first.top}px`;
  card.style.width = `${first.width}px`;
  card.style.height = `${first.height}px`;

  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, fill: "forwards" });
  if (demo) {
    demo.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 320,
      easing: "ease",
      fill: "backwards"
    });
  }
  const anim = card.animate(
    [
      { left: `${first.left}px`, top: `${first.top}px`, width: `${first.width}px`, height: `${first.height}px` },
      { left: `${targetLeft}px`, top: `${targetTop}px`, width: `${targetWidth}px`, height: `${targetHeight}px` }
    ],
    { duration: 440, easing: flipEasing }
  );
  anim.onfinish = settle;
}

function closeModal() {
  if (!activeModal) {
    return;
  }

  const { card, placeholder, backdrop } = activeModal;
  const toggle = card.querySelector("[data-toggle]");
  const demo = card.querySelector("[data-demo]");
  const last = placeholder.getBoundingClientRect();
  const current = card.getBoundingClientRect();
  activeModal = null;
  stopDemo(card);
  card.style.overflowY = "";

  const finish = () => {
    card.classList.remove("is-modal");
    card.removeAttribute("data-open");
    card.removeAttribute("style");
    toggle?.setAttribute("aria-expanded", "false");
    if (demo) {
      demo.hidden = true;
    }
    placeholder.remove();
    backdrop.remove();
    smoothScroll.lenis?.start();
  };

  if (reducedMotion.matches) {
    finish();
    return;
  }

  backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
  const anim = card.animate(
    [
      { left: `${current.left}px`, top: `${current.top}px`, width: `${current.width}px`, height: `${current.height}px` },
      { left: `${last.left}px`, top: `${last.top}px`, width: `${last.width}px`, height: `${last.height}px` }
    ],
    { duration: 360, easing: flipEasing }
  );
  anim.onfinish = finish;
}

document.querySelectorAll("[data-easing]").forEach((card) => {
  card.querySelector(".easing-demo__box").style.transform = "translate(0, -50%)";
  card.querySelector(".easing-demo__ghost").style.transform = "translate(0, -50%)";

  card.querySelector("[data-toggle]")?.addEventListener("click", () => {
    if (card.classList.contains("is-modal")) {
      closeModal();
    } else {
      openModal(card);
    }
  });

  card.querySelector("[data-start]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    playDemo(card);
  });

  card.addEventListener("mouseenter", () => playTracer(card));
  card.addEventListener("mouseleave", () => stopTracer(card));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

function applyGlobalDuration(value) {
  currentDuration = Number(value) || defaultDuration;
  globalDurationOutput.textContent = `${value}ms`;
  globalDurationCompactOutput.textContent = `${value}ms`;
}

globalDuration?.addEventListener("input", (event) => {
  applyGlobalDuration(event.currentTarget.value);
});

globalDurationReset?.addEventListener("click", () => {
  if (globalDuration) {
    globalDuration.value = String(defaultDuration);
  }
  applyGlobalDuration(defaultDuration);
});

globalDurationToggle?.addEventListener("click", () => {
  const open = !globalControl.hasAttribute("data-open");
  globalControl.toggleAttribute("data-open", open);
  globalDurationToggle.setAttribute("aria-expanded", String(open));
});

document.addEventListener("pointerdown", (event) => {
  if (!globalControl?.hasAttribute("data-open") || globalControl.contains(event.target)) {
    return;
  }

  globalControl.removeAttribute("data-open");
  globalDurationToggle?.setAttribute("aria-expanded", "false");
});

document.querySelectorAll("[data-copy-code]").forEach((button) => {
  button.addEventListener("click", async () => {
    const tip = button.querySelector("[data-copy-tip]");
    window.clearTimeout(copyTimers.get(button));

    try {
      await copyText(button.dataset.copyValue);
      button.setAttribute("data-copied", "");
      tip.textContent = "Copied";
    } catch {
      button.setAttribute("data-copy-error", "");
      tip.textContent = "Copy failed";
    }

    const timer = window.setTimeout(() => {
      button.removeAttribute("data-copied");
      button.removeAttribute("data-copy-error");
      tip.textContent = "Click to copy";
    }, 1600);
    copyTimers.set(button, timer);
  });
});

window.addEventListener("hashchange", () => syncCurrentEasing());
document.fonts.ready.then(() => {
  requestAnimationFrame(() => syncCurrentEasing());
});
