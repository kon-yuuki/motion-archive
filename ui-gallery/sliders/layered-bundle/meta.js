export const metadata = {
  slug: "layered-bundle",
  category: "sliders",
  title: "Layered bundle swap",
  subtitle: "変わらないベースと、重なって入れ替わる組み合わせ",
  description:
    "左のベースと中央の記号は固定したまま、右のセットと名前だけを切り替える。新旧の形が短く重なる、商品紹介の学習デモです。",
  trigger: "Previous / next / swipe / keyboard",
  duration: "760ms / このデモの調整値",
  easing: "Cubic ease-out",
  takeaways: [
    "変わらないものを固定すると、何が切り替わったかがすぐに伝わります。",
    "複数の形を一枚の画像にまとめず、少し違う角度で動かすとセット全体に奥行きが生まれます。",
    "形と名前を同じ進み具合で更新すると、違う商品の名前が残る混乱を抑えられます。",
  ],
  limitations: [
    "公開中のMore Nutritionのケーススタディサイトで、右の矢印を2回クリックし、紫と黄色の組み合わせが重なる途中の表示を確認しました。",
    "Awwwardsの紹介文では自主制作のケーススタディとされています。実際の商品販売サイトを再現するものではありません。",
    "元の商品画像・商標・商品名は使わず、独自のベクター容器と文章へ置き換えています。",
    "760ms、各パーツの距離と角度は学習デモの調整値です。元サイトの内部実装や正確な曲線は未計測です。",
    "2026年10月に観察した版と、2025年の受賞時の版が同じかは確認していません。",
  ],
  usability: {
    benefit:
      "比較に必要なベースを残したまま、変わる側に注意を向けられます。セットと名前を同時に更新して選択結果を伝えます。",
    caution:
      "旧セットが長く残ると二つを同時に選んだように見えます。重なる時間を短くし、確定した名前と番号を操作部に表示します。",
    smallScreen:
      "右側の小さな形をタップする必要はありません。前後ボタン、左右キー、Home・End、横スワイプで切り替えます。",
    reducedMotion:
      "傾き、移動、クロスフェードを省き、右のセットと名前をすぐに置き換えます。ベースはそのまま残します。",
  },
  implementation: [
    "左のベースを独立したgridの列に置き、右の候補だけを同じセルへ重ねます。",
    "右のセットを3つのSVGに分け、位置と回転量を変えて奥行きを表現します。SVGはデモ用のオリジナルです。",
    "新しい選択が入ったら、表示中の全レイヤーの透明度と移動量を保存し、そこから最新の選択へ補間します。",
    "名前も同じrequestAnimationFrameで更新します。Reset、再操作、破棄時には描画ループを止めます。",
  ],
  xPost:
    "ベースはそのまま、右の組み合わせだけが入れ替わる。新旧の形とタイトルを少し重ね、何が変わったかを伝える商品スライダーの学習メモ。",
  status: "WIP",
  source: {
    name: "More Nutrition",
    url: "https://more-nutrition.webflow.io/",
    awardUrl: "https://www.awwwards.com/sites/more-nutrition",
    awardDate: "2025-11-03",
    observedAt: "2026-10-02",
    location: "Chunky Flavour section below reviews",
    observation:
      "First click changed right-hand product pack and title to purple FUDGE BROWNIE. Second click produced a visible overlapping in-flight state: yellow VANILLA CHOC CHIP COOKIE product and title entered while the old purple product and FUDGE BROWNIE title faded/translated away. The green base product and plus sign remained fixed.",
    observationMode: "live interaction",
    evidence: [
      "Clicked the right circular arrow, then clicked it again after the first settled; captured immediate screenshot sequence.",
      "Browser tab 27 screenshots 15:20:03 UTC before, 15:20:17 UTC after first click, 15:20:30 UTC two immediate frames including translucent old/new overlapping products",
      "Award tab 10 heading Site of the Day - Nov 3, 2025 verified 15:25:28 UTC",
      "Award description explicitly calls this a self-initiated case study",
    ],
  },
};
