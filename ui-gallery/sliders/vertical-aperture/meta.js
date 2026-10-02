export const metadata = {
  slug: "vertical-aperture",
  category: "sliders",
  title: "Vertical film aperture",
  subtitle: "画面と目盛りを固定して、シーンだけを縦に送る",
  description:
    "横長の窓の中を、次のシーンが下から通り抜ける。枠と番号の目盛りは動かさず、映像の順序を見せる縦スライダーです。",
  trigger: "Ruler buttons / arrows / swipe / keyboard",
  duration: "680ms / このデモの調整値",
  easing: "Smoothstep",
  takeaways: [
    "表示する窓と移動する中身を分けると、画面全体を動かさずに大きなシーンを切り替えられます。",
    "途中に見える横の境界線が、前後のシーンがひと続きであることを伝えます。",
    "目盛りを固定すると、シーンが動いている間も今の位置と操作先を確認できます。",
  ],
  limitations: [
    "Awwwards公式の要素紹介動画を観察しました。録画のポインター位置から、元の入力方式を断定していません。",
    "原作の映像は使用せず、独自の静止した抽象画でシーンの移動だけを示します。",
    "原作で見える端のわずかな湾曲は、幅と角丸を変える簡略表現にしています。WebGLの変形と同一ではありません。",
    "680msと目盛りの操作方法はこの学習デモの設計です。4秒という公式動画の長さを移動時間として扱っていません。",
    "録画と2025年の受賞時の版が完全に一致するかは未確認です。",
  ],
  usability: {
    benefit:
      "枠と目盛りの位置が変わらないため、大きな画像を切り替えても操作位置を見失いにくくなります。",
    caution:
      "スクロールと縦送りを混ぜると迷いやすくなります。このデモはページのスクロールを奪わず、明示的なボタンでシーンを選びます。",
    smallScreen:
      "前後ボタンと番号をタップできます。左右のスワイプでもシーンを送り、縦のジェスチャーはページのスクロールに残します。矢印キーとHome・Endも使えます。",
    reducedMotion:
      "縦移動と端の変形を省き、選んだシーンをすぐ表示します。目盛りと番号は同じように更新します。",
  },
  implementation: [
    "同じ高さのシーンを縦方向に並べ、親のoverflowで表示領域を固定します。",
    "現在位置をtranslateYへ変換し、新旧のシーンが窓の中を連続して通るようにします。",
    "コンテナの高さが変わったらResizeObserverで移動距離を更新し、同じシーン位置を保ちます。",
    "繰り返しの選択は現在の移動位置からやり直します。破棄時には描画ループとObserverを解除します。",
  ],
  xPost:
    "画面と目盛りはそのまま、シーンだけを縦に送る。途中の境界線で前後のつながりを見せる、固定窓スライダーの学習メモ。",
  status: "WIP",
  source: {
    name: "Ciel Rose",
    url: "https://cielrose.tv/",
    awardUrl: "https://www.awwwards.com/sites/ciel-rose",
    awardDate: "2025-02-20",
    observedAt: "2026-10-02",
    location: "Homepage works slider",
    observation:
      "Film panels move vertically through a fixed wide central aperture. Intermediate frames show one outgoing scene above another incoming scene separated by a horizontal seam. The outer edges bow subtly during motion; the numbered ruler below changes active position (including 03 and 07). The page and ruler stay fixed while film content advances.",
    observationMode: "official recording observed",
    evidence: [
      "Observed official autoplaying Awwwards recording. The recorded cursor is within the image; input device/gesture is not established, so no live scroll or drag is claimed.",
      "Browser tab 34 screenshots 15:29:18 UTC (two stacked film scenes, index 07) and 15:29:38 UTC (different split scenes, index 03)",
      "Read-only video DOM confirmed active 4s recording; recording length is not transition duration",
      "Award browser tab 10 heading Site of the Day - Feb 20, 2025 verified 15:25:56 UTC",
    ],
    recordingUrl:
      "https://www.awwwards.com/inspiration/home-projects-slider-ciel-rose",
  },
};
