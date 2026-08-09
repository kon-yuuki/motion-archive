import { categories } from "../../src/data/works.js";
import { initInfoDialog } from "../../src/scripts/info-dialog.js";

const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");
const memo = document.querySelector("[data-tech-note]");
const memoToggle = document.querySelector("[data-tech-note-toggle]");
const navLinks = document.querySelector(".experiment-nav__links");

// Turn category tags into links to the matching card on the Categories page.
const categorySlug = (value) => value.trim().toLowerCase().replaceAll(" ", "-");
const categoryType = (label) => {
  const slug = categorySlug(label);
  if (categories.techniques.some((c) => categorySlug(c) === slug)) return "technique";
  if (categories.expressions.some((c) => categorySlug(c) === slug)) return "expression";
  return null;
};

document.querySelectorAll(".experiment-tags span").forEach((tag) => {
  const type = categoryType(tag.textContent);
  if (!type) {
    return;
  }

  const link = document.createElement("a");
  link.className = "experiment-tag-link";
  link.href = `../../categories/#${type}-${categorySlug(tag.textContent)}`;
  link.textContent = tag.textContent;
  link.setAttribute("aria-label", `Browse ${tag.textContent.trim()} experiments`);
  tag.replaceWith(link);
});

// Use the URL itself as the reference link label (drop the protocol / trailing slash).
const referenceLink = document.querySelector(".experiment-reference-link");
if (referenceLink) {
  const arrow = referenceLink.querySelector("span");
  const url = referenceLink.getAttribute("href") || "";
  const urlLabel = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  referenceLink.textContent = `${urlLabel} `;
  if (arrow) {
    referenceLink.append(arrow);
  }
}

const detailEasings = {
  "vortex-trail": "ease-out-expo",
  "webgl-plane-reveal": "ease-out-expo",
  "cursor-pixel-field": "ease-out-expo",
  "rotating-scroll-gallery": "ease-out-cubic",
  "cylindrical-image-flow": "ease-out-cubic",
  "cursor-image-burst": "ease-out-back",
  "rgb-cursor-stalker": "ease-out-expo",
  "hero-mask-shift": "ease-out-expo",
  "image-wipe-grid": "ease-out-expo",
  "scroll-type-reveal": "ease-out-cubic",
  "css-pie-chart": "ease-out-quint",
  "fluid-image": "ease-out-expo",
  "pixel-glitch": "ease-out-cubic",
  "latte-marble": "ease-out-expo"
};

if (navLinks && !navLinks.querySelector("[data-easing-index-link]")) {
  const detailSlug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const easingId = detailEasings[detailSlug];
  const easingLink = document.createElement("a");
  easingLink.className = "experiment-nav__link experiment-nav__easing-link";
  easingLink.href = `../../easings/${easingId ? `#${easingId}` : ""}`;
  easingLink.textContent = "Easings";
  if (easingId) {
    easingLink.setAttribute("aria-label", `Open the easing used on this page: ${easingId}`);
  }
  easingLink.setAttribute("data-easing-index-link", "");
  navLinks.insertBefore(easingLink, toggle);
}

if (panel && toggle) {
  if (memo) {
    const memoBody = memo.querySelector(".tech-note__body");
    if (memoBody) {
      panel.append(memoBody);
    }
    memo.remove();
  }
  memoToggle?.remove();

  // Keep the external reference link as the dialog's closing action, below the
  // title / description / tags and the technical memo body.
  const actions = panel.querySelector(".experiment-actions");
  if (actions) {
    panel.append(actions);
  }

  initInfoDialog({ panel, toggle });
}

export function bindReplay(callback) {
  document.querySelector("[data-replay]")?.addEventListener("click", callback);
}
