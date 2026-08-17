import { categories } from "../../src/data/works.js";
import { initInfoDialog } from "../../src/scripts/info-dialog.js";

const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");
const memo = document.querySelector("[data-tech-note]");
const memoToggle = document.querySelector("[data-tech-note-toggle]");
const navLinks = document.querySelector(".experiment-nav__links");
const navBrand = document.querySelector(".experiment-nav__brand");

if (navBrand?.matches("a")) {
  const brandLabel = document.createElement("span");
  brandLabel.className = navBrand.className;
  brandLabel.textContent = navBrand.textContent;
  navBrand.replaceWith(brandLabel);
}

navLinks?.querySelectorAll(".experiment-nav__link").forEach((link) => link.remove());

// Turn category tags into links to the matching card on the Categories page.
const categorySlug = (value) => value.trim().toLowerCase().replaceAll(" ", "-");
const categoryType = (label) => {
  const slug = categorySlug(label);
  if (categories.techniques.some((c) => categorySlug(c) === slug)) return "technique";
  if (categories.expressions.some((c) => categorySlug(c) === slug)) return "expression";
  return null;
};

function enhanceTags(root = document) {
root.querySelectorAll(".experiment-tags span").forEach((tag) => {
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
}

// Use the URL itself as the reference link label (drop the protocol / trailing slash).
function enhanceReferenceLink(root = document) {
const referenceLink = root.querySelector(".experiment-reference-link");
if (referenceLink) {
  const arrow = referenceLink.querySelector("span");
  const url = referenceLink.getAttribute("href") || "";
  const urlLabel = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  referenceLink.textContent = `${urlLabel} `;
  if (arrow) {
    referenceLink.append(arrow);
  }
}
}

function mergeMemoIntoPanel(targetPanel, targetMemo) {
  const memoBody = targetMemo?.querySelector(".tech-note__body");
  if (memoBody) targetPanel.append(memoBody);

  const actions = targetPanel.querySelector(".experiment-actions");
  if (actions) targetPanel.append(actions);
}

enhanceTags();
enhanceReferenceLink();

if (panel && toggle) {
  if (memo) {
    mergeMemoIntoPanel(panel, memo);
    memo.remove();
  }
  memoToggle?.remove();

  // Keep the external reference link as the dialog's closing action, below the
  // title / description / tags and the technical memo body.
  initInfoDialog({ panel, toggle });
}

export function replaceDetailContent(nextPanel, nextMemo) {
  const livePanel = document.querySelector("[data-details]");
  if (!livePanel || !nextPanel) return;

  mergeMemoIntoPanel(nextPanel, nextMemo);
  enhanceTags(nextPanel);
  enhanceReferenceLink(nextPanel);

  const incomingTitle = nextPanel.querySelector(":scope > h1");
  if (incomingTitle) {
    const replacement = document.createElement("h2");
    for (const attribute of incomingTitle.attributes) replacement.setAttribute(attribute.name, attribute.value);
    replacement.innerHTML = incomingTitle.innerHTML;
    incomingTitle.replaceWith(replacement);
  }

  const close = livePanel.querySelector(":scope > .experiment-meta__close");
  const incomingNodes = [...nextPanel.childNodes];
  livePanel.replaceChildren(...(close ? [close] : []), ...incomingNodes);

  const title = livePanel.querySelector(":scope > h2, :scope > h1");
  if (title) {
    title.id ||= "work-information-title";
    livePanel.setAttribute("aria-labelledby", title.id);
  }
}

export function bindReplay(callback) {
  document.querySelector("[data-replay]")?.addEventListener("click", callback);
}
