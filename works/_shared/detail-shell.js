const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");
const memo = document.querySelector("[data-tech-note]");
const memoToggle = document.querySelector("[data-tech-note-toggle]");
const memoClose = document.querySelector("[data-tech-note-close]");

if (panel && toggle) {
  toggle.addEventListener("click", () => {
    const open = !panel.hasAttribute("data-open");
    panel.toggleAttribute("data-open", open);
    toggle.setAttribute("aria-expanded", String(open));
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
