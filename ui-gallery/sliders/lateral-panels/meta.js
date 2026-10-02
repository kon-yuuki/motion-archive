export const metadata = {
  slug: "lateral-panels",
  category: "sliders",
  title: "Lateral panel accordion",
  subtitle: "次の面が広がり、前の面は帯として残る",
  description:
    "選んだ色の面が横に広がり、前の内容は細い帯に縮まる。項目のつながりを保ちながら、タイトルと説明を切り替えるスライダーです。",
  trigger: "Panel buttons / swipe / arrows / keyboard",
  duration: "780ms panel / 700ms content",
  easing: "cubic-bezier(.2,.7,.1,1)",
  takeaways: [
    "次の面を広げるときに前の面を消さず、細い帯として残します。どこから来たか、ほかに何があるかが伝わります。",
    "外側のパネル幅だけを変え、文章は完成時の幅で配置すると、途中の不自然な折り返しを抑えられます。",
    "内容の移動をパネルの移動に合わせると、別ページへ飛んだように見えず、一続きに読み進められます。",
  ],
  limitations: [
    "Awwwards公式の要素紹介動画を観察しました。原作のホイールやドラッグの入力方式は動画から特定していません。",
    "原作の画像・サービス名・ロゴは使わず、独自の文章と抽象画へ置き換えています。",
    "幅、時間、色、イージング、選択ボタンはこの学習デモの設計です。原作の内部実装は取得していません。",
    "録画と2024年の受賞時のサイトが完全に同じ版か、スマホの配置は確認していません。",
  ],
  usability: {
    benefit:
      "隣の項目が色の帯として残るため、全体の中でどこを見ているかを見失いにくくなります。",
    caution:
      "帯だけでは何を選べるか伝わりにくい場合があります。項目名、番号、前後ボタンを残し、選択後に現在位置を読み上げます。",
    smallScreen:
      "細い帯を無理に押さなくても、前後ボタンと横スワイプで選べます。左右キー、Home・Endでも操作でき、縦スクロールを奪いません。",
    reducedMotion:
      "パネル幅と内容の移動を即時に切り替えます。色の帯、選択状態、操作方法は残ります。",
  },
  implementation: [
    "flex-growを変更し、一つだけが余った幅を引き受ける構成です。隣のパネルは一定幅を保ちます。",
    "ResizeObserverで選択時の内容幅を計算し、パネルが縮む途中も本文の折り返しを固定します。",
    "CSS transitionは最新の幅から次の幅へ向かうので、連打しても待ち行列を作りません。",
    "Replayは最初に瞬時に戻してから次を選びます。破棄時には描画予約、CSSアニメーション、Observerを解除します。",
  ],
  xPost:
    "次の面が広がり、前の面は細い帯として残る。全体の順序を見せたまま、内容を切り替える。色のパネルを使ったアコーディオン型スライダーの学習メモ。",
  status: "WIP",
  source: {
    name: "Akaru",
    url: "https://akaru.fr/expertises/",
    awardUrl: "https://www.awwwards.com/sites/akaru-2",
    awardDate: "2024-04-01",
    observedAt: "2026-10-02",
    location: "Expertises horizontal panel slider",
    observation:
      "Colored panels slide and exchange widths: the active one widens while its predecessor becomes a thin vertical strip. The title, service list, lower right image and numbered footer index update. Intermediate frames show old and new content overlapping in the active-width transition.",
    observationMode: "official recording observed",
    evidence: [
      "Observed recorded horizontal progression through expertise entries; recorded pointer remains over the page. The precise wheel/drag input is not established.",
      "Browser tab 25 screenshots 15:18:37 UTC and 15:18:51 UTC show changing band widths, titles and preview images",
      "Award browser tab 10 verified Apr 1, 2024 at 15:25:56 UTC",
      "Live homepage also rendered in tab 32, but this slider motion claim comes from the official recording",
    ],
    recordingUrl: "https://www.awwwards.com/inspiration/slider-akaru-2",
  },
};
