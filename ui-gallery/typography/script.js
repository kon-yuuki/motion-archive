import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";
import { initDraggablePanels } from "../../src/scripts/draggable-panel.js";
import { easings } from "../../src/data/easings.js";
import { easingFunctions } from "../../src/scripts/easing-functions.js";

initSmoothScroll({
  lerp: 0.08,
  wheelMultiplier: 0.9
});

const title = document.querySelector("[data-character-reveal]");
const depthTitle = document.querySelector("[data-character-fade]");
const splitTargets = [...document.querySelectorAll("[data-character-reveal], [data-character-fade]")];
const revealTargets = [...document.querySelectorAll("[data-character-reveal], [data-character-fade]")];
const textControl = document.querySelector(".text-control");
const sharedTextInput = document.querySelector("[data-shared-text]");
const sharedTextApply = document.querySelector("[data-shared-text-apply]");
const sharedSizeInput = document.querySelector("[data-shared-size]");
const sharedSizeOutput = document.querySelector("[data-shared-size-output]");
const controlsReset = document.querySelector("[data-controls-reset]");
const controlsPreview = document.querySelector("[data-controls-preview]");
const controls = [...document.querySelectorAll("[data-control]")];
const depthControls = [...document.querySelectorAll("[data-depth-control]")];
const depthReset = document.querySelector("[data-depth-reset]");
const depthPreview = document.querySelector("[data-depth-preview]");
const specDuration = document.querySelector("[data-spec-duration]");
const specStagger = document.querySelector("[data-spec-stagger]");
const specEasing = document.querySelector("[data-spec-easing]");
const depthSpecDuration = document.querySelector("[data-depth-spec-duration]");
const depthSpecStagger = document.querySelector("[data-depth-spec-stagger]");
const depthSpecTilt = document.querySelector("[data-depth-spec-tilt]");
const depthSpecRotateY = document.querySelector("[data-depth-spec-rotate-y]");
const depthSpecTranslateZ = document.querySelector("[data-depth-spec-translate-z]");
const depthSpecEasing = document.querySelector("[data-depth-spec-easing]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaults = {
  progress: 0,
  initialColor: "#61e5c0",
  finalColor: "#083031",
  duration: 300,
  stagger: 30,
  easing: "easeOutExpo"
};
const depthDefaults = {
  progress: 0,
  duration: 520,
  stagger: 28,
  tilt: -30,
  rotateY: 0,
  translateZ: -200,
  easing: "easeOutExpo"
};
let characterAnimationFrame = null;
let depthAnimationFrame = null;

const easingFamilyLabels = {
  in: "Ease In",
  out: "Ease Out",
  "in-out": "Ease In Out"
};

function splitText(element) {
  const text = element.dataset.text ?? "";
  let characterIndex = 0;

  element.replaceChildren();
  element.setAttribute("aria-label", text.replace(/\n/g, " "));

  text.split("\n").forEach((line, lineIndex, lines) => {
    const lineElement = document.createElement("span");
    lineElement.className = "character-line";
    lineElement.setAttribute("aria-hidden", "true");

    const tokens = Array.from(line.matchAll(/(\s+|\S+)/g));

    tokens.forEach(([token], tokenIndex) => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement("span");
        space.className = "character-space";
        space.textContent = " ";
        lineElement.append(space);
        return;
      }

      const word = document.createElement("span");
      word.className = "character-word";

      Array.from(token).forEach((character) => {
        const span = document.createElement("span");
        span.className = "character";
        span.style.setProperty("--character-index", characterIndex);
        span.textContent = character;
        word.append(span);
        characterIndex += 1;
      });

      lineElement.append(word);

      if (tokenIndex < tokens.length - 1 && !/^\s+$/.test(tokens[tokenIndex + 1][0])) {
        const space = document.createElement("span");
        space.className = "character-space";
        space.textContent = " ";
        lineElement.append(space);
      }
    });

    element.append(lineElement);

    if (lineIndex < lines.length - 1) {
      element.append(document.createElement("br"));
    }
  });
}

