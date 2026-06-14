import { categories } from "../../src/data/works.js";

const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");
const memo = document.querySelector("[data-tech-note]");
const memoToggle = document.querySelector("[data-tech-note-toggle]");
const navLinks = document.querySelector(".experiment-nav__links");
let detailIsland = null;

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
  "cursor-pixel-field": "ease-out-expo",
  "green-noise-gradient": "ease-in-out-sine",
  "cylindrical-image-flow": "ease-out-cubic",
  "scroll-tilt-gallery": "ease-out-quart",
  "cursor-image-burst": "ease-out-back",
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

  detailIsland = document.createElement("div");
  detailIsland.className = "detail-dialog";
  detailIsland.setAttribute("aria-hidden", "true");
  detailIsland.append(panel);
  document.body.append(detailIsland);

  toggle.classList.remove("detail-toggle");
  toggle.classList.add("detail-dialog-toggle");
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 10.5v6M12 7.5h.01" stroke="currentColor" stroke-linecap="round" />
    </svg>
  `;
  document.body.append(toggle);
}

if (panel && toggle) {
  panel.id ||= "work-information";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("data-lenis-prevent", "");
  toggle.setAttribute("aria-controls", panel.id);
  toggle.setAttribute("aria-label", "作品情報を開く");

  let panelTitle = panel.querySelector(":scope > h1, :scope > h2");
  const pageHasMainHeading = Boolean(document.querySelector("main h1"));

  if (panelTitle?.tagName === "H1" && pageHasMainHeading) {
    const replacement = document.createElement("h2");
    for (const attribute of panelTitle.attributes) {
      replacement.setAttribute(attribute.name, attribute.value);
    }
    replacement.innerHTML = panelTitle.innerHTML;
    panelTitle.replaceWith(replacement);
    panelTitle = replacement;
  }

  if (panelTitle) {
    panelTitle.id ||= "work-information-title";
    panel.setAttribute("aria-labelledby", panelTitle.id);
  }

  if (!pageHasMainHeading) {
    panel.querySelectorAll(".tech-note__section h3").forEach((heading) => {
      const replacement = document.createElement("h2");
      replacement.innerHTML = heading.innerHTML;
      heading.replaceWith(replacement);
    });
  }

  const close = document.createElement("button");
  close.className = "experiment-meta__close";
  close.type = "button";
  close.setAttribute("aria-label", "作品情報を閉じる");
  close.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-linecap="round" />
    </svg>
  `;
  panel.prepend(close);

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  let inertElements = [];

  const setBackgroundInert = (inert) => {
    if (inert) {
      inertElements = [...document.body.children].filter(
        (element) => element !== detailIsland
      );
      inertElements.forEach((element) => {
        element.dataset.dialogWasInert = String(element.inert);
        element.inert = true;
      });
      return;
    }

    inertElements.forEach((element) => {
      element.inert = element.dataset.dialogWasInert === "true";
      delete element.dataset.dialogWasInert;
    });
    inertElements = [];
  };

  const setDetailsOpen = (open, restoreFocus = true) => {
    panel.toggleAttribute("data-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    detailIsland?.toggleAttribute("data-open", open);
    detailIsland?.setAttribute("aria-hidden", String(!open));
    document.body.toggleAttribute("data-dialog-open", open);
    toggle.setAttribute("aria-label", open ? "作品情報を閉じる" : "作品情報を開く");

    if (open) {
      setBackgroundInert(true);
      close.focus();
    } else {
      setBackgroundInert(false);
      if (restoreFocus) {
        toggle.focus();
      }
    }
  };

  panel.setAttribute("aria-hidden", "true");
  toggle.addEventListener("click", () => {
    const open = !panel.hasAttribute("data-open");
    setDetailsOpen(open);
  });
  detailIsland?.addEventListener("click", (event) => {
    if (event.target === detailIsland) {
      setDetailsOpen(false);
    }
  });
  close.addEventListener("click", () => setDetailsOpen(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.hasAttribute("data-open")) {
      setDetailsOpen(false);
      return;
    }

    if (event.key !== "Tab" || !panel.hasAttribute("data-open")) {
      return;
    }

    const focusable = [...panel.querySelectorAll(focusableSelector)].filter(
      (element) => !element.hidden && element.getClientRects().length > 0
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (!first || !last) {
      event.preventDefault();
      close.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function bindReplay(callback) {
  document.querySelector("[data-replay]")?.addEventListener("click", callback);
}
