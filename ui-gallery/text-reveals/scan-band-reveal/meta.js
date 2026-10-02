export const metadata = {
  slug: "scan-band-reveal",
  category: "text-reveals",
  title: "Scan-band reveal",
  subtitle: "細かな横帯が、ひとつの文字へつながる",
  description:
    "文字を細い横帯に分け、帯ごとに少しずつ異なる速さで左から表示する。先端の小さな断片が合流して、最後には鮮明な見出しになるデモです。",
  trigger: "Page entry / click / Replay / range",
  duration: "1,600ms（デモ調整値）",
  easing: "Independent band delays / linear progress",
  status: "WIP",
  source: {
    name: "Fine Thought",
    url: "https://finethought.com.au/",
    awardUrl: "https://www.awwwards.com/sites/fine-thought-site",
    awardDate: "2025-07-20",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/page-load-effect-fine-thought-4",
    location: "ページ読み込み時の、帯状の断片から見出しが現れる場面",
    observation:
      "公式映像では、空の見出し領域から不揃いな横帯が左から右へ現れます。先端には小さな断片が残り、帯が合流して鮮明な見出しになる様子を確認しました。",
    evidence: ["公式記録映像の開始・途中・静止後のフレームを比較して確認。"],
  },
  takeaways: [
    "行全体を一度に表示せず、細かな帯に分けると、デジタルな出現の輪郭を作れます。",
    "帯の先端をそろえないことで、単純な横ワイプとは異なる細かなリズムが生まれます。",
    "演出が終わったら断片を残さず、完全に読める文字へ揃えます。",
  ],
  usability: {
    benefit:
      "短い見出しの登場に、特徴のあるリズムを与えられます。演出後は普通の文字として残るので、読む時間を制限しません。",
    caution:
      "長文を細かく切り替えると読みにくくなります。使うのは短い見出しに絞り、繰り返し自動再生しないようにします。",
    smallScreen:
      "表示ボタンとReplayで開始できます。下のスライダーは矢印キーでも動くので、途中の断片を止めて見比べられます。",
    reducedMotion: "細かな帯の移動を省き、完全な文字をすぐに表示します。",
  },
  implementation: [
    "描画用の文字をCanvasへ一度描き、5px高の帯ごとに異なる幅まで切り抜いて表示します。",
    "帯ごとに固定した遅延を持たせ、表示幅は6px単位へ丸めます。先端へ短い断片も描き、不揃いな縁を作ります。",
    "元の映像にある画面枠や文字全体の位置変化は再現せず、帯状マスクの仕組みを独立させています。",
    "IntersectionObserverで初回だけ開始します。Resetと再生中のrange操作で描画ループを中止し、最後は100%表示で停止します。",
  ],
  xPost:
    "細い横帯が少しずつ進み、ひとつの見出しになる。帯の先端をそろえないことで、デジタルな出現のリズムをつくる。演出が終われば、きちんと読める文字へ。",
  limitations: [
    "Awwwardsの公式記録映像を観察した独立実装です。元サイトの現在の操作や実装コードを検証したものではありません。",
    "原作の書体・ブランド名・背景・コードは使用していません。独自の短い文章と描画へ置き換えています。",
    "原作の画面全体の拡大や位置変化は含めず、帯状の文字表示だけを抜き出しています。",
  ],
};
