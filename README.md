# Motion & UI

Web モーション実験と UI パーツギャラリーをまとめる公開アーカイブです。

## Pages

- `/` - Motion Archive と UI Gallery を選ぶサイトトップ
- `/motion-archive/` - Motion Archive のトップページと最新作品
- `/works/` - 全作品一覧
- `/categories/` - 技術別・表現別カテゴリ
- `/works/<slug>/` - 個別のフルスクリーン実験ページ
- `/ui-gallery/` - UI パーツギャラリーの目次
- `/ui-gallery/<component>/` - ボタンやスライダーなどの UI パーツギャラリー

## Development

```sh
npm install
npm run dev
```

本番ビルド:

```sh
npm run build
npm run preview
```

## Add An Experiment

1. `src/data/works.js` に作品メタデータを追加する。
2. `works/<slug>/` を作り、その中に `index.html`、`script.js`、`style.scss` をまとめて追加する。
3. 詳細ページの `<head>` で `../_shared/detail-shell.scss` と `./style.scss` を stylesheet として読み込む。
4. `script.js` からは作品固有の挙動だけを実装し、CSS は import しない。
5. `vite.config.js` の `build.rollupOptions.input` に詳細ページを追加する。

作品固有の HTML、JavaScript、SCSS は同じディレクトリに置きます。詳細ページ共通の外周ナビゲーションと情報パネルは `works/_shared/detail-shell.js` と `works/_shared/detail-shell.scss` が担い、中央の `.experiment-stage` は各作品が自由に使用できます。

CSS は JS module から import せず、HTML の `<head>` で直接読み込みます。ページ遷移直後に一瞬だけ無スタイルの HTML が見える FOUC を避けるためです。

```text
works/
  _shared/
    detail-shell.js
    detail-shell.scss
  <slug>/
    index.html
    script.js
    style.scss
```

## Add A UI Gallery Page

UI パーツをまとめて比較するページは、作品とは分けて `ui-gallery/<component>/` に追加します。

```text
ui-gallery/
  index.html
  style.scss
  buttons/
    index.html
    script.js
    style.scss
```

ページを追加したら、`vite.config.js` の `build.rollupOptions.input` にも登録します。

### Current Experiment Pattern

現在の `Latte Marble` は、1枚の非表示 canvas に模様を描画し、表示用の複数カラム canvas に切り出して見せる構成です。

- 描画元: `[data-marble-canvas]`
- 表示フレーム: `[data-marble-frame]`
- 分割カラム: `[data-marble-slices]`
- GUI: `[data-controls-panel]`

カラムの表示範囲は JS 側の1本のタイムラインで制御します。中央列から外側へ `rippleGap` ぶん遅延し、`sliceDuration`、`sliceEase` などは GUI から調整できます。

## Before Publishing

公開前に最低限これを確認します。

```sh
npm run build
node --check works/<slug>/script.js
```

共通スクリプトを触った場合は、対象の JS も確認します。

```sh
node --check src/scripts/home.js
node --check src/scripts/works-page.js
node --check src/scripts/categories-page.js
node --check src/scripts/ui.js
```

## X Video Recording

X 発信用のデモ動画は Playwright で自動撮影できます。字幕、録画用カーソル、注目位置へのズーム、MP4 変換を含む手順は [`docs/x-video-recording.md`](docs/x-video-recording.md) を参照してください。

## Deployment

このサイトは Vercel で公開しています。

- Production: [https://motion-archive-mu.vercel.app](https://motion-archive-mu.vercel.app)
- Project: `yuuki-kons-projects/motion-archive`
- Build Command: `npm run build`
- Output Directory: `dist`

### First-Time Vercel Setup

初回デプロイ時は Vercel CLI がプロジェクトをリンクします。

```sh
npx vercel --prod --yes
```

このリポジトリでは Vite として検出され、`dist/` が公開対象になります。初回実行後は `.vercel/` が作成され、同じ Vercel project にリンクされます。

### Deploy Updates

公開したい変更を確認してから、本番デプロイします。

```sh
npm install
npm run build
npx vercel --prod --yes
```

Vercel 側でも `npm run build` が実行されます。CLI の出力に `readyState: "READY"` が出れば公開完了です。

### Verify Deployment

公開後は Production URL が 200 を返すことを確認します。

```sh
curl -I https://motion-archive-mu.vercel.app
```

`HTTP/2 200` が返れば最低限の公開確認は完了です。見た目を確認する場合は Production URL をブラウザで開き、トップ、一覧、カテゴリ、作品詳細の遷移を確認します。

## References

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [Vercel Docs: Vite on Vercel](https://vercel.com/docs/frameworks/vite)
