import { works } from "../data/works.js";
import { uiGalleryItems } from "../data/ui-gallery.js";
import { motionGuideItems } from "../data/motion-guide.js";

const visualImageModules = import.meta.glob("../assets/images/**/*.{png,jpg,jpeg,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default"
});
const visualImageCount = Object.keys(visualImageModules).length;

const collections = {
  motion: works,
  ui: uiGalleryItems,
  guide: motionGuideItems,
  visual: [
    {
      date: "2026.07.03",
      count: visualImageCount
    }
  ]
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
  const total = items.reduce((sum, item) => sum + (item.count ?? 1), 0);
  count.textContent = String(total).padStart(2, "0");
});
