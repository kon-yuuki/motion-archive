export const metadata = {
  slug: "reel-expansion",
  category: "section-transitions",
  title: "Reel expansion",
  subtitle: "小さな窓から、画面いっぱいへ",
  description:
    "小さく切り取った画像がスクロールに合わせて広がり、左右の文字も離れていく。次の場面へ入る感覚を、画像の面積でつくるデモです。",
  trigger: "Scroll / progress slider",
  duration: "スクロール距離に連動",
  easing: "Linear progress / Replay: ease-in-out",
  status: "WIP",
  source: {
    name: "Exo Ape",
    url: "https://www.exoape.com/",
    awardUrl: "https://www.awwwards.com/sites/exo-ape",
    awardDate: "2022-05-23",
    observedAt: "2026-10-02",
    location: "Homepage, Work in motion / Play Reel, below featured projects",
    observation:
      "Work in motion / Play Reel の場面へ下向きにスクロールすると、白いページ内の映像が画面幅へ広がりました。同時に Play と Reel の文字が左右へ離れ、大きな映像の場面へつながります。",
    observationMode: "live interaction",
    evidence: ["Scroll downward into the Work in motion section."],
  },
  takeaways: [
    "画像の面積と文字の間隔を同じ進み具合で制御すると、場面転換がひとつの動きとしてまとまります。",
    "文字は画像の上に残し、画面いっぱいになっても何の場面かを見失いにくくします。",
    "上へ戻すと動きも戻るため、ユーザーのスクロール速度に合わせて確かめられます。",
  ],
  limitations: [
    "2026年10月の公開画面を観察しています。受賞時のバージョンと同一とは確認していません。",
    "画像・文章は独自のプレースホルダーです。サイトのコード、写真、ロゴは複製していません。",
    "表示面を独立したデモ領域へ置き換えています。動きの距離や時間は、このデモ用の調整値です。",
  ],
  usability: {
    benefit:
      "小さな紹介から大きな体験へ、連続した状態変化で進めます。突然別画面に変わるより、前後の関係を追いやすくなります。",
    caution:
      "画像が動く間に本文まで大きく移動すると読みにくくなります。動かす対象はメディアと短い見出しに絞り、重要な本文は次の静かな場面へ置きます。",
    smallScreen:
      "デモ内の縦スクロール、Tabで領域を選択した後の上下キー、下の進み具合スライダーで操作できます。画面全体のホイールは横取りしません。",
    reducedMotion:
      "画像の拡大と文字の横移動を省き、完成した構図を表示します。本文へ進む通常のスクロールは残します。",
  },
  implementation: [
    "position: stickyの表示面を長いrunwayの内側へ置きます。スクロール量÷可動距離を0〜1へ丸めます。",
    "画像の幅を54%から100%、高さを60%から100%へ変化させ、文字を左右33%まで移動します。値は独自の調整値です。",
    "独立したスクロール領域とrange入力は、同じ進捗を共有します。スクロール距離はResizeObserverで追従します。",
    "Replay中でもホイールやポインター操作があれば自動再生を停止します。ページ遷移時も描画ループを解除します。",
  ],
  xPost:
    "小さな画像が広がり、文字が左右へ開く。スクロールの進み具合を共有すると、複数の要素が一つの場面転換になる。画像に集中するための、セクション切り替えのスタディ。",
};
