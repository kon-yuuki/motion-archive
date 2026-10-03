# UI Motion References

30 種類の操作・表示パターンと、19 件の Awwwards SOTD サイトの出典を収録しています。現在、原作と実装の見た目・途中フレーム・時間変化を比較し、再現度を修正しています。件数や操作テストの合格だけでは、再現できたとは判断しません。

## 見る

1. `npm install` → `npm run dev`
2. `/ui-gallery/` の **Motion references** を開く
3. カテゴリーを選び、各デモの **Replay / Reset / 動きを控えめに** を試す
4. 実装メモ・参考リンク・ページ内の JavaScript / SCSS / Shared helpers を比較する

テキストのディレクトリ名は `text-reveals` ですが、表示名は **Text motion / テキスト演出** です。出現だけでなく、消失・ウェイト変化・輪郭の変化も含みます。

## 状態と観察範囲

- 新規デモは、実装テストとは別にユーザーレビューが必要なため **WIP** としています
- 参考サイトの現在の画面と、受賞時の版が同一とは限りません
- **実サイト操作**と**公式記録映像の観察**を各ページに明記しています。映像だけから、未確認のドラッグ・スクロール仕様や内部コードを断定していません
- 原作の公開 CSS / 表示 DOM から計測した値、記録映像から読み取った値、独立実装の推定値を各ページで区別します。原作の内部実装が不明な箇所は、その限界を記載します
- 動作するデモには元サイトの写真・動画・ロゴ・専用書体を同梱していません。比較資料の出典スクリーンショットと、デモで使う代替素材は区別しています。素材を置き換えても、寸法・配置・動きの一致は別に確認します
- WebGL や立体表現を CSS / SVG / Canvas で近似した場合は、各ページの「再現範囲と違い」に記載しています

## Buttons / 6 studies

| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |
|---|---|---|---|
| [Arrow swap](../ui-gallery/buttons/arrow-swap/) | REJOUICE の Let's talk を部品単位で再現 | [REJOUICE®](https://www.awwwards.com/sites/rejouice-r-3) / 2025-02-06 | 実サイト操作 |
| [Checker dissolve](../ui-gallery/buttons/checker-dissolve/) | 小さな四角で、面を切り替える | [Noomo Agency](https://www.awwwards.com/sites/noomo-agency) / 2023-09-21 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/button-hover-interaction-noomo-agency) |
| [Dennis / About me](../ui-gallery/buttons/magnetic-fill/) | 円と文字が別々に追従する CTA | [Dennis Snellenberg](https://www.awwwards.com/sites/dennis-snellenberg) / 2022-04-04 | 実サイト操作 |
| [Directional underline](../ui-gallery/buttons/directional-underline/) | 文字を動かさず、行き先を示す | [Exo Ape](https://www.awwwards.com/sites/exo-ape) / 2022-05-23 | 実サイト操作 |
| [Joseph Berry / Hall of Fame](../ui-gallery/buttons/icon-sequence/) | 文字、四つの炎、青いカプセルの順序 | [Joseph Berry Masterclass](https://www.awwwards.com/sites/joseph-berry-masterclass) / 2021-08-27 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/joseph-berry-masterclass-hover-button-animation) |
| [Menu icon morph](../ui-gallery/buttons/menu-icon-morph/) | 曲がった先端が伸び、リンクが少し遅れて入る | [Dennis Snellenberg](https://www.awwwards.com/sites/dennis-snellenberg) / 2022-04-04 | 実サイト操作 |

## Sliders / 6 studies

| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |
|---|---|---|---|
| [Bending cards](../ui-gallery/sliders/bending-cards/) | 送る瞬間だけ、カードがしなる | [Smooothy](https://www.awwwards.com/sites/smooothy) / 2025-08-21 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/slider-smooothy) |
| [Ferris-wheel gallery](../ui-gallery/sliders/ferris-wheel/) | 一枚の絵から、縦に回る作品の列へ | [De Maldè - Canvas Chronicles](https://www.awwwards.com/sites/de-malde-canvas-chronicles) / 2025-04-13 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/ferris-wheel-slider-de-malde-canvas-chronicles) |
| [Free-drag rail](../ui-gallery/sliders/free-drag-rail/) | 大きさの違うカードを、ひと続きに | [REJOUICE®](https://www.awwwards.com/sites/rejouice-r-3) / 2025-02-06 | 実サイト操作 |
| [Lateral panel accordion](../ui-gallery/sliders/lateral-panels/) | 次の面が広がり、前の面は帯として残る | [Akaru](https://www.awwwards.com/sites/akaru-2) / 2024-04-01 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/slider-akaru-2) |
| [Layered bundle swap](../ui-gallery/sliders/layered-bundle/) | 変わらないベースと、重なって入れ替わる組み合わせ | [More Nutrition](https://www.awwwards.com/sites/more-nutrition) / 2025-11-03 | 実サイト操作 |
| [Vertical film aperture](../ui-gallery/sliders/vertical-aperture/) | 画面と目盛りを固定して、シーンだけを縦に送る | [Ciel Rose](https://www.awwwards.com/sites/ciel-rose) / 2025-02-20 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/home-projects-slider-ciel-rose) |

## Section transitions / 6 studies

| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |
|---|---|---|---|
| [Depth tunnel](../ui-gallery/section-transitions/depth-tunnel/) | 奥行きを通り抜けて、次の場面へ | [Lusion v3](https://www.awwwards.com/sites/lusion-v3) / 2023-10-02 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/scroll-animation-3) |
| [Gradient frame wipe](../ui-gallery/section-transitions/gradient-frame-wipe/) | 色の枠を、明るい面が覆っていく | [Ciel Rose](https://www.awwwards.com/sites/ciel-rose) / 2025-02-20 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/global-transition-ciel-rose) |
| [Numeral mask](../ui-gallery/section-transitions/numeral-mask/) | 数字の面が、そのまま次の背景になる | [GRASS Vionaro V8](https://www.awwwards.com/sites/grass-vionaro-v8) / 2023-01-16 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/section-transition-8-grass-vionaro-v8) |
| [Reel expansion](../ui-gallery/section-transitions/reel-expansion/) | 小さな窓から、画面いっぱいへ | [Exo Ape](https://www.awwwards.com/sites/exo-ape) / 2022-05-23 | 実サイト操作 |
| [Underlapping footer](../ui-gallery/section-transitions/underlapping-footer/) | ページの下に、次の場面を隠す | [Exo Ape](https://www.awwwards.com/sites/exo-ape) / 2022-05-23 | 実サイト操作 |
| [Upward curtain](../ui-gallery/section-transitions/upward-curtain/) | 文字を動かさず、境界を引き上げる | [Akaru](https://www.awwwards.com/sites/akaru-2) / 2024-04-01 | 実サイト操作 · [映像](https://www.awwwards.com/inspiration/menu-akaru-2) |

## Text motion / 6 studies

| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |
|---|---|---|---|
| [Blur dissolve](../ui-gallery/text-reveals/blur-dissolve/) | 輪郭をほどいて、余韻を残す | [Black Dog](https://www.awwwards.com/sites/black-dog) / 2021-09-11 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/black-dog-blurred-text-effect-click-animation) |
| [Character X-ray](../ui-gallery/text-reveals/character-xray/) | 文字の輪郭を、丸い窓でのぞく | [Casa di Solare](https://www.awwwards.com/sites/casa-di-solare) / 2024-02-19 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/character-xray-effect-casa-di-solare) |
| [Contour ripple](../ui-gallery/text-reveals/contour-ripple/) | 線でできた文字を、局所的にゆがめる | [DICH™ Fashion](https://www.awwwards.com/sites/dichtm-fashion) / 2025-06-09 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/webgl-text-dichtm-fashion) |
| [Masked lines](../ui-gallery/text-reveals/masked-lines/) | 行の境界から、順番に現れる | [Dennis Snellenberg](https://www.awwwards.com/sites/dennis-snellenberg) / 2022-04-04 | 実サイト操作 |
| [Proximity weight](../ui-gallery/text-reveals/proximity-weight/) | 近い文字だけ、太さが変わる | [Casa di Solare](https://www.awwwards.com/sites/casa-di-solare) / 2024-02-19 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/variable-type-hover-effect-casa-di-solare) |
| [Scan-band reveal](../ui-gallery/text-reveals/scan-band-reveal/) | 細かな横帯が、ひとつの文字へつながる | [Fine Thought](https://www.awwwards.com/sites/fine-thought-site) / 2025-07-20 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/page-load-effect-fine-thought-4) |

## Image reveals / 6 studies

| デモ | 見どころ | SOTD 出典 / 受賞日 | 観察方法 |
|---|---|---|---|
| [Accordion unfold](../ui-gallery/image-reveals/accordion-unfold/) | 折り目がほどけて、景色が広がる | [B&O PLAY Spring/Summer 2017](https://www.awwwards.com/sites/b-o-play-spring-summer-2017) / 2017-03-30 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/unfolding-effect) |
| [Cursor preview](../ui-gallery/image-reveals/cursor-preview/) | 一覧の上に、気配を見せる | [Dennis Snellenberg](https://www.awwwards.com/sites/dennis-snellenberg) / 2022-04-04 | 実サイト操作 |
| [Menu crossfade](../ui-gallery/image-reveals/menu-crossfade/) | 同じ枠の中で、選択の気配を変える | [Exo Ape](https://www.awwwards.com/sites/exo-ape) / 2022-05-23 | 実サイト操作 |
| [Organic mask](../ui-gallery/image-reveals/organic-mask/) | 不規則な窓がつながり、最後の穴が消える | [Stuuudio](https://www.awwwards.com/sites/stuuudio) / 2019-08-01 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/image-reveal-animation-mask-stuuudio) |
| [Perspective tiles](../ui-gallery/image-reveals/cube-tiles/) | 離れた断片が、一枚に揃う | [B&O PLAY Spring/Summer 2017](https://www.awwwards.com/sites/b-o-play-spring-summer-2017) / 2017-03-30 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/cube-effect-image-reveal) |
| [Texture mask](../ui-gallery/image-reveals/texture-mask/) | 文字の内側に、素材をのぞかせる | [Duten](https://www.awwwards.com/sites/duten) / 2024-11-03 | 公式記録映像 · [映像](https://www.awwwards.com/inspiration/texture-hover-reveal-duten) |

## 再利用する

各部品は `ui-gallery/<category>/<slug>/` にまとまっています。

- `demo.js`: その部品の HTML と動作。`createDemo(root, { signal, reducedMotion })` が `replay / reset / destroy` を返します
- `style.scss`: 部品名で範囲を限定したスタイル。CSS は HTML の head から読み込みます
- `meta.js`: 参考 URL、観察内容、実装値、学習メモ、限界、状態
- `index.html / script.js`: 共通のデモ枠と接続。`node scripts/motion/scaffold-demo.mjs ui-gallery/<category>/<slug>` で生成できます

必要に応じて `ui-gallery/_motion/demo-helpers.js` も移植してください。画面内の Source code に同じヘルパーも掲載しています。ページ枠全体をコピーする必要はありません。

すべてのリスナー・描画ループ・遅延処理・Observer は、Reset または破棄時に解除する設計です。Swup の画面差し替え時にも共通シェルが破棄を呼びます。スクロール系は独立したスクロール領域を使用し、ページ全体のホイールを横取りしません。

新しい部品は、上の5カテゴリー内で `meta.js` と `index.html` を作ると通常ビルド・共有ビルドへ登録されます。Motion Archive の既存作品や、非公開の Motion Guide / Easings は変更していません。

## 確認する

`node scripts/motion/validate-metadata.mjs` でファイル構成・出典・必須メモを確認します。

`npm run build` と `npm run build:share` で通常版・単体共有版を生成します。

ブラウザの共通確認は、別ターミナルで開発サーバーを起動し、`npm run verify:ui-motion` を実行します。初回は Playwright の Chromium が必要です。プレビューサーバーを使う場合は `UI_TEST_BASE_URL=http://127.0.0.1:4173 npm run verify:ui-motion` を使います。

このスクリプトは、各ページの読み込み、繰り返し再生、Reset、動きを控える設定、ソース切り替え、320px / 390px 幅、カテゴリーフィルター、Swup の往復、axe の指摘を記録します。操作固有の品質と原作への忠実度は、実際に触ったレビューも併せて判断してください。結果は Git 対象外の `.ui-motion-qa/` に出力します。

ユーザー確認後、該当 `meta.js` の `status` を空にするとページと一覧の WIP バッジを外せます。
