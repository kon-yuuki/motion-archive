import { referencesFor } from "./ui-motion.js";

export const uiGalleryItems = [
  ...[ ["sliders", "Sliders"], ["section-transitions", "Section transitions"], ["text-reveals", "Text motion"], ["image-reveals", "Image reveals"] ].map(([slug, title]) => ({ slug, title, date: "2026.10.02", count: referencesFor(slug).length })),
  {
    slug: "buttons",
    title: "Buttons",
    date: "2026.10.02",
    count: 1 + referencesFor("buttons").length
  },
  {
    slug: "form",
    title: "Form",
    date: "2026.06.23",
    count: 1
  },
  {
    slug: "mega-menu",
    title: "Mega Menu",
    date: "2026.08.06",
    count: 2
  },
  {
    slug: "tooltip-behavior",
    title: "Tooltip Behavior",
    date: "2026.06.12",
    count: 2
  },
  {
    slug: "typography",
    title: "Typography",
    date: "2026.06.12",
    count: 2
  }
];
