import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const categories = [
  ["buttons", "Buttons"],
  ["sliders", "Sliders"],
  ["section-transitions", "Section transitions"],
  ["text-reveals", "Text motion"],
  ["image-reveals", "Image reveals"],
];
const items = [];
for (const [category] of categories)
  for (const entry of readdirSync(resolve("ui-gallery", category), {
    withFileTypes: true,
  }).filter((item) => item.isDirectory())) {
    const path = resolve("ui-gallery", category, entry.name, "meta.js");
    if (existsSync(path)) {
      const { metadata } = await import(pathToFileURL(path));
      items.push(metadata);
    }
  }
const sourceCount = new Set(items.map((item) => item.source.awardUrl)).size;
const label = (item) =>
  /live/i.test(item.source.observationMode ?? "live")
    ? "実サイト操作"
    : "公式記録映像";
const row = (item) =>
  `| [${item.title}](../ui-gallery/${item.category}/${item.slug}/) | ${item.subtitle} | [${item.source.name}](${item.source.awardUrl}) / ${item.source.awardDate} | ${label(item)}${item.source.recordingUrl ? ` · [映像](${item.source.recordingUrl})` : ""} |`;
const content = `# UI Motion References

${items.length} 種類の操作・表示パターンと、${sourceCount} 件の Awwwards SOTD サイトの出典を収録しています。現在、原作と実装の見た目・途中フレーム・時間変化を比較し、再現度を修正しています。件数や操作テストの合格だけでは、再現できたとは判断しません。

## 見る

1. \`npm install\` → \`npm run dev\`
2. \`/ui-gallery/\` の **Motion references** を開く
3. カテゴリーを選び、各デモの **Replay / Reset / 動きを控えめに** を試す
4. 実装メモ・参考リンク・ページ内の JavaScript / SCSS / Shared helpers を比較する

テキストのディレクトリ名は \`text-reveals\` ですが、表示名は **Text motion / テキスト演出** です。出現だけでなく、消失・ウェイト変化・輪郭の変化も含みます。

## 状態と観察範囲

- 新規デモは、実装テストとは別にユーザーレビューが必要なため **WIP** としています
- 参考サイトの現在の画面と、受賞時の版が同一とは限りません
- **実サイト操作**と**公式記録映像の観察**を各ページに明記しています。映像だけから、未確認のドラッグ・スクロール仕様や内部コードを断定していません
- 原作の公開 CSS / 表示 DOM から計測した値、記録映像から読み取った値、独立実装の推定値を各ページで区別します。原作の内部実装が不明な箇所は、その限界を記載します
- 動作するデモには元サイトの写真・動画・ロゴ・専用書体を同梱していません。比較資料の出典スクリーンショットと、デモで使う代替素材は区別しています。素材を置き換えても、寸法・配置・動きの一致は別に確認します
- WebGL や立体表現を CSS / SVG / Canvas で近似した場合は、各ページの「再現範囲と違い」に記載しています

${categories
  .map(
    ([slug, title]) =>
      `## ${title} / ${items.filter((item) => item.category === slug).length} studies\n\n| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |\n|---|---|---|---|\n${items
        .filter((item) => item.category === slug)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(row)
        .join("\n")}\n`,
  )
  .join("\n")}
## 再利用する

各部品は \`ui-gallery/<category>/<slug>/\` にまとまっています。

- \`demo.js\`: その部品の HTML と動作。\`createDemo(root, { signal, reducedMotion })\` が \`replay / reset / destroy\` を返します
- \`style.scss\`: 部品名で範囲を限定したスタイル。CSS は HTML の head から読み込みます
- \`meta.js\`: 参考 URL、観察内容、実装値、学習メモ、限界、状態
- \`index.html / script.js\`: 共通のデモ枠と接続。\`node scripts/motion/scaffold-demo.mjs ui-gallery/<category>/<slug>\` で生成できます

必要に応じて \`ui-gallery/_motion/demo-helpers.js\` も移植してください。画面内の Source code に同じヘルパーも掲載しています。ページ枠全体をコピーする必要はありません。

すべてのリスナー・描画ループ・遅延処理・Observer は、Reset または破棄時に解除する設計です。Swup の画面差し替え時にも共通シェルが破棄を呼びます。スクロール系は独立したスクロール領域を使用し、ページ全体のホイールを横取りしません。

新しい部品は、上の5カテゴリー内で \`meta.js\` と \`index.html\` を作ると通常ビルド・共有ビルドへ登録されます。Motion Archive の既存作品や、非公開の Motion Guide / Easings は変更していません。

## 確認する

\`node scripts/motion/validate-metadata.mjs\` でファイル構成・出典・必須メモを確認します。

\`npm run build\` と \`npm run build:share\` で通常版・単体共有版を生成します。

ブラウザの共通確認は、別ターミナルで開発サーバーを起動し、\`npm run verify:ui-motion\` を実行します。初回は Playwright の Chromium が必要です。プレビューサーバーを使う場合は \`UI_TEST_BASE_URL=http://127.0.0.1:4173 npm run verify:ui-motion\` を使います。

このスクリプトは、各ページの読み込み、繰り返し再生、Reset、動きを控える設定、ソース切り替え、320px / 390px 幅、カテゴリーフィルター、Swup の往復、axe の指摘を記録します。操作固有の品質と原作への忠実度は、実際に触ったレビューも併せて判断してください。結果は Git 対象外の \`.ui-motion-qa/\` に出力します。

ユーザー確認後、該当 \`meta.js\` の \`status\` を空にするとページと一覧の WIP バッジを外せます。
`;
writeFileSync("docs/ui-motion-references.md", content);
console.log(
  `Wrote reference index: ${items.length} studies / ${sourceCount} SOTD sources`,
);
