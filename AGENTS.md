# AGENTS.md - UI Gallery Content Guide

このリポジトリは Vite + Vanilla JS (ESM) + SCSS で構築された Motion & UI サイトです。
この文書の方針は **UI Gallery (`ui-gallery/`) のUI挙動デモ** を対象にします。Motion Archive (`works/`) の表現実験には、明示されない限り適用しません。

既存の全体構成、ページ追加手順、デプロイ情報は [AGENT.md](./AGENT.md) と [README.md](./README.md) も確認してください。

## このサイトの目的

UI Gallery では、Web UI の小さな「使いやすさ」や「ふるまい」を動くデモで検証します。

見た目のかっこよさだけではなく、ユーザーが操作したときに以下を満たすかを説明してください。

- 迷わない
- 邪魔にならない
- 読める
- 破綻しない
- 状態変化が伝わる
- 気持ちよく操作できる

デモは「動いてすごい」で終わらせず、ユーザー体験として何が良くなるのかまで説明します。

## UIデモ作成時の方針

- 悪い例と改善例を比較し、挙動の差が体験にどう影響するかを見せる。
- デザイナーにもエンジニアにも伝わる言葉で説明する。
- まず日常的な言葉で説明し、専門用語は必要な場合だけ実装メモや補足に回す。
- アクセシビリティは土台として扱うが、発信では専門用語を前面に出しすぎない。
- スマホ、狭い画面、画面端、キーボード操作、状態変化を確認する。
- 既存のページ構成、コンポーネント、スタイルの粒度を尊重する。
- 不要な大規模リファクタリングをしない。

## 文体・説明方針

日本語で、結論ははっきり書きます。ただし断定しすぎず、「これはダメ」より「こうすると使いやすくなる」という言い方を優先します。

優先する言葉:

- 使いやすい
- 迷わない
- 邪魔しない
- 読める位置に出す
- 押した後が伝わる
- 操作中に破綻しない
- 気持ちいい

避ける言い方:

- この実装はアクセシビリティ的にダメ
- hover依存はNG
- ariaが足りない
- これはUXが悪い

好ましい言い方:

- hoverだけに頼ると、スマホやキーボード操作で伝わりにくい。
- 読もうとした瞬間に消えるので、少しストレスになりやすい。
- 見た目では伝わっていても、実装上は説明との関係が曖昧になりやすい。
- 重要な情報なら、隠しすぎず本文側に出した方が安全。

## デモページに含めるべき要素

UI Gallery の新規デモでは、できるだけ以下を含めます。

1. 何を検証するデモか
2. よくある使いにくい挙動
3. 改善した挙動
4. なぜ使いやすくなるのか
5. 実装時に見るべきポイント
6. スマホや狭い画面での注意点
7. X投稿用の短い説明文

ページ上の本文、補足、実装メモの役割を分けてください。専門用語は本文の先頭に置かず、必要なら実装メモに書きます。

## 実装時の注意

- UI Gallery は `ui-gallery/<component>/` に `index.html`、`script.js`、`style.scss` をまとめる。
- 新しい UI Gallery ページは `src/data/ui-gallery.js` に登録する。
- 新しい HTML エントリは `vite.config.js` の `build.rollupOptions.input` に登録する。
- CSS は既存ページの読み込み方に合わせる。
- 既存の `src/styles/`、`src/scripts/`、`src/shared/head.html` の役割を尊重する。
- 共通化は、重複が明確に増えた場合だけ検討する。
- Motion Archive (`works/`) 側のデモや共通シェルは、依頼がない限り変更しない。

## 開発・確認コマンド

`package.json` で確認済みのスクリプト:

```sh
npm run dev
npm run build
npm run build:share
npm run images:optimize
npm run og:generate
npm run thumbnails:generate
npm run preview
npm run video:edge-collision
npm run video:hover-intent
npm run video:pie-chart
npm run video:typography-gui
```

`lint` と `test` の npm script は現在ありません。存在しないコマンドを推測で書かないでください。

公開前の最低限の確認:

```sh
npm run build
node --check ui-gallery/<component>/script.js
```

共通スクリプトを触った場合は、対象ファイルにも `node --check` を実行してください。

