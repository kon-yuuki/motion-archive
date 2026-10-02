export const metadata = {
  slug: "underlapping-footer",
  category: "section-transitions",
  title: "Underlapping footer",
  subtitle: "ページの下に、次の場面を隠す",
  description:
    "手前の明るいセクションが上へ抜けると、その下に待っていた暗いフッターが現れる。前後のレイヤー差で、ページの終わりを印象づけるデモです。",
  trigger: "Scroll / reveal slider",
  duration: "約1画面のスクロールに連動",
  easing: "Continuous progress / Replay: cubic-out",
  status: "WIP",
  source: {
    name: "Exo Ape",
    url: "https://www.exoape.com/",
    awardUrl: "https://www.awwwards.com/sites/exo-ape",
    awardDate: "2022-05-23",
    observedAt: "2026-10-02",
    location:
      "Homepage boundary from Spread the News to the dark Our Story footer",
    observation:
      "ページの下部では暗いフッターが大きく見えます。上へ戻すと、白い前のセクションがその上を覆い、Our Story の文字が境界で切り取られる様子を確認しました。",
    observationMode: "live interaction",
    evidence: [
      "Scroll upward one page at approximately (851,437), then observe the boundary.",
    ],
  },
  takeaways: [
    "次の場面を下に置いておくと、ページをめくるような奥行きを作れます。",
    "手前と奥の移動量を変え、境界の向こうに別の空間があるように見せます。",
    "色の違いと見出しの位置でも境界を伝えるので、動きが少なくても構造が残ります。",
  ],
  limitations: [
    "2026年10月の公開画面を観察しています。受賞時のバージョンと同一とは確認していません。",
    "画像・文章は独自のプレースホルダーです。サイトのコード、写真、ロゴは複製していません。",
    "表示面を独立したデモ領域へ置き換えています。動きの距離や時間は、このデモ用の調整値です。",
  ],
  usability: {
    benefit:
      "コンテンツの区切りと次の行動を、面の重なりで自然につなげられます。フッターが現れる過程で、ページの終わりだと伝わります。",
    caution:
      "隠れているリンクへフォーカスが入ると迷いやすくなります。このデモの奥面は読むための内容だけにし、実サイトで操作部品を置くときは見えるタイミングと操作可能状態を同期してください。",
    smallScreen:
      "縦スクロールと進み具合スライダーに対応します。デモ領域をTabで選んだ後、上下キーでも進めます。狭い幅では奥の画像と文字を小さく調整します。",
    reducedMotion:
      "奥の場面の追加パララックスを止め、通常のスクロールで面が現れる構成を残します。",
  },
  implementation: [
    "奥の表示面をstickyにし、同じ高さの負のmarginで手前の面と重ねます。手前にはz-indexを付け、読み順は自然なDOM順に保ちます。",
    "手前の面が移動する間、奥の内容のtranslateYを-22%から0%へ連動させます。原作の速度比を計測した値ではありません。",
    "スクロール領域はページから独立し、overscroll-behaviorで不要な連鎖を控えます。スクロールバーとキーボード操作を残します。",
    "Replayやrange入力も同じ描画関数を通ります。連続再生・Reset・ページ離脱時に描画ループを止めます。",
  ],
  xPost:
    "フッターをページの下へ置く。手前の面が抜けると、待っていた次の場面が現れる。奥の移動を少し遅らせるだけで生まれる、セクション切り替えの奥行き。",
};
