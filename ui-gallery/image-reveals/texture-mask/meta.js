export const metadata = {
  slug: "texture-mask",
  category: "image-reveals",
  title: "Texture mask",
  subtitle: "文字の内側に、素材をのぞかせる",
  description:
    "文字の形は固定したまま、動く窓の内側だけに素材が見えます。文字の切り抜きと移動する領域を重ねた、タイポグラフィに近い画像マスクのデモです。",
  trigger: "Pointer move / focus / tap / range",
  duration: "約450msの追従感",
  easing: "時間差を補正した指数補間",
  status: "WIP",
  source: {
    name: "Duten",
    url: "https://duten.com/en/finish/brushed-stainless-steel/",
    awardUrl: "https://www.awwwards.com/sites/duten",
    awardDate: "2024-11-03",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/texture-hover-reveal-duten",
    location: "公式の記録映像、素材の仕上げを大きな文字で紹介する場面",
    observation:
      "16.874秒の公式映像では、白い大きな文字の内側に、ポインターが通る曲線状の領域を通して銀色の素材写真が現れました。ほかの文字部分は白く残り、その後は暗色や真鍮色の素材も見られました。",
    evidence: [
      "Awwwards の Texture Hover Reveal - Duten のブラウザー再生と同じ映像のフレームで、文字の輪郭と曲線の境界を確認。",
    ],
  },
  takeaways: [
    "文字の輪郭と画像が見える範囲を別にすると、文字としての読みやすさと素材の見せ方を分けて調整できます。",
    "動く窓を少しだけ遅れて追わせると、硬い境界にも柔らかな反応が生まれます。",
    "素材を選ぶ操作と位置を動かす操作を分け、タッチやキーボードでも同じ内容を確かめられるようにします。",
  ],
  limitations: [
    "公式の記録映像を観察しています。現行ライブサイトのポインター操作は検証していません。",
    "元の写真の代わりに、独自の SVG グラデーションと細線から作った金属調の画像を使います。単なる文字色の切り替えではなく、文字形状と移動する窓の二重マスクです。",
    "窓の形、追従係数、FORM の文字、位置スライダーは独自の再構成です。元のシェーダーや正確な値は不明です。",
  ],
  usability: {
    benefit:
      "素材の質感を部分的に見せながら、文字の場所と輪郭を保てます。見え方はいつでも止めて確認できます。",
    caution:
      "よくある『マウスで探さないと情報が見つからない』状態を避け、タップ・ボタンのフォーカス・位置スライダーでも素材を表示します。重要な素材名は常に文字の外に置きます。",
    smallScreen:
      "大きな文字面をタップすると、その位置で素材の窓が固定されます。位置スライダーは指でもキーボードの矢印キーでも動かせます。",
    reducedMotion:
      "追従と窓の移動を止め、文字全体に素材を表示します。素材の選択はそのまま使えます。",
  },
  implementation: [
    "SVG の clipPath に文字を入れて輪郭を固定し、その内側の素材画像へ別の mask を適用します。二つの見える範囲が重なった部分だけに素材が現れます。",
    "ポインター座標を SVG の座標へ変換し、requestAnimationFrame で現在位置を目的地へ近づけます。窓の縁は複数の曲線点をつないだ独自形状です。",
    "動きが止まったら描画ループを止めます。Replay のタイマー、描画予約、イベントは Reset と破棄時に解除します。",
  ],
  xPost:
    "文字の中だけに、素材が見える。固定した文字の輪郭と、動く曲線の窓を重ねる二重マスク。タップで止めたり、キーボードで位置を変えたりできる質感プレビューの検証です。",
};
