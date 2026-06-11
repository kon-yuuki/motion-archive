import { works } from "../data/works.js";
import { uiGalleryItems } from "../data/ui-gallery.js";

const collections = {
  motion: works,
  ui: uiGalleryItems
};

function latestDate(items) {
  return items.reduce((latest, item) => (
    item.date > latest ? item.date : latest
  ), "");
}

document.querySelectorAll("[data-collection]").forEach((card) => {
  const items = collections[card.dataset.collection] ?? [];
  const date = card.querySelector("[data-collection-date]");
  const count = card.querySelector("[data-collection-count]");

  date.textContent = latestDate(items);
  count.textContent = String(items.length).padStart(2, "0");
});
