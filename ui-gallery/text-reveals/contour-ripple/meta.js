export const metadata = {
  slug: "contour-ripple",
  category: "text-reveals",
  title: "Contour ripple",
  subtitle: "線でできた文字を、局所的にゆがめる",
  description:
    "DICHの記録に合わせ、黒い技術的な画面の中央へ約60本の細い水平線と広いDICHの字形を配置。ポインター近くの線だけを二次元の折れとして動かします。",
  trigger: "Pointer / keyboard / touch（追加）",
  duration: "追従100ms（estimated / 推定）",
  easing: "Localized 2D fold / exponential settle",
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
      "記録の画面比率を保って縮小します。外側のReplay/Reset、Tabからのキーボード操作を残しています。これらはデモに追加した支援で、原作の動作保証ではありません。",
    reducedMotion:
      "追従の補間とReplayの移動を省き、指定した場所の形へ直ちに切り替えます。",
  },
  implementation: [
    "記録の左端の線ピークを測り、60本を採用。以前の本数が違っていたとは断定していません。",
    "DICHの外形を独立したPath2Dで再構成。元の文字画像・専用フォント・原作のシェーダーは同梱していません。",
    "字形の高さ場と、ポインター周囲の二次元変位を分離しました。背景の全幅を揺らす固定正弦波は使いません。",
    "中央の低コントラストな線・黒画面・黄色の小さなアクセントを戻し、追加のrangeや説明は画面内から除きました。",
    "公開サイトのBOTTOM画面にも到達し、見えるレイアウトとcanvasを確認。細かな入力追従は記録を基準にしています。",
  ],
  xPost:
    "文字を、水平線でできた地形として描く。触れた場所だけが波打ち、離れると戻る。全体を動かさずに質感を見せる、局所的な文字モーション。",
  limitations: [
    "中央のDICH外形と見出しの幾何学的な文字は手描きの近似。原作のT 012書体は取得・同梱していません。",
    "局所的な折れの向き・半径・速度応答は推定で、元のWebGLと同じ計算ではありません。途中画像にも差が残ります。",
    "原作の送信フォームや音声・メニューは対象外。描かれた外周UIは構図の参考表示です。キーボード等の追加操作は原作観察の主張ではありません。",
  ],
  timingDisclosure:
    "measured: 記録1600×1200、線場x362〜1235/y358〜838、左端の線ピーク60本、平均間隔約8.14px。estimated: 字形輪郭・半径106px・追従100ms。unknown: 原作のWebGL頂点変位式と減衰。",
};
