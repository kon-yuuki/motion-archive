import "../_shared/detail-shell.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

gsap.registerPlugin(ScrollTrigger);

const gallery = document.querySelector("[data-scroll-gallery]");
const marqueeTrack = document.querySelector("[data-marquee-track]");
const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];
const galleryImages = galleryItems.map((item) => item.querySelector("img")).filter(Boolean);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const smoothScroll = initSmoothScroll({
  lerp: 0.08,
  wheelMultiplier: 0.85
});

let frame = 0;
let metrics = {
  scrollable: 1,
  marqueeFrom: 0,
  marqueeTo: 0
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function measure() {
  metrics = {
    scrollable: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
    marqueeFrom: document.documentElement.clientWidth,
    marqueeTo: -marqueeTrack.scrollWidth
  };
}

function updateCameraOrigin() {
  document.documentElement.style.setProperty("--camera-y", `${window.scrollY + window.innerHeight / 2}px`);
}

function updateItemProgress() {
  galleryItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const range = window.innerHeight + rect.height;
    const progress = clamp((window.innerHeight - rect.top) / range);
    item.style.setProperty("--item-progress", progress.toFixed(4));
  });
}

function initImageScrollEffects() {
  if (reducedMotion.matches) {
    gsap.set(galleryImages, {
      opacity: 1,
      filter: "blur(0px)",
      rotationY: 0
    });
    return;
  }

  gsap.set(galleryImages, {
    opacity: 0.2,
    filter: "blur(10px)",
    rotationX: 16,
    rotationY: 0,
    transformOrigin: "50% 50%",
    willChange: "opacity, filter, transform"
  });

  galleryItems.forEach((item) => {
    const image = item.querySelector("img");
    if (!image) return;

    gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    })
      .to(image, {
        opacity: 1,
        filter: "blur(0px)",
        rotationX: 0,
        rotationY: -180,
        duration: 0.5,
        ease: "none"
      })
      .to(image, {
        opacity: 0.2,
        filter: "blur(10px)",
        rotationX: 16,
        rotationY: -360,
        duration: 0.5,
        ease: "none"
      });
  });
}

function update() {
  frame = 0;
  updateCameraOrigin();

  if (!gallery || !marqueeTrack) {
    return;
  }

  if (reducedMotion.matches) {
    document.documentElement.style.setProperty("--marquee-x", "0px");
    updateItemProgress();
    return;
  }

  const progress = clamp(window.scrollY / metrics.scrollable);
  const x = metrics.marqueeFrom + (metrics.marqueeTo - metrics.marqueeFrom) * progress;
  document.documentElement.style.setProperty("--marquee-x", `${x}px`);
  updateItemProgress();
}

function requestUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(update);
}

function refresh() {
  updateCameraOrigin();
  measure();
  requestUpdate();
  ScrollTrigger.refresh();
}

refresh();
initImageScrollEffects();
smoothScroll.onScroll(() => {
  requestUpdate();
  ScrollTrigger.update();
});
window.addEventListener("resize", refresh);
reducedMotion.addEventListener("change", () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  initImageScrollEffects();
  refresh();
  ScrollTrigger.refresh();
});
window.addEventListener("load", () => {
  refresh();
  ScrollTrigger.refresh();
});
document.fonts?.ready.then(() => {
  refresh();
  ScrollTrigger.refresh();
});