function reveal(element = title) {
  if (element === depthTitle) {
    if (reducedMotion.matches) {
      applyDepthProgress(100);
    } else {
      playDepthReveal();
    }
    return;
  }

  if (reducedMotion.matches) {
    applyCharacterProgress(100);
  } else {
    playCharacterReveal();
  }
}

function replayReveal() {
  playCharacterReveal();
}

function updateSettings() {
  stopCharacterAnimation();
  applyCharacterProgress(getCharacterValues().progress);
}

function resetSettings() {
  controls.forEach((control) => {
    control.value = defaults[control.dataset.control];
  });
  updateSettings();
}

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function getCharacterValues() {
  return Object.fromEntries(
    controls.map((control) => {
      const value = ["progress", "duration", "stagger"].includes(control.dataset.control)
        ? Number(control.value)
        : control.value;

      return [control.dataset.control, value];
    })
  );
}

function setCharacterControlValue(name, value) {
  const control = controls.find((item) => item.dataset.control === name);
  if (!control) return;
  control.value = value;
}

function updateCharacterReadout(values = getCharacterValues()) {
  const easing = easings.find((item) => item.key === values.easing);

  title.style.setProperty("--initial-color", values.initialColor);
  title.style.setProperty("--final-color", values.finalColor);
  title.style.setProperty("--character-duration", `${values.duration}ms`);
  title.style.setProperty("--character-stagger", `${values.stagger}ms`);

  document.querySelector('[data-output="progress"]').value = `${Math.round(values.progress)}%`;
  document.querySelector('[data-output="duration"]').value = `${values.duration}ms`;
  document.querySelector('[data-output="stagger"]').value = `${values.stagger}ms`;
  specDuration.textContent = values.duration;
  specStagger.textContent = values.stagger;
  specEasing.textContent = easing?.name ?? values.easing;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function mixColor(from, to, progress) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const channel = (key) => Math.round(start[key] + (end[key] - start[key]) * progress);

  return `rgb(${channel("r")}, ${channel("g")}, ${channel("b")})`;
}

function stopCharacterAnimation() {
  if (!characterAnimationFrame) return;
  cancelAnimationFrame(characterAnimationFrame);
  characterAnimationFrame = null;
}

function applyCharacterProgress(progress) {
  const values = { ...getCharacterValues(), progress };
  const characters = [...title.querySelectorAll(".character")];
  const totalDuration = values.duration + Math.max(characters.length - 1, 0) * values.stagger;
  const currentTime = totalDuration * (values.progress / 100);
  const ease = easingFunctions[values.easing] ?? easingFunctions.easeOutExpo;

  title.setAttribute("data-visible", "");

  characters.forEach((character, index) => {
    const characterTime = currentTime - index * values.stagger;
    const localProgress = clamp(characterTime / values.duration);
    const easedProgress = clamp(ease(localProgress));
    const opacity = clamp(easedProgress / 0.3);
    const colorProgress = clamp((easedProgress - 0.3) / 0.7);

    character.style.opacity = opacity;
    character.style.color = mixColor(values.initialColor, values.finalColor, colorProgress);
  });

  setCharacterControlValue("progress", values.progress);
  updateCharacterReadout(values);
}

function playCharacterReveal() {
  stopCharacterAnimation();
  applyCharacterProgress(0);

  const startedAt = performance.now();
  const values = getCharacterValues();
  const characters = [...title.querySelectorAll(".character")];
  const totalDuration = values.duration + Math.max(characters.length - 1, 0) * values.stagger;

  function tick(now) {
    const progress = clamp((now - startedAt) / totalDuration) * 100;
    applyCharacterProgress(progress);

    if (progress < 100) {
      characterAnimationFrame = requestAnimationFrame(tick);
      return;
    }

    characterAnimationFrame = null;
  }

  characterAnimationFrame = requestAnimationFrame(tick);
}

