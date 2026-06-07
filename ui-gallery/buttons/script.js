const toggleButton = document.querySelector("[data-toggle-button]");
const toggleLabel = document.querySelector("[data-toggle-label]");
const loadingButton = document.querySelector("[data-loading-button]");
const loadingLabel = document.querySelector("[data-loading-label]");

toggleButton.addEventListener("click", () => {
  const isPressed = toggleButton.getAttribute("aria-pressed") === "true";

  toggleButton.setAttribute("aria-pressed", String(!isPressed));
  toggleLabel.textContent = isPressed ? "Motion off" : "Motion on";
});

loadingButton.addEventListener("click", () => {
  if (loadingButton.hasAttribute("data-loading")) {
    return;
  }

  loadingButton.setAttribute("data-loading", "");
  loadingButton.setAttribute("aria-busy", "true");
  loadingLabel.textContent = "Generating";

  window.setTimeout(() => {
    loadingButton.removeAttribute("data-loading");
    loadingButton.removeAttribute("aria-busy");
    loadingLabel.textContent = "Preview ready";
  }, 1600);
});
