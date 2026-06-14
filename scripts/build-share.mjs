import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { build } from "vite";
import { injectSkipLink, injectSocialMeta } from "./html-meta.mjs";

const root = resolve(import.meta.dirname, "..");
const requestedPage = process.argv[2];
const temporaryDirectory = resolve(root, ".share-build");
const outputDirectory = resolve(root, "dist-share");
const sharedHead = readFileSync(resolve(root, "src/shared/head.html"), "utf8");
const workPages = readdirSync(resolve(root, "works"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name)
  .filter((slug) => existsSync(resolve(root, "works", slug, "index.html")))
  .sort()
  .map((slug) => ({
    type: "work",
    sourcePath: `works/${slug}/index.html`,
    outputPath: `${slug}/index.html`,
    requestKey: slug,
    logPath: `/${slug}/`,
    slug
  }));

const uiPages = [
  {
    type: "ui",
    sourcePath: "ui-gallery/buttons/index.html",
    outputPath: "ui-gallery/buttons/index.html",
    requestKey: "ui-gallery/buttons",
    logPath: "/ui-gallery/buttons/"
  },
  {
    type: "ui",
    sourcePath: "ui-gallery/tooltip-behavior/index.html",
    outputPath: "ui-gallery/tooltip-behavior/index.html",
    requestKey: "ui-gallery/tooltip-behavior",
    logPath: "/ui-gallery/tooltip-behavior/"
  },
  {
    type: "ui",
    sourcePath: "ui-gallery/typography/index.html",
    outputPath: "ui-gallery/typography/index.html",
    requestKey: "ui-gallery/typography",
    logPath: "/ui-gallery/typography/"
  }
];

const availablePages = [...workPages, ...uiPages].filter((page) =>
  existsSync(resolve(root, page.sourcePath))
);
const availablePageKeys = availablePages.map((page) => page.requestKey);

if (requestedPage && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(requestedPage)) {
  console.error("Usage: npm run build:share -- [work-slug|ui-gallery[/page]]");
  process.exit(1);
}

if (requestedPage && !availablePageKeys.includes(requestedPage)) {
  console.error(`Share page not found: ${requestedPage}`);
  console.error(`Available pages: ${availablePageKeys.join(", ")}`);
  process.exit(1);
}

const pages = requestedPage
  ? availablePages.filter((page) => page.requestKey === requestedPage)
  : availablePages;

function removeElement(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) {
    return html;
  }

  const end = html.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`Could not find closing marker for ${startMarker}`);
  }

  return html.slice(0, start) + html.slice(end + endMarker.length);
}

function createWorkShareHtml(html, slug) {
  let shareHtml = removeElement(html, '<nav class="experiment-nav"', "</nav>");
  shareHtml = removeElement(shareHtml, '<aside class="experiment-meta"', "</aside>");

  const memoStart = shareHtml.indexOf('<section class="tech-note"');
  const scriptStart = shareHtml.indexOf('<script type="module"', memoStart);
  if (memoStart !== -1 && scriptStart !== -1) {
    shareHtml = shareHtml.slice(0, memoStart) + shareHtml.slice(scriptStart);
  }

  return shareHtml
    .replaceAll("../_shared/", "../../works/_shared/")
    .replaceAll('href="./style.scss"', `href="../../works/${slug}/style.scss"`)
    .replaceAll('src="./script.js"', `src="../../works/${slug}/script.js"`)
    .replaceAll("../../src/", "../../src/")
    .replace("<body>", '<body class="share-demo">');
}

function relativeImportPath(fromFile, toFile) {
  const importPath = relative(dirname(fromFile), toFile);
  return importPath.startsWith(".") ? importPath : `./${importPath}`;
}

function createUiShareHtml(html, page, temporaryHtml) {
  const sourceDirectory = dirname(resolve(root, page.sourcePath));
  let shareHtml = removeElement(html, '<header class="gallery-header"', "</header>");
  shareHtml = removeElement(shareHtml, '<footer class="gallery-footer"', "</footer>");
  shareHtml = shareHtml
    .replaceAll(
      'href="./style.scss"',
      `href="${relativeImportPath(temporaryHtml, resolve(sourceDirectory, "style.scss"))}"`
    )
    .replace("<body>", '<body class="share-demo">');

  if (existsSync(resolve(sourceDirectory, "script.js"))) {
    shareHtml = shareHtml.replaceAll(
      'src="./script.js"',
      `src="${relativeImportPath(temporaryHtml, resolve(sourceDirectory, "script.js"))}"`
    );
  }

  return shareHtml;
}

rmSync(temporaryDirectory, { recursive: true, force: true });
rmSync(outputDirectory, { recursive: true, force: true });

const inputs = {};
for (const page of pages) {
  const temporaryHtml = resolve(temporaryDirectory, page.outputPath);
  await mkdir(resolve(temporaryHtml, ".."), { recursive: true });
  const sourceHtml = readFileSync(resolve(root, page.sourcePath), "utf8");
  writeFileSync(
    temporaryHtml,
    page.type === "work"
      ? createWorkShareHtml(sourceHtml, page.slug)
      : createUiShareHtml(sourceHtml, page, temporaryHtml)
  );
  inputs[page.requestKey] = temporaryHtml;
}

await build({
  configFile: false,
  root,
  base: "/",
  plugins: [
    {
      name: "share-head",
      transformIndexHtml(html, context) {
        const withSharedHead = html.replace("<head>", `<head>\n${sharedHead}`);
        const withMeta = injectSocialMeta(withSharedHead, {
          pagePath: context.path,
          share: true
        });
        return injectSkipLink(withMeta);
      }
    }
  ],
  build: {
    emptyOutDir: true,
    outDir: outputDirectory,
    rollupOptions: {
      input: inputs
    }
  }
});

for (const page of pages) {
  const nestedHtml = resolve(outputDirectory, ".share-build", page.outputPath);
  const finalHtml = resolve(outputDirectory, page.outputPath);
  if (!existsSync(nestedHtml)) {
    throw new Error(`Share build did not produce HTML for ${page.requestKey}.`);
  }
  await mkdir(resolve(finalHtml, ".."), { recursive: true });
  renameSync(nestedHtml, finalHtml);
}

rmSync(resolve(outputDirectory, ".share-build"), { recursive: true, force: true });
rmSync(temporaryDirectory, { recursive: true, force: true });

console.log(`Share build ready: ${pages.map((page) => page.logPath).join(", ")}`);
