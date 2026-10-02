export const metadata = {
  slug: "free-drag-rail",
  category: "sliders",
  title: "Free-drag rail",
  subtitle: "大きさの違うカードを、ひと続きに",
  description:
    "高さの違うカードを一本のレールに並べ、ドラッグで自由に送る。隣のカードを少し見せて、続きがあることを伝えるデモです。",
  trigger: "Drag / swipe / arrows / keyboard",
  duration: "追従は直接・慣性は減衰",
  easing: "Release: velocity decay",
  status: "WIP",
  source: {
    name: "REJOUICE®",
    url: "https://www.rejouice.com/",
    awardUrl: "https://www.awwwards.com/sites/rejouice-r-3",
    awardDate: "2025-02-06",
    observedAt: "2026-10-02",
    location: "Homepage, Rejouice at a Glance, below client logos",
    observation:
      "Rejouice at a Glance のカード列を左へドラッグすると、カードごとの高さと間隔を保ったまま列全体が横へ移動しました。カードは画面端で切り抜かれ、次のカードが右から見えてきます。",
    observationMode: "live interaction",
    evidence: [
      "Pointer drag from approximately (705,389) to (260,389) across the card row in a 1180x757 viewport.",
    ],
  },
  takeaways: [
    "カードごとに高さを変えても、中心線をそろえると一つの流れとして読めます。",
    "端を少し見切らせると、横に続くコンテンツがあることを伝えられます。",
    "ドラッグ後の余韻は短くし、止めたいときは次の操作で止まります。",
  ],
  limitations: [
    "2026年10月の公開画面を観察しています。受賞時のバージョンと同一とは確認していません。",
    "画像・文章は独自のプレースホルダーです。サイトのコード、写真、ロゴは複製していません。",
    "表示面を独立したデモ領域へ置き換えています。動きの距離や時間は、このデモ用の調整値です。",
  ],
  usability: {
    benefit:
      "一覧から離れず、興味のある情報へ横移動できます。位置表示と矢印を添えることで、ドラッグに気づかなくても操作を続けられます。",
    caution:
      "ドラッグだけにすると操作に気づきにくくなります。移動量を画面端で止め、縦スクロールの意図が見えたら横ドラッグを始めません。",
    smallScreen:
      "タップ用の前後ボタン、左右キー、Home・Endに対応しています。カード内にリンクを足す場合は、ドラッグとクリックの判定を分けてください。",
    reducedMotion:
      "リリース後の慣性と矢印移動の滑らかなスクロールを省きます。横移動と位置表示は残します。",
  },
  implementation: [
    "native overflow-xの上にポインタードラッグを重ね、キーボードやスクロールバーの基本動作を残します。",
    "横方向へ6px以上動いた時点でポインターを捕捉します。上下の移動が優先されるときは横ドラッグを中止します。",
    "速度は最後の移動から更新し、リリース後は減衰させます。画面端に着くか速度が小さくなるとrequestAnimationFrameを止めます。",
    "ResizeObserverでカード位置と両端ボタンを再計算します。破棄時に描画ループ、遅延処理、Observerを解除します。",
  ],
  xPost:
    "高さの違うカードを、一本のレールで送る。隣のカードを少し見せると、続きがあると伝わる。ドラッグだけでなく矢印とキーボードも用意した、横スライダーの実装メモ。",
};
