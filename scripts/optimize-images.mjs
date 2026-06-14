import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, "src", "assets", "images");
const outputDirectory = resolve(sourceDirectory, "optimized");
const sources = ["dummy_1.png", "dummy_2.png", "dummy_3.png", "dummy_4.png"];
const widths = [480, 800, 1024];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const source of sources) {
  const bytes = await readFile(resolve(sourceDirectory, source));
  const dataUrl = `data:image/png;base64,${bytes.toString("base64")}`;

  for (const width of widths) {
    const encoded = await page.evaluate(
      async ({ dataUrl: url, targetWidth }) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const scale = targetWidth / image.naturalWidth;
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolveBlob) =>
          canvas.toBlob(resolveBlob, "image/webp", 0.82)
        );
        return [...new Uint8Array(await blob.arrayBuffer())];
      },
      { dataUrl, targetWidth: width }
    );

    const name = `${basename(source, ".png")}-${width}.webp`;
    await writeFile(resolve(outputDirectory, name), Buffer.from(encoded));
  }
}

await browser.close();
console.log(`Optimized ${sources.length} images at ${widths.join(", ")}px`);
