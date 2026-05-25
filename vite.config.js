import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        works: resolve(__dirname, "works/index.html"),
        categories: resolve(__dirname, "categories/index.html"),
        "kinetic-type": resolve(__dirname, "works/kinetic-type/index.html"),
        "magnetic-orbit": resolve(__dirname, "works/magnetic-orbit/index.html"),
        "grid-wave": resolve(__dirname, "works/grid-wave/index.html")
      }
    }
  }
});
