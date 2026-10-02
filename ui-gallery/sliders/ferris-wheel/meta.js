export const metadata = {
  slug: "ferris-wheel",
  category: "sliders",
  title: "Ferris-wheel gallery",
  subtitle: "一枚の絵から、縦に回る作品の列へ",
  description:
    "広い一枚の絵が細い作品の列に縮まり、縦の輪を回って次の絵へ。選び終わると再び大きく見せる、ギャラリーの切り替えデモです。",
  trigger: "Arrows / scrubber / swipe / keyboard",
  duration: "900ms / このデモの調整値",
  easing: "Smoothstep rotation + sine compression",
  takeaways: [
    "見るときは大きく、選ぶときは複数を見せる。ひとつの表示領域に二つの役割を持たせられます。",
    "前後の絵を上下に少し見せると、作品の順序が伝わります。",
    "周囲のタイトルと操作部を固定すると、絵が大きく動いても操作する場所を見失いにくくなります。",
  ],
  limitations: [
    "Awwwards公式の要素紹介動画の再生を観察しました。元サイトのスクラバーを直接操作した記録ではありません。",
    "原作の曲面や内部実装は取得せず、CSS 3Dの平面を縦の円周に並べた近似です。",
    "原作の絵画・作家名・ロゴを使わず、独自の抽象画に置き換えています。",
    "900ms、縮小幅、角度、半径はこのデモの調整値です。元サイトの正確な値は未計測です。",
    "録画と受賞時のサイトが完全に同じ版か、タッチやキーボードで同じ挙動かは確認していません。",
  ],
  usability: {
    benefit:
      "作品が切り替わる途中に前後関係を見せ、止まったら大きな絵へ戻します。現在位置は常に数字で確認できます。",
    caution:
      "回転し続けると作品を見づらくなります。自動再生はせず、選択のたびに短く回して止めます。",
    smallScreen:
      "前後ボタンと位置バーを常設します。左右スワイプ、左右・上下キー、Home・Endでも選べ、縦スクロールを奪いません。",
    reducedMotion:
      "縮小と3D回転を省き、選んだ作品を広い状態で表示します。作品名と数字は同時に更新します。",
  },
  implementation: [
    "カードをgridの同じセルへ重ね、sin/cosで縦方向と奥行きの位置を計算します。rotateXで上下の絵を短く見せます。",
    "最初にカード幅を縮め、中央の時間帯で作品位置を送り、最後に広い画像へ戻します。",
    "途中に新しい選択が来たら、現在の位置と縮小量から最新の目的位置へ向かいます。アニメーションを待ち行列に入れません。",
    "変更は単一のrequestAnimationFrameで描画し、Reset、再操作、破棄、動きを控える設定で停止します。",
  ],
  xPost:
    "見るときは一枚を大きく、選ぶときは縦の作品の列に。縮む・回る・広がるを一つにつないだ、ギャラリー切り替えの実装メモ。",
  status: "WIP",
  source: {
    name: "De Maldè - Canvas Chronicles",
    url: "https://giannantoniodemalde.com/",
    awardUrl: "https://www.awwwards.com/sites/de-malde-canvas-chronicles",
    awardDate: "2025-04-13",
    observedAt: "2026-10-02",
    location: "Project gallery with numeric scrubber",
    observation:
      "The broad focused image contracts into a narrow vertical, curved stack of several artworks. The artwork strips roll vertically like a drum/Ferris wheel, with top and bottom strips foreshortened. The current project name and numeric position change while the outer title/action layout stays in place.",
    observationMode: "official recording observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/ferris-wheel-slider-de-malde-canvas-chronicles",
    evidence: [
      "Observed official recording playback, including a recorded cursor over the bottom scrubber; direct live-site input is not claimed.",
      "Browser tab 23 screenshots 15:17:20 UTC (large Conversazioni artwork), 15:17:37 UTC (narrow curved vertical stack) and 15:19:33 UTC (different stack/title)",
      "Recording duration 16s, verified through read-only video DOM; no exact source transition duration measured",
      "Award tab 10 heading Apr 13, 2025 verified 15:17:37 UTC",
    ],
  },
};
