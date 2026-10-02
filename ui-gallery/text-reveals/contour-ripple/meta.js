export const metadata = {
  slug: "contour-ripple",
  category: "text-reveals",
  title: "Contour ripple",
  subtitle: "線でできた文字を、局所的にゆがめる",
  description:
    "細かな水平線の集まりが文字の地形をつくり、ポインターの近くだけが波打つ。文字全体を動かさず、触れた場所の輪郭へ反応を加えるスタディです。",
  trigger: "Pointer / keyboard / range",
  duration: "追従 約90ms・静止すると停止",
  easing: "Local height field / exponential settle",
  status: "WIP",
  source: {
    name: "DICH™ Fashion",
    url: "https://dich-fashion.webflow.io/",
    awardUrl: "https://www.awwwards.com/sites/dichtm-fashion",
    awardDate: "2025-06-09",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/webgl-text-dichtm-fashion",
    location: "水平の輪郭線で描かれた大きな文字のポインター反応",
    observation:
      "公式映像では、細かな水平線が文字の輪郭を地形のように表していました。ポインターの周囲で線が局所的に盛り上がり、通り過ぎると落ち着く様子を確認しました。",
    evidence: ["公式記録映像の開始・途中・静止後のフレームを比較して確認。"],
  },
  takeaways: [
    "文字を平面の塗りではなく、線の高低差として表すと、触れた場所のゆがみが文字の輪郭まで伝わります。",
    "ポインターから離れた場所は動かさないことで、局所的な反応がはっきり見えます。",
    "離れた後は基準の形へ戻し、動かしていない間は描画を止めます。",
  ],
  usability: {
    benefit:
      "短い装飾用の文字に、触れて確かめる質感を加えられます。全体の位置を保つので、操作に反応した場所を追いやすくなります。",
    caution:
      "細い線とゆがみは本文には向きません。情報を読むための文章は通常のHTMLで残し、重要な意味をこの表現だけに任せません。",
    smallScreen:
      "文字領域をTabで選択して矢印キーで移動できます。タップと位置スライダーでも波紋を指定できます。縦スクロールを止めません。",
    reducedMotion:
      "追従の補間とReplayの移動を省き、指定した場所の形へ直ちに切り替えます。",
  },
  implementation: [
    "独自のFLOWという文字をオフスクリーンCanvasへ描き、そのアルファ値を高さとして使います。",
    "水平線を5px間隔でサンプリングし、文字の高さ場とポインター付近の局所波形を足して、線のY座標を変えます。",
    "原作のWebGLを複製せず、Canvas 2Dの線で近似しています。線の密度、波形、振幅はこのデモの調整値です。1回のstrokeへまとめ、ソフトウェア描画でも過度に重くならないようにしています。",
    "ポインターが静止して変化が落ち着いたら描画を止めます。画面サイズ変更と破棄時には描画面・Observerを更新または解除します。",
  ],
  xPost:
    "文字を、水平線でできた地形として描く。触れた場所だけが波打ち、離れると戻る。全体を動かさずに質感を見せる、局所的な文字モーション。",
  limitations: [
    "Awwwardsの公式記録映像を観察した独立実装です。元サイトの現在の操作や実装コードを検証したものではありません。",
    "原作の書体・ブランド名・背景・コードは使用していません。独自の短い文章と描画へ置き換えています。",
    "文字を地形として見せる仕組みをCanvasで近似しています。原作のWebGLシェーダーや波形を再現したものではありません。",
  ],
};
