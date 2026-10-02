export const metadata = {
  slug: "icon-sequence",
  category: "buttons",
  title: "Icon sequence",
  subtitle: "短い合図を挟んで、次の言葉へ",
  description:
    "ラベルが消え、小さな図形が順番に現れた後、新しい呼びかけへ変わります。短い演出を挟みながら、操作そのものはすぐ受け付けるボタンのデモです。",
  trigger: "Hover / focus / tap",
  duration: "約1100ms",
  easing: "アイコン: ease-out・色: ease",
  status: "WIP",
  source: {
    name: "Joseph Berry Masterclass",
    url: "https://joseph-berry-webflow-master-class.webflow.io/",
    awardUrl: "https://www.awwwards.com/sites/joseph-berry-masterclass",
    awardDate: "2021-08-27",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/joseph-berry-masterclass-hover-button-animation",
    location: "公式の記録映像、黄色い背景にある Hall of Fame ボタン",
    observation:
      "2.467秒の映像でラベルが薄くなり、四つの炎のアイコンが左から順に現れて消えました。その後 Let’s Go の文字が現れ、白いカプセルが青に変わる様子を確認しています。",
    evidence: [
      "受賞ページの Site of the Day - Aug 27, 2021 を確認。リンク先の公式映像をブラウザーで再生し、同じ映像の連続フレームで順序を確認。",
    ],
  },
  takeaways: [
    "文字、図形、次の文字の順番を分けると、短いボタンの中にも小さな物語を作れます。",
    "意味のあるラベルは読み上げ側に残し、装飾の並びを読み上げさせません。",
    "演出が終わるまで押せない仕組みにせず、クリックはいつでも受け付けます。",
  ],
  limitations: [
    "公式の記録映像を観察した再構成です。現行サイトのホバーは検証していません。",
    "炎の絵文字を独自の SVG の光形に置き換え、文字と配色もオリジナルにしています。原サイトの素材やコードは含みません。",
    "約1100ms の順序、タップ選択、フォーカスの反応は学習用の調整です。元の正確な時間は抽出していません。",
  ],
  usability: {
    benefit:
      "呼びかけが少し変わることで、操作への期待を作れます。押した結果は演出とは別の状態文ですぐ伝えます。",
    caution:
      "よくある『文字が消えたまま操作の意味が分からなくなる』時間を短くし、常に同じ操作名を保ちます。情報が多い画面では、もっと短い色の変化だけでも十分です。",
    smallScreen:
      "タップで選択結果をすぐ表示します。Tab でも演出が始まり、Enter・Space で選択できます。",
    reducedMotion:
      "図形の連続表示を省き、背景とラベルをすぐ切り替えます。操作結果は省略しません。",
  },
  implementation: [
    "読み上げ用の名前は button の aria-label に固定し、視覚用のラベルと図形には aria-hidden を付けます。",
    "四つの SVG に短い一回のアニメーションと時差を設定します。文字ごとの分割や配置調整はしません。",
    "操作結果と演出段階を分けて管理します。離れたとき、新しい再生、Reset、破棄では前の予定を取り消します。",
  ],
  xPost:
    "文字、図形、次の文字。短い順番を作ると、ボタンにも小さな手応えが生まれます。演出中もすぐ押せること、操作の名前を変えないことを大切にした検証です。",
};
