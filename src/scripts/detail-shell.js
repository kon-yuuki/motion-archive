import "../styles/detail-shell.scss";

const panel = document.querySelector("[data-details]");
const toggle = document.querySelector("[data-details-toggle]");

if (panel && toggle) {
  toggle.addEventListener("click", () => {
    const open = !panel.hasAttribute("data-open");
    panel.toggleAttribute("data-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
}

export function bindReplay(callback) {
  document.querySelector("[data-replay]")?.addEventListener("click", callback);
}