function getDepthValues() {
  return Object.fromEntries(
    depthControls.map((control) => {
      const value = control.dataset.depthControl === "easing" ? control.value : Number(control.value);
      return [control.dataset.depthControl, value];
    })
  );
}

function setDepthControlValue(name, value) {
  const control = depthControls.find((item) => item.dataset.depthControl === name);
  if (!control) return;
  control.value = value;
}

function updateDepthReadout(values = getDepthValues()) {
  const easing = easings.find((item) => item.key === values.easing);

  document.querySelector('[data-depth-output="progress"]').value = `${Math.round(values.progress)}%`;
  document.querySelector('[data-depth-output="duration"]').value = `${values.duration}ms`;
  document.querySelector('[data-depth-output="stagger"]').value = `${values.stagger}ms`;
  document.querySelector('[data-depth-output="tilt"]').value = `${values.tilt}deg`;
  document.querySelector('[data-depth-output="rotateY"]').value = `${values.rotateY}deg`;
  document.querySelector('[data-depth-output="translateZ"]').value = `${values.translateZ}px`;
  depthSpecDuration.textContent = values.duration;
  depthSpecStagger.textContent = values.stagger;
  depthSpecTilt.textContent = values.tilt;
  depthSpecRotateY.textContent = values.rotateY;
  depthSpecTranslateZ.textContent = values.translateZ;
  if (depthSpecEasing) {
    depthSpecEasing.textContent = easing?.name ?? values.easing;
  }
}

function applyDepthProgress(progress) {
  const values = { ...getDepthValues(), progress };
  const characters = [...depthTitle.querySelectorAll(".character")];
  const totalDuration = values.duration + Math.max(characters.length - 1, 0) * values.stagger;
  const currentTime = totalDuration * (values.progress / 100);
  const ease = easingFunctions[values.easing] ?? easingFunctions.easeOutExpo;

  depthTitle.setAttribute("data-visible", "");

  characters.forEach((character, index) => {
    const characterTime = currentTime - index * values.stagger;
    const localProgress = clamp(characterTime / values.duration);
    const easedProgress = ease(localProgress);
    const tilt = values.tilt * (1 - easedProgress);
    const rotateY = values.rotateY * (1 - easedProgress);
    const depth = values.translateZ * (1 - easedProgress);

    character.style.opacity = easedProgress;
    const rotateYTransform = rotateY === 0 ? "" : ` rotateY(${rotateY}deg)`;
    character.style.transform = `translate3d(0px, 0px, ${depth}px) rotateX(${tilt}deg)${rotateYTransform}`;
  });

  setDepthControlValue("progress", values.progress);
  updateDepthReadout(values);
}

function stopDepthAnimation() {
  if (!depthAnimationFrame) return;
  cancelAnimationFrame(depthAnimationFrame);
  depthAnimationFrame = null;
}

function playDepthReveal() {
  stopDepthAnimation();
  applyDepthProgress(0);

  const startedAt = performance.now();
  const values = getDepthValues();
  const characters = [...depthTitle.querySelectorAll(".character")];
  const totalDuration = values.duration + Math.max(characters.length - 1, 0) * values.stagger;

  function tick(now) {
    const progress = clamp((now - startedAt) / totalDuration) * 100;
    applyDepthProgress(progress);

    if (progress < 100) {
      depthAnimationFrame = requestAnimationFrame(tick);
      return;
    }

    depthAnimationFrame = null;
  }

  depthAnimationFrame = requestAnimationFrame(tick);
}

function updateDepthSettings(event) {
  const controlName = event?.target?.dataset.depthControl;

  if (controlName === "progress") {
    stopDepthAnimation();
  }

  if (controlName === "tilt" || controlName === "rotateY" || controlName === "translateZ") {
    stopDepthAnimation();
    const currentProgress = getDepthValues().progress;

    if (currentProgress <= 0 || currentProgress >= 100) {
      setDepthControlValue("progress", 28);
    }
  }

  applyDepthProgress(getDepthValues().progress);
}

