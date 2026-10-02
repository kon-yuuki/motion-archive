export const metadata = {
  slug: "gradient-frame-wipe",
  category: "section-transitions",
  title: "Gradient frame wipe",
  subtitle: "色の枠を、明るい面が覆っていく",
  description:
    "色のついた枠の内側から明るい面が広がり、画面を一度覆ってから次の場面へ進みます。ページ同士を直接動かさず、間に一枚の面をはさむ切り替えです。",
  trigger: "Click / keyboard scene buttons",
  duration: "1280ms including covered hold",
  easing: "cubic-bezier(.65, 0, .25, 1) / opacity linear",
  status: "WIP",
  source: {
    name: "Ciel Rose",
    url: "https://cielrose.tv/",
    awardUrl: "https://www.awwwards.com/sites/ciel-rose",
    awardDate: "2025-02-20",
    observedAt: "2026-10-02",
    location: "Global page navigation transition",
    observation:
      "A pale rectangular cover with a faint centered mark appears inside a colored gradient frame. The pale inner rectangle grows outward, reducing the gradient border to thin edges and then covering it. The cover holds briefly, then the new page content appears. The framing and cover, rather than the photo itself, bridge the pages.",
    observationMode: "official recording observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/global-transition-ciel-rose",
    evidence: [
      "Recording tab 35 at 15:29:38 UTC (outgoing production photo), 15:30:00 UTC six-frame sequence showing thick gradient frame become thin then vanish behind expanding pale cover",
      "Read-only DOM confirms recording duration 5.483333s, not an asserted motion duration",
      "Award tab 10 heading Site of the Day Feb20 2025 verified 15:25:56 UTC",
    ],
  },
  takeaways: [
    "画面を覆う面と、次の内容を別々に扱うと、前後の画像が重なって読みにくくなる時間を減らせます。",
    "色の枠が細くなることで、覆いが広がる方向を短い時間でも感じ取れます。",
    "押したボタンの選択状態は先に更新し、内容は覆いの下で入れ替えます。「押した後」がすぐに伝わります。",
  ],
  limitations: [
    "公式のAwwwards記録映像を観察しています。ライブサイトをクリックして同じ遷移を試したものではありません。",
    "受賞記録と録画の見た目を別々に確認しています。現在の公開版・録画・受賞時の版が完全に一致するとは確認していません。",
    "図形・文章は独自制作です。元サイトの映像、ロゴ、コードは使用していません。",
    "観察できた中心のマークは独自の線画に置き換えています。覆いの色と枠の配色も元のデザインの複製ではありません。",
    "1280msの全体時間、830msでの内容交換、退出時の透明度変化はこのデモの調整値です。元の内部処理や正確な時間を示すものではありません。",
  ],
  usability: {
    benefit:
      "一度明るい面で区切るため、異なる画像やレイアウトへの切り替えを落ち着いて見られます。",
    caution:
      "毎回長い覆いを挟むと待たされる感覚が強くなります。主要な場面転換へ絞り、連打したときに古い遷移をためないようにします。",
    smallScreen:
      "下の場面ボタンはタップ・Tab・Enterで操作できます。覆いはデモの中だけに表示し、外側のスクロールや操作を遮りません。",
    reducedMotion:
      "覆いの拡大とフェードを省き、選んだ場面へ瞬時に切り替えます。ボタンの選択状態と場面名は変わります。",
  },
  implementation: [
    "グラデーションのレイヤーに明るい覆いを重ね、clip-path: inset(9% 7%)を0%へ近づけます。文字や画像は拡大しません。",
    "覆いが全体に広がった後の830msで下の内容を交換し、短く待ってから覆いを消します。描画順序で途中のちらつきを防ぎます。",
    "ボタンの繰り返し操作では前のアニメーションとタイマーを中止します。世代番号を確認し、古い完了処理が新しい選択を戻さないようにします。",
    "二つの図版は独自SVGです。外部画像の読み込みを待たず、Replay・Reset・動きを控える設定を確かめられます。",
  ],
  xPost:
    "次の画像を直接すべり込ませる代わりに、一枚の明るい面で画面をつなぐ。色の枠が細くなる時間と、内容を入れ替える時間を分けたページ転換のスタディ。",
};
