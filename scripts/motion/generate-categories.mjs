import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const categories = [
  [
    "buttons",
    "Buttons",
    "ボタン",
    "触れる前から、押した後まで。小さな反応の違いを確かめる。",
  ],
  [
    "sliders",
    "Sliders",
    "スライダー",
    "次の一枚へ進む動き。位置、方向、切り替わり方を比べる。",
  ],
  [
    "section-transitions",
    "Section transitions",
    "セクション切り替え",
    "ページの流れをつなぐ。スクロールと場面転換の関係を調べる。",
  ],
  [
    "text-reveals",
    "Text motion",
    "テキスト演出",
    "読む順序や触れたときの手応えをつくる。文字の出現・変化・消失を観察する。",
  ],
  [
    "image-reveals",
    "Image reveals",
    "画像出現",
    "画像をどう見せ始めるか。マスク、奥行き、ポインターへの反応。",
  ],
];
for (const [slug, title, label, description] of categories) {
  const section = `<section class="reference-collection" data-reference-category="${slug}" aria-labelledby="reference-title"><div class="reference-collection__heading"><div><h2 id="reference-title">SOTD motion references <span data-reference-count></span></h2><p data-filter-status role="status">公開サイト・公式記録映像を観察したリファレンス / WIP</p></div><label class="reference-filter">Filter <input type="search" data-reference-filter placeholder="動き・サイト名で絞り込む" aria-label="リファレンスを絞り込む" /></label></div><div class="reference-grid" data-reference-grid></div></section>`;
  if (slug === "buttons") {
    let html = readFileSync("ui-gallery/buttons/index.html", "utf8");
    if (!html.includes("data-reference-category"))
      html = html
        .replace(
          '<link rel="stylesheet" href="./style.scss" />',
          '<link rel="stylesheet" href="../_motion/category.scss" />\n    <link rel="stylesheet" href="./style.scss" />',
        )
        .replace(
          '      <section class="gallery-section"',
          `${section}\n      <section class="gallery-section"`,
        )
        .replace(
          "</body>",
          '<script type="module" src="./references.js"></script>\n</body>',
        );
    writeFileSync("ui-gallery/buttons/index.html", html);
    writeFileSync(
      "ui-gallery/buttons/references.js",
      "import { mountCategory } from '../_motion/catalog.js';\nmountCategory();\n",
    );
    continue;
  }
  mkdirSync(`ui-gallery/${slug}`, { recursive: true });
  const nav = categories
    .map(
      ([id, name]) =>
        `<a href="../${id}/"${id === "buttons" ? " data-no-swup" : ""}${id === slug ? ' aria-current="page"' : ""}>${name}</a>`,
    )
    .join("");
  writeFileSync(
    `ui-gallery/${slug}/index.html`,
    `<!doctype html><html lang="ja"><head><meta name="description" content="${description}" /><link rel="stylesheet" href="./style.scss" /><title>${title} / UI Gallery / Motion &amp; UI</title></head><body><header id="site-header" class="motion-header"><a class="motion-brand" href="../../">Motion &amp; UI</a><nav aria-label="ページ案内"><a href="../">UI Gallery</a><a href="../../motion-archive/">Motion Archive</a></nav></header><div id="swup" class="transition-fade"><main class="motion-category-page"><div class="motion-category-hero"><div><p class="motion-eyebrow">UI Gallery / ${label}</p><h1>${title}</h1></div><p class="motion-category-hero__copy">${description}<br />過去の Awwwards SOTD サイトや公式記録映像を観察し、使い回せる小さなデモに分解しています。</p></div><nav class="motion-category-navigation" aria-label="カテゴリー">${nav}</nav>${section}<aside class="motion-reference-disclaimer"><h2>観察して、触って、使う</h2><p>各デモに参考 URL・受賞日・観察箇所・再現の限界・ソースコードを掲載しています。実装の検証済みでも、ユーザーレビュー前は WIP 表示です。サイトの意匠をそのまま複製せず、動きの仕組みを独立して学ぶためのリファレンスです。</p></aside></main><footer class="motion-footer"><a href="../">← UI Gallery</a><span>Motion &amp; UI / Component references</span></footer><script type="module" src="./script.js" data-swup-reload-script></script></div><script type="module" src="/src/scripts/page-transitions.js" data-swup-ignore-script></script></body></html>\n`,
  );
  writeFileSync(
    `ui-gallery/${slug}/style.scss`,
    "@use '../_motion/category';\n",
  );
  writeFileSync(
    `ui-gallery/${slug}/script.js`,
    "import { mountCategory } from '../_motion/catalog.js';\nmountCategory();\n",
  );
}
