export const metadata = {
  slug: "checker-dissolve",
  category: "buttons",
  title: "Checker dissolve",
  subtitle: "小さな四角で、面を切り替える",
  description:
    "カプセル形のボタンの色が、小さな四角の列を通して切り替わります。輪郭とラベルは固定し、背景の変化だけで手応えを作るデモです。",
  trigger: "Hover / focus / tap",
  duration: "約500ms",
  easing: "セルごとの短い切り替え + 時差",
  status: "WIP",
  source: {
    name: "Noomo Agency",
    url: "https://noomoagency.com/",
    awardUrl: "https://www.awwwards.com/sites/noomo-agency",
    awardDate: "2023-09-21",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/button-hover-interaction-noomo-agency",
    location:
      "公式の記録映像にある Space Needle の事例カード、View Project ボタン",
    observation:
      "8.938秒の記録映像をブラウザーで確認。カーソルが重なると黒いカプセルが淡い面へ変わり、戻る途中には、黒と淡色の小さな四角が交互に並ぶ境界が左側に見られました。",
    evidence: [
      "Awwwards の Button Hover Interaction - Noomo Agency に掲載された映像の初期・ホバー・退出途中を比較。",
    ],
  },
  takeaways: [
    "輪郭を変えずに背景だけを細かく切り替えると、普通の色変更とは違う手応えを作れます。",
    "変化をボタンの中に閉じ込めることで、近くの情報を邪魔しません。",
    "四角の数と切り替え順は少なく整理し、細かい装飾が長く続かないようにします。",
  ],
  limitations: [
    "これは公式の記録映像を観察した再構成です。現行ライブサイトは読み込み画面で止まり、実際のホバー操作を検証できていません。",
    "格子の作り方、約500ms の長さ、セル数はこのデモの独自実装です。元の描画方式や正確な値は不明です。",
    "参照元の画像・文章・コードは使用していません。フォーカスとタップの選択状態は、使いやすさを確かめるために追加しています。",
  ],
  usability: {
    benefit:
      "固定したボタンの中で色が変わるため、押す場所がずれず、触れたことだけがはっきり伝わります。",
    caution:
      "よくある『細かな点滅をずっと続ける』表現は読み取りを邪魔します。ここでは一度の短い切り替えで止め、重要な情報は格子に入れません。",
    smallScreen:
      "タップで選択を切り替えます。キーボードではフォーカスで色が変わり、Enter・Space で選択できます。",
    reducedMotion:
      "格子の時差をなくし、背景色をすぐ切り替えます。選択状態の文章は変わらず表示します。",
  },
  implementation: [
    "淡色の背景に黒いセルを重ね、セルの opacity を切り替えます。装飾レイヤーは aria-hidden と pointer-events: none で操作から外します。",
    "列位置と偶奇から遅延を決め、小さなチェック柄の境界を作ります。ランダム値や連続した描画ループは使いません。",
    "ラベルは分割せず、固定レイヤーとして最前面に置きます。Replay・Reset・破棄時はタイマーとイベントを解除します。",
  ],
  xPost:
    "ボタンの輪郭はそのまま、色だけを小さな四角で切り替える。派手な反応も短く止めて、ラベルと操作位置は動かさない。公式の記録映像から学ぶカプセルボタンの再構成。",
};
