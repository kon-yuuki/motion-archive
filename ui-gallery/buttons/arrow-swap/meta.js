export const metadata = {
  slug: "arrow-swap",
  category: "buttons",
  title: "Arrow swap",
  subtitle: "REJOUICE の Let's talk を部品単位で再現",
  description:
    "REJOUICE のホーム右上にある Let's talk を再現。14pxの文字と小さな ↗、文字の20px移動、左端から伸び縮みする下線を、公開画面の寸法・CSSと照合しています。",
  trigger: "Pointer enter / leave・リンク",
  duration: "矢印・文字 700ms / 下線 600ms",
  easing: "矢印・文字: cubic-bezier(.52, 0, 0, 1) / 下線: cubic-bezier(.85, 0, .15, 1)",
  status: "WIP",
  timingDisclosure:
    "寸法・色・時間・easing は2026年10月2日の公開DOMとCSSで確認した値です。SuisseIntl は再配布せず Arial 系のフォントで近似しているため、文字と矢印の字形は原本と異なります。",
  source: {
    name: "REJOUICE®",
    url: "https://www.rejouice.com/",
    awardUrl: "https://www.awwwards.com/sites/rejouice-r-3",
    awardDate: "2025-02-06",
    observedAt: "2026-10-02",
    location: "ホーム右上の Let's talk（.b-arrow.link-active.cta）。計測 viewport: 1180 × 757 CSS px",
    observation:
      "リンクは74.765625×15.953125px、文字14px・行高15.96px、ラベル幅54.765625px、矢印枠15px、間隔5px。hoverで文字が右へ20px、右の ↗ が(+18.75, -7.97656)pxへ退き、左の ↗ が(-18.75, +7.97656)pxから現れます。下線は1pxで、進入・退出とも左端を起点に伸び縮みします。",
    evidence: [
      "初期・hover完了・進入途中13枚の画面と、文字・両矢印・下線の computed style を採取。位置・透過率・クリッピングを比較。",
      "公開CSSの矢印・文字の700ms / cubic-bezier(.52,0,0,1)、下線の600ms / cubic-bezier(.85,0,.15,1)、.cta の左端起点の上書きを確認。",
      "保存された参照PNGは1165×747px。DOM計測の1180×757 CSS pxと異なるため、画像比較では寸法差を明示し、途中の画面を同一時刻の比較とは扱いません。",
    ],
    observationMode: "live interaction and rendered DOM/CSS measurement",
  },
  takeaways: [
    "矢印は大きなSVGではなく、小さな ↗ の文字です。文字の大きさと余白も動きの一部として揃えます。",
    "ラベルと両矢印は同じ700msの曲線。20pxのラベル移動で、後ろにあった矢印の場所が前へ移ります。",
    "下線は常時表示ではありません。600msの別の曲線で現れ、退出時も左端へ縮みます。",
  ],
  limitations: [
    "再現範囲はホームの Let's talk リンクだけです。黒い部品ステージへ切り出し、元の大きなロゴ、映像、本文、ページ遷移演出は含めていません。",
    "原本のSuisseIntlは再配布していません。Arial系の文字を計測幅に合わせ、↗は利用可能なフォントで表示します。字形とアンチエイリアスには差が残ります。",
    "リンクは原本と同じContactを指しますが、ギャラリーでは新しいタブを開きます。選択トグルや完了表示への変更はありません。",
    "フォーカス輪郭と静止した下線、タッチの44px操作範囲、動きを控える設定はギャラリー側の代替です。観察したデスクトップ動作とは区別しています。",
    "2026年10月2日の現行公開版を対象としています。2025年の受賞時点と同一の動作を保証するものではありません。",
  ],
  usability: {
    benefit:
      "文字と押す場所を変えず、矢印と下線が操作への反応を伝えます。押した後は普通のリンクとして移動します。",
    caution:
      "原本と同じ小さなリンクを切り出しています。用途によってはこの操作範囲では小さいため、実際の製品へ使う際には周囲の余白も検討してください。",
    smallScreen:
      "タッチでは44pxの高さを確保し、押している間だけ下線を即時表示。最初のタップでContactを新しいタブに開きます。キーボードはTabで輪郭と下線を表示し、Enterでリンクを開きます。",
    reducedMotion:
      "矢印・文字・下線の遷移を省き、同じ開始・終了状態を即時に切り替えます。Replayは状態の比較として使えます。",
  },
  implementation: [
    "二つの装飾用Unicode ↗ と一つのラベルを配置。リンクの overflow: hidden で斜めに出入りする矢印を切り取ります。",
    "矢印は translate(±125%, ∓50%) と opacity、ラベルは translateX(20px)。移動と透過を同じ700msのCSS transitionで同期します。",
    "下線は1pxの疑似要素。scaleX(0→1)、600ms、transform-origin: left center を両方向で保ちます。",
    "CSS transitionに途中の反転を任せ、ReplayのタイマーとrequestAnimationFrameをReset・ページ破棄で解除します。リンクのクリックはキャンセルしません。",
  ],
  xPost:
    "REJOUICEのLet's talkを部品単位で観察。14pxの文字、小さな↗、20pxの横移動。矢印と文字は700ms、下線は600ms。大きな演出を足さず、実際の寸法と曲線を追うリンクの検証です。",
};
