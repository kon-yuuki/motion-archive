import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

const smoothScroll = initSmoothScroll({
  lerp: 0.15,
  wheelMultiplier: 0.9
});

const transitions = [...document.querySelectorAll("[data-transition]")];
const chapters = [...document.querySelectorAll("[data-chapter]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function render() {
  frame = 0;

  chapters.forEach((chapter) => {
    const rect = chapter.getBoundingClientRect();
    const scene = chapter.querySelector("[data-scene]");
    scene?.classList.toggle("is-current-scene", rect.top <= 0 && rect.bottom > 0);
  });

  transitions.forEach((transition) => {
    const chapter = transition.closest("[data-chapter]");
    const nextScene = chapter.nextElementSibling?.querySelector("[data-scene]");
    const rect = chapter.getBoundingClientRect();
    const elapsed = -rect.top;
    const isVisible = elapsed >= 0 && elapsed < chapter.offsetHeight;
    const progress = reducedMotion.matches
      ? clamp((elapsed - chapter.offsetHeight * 0.5) / 1)
      : clamp(elapsed / chapter.offsetHeight);
    const timeline = progress * 2;
    const nextProgress = clamp((progress - 0.625) / 0.375);

    transition.style.visibility = isVisible ? "visible" : "hidden";

    if (nextScene) {
      const isPreview = isVisible && nextProgress > 0;
      nextScene.classList.toggle("is-transition-preview", isPreview);
      nextScene.style.setProperty("--preview-y", `${((1 - nextProgress) * 100).toFixed(4)}%`);
    }

    [...transition.children].forEach((band, index) => {
      const bottomIndex = transition.children.length - 1 - index;
      const scale = clamp(timeline - bottomIndex * 0.25);
      band.style.transform = `scaleY(${scale.toFixed(4)})`;
    });
  });
}

function requestRender() {
  if (frame) return;
  frame = requestAnimationFrame(render);
}

render();
smoothScroll.onScroll(requestRender);
window.addEventListener("resize", requestRender);
reducedMotion.addEventListener("change", requestRender);
