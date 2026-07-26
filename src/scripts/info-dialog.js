export function initInfoDialog({
  panel = document.querySelector("[data-info-panel]"),
  toggle = document.querySelector("[data-info-toggle]"),
  openLabel = "作品情報を開く",
  closeLabel = "作品情報を閉じる",
  iconToggle = true,
  normalizeHeadings = true
} = {}) {
  if (!panel || !toggle) {
    return null;
  }

  const detailIsland = document.createElement("div");
  detailIsland.className = "detail-dialog";
  detailIsland.setAttribute("aria-hidden", "true");
  detailIsland.append(panel);
  document.body.append(detailIsland);

  toggle.classList.remove("detail-toggle");
  toggle.classList.add("detail-dialog-toggle");
  if (iconToggle) {
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 10.5v6M12 7.5h.01" stroke="currentColor" stroke-linecap="round" />
      </svg>
    `;
  }
  document.body.append(toggle);

  panel.id ||= "work-information";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("data-lenis-prevent", "");
  toggle.setAttribute("aria-controls", panel.id);
  toggle.setAttribute("aria-label", openLabel);

  let panelTitle = panel.querySelector(":scope > h1, :scope > h2");
  const pageHasMainHeading = Boolean(document.querySelector("main h1"));

  if (normalizeHeadings && panelTitle?.tagName === "H1" && pageHasMainHeading) {
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

  if (normalizeHeadings && !pageHasMainHeading) {
    panel.querySelectorAll(".tech-note__section h3").forEach((heading) => {
      const replacement = document.createElement("h2");
      replacement.innerHTML = heading.innerHTML;
      heading.replaceWith(replacement);
    });
  }

  const close = document.createElement("button");
  close.className = "experiment-meta__close";
  close.type = "button";
  close.setAttribute("aria-label", closeLabel);
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
      inertElements = [...document.body.children].filter((element) => element !== detailIsland);
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

  const setOpen = (open, restoreFocus = true) => {
    panel.toggleAttribute("data-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    detailIsland.toggleAttribute("data-open", open);
    detailIsland.setAttribute("aria-hidden", String(!open));
    document.body.toggleAttribute("data-dialog-open", open);
    toggle.setAttribute("aria-label", open ? closeLabel : openLabel);

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
    setOpen(!panel.hasAttribute("data-open"));
  });
  detailIsland.addEventListener("click", (event) => {
    if (event.target === detailIsland) {
      setOpen(false);
    }
  });
  close.addEventListener("click", () => setOpen(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.hasAttribute("data-open")) {
      setOpen(false);
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

  return { setOpen, panel, toggle, detailIsland };
}
