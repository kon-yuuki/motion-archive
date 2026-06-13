import { bindReplay } from "../_shared/detail-shell.js";
import { easingFunctions } from "../../src/scripts/easing-functions.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";
import { initGlassScene } from "./glass-scene.js";

const story = document.querySelector("[data-story]");
const textNodes = [...document.querySelectorAll("[data-reveal-text]")];
const progressBar = document.querySelector("[data-progress-bar]");
const progressLabel = document.querySelector("[data-progress-label]");
const sceneNumber = document.querySelector("[data-scene-number]");
const jumpStart = document.querySelector("[data-jump-start]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const smoothScroll = initSmoothScroll({
  lerp: 0.07,
  wheelMultiplier: 0.85
});
const lines = [];
const glassScene = initGlassScene({
  canvas: document.querySelector("[data-glass-scene]"),
  reducedMotion
});
let frame = 0;

function splitText() {
  textNodes.forEach((line) => {
    const text = line.dataset.revealText ?? "";
    const characters = [];
    line.setAttribute("aria-label", text);

    [...text].forEach((character) => {
      const span = document.createElement("span");
      span.className = character === " " ? "type-char type-char--space" : "type-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = character === " " ? "\u00a0" : character;
      line.append(span);

      if (character !== " ") {
        characters.push(span);
      }
    });

    lines.push({ element: line, characters });
  });
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function update() {
  frame = 0;

  if (!story || lines.length === 0) {
    return;
  }

  const rect = story.getBoundingClientRect();
  const travel = Math.max(1, story.offsetHeight - window.innerHeight);
  const progress = reducedMotion.matches ? 1 : clamp(-rect.top / travel);
  const sceneProgress = progress * lines.length;

  lines.forEach(({ element, characters }, lineIndex) => {
    const local = sceneProgress - lineIndex;
    const enterStart = 0.04;
    const enterEnd = 0.38;
    const exitStart = 0.58;
    const exitEnd = 0.92;
    const stagger = 0.18;

    element.toggleAttribute("data-active", local >= 0 && local < 1);

    characters.forEach((character, index) => {
      const offset = (index / Math.max(1, characters.length - 1)) * stagger;
      const enter = easingFunctions.easeOutCubic(
        clamp((local - enterStart - offset) / (enterEnd - enterStart - stagger))
      );
      const exit = easingFunctions.easeOutCubic(
        clamp((local - exitStart - offset) / (exitEnd - exitStart - stagger))
      );
      const opacity = enter * (1 - exit);
      const scale = 1.55 - enter * 0.55 + exit * 0.42;

      character.style.setProperty("--char-opacity", opacity.toFixed(4));
      character.style.setProperty("--char-scale", scale.toFixed(4));
    });
  });

  const percent = Math.round(progress * 100);
  const scene = Math.min(lines.length, Math.floor(progress * lines.length) + 1);
  document.documentElement.style.setProperty("--story-progress", progress.toFixed(4));
  progressBar?.style.setProperty("--progress", progress.toFixed(4));
  glassScene?.setProgress(progress);

  if (progressLabel) {
    progressLabel.textContent = `${String(percent).padStart(2, "0")}%`;
  }

  if (sceneNumber) {
    sceneNumber.textContent = String(scene).padStart(2, "0");
  }
}

function requestUpdate() {
  if (!frame) {
    frame = requestAnimationFrame(update);
  }
}

function scrollToStory() {
  smoothScroll.scrollTo(story ?? 0, {
    duration: 1.5,
    lock: true
  });
}

splitText();
update();

smoothScroll.onScroll(requestUpdate);
window.addEventListener("resize", requestUpdate);
reducedMotion.addEventListener("change", requestUpdate);
jumpStart?.addEventListener("click", scrollToStory);
bindReplay(scrollToStory);