function resetDepthSettings() {
  stopDepthAnimation();
  Object.entries(depthDefaults).forEach(([name, value]) => {
    setDepthControlValue(name, value);
  });
  applyDepthProgress(depthDefaults.progress);
}

function applySharedText() {
  const text = sharedTextInput.value.trim();

  if (!text) return;

  stopCharacterAnimation();
  stopDepthAnimation();

  title.dataset.text = text;
  depthTitle.dataset.text = text;
  splitText(title);
  splitText(depthTitle);

  if (reducedMotion.matches) {
    applyCharacterProgress(100);
    applyDepthProgress(100);
    return;
  }

  playCharacterReveal();
  playDepthReveal();
}

function syncSharedText() {
  const text = sharedTextInput.value.trim();

  if (!text) return;

  title.dataset.text = text;
  depthTitle.dataset.text = text;
}

function updateSharedSize() {
  const size = Number(sharedSizeInput.value);

  document.documentElement.style.setProperty("--typography-title-size", `${size}px`);
  sharedSizeOutput.value = `${size}px`;
}

function updateTextControlVisibility() {
  textControl.toggleAttribute("data-visible", window.scrollY > 96);
}

function initDepthEasingSelect() {
  const select = document.querySelector('[data-depth-control="easing"]');
  if (!select) return;

  select.innerHTML = easingOptionsMarkup();

  select.value = depthDefaults.easing;
}

function easingOptionsMarkup() {
  return ["in", "out", "in-out"].map((family) => {
    const options = easings
      .filter((easing) => easing.family === family)
      .map((easing) => `<option value="${easing.key}">${easing.name}</option>`)
      .join("");

    return `<optgroup label="${easingFamilyLabels[family]}">${options}</optgroup>`;
  }).join("");
}

function initCharacterEasingSelect() {
  const select = document.querySelector('[data-control="easing"]');
  if (!select) return;

  select.innerHTML = easingOptionsMarkup();
  select.value = defaults.easing;
}

function initGuiToggles() {
  document.querySelectorAll("[data-gui-toggle]").forEach((button) => {
    const panel = button.closest(".gui-panel");
    const body = button.getAttribute("aria-controls")
      ? document.getElementById(button.getAttribute("aria-controls"))
      : panel?.querySelector("[data-gui-body]");

    if (!panel || !body) return;

    button.addEventListener("click", (event) => {
      const collapsed = !panel.hasAttribute("data-collapsed");

      panel.toggleAttribute("data-collapsed", collapsed);
      body.hidden = collapsed;
      button.setAttribute("aria-expanded", String(!collapsed));
      event.stopPropagation();
    });
  });
}

syncSharedText();
splitTargets.forEach(splitText);
initCharacterEasingSelect();
initDepthEasingSelect();
applyCharacterProgress(0);
applyDepthProgress(depthDefaults.progress);
initGuiToggles();
initDraggablePanels();

if (reducedMotion.matches) {
  revealTargets.forEach(reveal);
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

controls.forEach((control) => {
  control.addEventListener("input", updateSettings);
  control.addEventListener("change", updateSettings);
});
controlsReset.addEventListener("click", resetSettings);
controlsPreview.addEventListener("click", replayReveal);
depthControls.forEach((control) => {
  control.addEventListener("input", updateDepthSettings);
  control.addEventListener("change", updateDepthSettings);
});
depthReset.addEventListener("click", resetDepthSettings);
depthPreview.addEventListener("click", playDepthReveal);
updateTextControlVisibility();
window.addEventListener("scroll", updateTextControlVisibility, { passive: true });
sharedTextApply.addEventListener("click", applySharedText);
sharedTextInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    applySharedText();
  }
});
sharedSizeInput.addEventListener("input", updateSharedSize);
