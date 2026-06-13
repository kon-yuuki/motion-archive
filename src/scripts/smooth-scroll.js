import Lenis from "lenis";
import { easingFunctions } from "./easing-functions.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function initSmoothScroll(options = {}) {
  const lenis = new Lenis({
    anchors: true,
    autoRaf: true,
    lerp: 0.075,
    smoothWheel: !reducedMotion.matches,
    syncTouch: false,
    wheelMultiplier: 0.9,
    prevent: (node) => Boolean(node.closest?.(".tech-note__panel, [data-lenis-prevent]")),
    ...options
  });

  const syncModalState = () => {
    if (document.body.hasAttribute("data-modal-open")) {
      lenis.stop();
    } else {
      lenis.start();
    }
  };

  const modalObserver = new MutationObserver(syncModalState);
  modalObserver.observe(document.body, {
    attributeFilter: ["data-modal-open"]
  });

  reducedMotion.addEventListener("change", () => {
    lenis.options.smoothWheel = !reducedMotion.matches;
  });

  return {
    lenis,
    onScroll(callback) {
      return lenis.on("scroll", callback);
    },
    scrollTo(target, scrollOptions = {}) {
      lenis.scrollTo(target, {
        duration: reducedMotion.matches ? 0 : 1.45,
        easing: easingFunctions.easeOutExpo,
        immediate: reducedMotion.matches,
        ...scrollOptions
      });
    }
  };
}
