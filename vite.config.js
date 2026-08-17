import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { injectSkipLink, injectSocialMeta } from "./scripts/html-meta.mjs";

const sharedHead = readFileSync(new URL("./src/shared/head.html", import.meta.url), "utf8");

const legacyVisualRedirects = new Map([
  ["/visual-gallery", "/works/x-scroll-gallery/"],
  ["/visual-gallery/", "/works/x-scroll-gallery/"],
  ["/visual-gallery/x-scroll", "/works/x-scroll-gallery/"],
  ["/visual-gallery/x-scroll/", "/works/x-scroll-gallery/"],
  ["/visual-gallery/free-drag", "/works/free-drag-gallery/"],
  ["/visual-gallery/free-drag/", "/works/free-drag-gallery/"]
]);

function redirectLegacyVisualGallery(server) {
  server.middlewares.use((request, response, next) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    const destination = legacyVisualRedirects.get(pathname);
    if (!destination) {
      next();
      return;
    }

    response.statusCode = 308;
    response.setHeader("Location", destination);
    response.end();
  });
}

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "remove-local-only-links",
      apply: "build",
      transformIndexHtml(html) {
        return html.replace(/\s*<a\b[^>]*\bdata-local-only\b[^>]*>[\s\S]*?<\/a>/g, "");
      }
    },
    {
      name: "legacy-visual-gallery-redirects",
      configureServer: redirectLegacyVisualGallery,
      configurePreviewServer: redirectLegacyVisualGallery
    },
    {
      name: "shared-head",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          const withSharedHead = html.replace("<head>", `<head>\n${sharedHead}`);
          const withMeta = injectSocialMeta(withSharedHead, {
            pagePath: context.path
          });
          return injectSkipLink(withMeta);
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        "motion-archive": resolve(__dirname, "motion-archive/index.html"),
        categories: resolve(__dirname, "categories/index.html"),
        "ui-gallery": resolve(__dirname, "ui-gallery/index.html"),
        "ui-gallery-buttons": resolve(__dirname, "ui-gallery/buttons/index.html"),
        "ui-gallery-form": resolve(__dirname, "ui-gallery/form/index.html"),
        "ui-gallery-mega-menu": resolve(__dirname, "ui-gallery/mega-menu/index.html"),
        "ui-gallery-tooltip-behavior": resolve(__dirname, "ui-gallery/tooltip-behavior/index.html"),
        "ui-gallery-typography": resolve(__dirname, "ui-gallery/typography/index.html"),
        "scale-through-scroll": resolve(__dirname, "works/scale-through-scroll/index.html"),
        "x-scroll-gallery": resolve(__dirname, "works/x-scroll-gallery/index.html"),
        "free-drag-gallery": resolve(__dirname, "works/free-drag-gallery/index.html"),
        "helical-image-scroll": resolve(__dirname, "works/helical-image-scroll/index.html"),
        "random-image-stream": resolve(__dirname, "works/random-image-stream/index.html"),
        "random-image-stream-ver2": resolve(__dirname, "works/random-image-stream-ver2/index.html"),
        "section-layer-transition": resolve(__dirname, "works/section-layer-transition/index.html"),
        "vortex-trail": resolve(__dirname, "works/vortex-trail/index.html"),
        "webgl-plane-reveal": resolve(__dirname, "works/webgl-plane-reveal/index.html"),
        "soft-torque": resolve(__dirname, "works/soft-torque/index.html"),
        "particle-torque": resolve(__dirname, "works/particle-torque/index.html"),
        "webgl-image-slider": resolve(__dirname, "works/webgl-image-slider/index.html"),
        "hover-video-cards": resolve(__dirname, "works/hover-video-cards/index.html"),
        "spiral-infinite-gallery": resolve(__dirname, "works/spiral-infinite-gallery/index.html"),
        "rotating-scroll-gallery": resolve(__dirname, "works/rotating-scroll-gallery/index.html"),
        "cursor-pixel-field": resolve(__dirname, "works/cursor-pixel-field/index.html"),
        "cylindrical-image-flow": resolve(__dirname, "works/cylindrical-image-flow/index.html"),
        "rainy-neon-cylinder": resolve(__dirname, "works/rainy-neon-cylinder/index.html"),
        "cursor-image-burst": resolve(__dirname, "works/cursor-image-burst/index.html"),
        "rgb-cursor-stalker": resolve(__dirname, "works/rgb-cursor-stalker/index.html"),
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
