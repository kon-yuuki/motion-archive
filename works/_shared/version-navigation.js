import { replaceDetailContent } from "./detail-shell.js";

const switcher = document.querySelector(".version-switcher");
const transitionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 260;
let navigating = false;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function updateCurrentVersion(url) {
  const currentPath = new URL(url, window.location.href).pathname;

  switcher?.querySelectorAll("a[href]").forEach((link) => {
    const isCurrent = new URL(link.href, window.location.href).pathname === currentPath;
    link.toggleAttribute("aria-current", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
  });
}

function loadVersionStyles(nextDocument, destinationUrl) {
  const nextStylesheet = [...nextDocument.querySelectorAll('link[rel="stylesheet"][href]')].at(-1);
  const currentStylesheet = document.querySelector('link[data-version-style]')
    || [...document.querySelectorAll('link[rel="stylesheet"][href]')].at(-1);
  if (!nextStylesheet || !currentStylesheet) return Promise.resolve();

  const nextHref = new URL(nextStylesheet.getAttribute("href"), destinationUrl).href;
  if (new URL(currentStylesheet.href).href === nextHref) {
    currentStylesheet.dataset.versionStyle = "";
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const replacement = document.createElement("link");
    replacement.rel = "stylesheet";
    replacement.dataset.versionStyle = "";
    replacement.href = nextHref;
    replacement.addEventListener("load", () => {
      currentStylesheet.remove();
      resolve();
    }, { once: true });
    replacement.addEventListener("error", reject, { once: true });
    document.head.append(replacement);
  });
}

async function changeVersion(url, { push = true } = {}) {
  if (navigating) return;

  const currentContent = document.querySelector("[data-version-content]");
  if (!currentContent) {
    window.location.assign(url);
    return;
  }

  navigating = true;

  try {
    const response = await fetch(url, { headers: { "X-Requested-With": "version-navigation" } });
    if (!response.ok) throw new Error(`Version request failed: ${response.status}`);

    const destinationUrl = new URL(response.url || url, window.location.href);
    const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
    const nextContent = nextDocument.querySelector("[data-version-content]");
    const nextPanel = nextDocument.querySelector("[data-details]");
    const nextMemo = nextDocument.querySelector("[data-tech-note]");
    const nextScript = [...nextDocument.querySelectorAll('script[type="module"][src]')]
      .find((candidate) => {
        const pathname = new URL(candidate.getAttribute("src"), destinationUrl).pathname;
        return !pathname.includes("/metrics") && !pathname.includes("/@vite/client");
      });
    if (!nextContent || !nextScript) throw new Error("Version content was not found");

    currentContent.setAttribute("data-version-transition", "");
    await wait(transitionDuration);
    window.dispatchEvent(new Event("work:before-version-change"));
    await loadVersionStyles(nextDocument, destinationUrl);
    replaceDetailContent(nextPanel, nextMemo);

    const importedContent = document.importNode(nextContent, true);
    importedContent.setAttribute("data-version-transition", "");
    currentContent.replaceWith(importedContent);

    document.title = nextDocument.title;
    updateCurrentVersion(destinationUrl);
    if (push) window.history.pushState({ versionNavigation: true }, "", destinationUrl);

    const activeScript = document.querySelector("script[data-version-script]");
    const script = document.createElement("script");
    script.type = "module";
    script.dataset.versionScript = "";
    const scriptUrl = new URL(nextScript.getAttribute("src"), destinationUrl);
    scriptUrl.searchParams.set("version", String(Date.now()));
    script.src = scriptUrl.href;
    activeScript?.remove();
    document.body.append(script);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => importedContent.removeAttribute("data-version-transition"));
    });
  } catch (error) {
    console.error(error);
    window.location.assign(url);
  } finally {
    navigating = false;
  }
}

switcher?.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || link.hasAttribute("aria-current")) return;
  event.preventDefault();
  changeVersion(link.href);
});

window.addEventListener("popstate", () => {
  changeVersion(window.location.href, { push: false });
});
