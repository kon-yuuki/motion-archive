# Motion Archive

Vanilla JavaScript と SCSS で制作する Web アニメーション実験の公開アーカイブです。

## Pages

- `/` - トップページと最新作品
- `/works/` - 全作品一覧
- `/categories/` - 技術別・表現別カテゴリ
- `/works/<slug>/` - 個別のフルスクリーン実験ページ

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
2. `works/<slug>/index.html` と、対応する `src/scripts/`、`src/styles/` のファイルを追加する。
3. `vite.config.js` の `build.rollupOptions.input` に詳細ページを追加する。

詳細ページでは `detail-shell.js` と `detail-shell.scss` が外周ナビゲーションと情報パネルのみを担います。中央の `.experiment-stage` は各作品が自由に使用できます。

## Deployment

GitHub Pages を想定しています。GitHub リポジトリの `Settings > Pages > Build and deployment > Source` を `GitHub Actions` に設定すると、`main` ブランチへの push で `.github/workflows/deploy.yml` がビルドと公開を行います。

## References

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [GitHub Docs: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
