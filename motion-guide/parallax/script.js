const parallaxDemo = document.querySelector("[data-parallax-demo]");
const wideParallax = document.querySelector("[data-wide-parallax]");

function clamp(value, min = -1, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function progressFor(element) {
  const rect = element.getBoundingClientRect();
  const center = rect.top + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;
  return clamp((viewportCenter - center) / window.innerHeight);
}

function updateParallax() {
  if (parallaxDemo) {
    const progress = progressFor(parallaxDemo);
    parallaxDemo.style.setProperty("--para-back", `${progress * 18}px`);
    parallaxDemo.style.setProperty("--para-front", `${progress * -32}px`);
    parallaxDemo.style.setProperty("--window-y", `${progress * 36}px`);
  }

  if (wideParallax) {
    const progress = progressFor(wideParallax);
    wideParallax.style.setProperty("--wide-back", `${progress * 42}px`);
    wideParallax.style.setProperty("--wide-middle", `${progress * -34}px`);
    wideParallax.style.setProperty("--wide-front", `${progress * 18}px`);
  }
}

window.addEventListener("scroll", updateParallax, { passive: true });
window.addEventListener("resize", updateParallax);
updateParallax();
