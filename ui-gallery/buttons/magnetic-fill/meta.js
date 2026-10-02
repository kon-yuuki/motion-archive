export const metadata = {
  slug: "magnetic-fill",
  category: "buttons",
  title: "Magnetic fill",
  subtitle: "引き寄せて、色で応える",
  description:
    "円形ボタンがポインターへ少し近づき、内側から色が広がる。押せる場所は動かさず、見た目だけを動かして、狙いやすさと手応えを両立するデモです。",
  trigger: "Hover / pointer move / focus / click",
  duration: "色の変化 450ms・位置はばね追従",
  easing: "Fill: cubic-bezier(.22, 1, .36, 1)",
  status: "WIP",
  source: {
    name: "Dennis Snellenberg",
    url: "https://dennissnellenberg.com/",
    awardUrl: "https://www.awwwards.com/sites/dennis-snellenberg",
    awardDate: "2022-04-04",
    observedAt: "2026-10-02",
    location: "ホームの紹介文に続く、円形の About me ボタン",
    observation:
      "暗い円とラベルがポインター側へ異なる量で引き寄せられ、円の内側が青に変わりました。外へ出すと色と位置が元に戻る様子を、公開画面で確認しています。",
    evidence: [
      "ホームを約1画面スクロールし、円の右上へポインターを移動。その後、円の外へ移動して比較。",
    ],
    observationMode: "live interaction",
  },
  takeaways: [
    "円と文字の移動量を分けると、ひとつの部品にも奥行きのある反応が生まれます。",
    "色の面を円の中で切り抜くことで、輪郭を保ったまま状態を伝えられます。",
    "素早く出入りしても、現在地から次の目的地へ向かうため、動きがたまりません。",
  ],
  limitations: [
    "参考サイトのコード、文章、ロゴは使っていません。このデモは送信やページ移動を行わない選択ボタンです。",
    "450ms、最大24pxの移動量、ばねの係数は、この実装の調整値です。参考サイトの値を計測・抽出したものではありません。",
    "参考サイトはデスクトップのポインター操作を観察しました。フォーカスとタップの反応は、学習用に追加した代替操作です。",
  ],
  usability: {
    benefit:
      "触れたときの色と軽い追従で、ここが操作できる場所だと伝わります。押した後はラベルと状態表示も変わります。",
    caution:
      "よくある『ボタン全体が逃げる』動きは狙いにくくなります。ここでは200pxの操作範囲を固定し、その中の見た目だけを最大24px動かしています。",
    smallScreen:
      "タップでも選択状態が切り替わります。Tabで移動すると色が変わり、Enter・Spaceで選択できます。細かな追従はマウスなどの細かいポインターに限定します。",
    reducedMotion:
      "位置の追従と色の移動を止めます。色・ラベル・選択状態による手応えは残します。",
  },
  implementation: [
    "固定したbuttonの内側に、円の見た目と文字のレイヤーを置きます。操作範囲そのものはtranslateしません。",
    "ポインターの中心からの距離を0.24倍して円へ、0.14倍して文字へ渡します。円の移動は±24pxに制限します。",
    "requestAnimationFrameで時間差を補正したばねを計算し、静止したらループを止めます。離れた後も同じ座標系で原点に戻します。",
    "色の面はtransformだけで動かし、円のoverflow: hiddenで切り抜きます。Replay用タイマーと描画ループはReset・破棄時に解除します。",
  ],
  xPost:
    "ポインターへ少し寄ってくる円形ボタン。操作範囲は固定して、円と文字だけを動かす。色の変化はキーボードやタップにも残すと、見た目の気持ちよさを使いやすさにつなげられます。",
};
