export const metadata = {
  slug: "blur-dissolve",
  category: "text-reveals",
  title: "Blur dissolve",
  subtitle: "輪郭をほどいて、余韻を残す",
  description:
    "Black Dogの小さな韓国語タイトルとBLACK DOGの副題を、黒い余白の中央へ戻しました。文字を押すと、細かな密度ノイズを伴う柔らかい霧へほどけます。",
  trigger: "Click / Replay",
  duration: "約1,850ms（estimated / 記録から推定）",
  easing: "Soft density diffusion / late fade",
  status: "WIP",
  source: {
    name: "Black Dog",
    url: "https://blackdogstory.com/",
    awardUrl: "https://www.awwwards.com/sites/black-dog",
    awardDate: "2021-09-11",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/black-dog-blurred-text-effect-click-animation",
    location: "タイトルをクリックした後の、文字がにじんで消える場面",
    observation:
      "Awwwardsの約2.77秒の公式記録映像を確認しました。黒い背景の中央にある鮮明な文字が、クリック表示の後に粒状のぼけへ変わり、輪郭を失いながら暗く消えていきます。",
    evidence: [
      "公式映像の開始時、約1秒、約2秒のフレームを比較。文字の輪郭、粒状のにじみ、消失を確認。",
    ],
  },
  takeaways: [
    "大きな英文を、小さな韓国語タイトルと細い副題へ戻しました。",
    "四角い粒を飛ばさず、連続したぼかし場の密度を細かなノイズで変化させています。",
    "意味を持つHTMLの見出しは残し、タイトル位置のネイティブボタンから再生できます。",
  ],
  limitations: [
    "現在のBlack Dog公開ページはクラウドブラウザーでLOADINGから進まず、クリック範囲の実測は未確認。記録のタイトル位置を操作対象にしています。",
    "Noto Serif CJKによる字形、霧の分布と拡散カーブは近似です。原作のシェーダーを復元したものではありません。",
    "Source対Replicaの途中フレームを比較し修正しましたが、WIPのままです。ユーザーレビューは未完了です。",
  ],
  usability: {
    benefit:
      "短いタイトルの区切りや、次の場面へ渡す余韻をつくれます。読み終わってから操作するので、内容を読む時間を奪いません。",
    caution:
      "本文や操作の説明を自動で消すと、読み直せなくなります。ここでは短い装飾用見出しだけを対象にし、Resetでいつでも戻せます。",
    smallScreen:
      "画面比率を維持して縮小します。Tab・Enter/Space、外側のReplay / Resetから操作できます。これらはデモ側の追加仕様です。",
    reducedMotion:
      "粒の拡散を省き、見た目を即座に切り替えます。意味を持つHTMLの見出しと状態表示は残ります。",
  },
  implementation: [
    "Noto Serif CJKの必要な韓国語グリフだけをOFLライセンスで同梱。原作の字形とは完全一致しません。",
    "918×656の記録座標を基準に、約17%幅のタイトルを配置します。",
    "文字マスクのぼかし・局所変位・密度ノイズを分け、終盤で暗くなる霧を再構成しました。",
    "Reset・Replayの中断・abort後の処理・フォント読込とResizeObserverを検証しています。",
  ],
  xPost:
    "文字が、輪郭を失いながら消えていく。短いタイトルの終わりに余韻をつくる、粒状のぼかし。読む時間はユーザーに任せ、文字の意味はHTMLに残す。",
  timingDisclosure:
    "measured: 918×656、黒背景、記録フレーム。estimated: 消失開始は記録約0.87秒、再現の拡散は約1.85秒。unknown: 原作のノイズ場・イージング・元の描画方式。",
};
