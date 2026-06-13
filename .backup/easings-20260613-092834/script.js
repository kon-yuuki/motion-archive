import { easings } from "../src/data/easings.js";
import { easingFunctions } from "../src/scripts/easing-functions.js";
import { initSmoothScroll } from "../src/scripts/smooth-scroll.js";

const catalog = document.querySelector("[data-easing-catalog]");
const summary = document.querySelector("[data-easing-summary]");
const startAll = document.querySelector("[data-start-all]");
const globalControl = document.querySelector(".easing-global-control");
const globalDuration = document.querySelector("[data-global-duration]");
const globalDurationOutput = document.querySelector("[data-global-duration-output]");
const globalDurationCompactOutput = document.querySelector("[data-global-duration-compact-output]");
const globalDurationToggle = document.querySelector("[data-global-duration-toggle]");
const globalDurationReset = document.querySelector("[data-global-duration-reset]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeRuns = new WeakMap();
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

function easingRow(easing, index) {
  const links = easing.uses
    .map(({ label, href }) => `<a href="${href}">${label}</a>`)
    .join("");
  const cssCode = easing.css
    ? copyButton(`${easing.name} CSS code`, easing.css, "CSS")
    : `<p class="easing-row__no-css">CSS cubic-bezierでは再現不可</p>`;

  return `
    <article class="easing-row" id="${easing.id}" data-easing="${easing.id}">
      <div class="easing-row__info">
        <span class="easing-row__index">${String(index + 1).padStart(2, "0")}</span>
        <div class="easing-row__body">
          <h3>${easing.name}</h3>
          <div class="easing-row__codes">
            ${copyButton(`${easing.name} JavaScript code`, easing.functionCode, "JavaScript")}
            ${cssCode}
          </div>
          <p class="easing-row__description">${easing.description}</p>
          ${links ? `<div class="easing-row__links" aria-label="${easing.name} usage">${links}</div>` : ""}
        </div>
      </div>
      <div class="easing-demo" role="group" aria-label="${easing.name} movement demo">
        <div class="easing-demo__graph">
          ${curveSvg(easingFunctions[easing.key])}
        </div>
        <div class="easing-demo__track">
          <span class="easing-demo__line" aria-hidden="true"></span>
          <span class="easing-demo__ghost" aria-hidden="true"></span>
          <span class="easing-demo__box" aria-hidden="true"></span>
        </div>
        <button class="easing-demo__action" type="button" data-start>
          <span>Start</span>
          <span aria-hidden="true">→</span>
        </button>
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
      <div class="easing-list">
        ${items.map((item, index) => easingRow(item, indexOffset + index)).join("")}
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

async function start(row) {
  const easing = easings.find((item) => item.id === row.dataset.easing);
  const track = row.querySelector(".easing-demo__track");
  const box = row.querySelector(".easing-demo__box");
  const ghost = row.querySelector(".easing-demo__ghost");
  const dot = row.querySelector(".easing-curve__dot");
  const button = row.querySelector("[data-start]");

  if (!easing || !track || !box || !button || button.disabled) {
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
  const from = row.dataset.side === "right" ? 1 : 0;
  const to = from === 0 ? 1 : 0;
  const duration = currentDuration;
  const distance = Math.max(0, track.clientWidth - box.offsetWidth - trackPadding * 2);
  button.disabled = true;
  button.innerHTML = "<span>Running</span><span aria-hidden=\"true\">•••</span>";

  if (reducedMotion.matches) {
    box.style.transform = `translate(${trackPadding + distance * to}px, -50%)`;
    if (ghost) {
      ghost.style.transform = `translate(${trackPadding + distance * to}px, -50%)`;
    }
    if (dot) {
      dot.setAttribute("cx", "100");
      dot.setAttribute("cy", mapY(1).toFixed(2));
    }
  } else {
    await animateLeg(
      { box, ghost, dot, mapY },
      distance,
      trackPadding,
      from,
      to,
      duration,
      easingFunction,
      run
    );
  }

  if (!run.cancelled) {
    box.style.transform = `translate(${trackPadding + distance * to}px, -50%)`;
    if (ghost) {
      ghost.style.transform = `translate(${trackPadding + distance * to}px, -50%)`;
    }
    if (dot) {
      dot.setAttribute("cx", "100");
      dot.setAttribute("cy", mapY(1).toFixed(2));
    }
    row.dataset.side = to === 1 ? "right" : "left";
    button.disabled = false;
    button.innerHTML = to === 1
      ? "<span>Back</span><span aria-hidden=\"true\">←</span>"
      : "<span>Start</span><span aria-hidden=\"true\">→</span>";
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

document.querySelectorAll("[data-easing]").forEach((row) => {
  row.dataset.side = "left";
  row.querySelector(".easing-demo__box").style.transform = `translate(${trackPadding}px, -50%)`;
  row.querySelector(".easing-demo__ghost").style.transform = `translate(${trackPadding}px, -50%)`;
  row.querySelector("[data-start]")?.addEventListener("click", () => start(row));
});

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const autoPlay = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const row = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!row.dataset.played) {
            row.dataset.played = "1";
            start(row);
          }
        } else if (!entry.isIntersecting) {
          delete row.dataset.played;
        }
      });
    },
    { threshold: [0, 0.6] }
  );

  document.querySelectorAll("[data-easing]").forEach((row) => autoPlay.observe(row));
}

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

startAll?.addEventListener("click", () => {
  document.querySelectorAll("[data-easing]").forEach((row, index) => {
    window.setTimeout(() => start(row), index * 40);
  });
});

window.addEventListener("hashchange", () => syncCurrentEasing());
document.fonts.ready.then(() => {
  requestAnimationFrame(() => syncCurrentEasing());
});
