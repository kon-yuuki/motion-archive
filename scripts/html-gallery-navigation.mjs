import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(
  resolve(root, "src/shared/gallery-navigation.html"),
  "utf8",
);
const categories = [
  "buttons",
  "sliders",
  "section-transitions",
  "text-reveals",
  "image-reveals",
];

function referenceCounts() {
  return Object.fromEntries(
    categories.map((category) => {
      const directory = resolve(root, "ui-gallery", category);
      const count = readdirSync(directory, { withFileTypes: true }).filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(resolve(directory, entry.name, "meta.js")) &&
          existsSync(resolve(directory, entry.name, "index.html")),
      ).length;
      return [category, count];
    }),
  );
}

/** Render the same ordinary links on every gallery route, before JS runs. */
export function injectGalleryNavigation(html, pagePath = "") {
  const pathname = pagePath.split("?")[0];
  const match = pathname.match(/^\/ui-gallery(?:\/|$)/);
  if (!match) return html;

  const segments = pathname
    .replace(/\/index\.html$/, "/")
    .split("/")
    .filter(Boolean);
  const current = segments[1] ?? "index";
  const isDemo = segments.length > 2;
  const pageDirectory = `/${segments.join("/")}`;
  const relativeTo = (target) => {
    const path = posix.relative(pageDirectory, target);
    return path ? `${path}/` : "./";
  };
  const counts = referenceCounts();
  const replacements = {
    "site-root": relativeTo("/"),
    "gallery-root": relativeTo("/ui-gallery"),
    "reference-total": Object.values(counts).reduce((sum, count) => sum + count, 0),
    ...Object.fromEntries(
      Object.entries(counts).map(([category, count]) => [
        `${category}-count`,
        String(count).padStart(2, "0"),
      ]),
    ),
  };
  const header = template
    .replace(/\{\{([a-z-]+)\}\}/g, (_, key) => replacements[key])
    .replace(/data-gallery-(page|category)="([a-z-]+)"/g, (attribute, type, slug) => {
      if (slug !== current) return attribute;
      const state = type === "category" && isDemo ? "location" : "page";
      return `${attribute} aria-current="${state}"`;
    });

  // Only replace gallery headers; work shells and standalone share builds stay untouched.
  const headerPattern = /<header\b[^>]*class="(?:gallery-header|motion-header)"[^>]*>[\s\S]*?<\/header>/;
  if (!headerPattern.test(html)) return html;
  return html
    .replace(headerPattern, header)
    .replace(
      "</head>",
      '<link rel="stylesheet" href="/src/styles/gallery-navigation.scss" />\n</head>',
    );
}
