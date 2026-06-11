# X 発信用動画の撮影手順

Playwright で作品ページを操作し、カーソル移動、注目箇所へのズーム、字幕表示を含む動画を自動撮影する。

## 関連ファイル

- `scripts/video-demo/runner.mjs`
  - 録画、カーソル表示、カメラ移動、字幕表示、MP4 変換の共通処理
- `scripts/record-css-pie-chart-full.mjs`
  - 一連の操作を見せる動画の実装例
- `scripts/record-css-pie-chart.mjs`
  - X 向け短尺動画の旧実装例
- `exports/`
  - 動画の出力先

新しい動画は `scripts/record-<slug>.mjs` として作成し、共通処理を `runner.mjs` から読み込む。

## 撮影する

依存関係をインストールする。

```sh
npm install
```

開発サーバーをポート `5174` で起動する。

```sh
npm run dev -- --port 5174
```

別のターミナルで録画スクリプトを実行する。

```sh
npm run video:pie-chart
```

成功すると `exports/css-pie-chart-full.mp4` が生成される。録画元の WebM も同じディレクトリに残る。

## 録画スクリプトの基本形

```js
import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const demo = await createDemo({
  url: "http://127.0.0.1:5174/works/<slug>/",
  output: "exports/<slug>.webm",
  viewport: { width: 1980, height: 1114 },
  stageSelector: ".experiment-stage",
  tooltipSelector: "[data-tooltip]"
});

await demo.wait(700);

await demo.moveTo(".target", {
  position: { x: 0.5, y: 0.5 },
  duration: 1200,
  zoom: 1.45,
  ja: "日本語の字幕",
  en: "English caption"
});
await demo.wait(1200);

await demo.zoomOut(900);
await demo.hideCaption();
await demo.wait(500);

const webm = await demo.finish();
await transcodeToMp4(webm, "exports/<slug>.mp4");
```

`finish()` はブラウザを閉じて録画ファイルを確定する。必ず最後に呼び、その後に `transcodeToMp4()` で X に投稿しやすい MP4 に変換する。

## カーソル移動とズーム

```js
await demo.moveTo(".pie-chart", {
  position: { x: 0.78, y: 0.38 },
  duration: 1450,
  zoom: 1.48,
  ja: "ホバーで項目の詳細を確認",
  en: "Hover an item to inspect its details"
});
```

`moveTo(target, options)` の指定:

| 項目 | 説明 |
|---|---|
| `target` | CSS セレクター、または Playwright の Locator |
| `position` | 対象要素内の位置。左上が `{ x: 0, y: 0 }`、中央が `{ x: 0.5, y: 0.5 }` |
| `duration` | カーソルとカメラの移動時間（ミリ秒） |
| `zoom` | 移動先を中心にした拡大率。等倍は `1` |
| `ja` | 字幕の日本語メインテキスト |
| `en` | 字幕の英語サブテキスト |

`moveTo()` は対象位置までカーソルを滑らかに動かし、その位置を基準にステージを拡大する。元の表示へ戻す場合は次を使う。

```js
await demo.zoomOut(900);
```

ズーム対象は `createDemo()` の `stageSelector` で指定する。ページ全体ではなく、作品の表示領域を指定する。

## 字幕

カーソル移動を伴わず字幕だけを出す場合:

```js
await demo.caption(
  "ラベルと値をその場で編集",
  "Edit labels and values live"
);
await demo.wait(1200);
await demo.hideCaption();
```

字幕は画面下部中央に表示される。日本語を主見出し、英語を小さい補足として扱う。

字幕を付ける際の目安:

- 1字幕につき1メッセージにする
- 表示時間は最低でも `900` から `1200` ミリ秒確保する
- 操作内容を説明する短い文にする
- 最後は `hideCaption()` を呼んでから録画を終了する

字幕の見た目を変更する場合は、`runner.mjs` 内の `.demo-caption` を編集する。

## ページを操作する

`createDemo()` が返す `page` は Playwright の Page オブジェクトである。

```js
const { page } = demo;

await page.locator('[data-field="label"]').first().fill("Design");
await page.locator('[data-field="value"]').first().fill("52");
await demo.wait(500);
```

通常の Playwright API でクリック、入力、ホバー、JavaScript 実行ができる。

```js
await page.locator("[data-replay]").click();

await page.evaluate(() => {
  document.querySelector("#bar-view")?.click();
});
```

操作直後は変化が認識できるように `demo.wait()` を入れる。

## ツールチップ

カーソルに追従するツールチップがある場合、`tooltipSelector` を指定する。

```js
const demo = await createDemo({
  url: "http://127.0.0.1:5174/works/<slug>/",
  output: "exports/<slug>.webm",
  stageSelector: ".experiment-stage",
  tooltipSelector: "[data-chart-tooltip]"
});
```

指定したツールチップは `body` 直下へ移され、録画用カーソルの近くに表示される。ツールチップがない作品では省略する。

## 新しい作品用のコマンドを追加する

`package.json` の `scripts` に録画コマンドを追加する。

```json
{
  "scripts": {
    "video:<slug>": "node scripts/record-<slug>.mjs"
  }
}
```

実行:

```sh
npm run video:<slug>
```

## 撮影前チェック

- 開発サーバーが `http://127.0.0.1:5174` で開く
- `url` が撮影対象の作品ページを指している
- `stageSelector` が作品の表示領域を指している
- `moveTo()` の対象セレクターが存在する
- 字幕が操作対象を隠していない
- 操作の前後に適切な `wait()` がある
- 最後に `finish()` と `transcodeToMp4()` を呼んでいる
- 生成された MP4 を再生し、冒頭、字幕、ズーム、末尾を確認する

