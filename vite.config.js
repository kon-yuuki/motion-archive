import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const sharedHead = readFileSync(new URL("./src/shared/head.html", import.meta.url), "utf8");

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "shared-head",
      transformIndexHtml(html) {
        return html.replace("<head>", `<head>\n${sharedHead}`);
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        easings: resolve(__dirname, "easings/index.html"),
        "motion-archive": resolve(__dirname, "motion-archive/index.html"),
        works: resolve(__dirname, "works/index.html"),
        categories: resolve(__dirname, "categories/index.html"),
        "ui-gallery": resolve(__dirname, "ui-gallery/index.html"),
        "ui-gallery-buttons": resolve(__dirname, "ui-gallery/buttons/index.html"),
        "ui-gallery-tooltip-behavior": resolve(__dirname, "ui-gallery/tooltip-behavior/index.html"),
        "ui-gallery-typography": resolve(__dirname, "ui-gallery/typography/index.html"),
        "green-marble": resolve(__dirname, "works/green-marble/index.html"),
        "fluid-image": resolve(__dirname, "works/fluid-image/index.html"),
        "image-wipe-grid": resolve(__dirname, "works/image-wipe-grid/index.html"),
        "pixel-glitch": resolve(__dirname, "works/pixel-glitch/index.html"),
        "css-pie-chart": resolve(__dirname, "works/css-pie-chart/index.html"),
        "scroll-type-reveal": resolve(__dirname, "works/scroll-type-reveal/index.html")
      }
    }
  }
});
