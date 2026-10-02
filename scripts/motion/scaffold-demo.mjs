import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const paths = process.argv.slice(2);
for (const path of paths) {
  const directory = resolve(path);
  const { metadata } = await import(
    pathToFileURL(resolve(directory, "meta.js"))
  );
  const title = metadata.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  writeFileSync(
    resolve(directory, "index.html"),
    `<!doctype html>
<html lang="ja">
<head>
<meta name="description" content="${metadata.description.replaceAll('"', "&quot;")}" />
<link rel="stylesheet" href="../../_motion/demo-shell.scss" />
<link rel="stylesheet" href="./style.scss" />
<title>${title} / UI Gallery / Motion &amp; UI</title>
</head>
<body>
<header id="site-header" class="motion-header"><a class="motion-brand" href="../../../">Motion &amp; UI</a><nav aria-label="ページ案内"><a href="../../">UI Gallery</a><a href="../"${metadata.category === "buttons" ? " data-no-swup" : ""}>カテゴリーに戻る ↗︎</a></nav></header>
<div id="swup" class="transition-fade">
<main class="motion-page" data-motion-page data-demo-slug="${metadata.slug}" data-demo-category="${metadata.category}">
<div data-demo-heading><h1>${title}</h1></div>
<section class="motion-lab" aria-label="${title} の操作デモ">
<div class="motion-toolbar"><div class="motion-toolbar__actions"><button class="motion-control motion-control--primary" type="button" data-demo-replay>↻ Replay</button><button class="motion-control" type="button" data-demo-reset>Reset</button></div><label class="motion-toggle"><input type="checkbox" data-motion-toggle />動きを控えめに</label></div>
<div class="motion-stage" data-demo-stage><noscript>このデモを操作するには JavaScript を有効にしてください。</noscript></div>
<div class="motion-lab-footer"><p data-demo-status role="status" aria-live="polite"></p><p>独立した学習用実装 / Original placeholder assets</p></div>
</section>
<dl class="motion-facts" data-demo-facts></dl>
<div class="motion-content"><div class="motion-notes" data-demo-notes></div><section class="motion-code" aria-label="デモのソースコード"><div class="motion-code-heading"><h2>Source code</h2><button type="button" class="motion-control" data-copy-code>Copy</button></div><div class="motion-code-tabs" role="tablist" aria-label="コードの種類"><button id="code-js" role="tab" aria-selected="true" aria-controls="code-panel" data-code-tab="js">JavaScript</button><button id="code-css" role="tab" aria-selected="false" aria-controls="code-panel" tabindex="-1" data-code-tab="css">SCSS</button><button id="code-helpers" role="tab" aria-selected="false" aria-controls="code-panel" tabindex="-1" data-code-tab="helpers">Shared helpers</button></div><pre id="code-panel" role="tabpanel" tabindex="0" aria-labelledby="code-js" data-code-panel><code data-code-content></code></pre></section></div>
</main><footer class="motion-footer"><a href="../../">← UI Gallery</a><span data-reference-status>Reference study${metadata.status ? " / " + metadata.status : ""}</span></footer>
<script type="module" src="./script.js" data-swup-reload-script></script>
</div>
<script type="module" src="/src/scripts/page-transitions.js" data-swup-ignore-script></script>
</body></html>\n`,
  );
  writeFileSync(
    resolve(directory, "script.js"),
    `import { mountDemoPage } from '../../_motion/demo-page.js';\nimport { metadata } from './meta.js';\nimport { createDemo } from './demo.js';\nimport js from './demo.js?raw';\nimport css from './style.scss?raw';\nimport helpers from '../../_motion/demo-helpers.js?raw';\nmountDemoPage(metadata, createDemo, { js, css, helpers });\n`,
  );
  if (!existsSync(resolve(directory, "demo.js")))
    console.warn("Missing demo.js:", directory);
  console.log(metadata.category + "/" + metadata.slug);
}
