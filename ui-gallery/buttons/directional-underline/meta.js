export const metadata = {
  slug: "directional-underline",
  category: "buttons",
  title: "Directional underline",
  subtitle: "文字を動かさず、行き先を示す",
  description:
    "文字の下に細い線が伸びて、今触れている項目を知らせます。ラベルと操作範囲を固定したまま、線の出入りだけで反応を作るデモです。",
  trigger: "Hover / focus / tap",
  duration: "350ms",
  easing: "cubic-bezier(.65, 0, .35, 1)",
  status: "WIP",
  source: {
    name: "Exo Ape",
    url: "https://www.exoape.com/",
    awardUrl: "https://www.awwwards.com/sites/exo-ape",
    awardDate: "2022-05-23",
    observedAt: "2026-10-02",
    location: "ホームで Menu を開いた後の Studio・News リンク",
    observation:
      "Studio の左端に短い白線が現れ、ラベルの幅まで伸びました。News へ移ると、前の線が縮み、新しい線が伸びる様子を公開画面で確認しています。",
    evidence: [
      "Menu をクリックし、Studio へホバー。その後 News へ移して線の途中と完了状態を比較。",
    ],
    observationMode: "live interaction",
  },
  takeaways: [
    "文字を動かさずに線だけを変えると、読みやすさを保って操作できる場所を伝えられます。",
    "線の幅はラベルに合わせ、操作範囲は文字より広く取ると、見た目と押しやすさを両立できます。",
    "次の項目へすぐ移っても、線は現在の状態から切り替わります。待ち時間は作りません。",
  ],
  limitations: [
    "2026年10月2日の現行公開版を観察しています。2022年の受賞時点と同一の実装であるとは限りません。",
    "参考元は文字リンクです。このデモではページを移動しない選択ボタンとして再構成しています。",
    "350ms、イージング、退出時の右側を基点にした縮小は学習用の調整値です。元サイトのコードや正確な値を抽出していません。",
  ],
  usability: {
    benefit:
      "項目間の移動を小さな線で伝え、隣の文字やレイアウトを揺らしません。押した結果は下部の文章でも確認できます。",
    caution:
      "よくある『線を足すたびに行の高さが変わる』実装では、狙っていた位置がずれます。ここでは線を重ねて表示し、行の高さを固定します。",
    smallScreen:
      "タップすると線と選択表示が残ります。Tab で同じ反応を確認でき、Enter・Space で選択できます。",
    reducedMotion:
      "線の伸縮は省き、対象の下にすぐ線を表示します。選択状態の文章はそのまま残します。",
  },
  implementation: [
    "ラベルを囲む span に ::after を置き、scaleX(0) と scaleX(1) を切り替えます。文字ごとの分割は行いません。",
    "入るときと出るときで transform-origin を変え、線の進行方向を作ります。",
    "ホバー、キーボードフォーカス、タップ選択を同じ状態描画へまとめます。Replay のタイマーは新しい操作・Reset・破棄で解除します。",
  ],
  xPost:
    "文字を動かさず、線だけで応える。細い下線の出入りなら読みやすさと手応えを両立できます。操作範囲を広めに保ち、タップやキーボードにも同じ反応を残す小さな UI の検証。",
};
