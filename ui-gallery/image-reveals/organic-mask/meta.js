export const metadata = {
  slug: "organic-mask",
  category: "image-reveals",
  title: "Organic mask",
  subtitle: "小さな窓がつながって、全体になる",
  description:
    "丸みのある小さな窓から画像が現れ、窓同士がつながって一枚になります。透明度ではなく、見える範囲そのものを広げる画像登場のデモです。",
  trigger: "Viewport entry / Replay / button",
  duration: "900ms",
  easing: "Cubic ease-out + 島ごとの時差",
  status: "WIP",
  source: {
    name: "Stuuudio",
    url: "https://stuuudio.co/",
    awardUrl: "https://www.awwwards.com/sites/stuuudio",
    awardDate: "2019-08-01",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/image-reveal-animation-mask-stuuudio",
    location: "公式の記録映像、スクロールで現れるプロジェクト画像の一覧",
    observation:
      "5.067秒の公式映像では、画像の中に小さく離れた不規則な窓が現れ、それぞれが広がってつながりました。最後に背景色の穴が消え、長方形の画像が完成する様子を確認しています。",
    evidence: [
      "Awwwards の Image reveal animation mask - Stuuudio の再生画面と同じ映像のフレームを比較。",
    ],
  },
  takeaways: [
    "画像の透明度を変えるだけでなく、見える面積を広げることで素材の手触りを感じさせられます。",
    "窓を少しずつ異なる順番で広げると、機械的な格子とは違う現れ方になります。",
    "最後は必ず画像全体を表示し、情報が穴の裏に残らないようにします。",
  ],
  limitations: [
    "公式の記録映像を観察しています。現行サイトでスクロール操作を検証したとは主張していません。",
    "ここではオリジナル SVG を複数の楕円で切り抜いています。元のシェーダー、ノイズ生成方法、時間の値は不明です。",
    "900ms、楕円の配置、画面への登場検知、再生ボタンはこの学習用デモの実装です。元の画像・文章・コードは使用していません。",
  ],
  usability: {
    benefit:
      "一覧で画像が現れる瞬間を穏やかに示し、どのカードに注目すればよいかを伝えます。画像の場所と大きさは固定です。",
    caution:
      "よくある『マスクの穴が残って細部が見えない』状態を防ぐため、完了時には切り抜きを解除します。重要な見出しや操作は画像の外に出します。",
    smallScreen:
      "ポインター位置を使わず、一度見える場所に入ると再生します。ボタンのタップやキーボードで何度でも確かめられます。",
    reducedMotion:
      "画像を最初から完全に表示します。再生や Reset を押しても、画像を隠す動きは行いません。",
  },
  implementation: [
    "SVG の mask に白い楕円を並べ、requestAnimationFrame で rx・ry を広げます。黒い部分は画像を隠し、白い部分だけを見せます。",
    "楕円ごとに少し違う開始時刻と縦横比を持たせ、連続した丸い窓へ近づけます。完了時は mask 属性を外して全体を保証します。",
    "IntersectionObserver は最初の登場だけに使い、その後は解除します。再生のやり直し、Reset、破棄では描画ループを停止します。",
  ],
  xPost:
    "小さな丸い窓がつながって、一枚の画像になる。透明度ではなく見える範囲を広げる画像登場。最後は必ず全体を見せ、動きを控える設定では最初から画像を表示します。",
};
