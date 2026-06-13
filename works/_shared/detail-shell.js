const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");
const memo = document.querySelector("[data-tech-note]");
const memoToggle = document.querySelector("[data-tech-note-toggle]");
const memoClose = document.querySelector("[data-tech-note-close]");
const navLinks = document.querySelector(".experiment-nav__links");
const detailEasings = {
  "image-wipe-grid": "ease-out-expo",
  "scroll-type-reveal": "ease-out-cubic",
  "css-pie-chart": "ease-out-quint",
  "fluid-image": "ease-out-expo",
  "pixel-glitch": "ease-out-cubic",
  "green-marble": "ease-out-expo"
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
  navLinks.insertBefore(easingLink, memoToggle ?? toggle);
}

if (panel && toggle) {
  const close = document.createElement("button");
  close.className = "experiment-meta__close";
  close.type = "button";
  close.setAttribute("aria-label", "Close information panel");
  close.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-linecap="round" />
    </svg>
  `;
  panel.prepend(close);

  const setDetailsOpen = (open) => {
    panel.toggleAttribute("data-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));

    if (open) {
      close.focus();
    } else {
      toggle.focus();
    }
  };

  panel.setAttribute("aria-hidden", "true");
  toggle.addEventListener("click", () => {
    const open = !panel.hasAttribute("data-open");
    setDetailsOpen(open);
  });
  close.addEventListener("click", () => setDetailsOpen(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.hasAttribute("data-open")) {
      setDetailsOpen(false);
    }
  });
}

function setMemoOpen(open) {
  if (!memo || !memoToggle) {
    return;
  }

  memo.toggleAttribute("data-open", open);
  memo.setAttribute("aria-hidden", String(!open));
  memoToggle.setAttribute("aria-expanded", String(open));
  document.body.toggleAttribute("data-modal-open", open);

  if (open) {
    memoClose?.focus();
  } else {
    memoToggle.focus();
  }
}

if (memo && memoToggle) {
  memoToggle.addEventListener("click", () => setMemoOpen(true));
  memoClose?.addEventListener("click", () => setMemoOpen(false));
  memo.addEventListener("click", (event) => {
    if (event.target === memo) {
      setMemoOpen(false);
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && memo.hasAttribute("data-open")) {
      setMemoOpen(false);
    }
  });
}

export function bindReplay(callback) {
  document.querySelector("[data-replay]")?.addEventListener("click", callback);
}
