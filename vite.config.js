import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { injectSkipLink, injectSocialMeta } from "./scripts/html-meta.mjs";

const sharedHead = readFileSync(new URL("./src/shared/head.html", import.meta.url), "utf8");

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "shared-head",
      transformIndexHtml(html, context) {
        const withSharedHead = html.replace("<head>", `<head>\n${sharedHead}`);
        const withMeta = injectSocialMeta(withSharedHead, {
          pagePath: context.path
        });
        return injectSkipLink(withMeta);
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        easings: resolve(__dirname, "easings/index.html"),
        "motion-archive": resolve(__dirname, "motion-archive/index.html"),
        categories: resolve(__dirname, "categories/index.html"),
        "ui-gallery": resolve(__dirname, "ui-gallery/index.html"),
        "ui-gallery-buttons": resolve(__dirname, "ui-gallery/buttons/index.html"),
        "ui-gallery-tooltip-behavior": resolve(__dirname, "ui-gallery/tooltip-behavior/index.html"),
        "ui-gallery-typography": resolve(__dirname, "ui-gallery/typography/index.html"),
        "cursor-pixel-field": resolve(__dirname, "works/cursor-pixel-field/index.html"),
        "green-noise-gradient": resolve(__dirname, "works/green-noise-gradient/index.html"),
        "cylindrical-image-flow": resolve(__dirname, "works/cylindrical-image-flow/index.html"),
        "scroll-tilt-gallery": resolve(__dirname, "works/scroll-tilt-gallery/index.html"),
        "cursor-image-burst": resolve(__dirname, "works/cursor-image-burst/index.html"),
        "hero-mask-shift": resolve(__dirname, "works/hero-mask-shift/index.html"),
        "latte-marble": resolve(__dirname, "works/latte-marble/index.html"),
        "fluid-image": resolve(__dirname, "works/fluid-image/index.html"),
        "image-wipe-grid": resolve(__dirname, "works/image-wipe-grid/index.html"),
        "pixel-glitch": resolve(__dirname, "works/pixel-glitch/index.html"),
        "css-pie-chart": resolve(__dirname, "works/css-pie-chart/index.html"),
        "scroll-type-reveal": resolve(__dirname, "works/scroll-type-reveal/index.html")
      }
    }
  }
});
