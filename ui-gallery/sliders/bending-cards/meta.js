export const metadata = {
  slug: "bending-cards",
  category: "sliders",
  title: "Bending cards",
  subtitle: "送る瞬間だけ、カードがしなる",
  description:
    "横に送るカードの面がしなり、別レイヤーの立体が少し遅れて傾く。止まるとまっすぐに戻る、柔らかいスライダーの学習デモです。",
  trigger: "Drag / swipe / arrows / keyboard",
  duration: "780ms / このデモの調整値",
  easing: "Cubic ease-out + sine bend",
  takeaways: [
    "カードの面と立体を分けると、画面から少しはみ出す奥行きを作れます。",
    "しなりは移動中だけに限定し、止まったあとは内容をまっすぐ読める状態に戻します。",
    "横方向の移動と傾きを結びつけると、どちらへ送っているかが伝わります。",
  ],
  limitations: [
    "Awwwards公式の要素紹介動画を観察しました。参考サイトを直接ドラッグした結果ではありません。",
    "原作のWebGLによる曲面変形を複製せず、SVGの曲線とCSSの傾きで見え方を近似しています。",
    "写真・食品の立体モデル・文章・ロゴは使わず、独自の図形へ置き換えています。",
    "録画の長さは移動時間ではありません。780ms、しなり量、カード寸法はこのデモ独自の調整値です。",
    "録画と受賞時のサイトが完全に同じ版か、スマホで同じ挙動かは確認していません。",
  ],
  usability: {
    benefit:
      "変形を移動中だけにすると、操作の手応えと止まったあとの読みやすさを両立できます。",
    caution:
      "強く傾けると内容が読みにくくなります。繰り返しの操作は前の移動を中断し、最新の目的位置へ向かいます。",
    smallScreen:
      "横スワイプのほか、前後ボタン、位置ボタン、左右キー、Home・Endに対応します。縦の動きが大きければページのスクロールを優先します。",
    reducedMotion:
      "移動としなりのアニメーションを省き、選んだカードへすぐに切り替えます。位置とタイトルの表示は残ります。",
  },
  implementation: [
    "カード背景のSVG pathと手前のオブジェクトを別レイヤーにします。背景の曲線とCSS perspectiveで軽量なしなりを作ります。",
    "ドラッグは移動量に追従し、離した位置から最も近いカードへ収束させます。",
    "矢印移動では位置をease-outで更新し、しなりをsin曲線で増やしてゼロへ戻します。原作の式ではありません。",
    "requestAnimationFrameは操作のたびに停止して再開します。ResizeObserverとポインター捕捉は破棄時に解除します。",
  ],
  xPost:
    "送る瞬間だけ、カードがしなる。背景の曲面と手前の立体を分けて、止まったらまっすぐに。ドラッグ、矢印、キーボードで試せるスライダーの学習メモ。",
  status: "WIP",
  source: {
    name: "Smooothy",
    url: "https://smooothy.federic.ooo/",
    awardUrl: "https://www.awwwards.com/sites/smooothy",
    awardDate: "2025-08-21",
    observedAt: "2026-10-02",
    location: "Homepage demonstration carousel",
    observation:
      "As the row moves horizontally, the colored panels visibly bend into bowed trapezoidal surfaces and the 3D objects tilt and overlap adjacent frames. Later the row settles with straight frames, a centered cake object and updated dot selection.",
    observationMode: "official recording observed",
    recordingUrl: "https://www.awwwards.com/inspiration/slider-smooothy",
    evidence: [
      "Observed the official autoplaying element recording through multiple browser screenshots; recorded hand cursor travels across the row. No live drag claimed.",
      "Browser tab 22 screenshots at 15:16:28, 15:16:42 and 15:17:01 UTC; latter captures pronounced bent panels",
      "DOM read-only video inspection: playback active, duration 9.716667s. This is recording length, not slider transition duration.",
      "Award browser tab 10 verified Aug 21, 2025 at 15:15:40 UTC",
    ],
  },
};
