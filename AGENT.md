# AGENT.md — Motion Archive

Web モーションとUIパーツを公開するアーカイブサイト。Vite + Vanilla JS (ESM) + SCSS のみで構築したマルチページアプリ。React・TS・CSS-in-JS なし。

Production: https://motion-archive-mu.vercel.app  
Deploy: `npx vercel --prod --yes`（Vercel が `npm run build` を実行、`dist/` を公開）

---

## ページ構成

| パス | ファイル | 説明 |
|---|---|---|
| `/` | `index.html` | サイトトップ（Motion Archive / UI Gallery の選択） |
| `/motion-archive/` | `motion-archive/index.html` | Motion Archive トップ・最新作品 |
| `/works/` | `works/index.html` | 全作品一覧 |
| `/categories/` | `categories/index.html` | 技術別・表現別カテゴリ |
| `/works/<slug>/` | `works/<slug>/index.html` | 個別実験ページ（フルスクリーン） |
| `/ui-gallery/` | `ui-gallery/index.html` | UI パーツギャラリー目次 |
| `/ui-gallery/<component>/` | `ui-gallery/<component>/index.html` | UI コンポーネントギャラリー |

すべてのページは `vite.config.js` の `build.rollupOptions.input` に登録する必要がある。新ページを追加したら必ず登録すること。

---

## データ

**`src/data/works.js`** — 作品メタデータの唯一の情報源。

```js
{
  slug: "css-pie-chart",   // works/<slug>/ のディレクトリ名と一致させる
  title: "CSS Pie Chart",
  date: "2026.06.07",      // YYYY.MM.DD
  description: "...",      // 日本語
  techniques: ["CSS"],     // 使用技術（カテゴリ taxonomy）
  expressions: ["Transition"], // 表現種別（カテゴリ taxonomy）
  thumbnail: import,       // 省略可（省略時はサムネイルなし）
  status: "WIP",           // 省略可（バッジ表示）
  reference: { label, url } // 参考リンク
}
```

**カテゴリ taxonomy**（`src/data/works.js` の `categories` に定義）:
- techniques: `CSS`, `JavaScript`, `SVG`, `Canvas`
- expressions: `Text`, `Hover`, `Loading`, `Background`, `Scroll`, `Transition`, `Image`

---

## スクリプト・スタイル構成

```
src/
  data/works.js          # 作品メタデータ（唯一の情報源）
  scripts/
    ui.js                # workRow(), tags(), statusBadge() — 共通HTML生成
    home.js              # motion-archive/ のリスト描画
    works-page.js        # works/ の全一覧描画
    categories-page.js   # categories/ の描画
  styles/
    global.scss          # フォント・ベースリセット
    base.scss            # 共通レイアウト・コンポーネント（@use global）
    site-index.scss      # サイトトップ専用スタイル
  shared/
    head.html            # 全ページ共通 <head> インジェクション（Vite プラグイン経由）

works/
  _shared/
    detail-shell.js      # 実験ページ共通JS（Info パネル・Tech Memo・Replay ボタン）
    detail-shell.scss    # 実験ページ共通外枠スタイル
  <slug>/
    index.html
    script.js
    style.scss
```

---

## 重要な規約

### CSS は `<head>` で読み込む（JS import 禁止）
実験ページでは `import './style.scss'` を書かない。`<head>` の `<link rel="stylesheet">` で読み込む。JS module からの CSS import は FOUC（スタイルなしの一瞬）が発生するため。

### 実験ページの構造
各 `works/<slug>/index.html` は以下のパターンに従う:
- `<head>` に `../_shared/detail-shell.scss` と `./style.scss` を `<link>` で読み込む
- `<main class="experiment-stage" data-stage>` — 実験コンテンツ
- `<aside class="experiment-meta" data-details>` — Info パネル（右サイドに展開）
- `<section class="tech-note" data-tech-note ...>` — Technical memo モーダル（任意）
- `<script type="module" src="./script.js">` — 実験固有ロジック

`works/_shared/detail-shell.js` が `[data-details-toggle]`・`[data-tech-note-toggle]`・`[data-tech-note-close]` の挙動を担うため、`script.js` は `import '../../works/_shared/detail-shell.js'` するか、またはグローバルスクリプトとして HTML に追加する。

### カラーパレット（`src/styles/base.scss`）
```scss
$black: #121313;
$muted: #777772;
$line:  #deddd7;
$paper: #f6f5f0;
$white: #fffefa;
```

---

## 新しい実験を追加する手順

1. `src/data/works.js` に作品オブジェクトを追加（配列の先頭 = 最新）
2. `works/<slug>/` を作成し `index.html`・`script.js`・`style.scss` を追加
3. `vite.config.js` の `build.rollupOptions.input` に `"<slug>": resolve(__dirname, "works/<slug>/index.html")` を追加
4. `index.html` の `<head>` は `../_shared/detail-shell.scss` → `./style.scss` の順で読み込む

---

## 開発・確認コマンド

```sh
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド（dist/ に出力）
npm run preview   # ビルド結果の確認

# 公開前チェック（必須）
npm run build
node --check works/<slug>/script.js

# 共通スクリプトを変更した場合も確認
node --check src/scripts/home.js
node --check src/scripts/works-page.js
node --check src/scripts/categories-page.js
node --check src/scripts/ui.js
```

---

## デプロイ

Vercel プロジェクト `yuuki-kons-projects/motion-archive` にデプロイする。`.vercel/` がリポジトリにリンク済み。

```sh
npx vercel --prod --yes
# readyState: "READY" が出れば完了
curl -I https://motion-archive-mu.vercel.app  # HTTP/2 200 を確認
```

GitHub Actions (`deploy.yml`) は GitHub Pages へのデプロイ設定（現在は Vercel が本番）。
