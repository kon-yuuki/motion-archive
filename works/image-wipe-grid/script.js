import { bindReplay } from "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

const products = [...document.querySelectorAll("[data-reveal]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const smoothScroll = initSmoothScroll({
  lerp: 0.065,
  wheelMultiplier: 0.82
});

let observer;

function revealProducts() {
  observer?.disconnect();

  if (reducedMotion.matches) {
    products.forEach((product) => product.setAttribute("data-visible", ""));
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.setAttribute("data-visible", "");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -14% 0px",
      threshold: 0.08
    }
  );

  products.forEach((product) => observer.observe(product));
}

function replay() {
  products.forEach((product) => product.removeAttribute("data-visible"));
  smoothScroll.scrollTo(0, {
    duration: 1.6,
    lock: true
  });

  window.setTimeout(revealProducts, reducedMotion.matches ? 0 : 1100);
}

document.querySelector("[data-scroll-top]")?.addEventListener("click", () => {
  smoothScroll.scrollTo(0, {
    duration: 1.6
  });
});

reducedMotion.addEventListener("change", revealProducts);
bindReplay(replay);
revealProducts();
