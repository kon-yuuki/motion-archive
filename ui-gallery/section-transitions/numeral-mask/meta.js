export const metadata = {
  slug: "numeral-mask",
  category: "section-transitions",
  title: "Numeral mask",
  subtitle: "数字の面が、そのまま次の背景になる",
  description:
    "大きな数字の8をさらに拡大し、黒い線が画面いっぱいになったところで次の内容を出します。見出しの形を場面の境界に変える、スクロール連動のデモです。",
  trigger: "Local scroll / range / next section",
  duration: "スクロール距離に連動 / Replay 1700ms",
  easing: "Scroll-linked exponential scale / Replay ease-in-out",
  status: "WIP",
  source: {
    name: "GRASS Vionaro V8",
    url: "https://vionaro-v8.com/en/home#highlights",
    awardUrl: "https://www.awwwards.com/sites/grass-vionaro-v8",
    awardDate: "2023-01-16",
    observedAt: "2026-10-02",
    location: "Highlights section, bright numeral 8 to dark product story",
    observation:
      "The numeral enlarges until its black strokes fill the viewport. The yellow counters and outside field move beyond the crop; a curved yellow remnant disappears at the left. Dark product artwork and white body heading then enter on the resulting black section. The glyph is used as the transition mask between two full sections.",
    observationMode: "official recording observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/section-transition-8-grass-vionaro-v8",
    evidence: [
      "Recording tab 41 six frames at 15:35:47 UTC: full 8, oversized 8, curved yellow edge, dark product surface, next-section heading entering",
      "Screenshot 15:35:26 UTC shows settled dark section with heading and product",
      "Award tab 10 heading Site of the Day Jan16 2023 verified 15:34:56 UTC",
      "Read-only DOM confirms recording duration 7.583333s, not an exact source transition time",
    ],
  },
  takeaways: [
    "前の画面にある形を次の背景へつなぐと、急に別の画面へ飛ぶより前後の関係を感じ取りやすくなります。",
    "数字の穴を中心に拡大すると背景色が残ります。黒い線がつながる位置を中心にして、最後に画面全体を覆います。",
    "次の本文は黒い面になってから表示します。数字と本文を同時に強く動かさず、読む時間を分けます。",
  ],
  limitations: [
    "公式のAwwwards記録映像を観察しています。ライブサイトをクリックして同じ遷移を試したものではありません。",
    "受賞記録と録画の見た目を別々に確認しています。現在の公開版・録画・受賞時の版が完全に一致するとは確認していません。",
    "図形・文章は独自制作です。元サイトの映像、ロゴ、コードは使用していません。",
    "数字はフォントや元のマスクではなく独自の二重ループSVGです。製品の図版もオリジナルの幾何学的な形へ置き換えています。",
    "拡大率20倍、進捗78%からの内容表示、Replayの1700msは独自の調整値です。録画7.58秒は映像全体の長さで、元のアニメーション時間ではありません。",
  ],
  usability: {
    benefit:
      "前のセクションの象徴的な形を引き継ぎ、次の内容への連続性を作れます。",
    caution:
      "数字が大きく動いている間は長い文章が読みにくくなります。大きな形だけを動かし、次の説明は停止に近い状態で見せます。",
    smallScreen:
      "タッチの縦スクロール、領域を選んだ後の上下キー、進み具合スライダー、次のセクションボタンで同じ状態へ進めます。ページ全体のスクロールは横取りしません。",
    reducedMotion:
      "数字の拡大を省き、明るい数字の画面と暗い説明の画面を瞬時に切り替えます。内容と操作方法は残します。",
  },
  implementation: [
    "独自SVGのfill-rule: evenoddで二つの穴を作ります。数字の中心ではなく、上下の輪がつながる48.2%の位置を拡大の中心にします。",
    "ローカルのスクロール進捗に応じて1倍から20倍へ拡大します。指数的な増加により、最初は数字の形が読める時間を残します。",
    "次のセクションは進捗78%から表示し、見出しと図版の小さな縦移動を別々に調整します。背景色は数字の線と一致させます。",
    "Replay中の手動操作は自動再生を停止します。終了時にrequestAnimationFrame・ResizeObserver・イベントリスナーを解除します。",
  ],
  xPost:
    "数字の8が大きくなり、黒い線がそのまま次のセクションの背景になる。拡大の中心と本文が出る順番を調整して、形の意味を場面転換へつなぐスタディ。",
};
