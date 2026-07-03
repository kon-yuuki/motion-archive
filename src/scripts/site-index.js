import { works } from "../data/works.js";
import { uiGalleryItems } from "../data/ui-gallery.js";
import { motionGuideItems } from "../data/motion-guide.js";

const visualGalleryLayouts = [
  {
    title: "X Scroll",
    date: "2026.07.03"
  },
  {
    title: "Free Drag",
    date: "2026.07.03"
  }
];

const collections = {
  motion: works,
  ui: uiGalleryItems,
  guide: motionGuideItems,
  visual: visualGalleryLayouts
};

function latestDate(items) {
  return items.reduce((latest, item) => (
    item.date > latest ? item.date : latest
  ), "");
}

function itemTotal(items) {
  return items.reduce((sum, item) => sum + (item.count ?? 1), 0);
}

document.querySelectorAll("[data-collection]").forEach((card) => {
  const items = collections[card.dataset.collection] ?? [];
  const date = card.querySelector("[data-collection-date]");
  const count = card.querySelector("[data-collection-count]");

  date.textContent = latestDate(items);
  const total = itemTotal(items);
  count.textContent = String(total).padStart(2, "0");
});

const totalItems = Object.values(collections).reduce((sum, items) => sum + itemTotal(items), 0);
const totalItemsElement = document.querySelector("[data-total-items]");

if (totalItemsElement) {
  totalItemsElement.textContent = String(totalItems).padStart(2, "0");
}
