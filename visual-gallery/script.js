const VALID_LAYOUTS = ["masonry", "magazine", "rail", "stack"];

const imageModules = import.meta.glob("../src/assets/images/**/*.{png,jpg,jpeg,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default"
});

const board = document.querySelector("[data-image-board]");
const dialog = document.querySelector("[data-image-dialog]");
const dialogImage = dialog.querySelector("[data-dialog-image]");
const dialogClose = dialog.querySelector("[data-dialog-close]");

let lastFocusedImage = null;

function toTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function comparePath(a, b) {
  return a.path.localeCompare(b.path, "en", { numeric: true });
}

function createImageList() {
  return Object.entries(imageModules)
    .map(([path, src]) => {
      const relativePath = path.replace("../src/assets/images/", "");
      const parts = relativePath.split("/");
      const filename = parts.at(-1);

      return {
        src,
        path: relativePath,
        filename,
        title: toTitle(filename)
      };
    })
    .sort(comparePath);
}

const images = createImageList();

function getLayoutFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const layout = params.get("layout") || "masonry";
  return VALID_LAYOUTS.includes(layout) ? layout : "masonry";
}

function setActiveLayout(layout) {
  board.dataset.layout = layout;

  document.querySelectorAll("[data-layout-link]").forEach((link) => {
    const isCurrent = link.dataset.layoutLink === layout;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function renderImages() {
  board.innerHTML = images
    .map((image, index) => {
      const loading = index < 8 ? "eager" : "lazy";
      return `
        <figure class="image-item" style="--item-index: ${index}; --stack-offset: ${index % 3}; --tilt: ${(index % 5) - 2};">
          <button type="button" data-image-index="${index}" aria-label="${image.title} を大きく表示">
            <img src="${image.src}" alt="${image.title}" loading="${loading}" decoding="async" />
          </button>
        </figure>
      `;
    })
    .join("");
}

function openDialog(index, trigger) {
  const image = images[index];
  lastFocusedImage = trigger;
  dialogImage.src = image.src;
  dialogImage.alt = image.title;
  dialog.showModal();
  dialogClose.focus();
}

function closeDialog() {
  dialog.close();
}

renderImages();
setActiveLayout(getLayoutFromUrl());

document.querySelector("[data-layout-switcher]").addEventListener("click", (event) => {
  const link = event.target.closest("[data-layout-link]");
  if (!link) return;

  event.preventDefault();
  const layout = link.dataset.layoutLink;
  const nextUrl = new URL(link.href);
  window.history.pushState({ layout }, "", nextUrl);
  setActiveLayout(layout);
});

window.addEventListener("popstate", () => {
  setActiveLayout(getLayoutFromUrl());
});

board.addEventListener("click", (event) => {
  const button = event.target.closest("[data-image-index]");
  if (!button) return;

  openDialog(Number(button.dataset.imageIndex), button);
});

dialogClose.addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog.addEventListener("close", () => {
  dialogImage.removeAttribute("src");
  lastFocusedImage?.focus();
});
