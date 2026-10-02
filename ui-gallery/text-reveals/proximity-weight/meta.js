export const metadata = {
  slug: "proximity-weight",
  category: "text-reveals",
  title: "Proximity weight",
  subtitle: "近い文字だけ、太さが変わる",
  description:
    "ポインターに近い文字の線が太くなり、離れた文字は細い状態へ戻る。段落全体ではなく、一文字ごとに距離へ反応する可変書体のスタディです。",
  trigger: "Pointer proximity / keyboard / range",
  duration: "追従 約90ms（デモ調整値）",
  easing: "Exponential smoothing / weight 220–880",
  status: "WIP",
  source: {
    name: "Casa di Solare",
    url: "https://casadisolare.com/",
    awardUrl: "https://www.awwwards.com/sites/casa-di-solare",
    awardDate: "2024-02-19",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/variable-type-hover-effect-casa-di-solare",
    location: "中央に組まれた4行の文字のホバー効果",
    observation:
      "公式映像では、薄いセリフ書体の段落上をポインターが通ると、近くの文字だけが太くなります。太い範囲がポインターを追い、通り過ぎた文字は細い状態へ戻りました。",
    evidence: [
      "公式記録映像の複数フレームを比較し、ポインターの位置と文字の見え方の変化を確認。",
    ],
  },
  takeaways: [
    "文字の拡大ではなく、可変フォントのウェイト軸を動かして線の厚さを変えます。",
    "近さをなだらかな強弱へ変えることで、太い部分がポインターと一緒に移動します。",
    "文字の送り幅を固定し、太さが変わっても行や単語の位置が大きく揺れないようにします。",
  ],
  usability: {
    benefit:
      "読む位置や操作位置に、静かな反応を加えられます。全文を読めるまま、触れている場所を視覚的に強調できます。",
    caution:
      "行組みまで動いてしまうと、文字を追うのが疲れやすくなります。動かすのは文字の太さだけにし、短い装飾文へ限定します。",
    smallScreen:
      "指で触れた場所にも反応します。文字領域をTabで選び、矢印キーまたは下の位置スライダーから同じ反応を確認できます。",
    reducedMotion:
      "太さの追従を補間せず、指定位置の太さへ即座に切り替えます。文字が常に読める状態は変えません。",
  },
  implementation: [
    "既存のLibre Franklin可変フォントを使い、各文字にfont-variation-settingsのwght値を与えます。原作の専用書体は使いません。",
    "各文字の中心とポインターの距離を求め、半径内の影響度を0〜1へ変換します。基準220、最大880をこのデモ用に設定しています。",
    "各文字を基準ウェイトで計測した送り幅へ固定します。読み上げ用の文章は分割せず、一つのHTMLテキストとして残します。",
    "フォント読込後と画面サイズ変更時だけ文字位置を再計測します。変化が落ち着いたら描画ループを停止します。",
  ],
  xPost:
    "近づいた文字だけ、線が太くなる。可変フォントのウェイトを距離で動かすと、ポインターが通った場所にやわらかな反応が生まれる。行組みを動かさないことが、読みやすさのポイント。",
  limitations: [
    "公式の記録映像から観察した独立実装です。元サイトの現在の操作や実装コードを検証したものではありません。",
    "原作のセリフ書体に対し、このデモはリポジトリの既存書体Libre Franklinを使用しています。字形そのものは一致しません。",
    "追従速度・影響する範囲・キーボード操作は、このデモの調整値と追加仕様です。",
  ],
};
