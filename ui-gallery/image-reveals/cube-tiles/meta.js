export const metadata = {
  slug: "cube-tiles",
  category: "image-reveals",
  title: "Perspective tiles",
  subtitle: "離れた断片が、一枚に揃う",
  description:
    "画像を小さな長方形に分け、少し違う角度から戻して一枚に組み立てます。奥行きのある入口を、固定された画像枠の中で確かめるデモです。",
  trigger: "Viewport entry / Replay / button",
  duration: "最大1500ms",
  easing: "cubic-bezier(.16, 1, .3, 1)",
  status: "WIP",
  source: {
    name: "B&O PLAY Spring/Summer 2017",
    url: "http://beoplay.com/landingpages/ss17",
    awardUrl: "https://www.awwwards.com/sites/b-o-play-spring-summer-2017",
    awardDate: "2017-03-30",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/cube-effect-image-reveal",
    location: "公式の記録映像、Charcoal の製品画像が登場する場面",
    observation:
      "2.133秒の公式映像では、白い面に離れた長方形の画像片が浮かび、異なる角度や奥行きから回転・移動して揃いました。それぞれの片が時間差で止まり、最後は一枚の写真になっています。",
    evidence: [
      "Awwwards の Cube effect image reveal の再生画面と同じ映像のフレームを比較。",
    ],
  },
  takeaways: [
    "画像を見せる順番を分けると、平面の画像にも奥行きのある登場を作れます。",
    "断片の着地点を先に揃えておくと、動きが終わった後の画像に継ぎ目が残りにくくなります。",
    "操作や説明は分割せず、動く画像とは別の読みやすい場所に残します。",
  ],
  limitations: [
    "公式の記録映像を観察した再構成です。映像には開始の操作が映っていないため、画面への登場検知と再生ボタンはこのデモの代替操作です。",
    "元のタイル数、3D の値、描画方法は不明です。ここではオリジナル SVG を12枚の CSS タイルに分けて近い見え方を作っています。",
    "参考 URL は受賞時の製品ページです。現行ページの動作は検証していません。原サイトの写真・コード・ロゴは含みません。",
  ],
  usability: {
    benefit:
      "視線を画像の中に集め、全体が揃ったところを自然な読み始めにできます。画像枠の高さを先に確保するので、周りの文章は動きません。",
    caution:
      "よくある『強い回転を何度も繰り返す』演出は内容を読む邪魔になります。初回登場は一度だけにし、もう一度見るかは操作で選べます。",
    smallScreen:
      "画像枠を幅に合わせて縮めます。タップ・Enter・Space で再生でき、横方向のスクロールは必要ありません。",
    reducedMotion:
      "分割した画像を最初から正しい位置で表示します。回転・奥行き移動・時差は省きます。",
  },
  implementation: [
    "一枚の SVG を各タイルで同じ倍率に拡大し、列と行の位置だけずらして同じ画像の一部分を表示します。",
    "親に perspective、タイルに rotateX・rotateY・translateZ を設定し、最後に transform: none へ揃えます。",
    "最後の時差を含めた完了後は一枚の静止画像を重ね、丸め誤差による継ぎ目を防ぎます。Replay・Reset・破棄ではタイマーと観察を解除します。",
  ],
  xPost:
    "ばらばらの画像片が、違う角度から戻って一枚に揃う。奥行きの演出は画像の中だけに閉じ込めて、周りの文章は固定する。公式映像から学ぶ、タイル状の画像登場。",
};
