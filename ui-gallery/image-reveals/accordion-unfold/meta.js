export const metadata = {
  slug: "accordion-unfold",
  category: "image-reveals",
  title: "Accordion unfold",
  subtitle: "折り目がほどけて、景色が広がる",
  description:
    "小さく折り畳まれた画像が、つながった帯のまま開いて大きな一枚になります。離れたタイルとは違う、折り目のある登場を検証するデモです。",
  trigger: "Viewport entry / Replay / button",
  duration: "1200ms",
  easing: "cubic-bezier(.65, 0, .35, 1)",
  status: "WIP",
  source: {
    name: "B&O PLAY Spring/Summer 2017",
    url: "http://beoplay.com/landingpages/ss17",
    awardUrl: "https://www.awwwards.com/sites/b-o-play-spring-summer-2017",
    awardDate: "2017-03-30",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl: "https://www.awwwards.com/inspiration/unfolding-effect",
    location:
      "公式の記録映像、中央の小さな画像から大きなヒーロー画像へ広がる場面",
    observation:
      "2.733秒の映像で、中央の小さな画像に交互の縦の折り目が見えました。つながった帯がほどけるのと同時に画像全体が拡大し、横長の写真へ揃う様子を確認しています。",
    evidence: [
      "Awwwards の Unfolding effect の再生画面と同じ映像の連続フレームを比較。",
    ],
  },
  takeaways: [
    "断片を離さずに折り目でつなぐと、一枚の素材を開くような連続性を作れます。",
    "開く動きと画像全体の拡大を同じ進行に揃えると、別々の部品には見えにくくなります。",
    "最後は平らな一枚に戻し、演出の後に内容を読みやすく残します。",
  ],
  limitations: [
    "公式の記録映像を観察しています。現行サイトや開始の入力操作は検証していません。画面への登場検知と再生ボタンは学習用の代替操作です。",
    "8本の帯、折り角度、1200ms は独自の調整値です。元の折り構造や描画方法を抽出していません。",
    "受賞時の製品ページ URL は現在の動作を保証しません。元の写真・文章・ロゴ・コードは使わず、独自の SVG 画像を表示しています。",
  ],
  usability: {
    benefit:
      "画像が完成するまでの変化をひとつのつながった動きとして見せます。外側の画像枠は確保しておくため、周囲の読み位置は変わりません。",
    caution:
      "よくある『折り返しが残って画像の一部が読めない』状態を防ぎ、完了時には一枚の静止画像へ切り替えます。動きは自動で繰り返しません。",
    smallScreen:
      "画像は画面幅に合わせて縮み、タップやキーボードで再生できます。大きなドラッグを要求しません。",
    reducedMotion: "折り目と拡大を省き、初めから一枚の画像を表示します。",
  },
  implementation: [
    "8枚の帯を入れ子にして、それぞれを前の帯の右端へつなぎます。transform-origin を左端へ置き、親子の角度を交互にします。",
    "画像の見え方を各帯でずらし、全ての角度が0度になったときに一枚へ揃います。影は折りが消えるのと同時に薄くします。",
    "Replay の前に開始姿勢を即座に適用し、前の再生を積みません。描画予約・完了タイマー・観察は Reset と破棄で解除します。",
  ],
  xPost:
    "小さく畳まれた景色が、折り目をほどきながら一枚になる。帯を離さずつなぐと、画像にも素材のような連続性が生まれます。完成後の読みやすさまで含めた登場演出の検証。",
};
