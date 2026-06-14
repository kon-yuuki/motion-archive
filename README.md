# Motion & UI

Web モーション実験と UI パーツギャラリーをまとめる公開アーカイブです。

## Pages

- `/` - Motion Archive と UI Gallery を選ぶサイトトップ
- `/motion-archive/` - Motion Archive のトップページと全作品一覧
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

## Request New Demos

追加したいdemoの参考URLと対象箇所は [`demo-requests/request.md`](demo-requests/request.md) に追記します。
参考動画、スクショ、GIFは [`demo-requests/assets/`](demo-requests/assets/) に置きます。
複数demoをまとめて依頼して問題ありません。依頼は上から順番に実装します。
実装時は動画や画像だけを参考にせず、必ず参考URLの実サイトを確認します。
動画、GIF、スクショは「どの部分を実装するか」を特定するための補助資料として扱います。

最小限この2点だけで進められます。

```md
### Demo名 または 仮名
- 参考URL:
- 対象箇所:
- Status: WIP
```

実装後も、依頼者が明確にOKを出すまでは完成扱いにしません。
OK前のdemoにはページやカード上で `WIP` チップを付け、OK後に外します。
判断に迷う場合は `WIP` のままにします。

詳しい書き方と例は [`demo-requests/README.md`](demo-requests/README.md) を参照してください。

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
node --check src/scripts/categories-page.js
node --check src/scripts/ui.js
```

一覧用サムネイルを更新する場合:

```sh
npm run dev
npm run thumbnails:generate
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

### Standalone Demo Deployment

Xなどで作品やUIギャラリー単体ページを共有する場合は、通常サイトとは別のVercelプロジェクト
`yuuki-kons-projects/motion-demos`へ単独デモをデプロイします。
このプロジェクトはリポジトリ内の別ディレクトリではなく、Vercel側の別プロジェクトです。
作品ページの共有版にはサイトヘッダー、Infoモーダル、一覧へ戻る導線は含まれません。

- Production: [https://motion-demos-psi.vercel.app](https://motion-demos-psi.vercel.app)
- Project: `yuuki-kons-projects/motion-demos`
- Build Command: `npm run build:share`
- Output Directory: `dist-share`

```sh
npm run build:share
```

全作品とUIギャラリーの個別ページが`dist-share/`へ生成されます。`motion-demos`側のVercel Git連携が有効な場合は、
`main`へのpushでこのビルドが実行されて公開されます。リポジトリ内の`.vercel/`は通常サイト
`motion-archive`にリンクされているため、CLIで共有用デモをデプロイする場合はプロジェクト名を明示します。

```text
https://motion-demos-psi.vercel.app/fluid-image/
https://motion-demos-psi.vercel.app/image-wipe-grid/
https://motion-demos-psi.vercel.app/ui-gallery/buttons/
https://motion-demos-psi.vercel.app/ui-gallery/tooltip-behavior/
https://motion-demos-psi.vercel.app/ui-gallery/typography/
```

ローカル確認用に1ページだけ生成することもできます。

```sh
npm run build:share -- image-wipe-grid
npm run build:share -- ui-gallery/typography
```

この状態で本番デプロイすると、そのページだけの`dist-share/`を公開することになります。
全ページを公開する通常運用では、slug指定なしで`npm run build:share`を実行します。

手動で本番デプロイする場合:

```sh
npx vercel deploy . \
  --project motion-demos \
  --scope yuuki-kons-projects \
  --prod \
  --yes
```

## References

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [Vercel Docs: Vite on Vercel](https://vercel.com/docs/frameworks/vite)
