export const metadata = {
  slug: "scan-band-reveal",
  category: "text-reveals",
  title: "Scan-band reveal",
  subtitle: "細かな横帯が、ひとつの文字へつながる",
  description:
    "Fine Thoughtの記録に合わせ、右下の大きなFine / Thought、左上の小さなコピー、画面全体のASCII線場を再構成。要素ごとに別の開始時刻で横帯が組み上がります。",
  trigger: "Page entry / Replay / Enter（追加）",
  duration: "約3,220ms（estimated / 記録の区間）",
  easing: "Per-element clocks / irregular horizontal fronts",
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
    "小コピー、Thought、Fineを同時に出さず、それぞれの開始を分けています。",
    "文字の左側はつながり、進む先端だけが不揃いな横帯と断片になります。",
    "細いASCIIの線場は文字より控えめにし、右下に大きな余白の少ない配置を戻しました。",
  ],
  usability: {
    benefit:
      "短い見出しの登場に、特徴のあるリズムを与えられます。演出後は普通の文字として残るので、読む時間を制限しません。",
    caution:
      "長文を細かく切り替えると読みにくくなります。使うのは短い見出しに絞り、繰り返し自動再生しないようにします。",
    smallScreen:
      "記録の画面比率を保って縮小します。外側のReplay/Reset、Tabからのキーボード操作を残しています。これらはデモに追加した支援で、原作の動作保証ではありません。",
    reducedMotion: "細かな帯の移動を省き、完全な文字をすぐに表示します。",
  },
  implementation: [
    "公開サイトを実際に表示し、大文字の計算済み書体neue-haas-grotesk-display / weight600を確認。ライセンスされた代替Nimbus Sans Boldをローカルに使用します。",
    "記録内のウィンドウ位置を1600×1200の座標で再現。記録の外側の枠は映像上の構図で、現在のブラウザー全画面とは別です。",
    "コピー2行と大見出し2行を別Canvasへ描画し、独立の時刻と長さで8〜23pxの帯を表示します。",
    "実際に見える背景がASCIIの連続列なので、単なる格子ではなく記号の行を組み直しました。文字列の配置は近似です。",
    "Replay/Reset・途中seek・縮小・低モーション・Enter/Escape・abortの処理を検証しています。",
  ],
  xPost:
    "細い横帯が少しずつ進み、ひとつの見出しになる。帯の先端をそろえないことで、デジタルな出現のリズムをつくる。演出が終われば、きちんと読める文字へ。",
  limitations: [
    "原作のNeue Haas Groteskに対しNimbus Sans Boldを使用。字形・字間と描画密度は完全一致しません。",
    "ASCIIの並びと横帯の順番は独立した決定的な近似。記録の全ピクセルを一致させたものではありません。",
    "現在の公開サイトは全画面ですが、比較用デモは記録で見えるウィンドウ枠を含みます。WIPでユーザーの受け入れ確認は未完了です。",
  ],
  timingDisclosure:
    "measured: 記録1600×1200。estimated: 小コピー650/730ms、Thought1040ms、Fine1720msから開始、約3秒でほぼ完成。unknown: 原作の各帯の乱数・イージング。",
};
