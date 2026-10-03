export const metadata = {
  "slug": "free-drag-rail",
  "category": "sliders",
  "title": "Free-drag rail",
  "subtitle": "大きさの違うカードを、ひと続きに",
  "description": "9種類のカードが、操作する前からゆっくり左へ流れます。高さを変えて上端をそろえ、ドラッグで位置を直接動かす、ループするレールの再現です。",
  "trigger": "Idle / drag / swipe / arrows / keyboard",
  "duration": "Idle ≈52.4px/s / direct drag",
  "easing": "Idle linear / drag direct",
  "status": "WIP",
  "source": {
    "name": "REJOUICE®",
    "url": "https://www.rejouice.com/",
    "awardUrl": "https://www.awwwards.com/sites/rejouice-r-3",
    "awardDate": "2025-02-06",
    "observedAt": "2026-10-02",
    "location": "Homepage, Rejouice at a Glance, below client logos",
    "observation": "1180×757で9種類のwidgetが2組連結。幅440px、高さ325/440/503px、間隔30px、上端そろえ。操作前の262msの計測では左へ約52.4px/sで移動。ドラッグ後の短い観察では停止しており、再開条件は未確認。",
    "observationMode": "live rendered-DOM measurements and screenshots",
    "evidence": [
      "2026-10-02: rejouice-rail-dom.json records all 18 widget boxes and two 4237.59375px groups.",
      "rejouice-autoplay-trace.json: left -1942.4866→-1956.2164px over 262ms before input.",
      "rejouice-drag-settle.json and pointer-out-trace.json: no observed momentum/restart during short post-drag samples."
    ]
  },
  "takeaways": [
    "高さを変えても上端をそろえると、異なる種類の情報を同じ列として読めます。",
    "繰り返す2組のカードをつなぎ、操作前から横に続く構造を見せます。",
    "ドラッグの間は自動移動を止め、指の移動量を直接反映します。"
  ],
  "limitations": [
    "カード寸法・9種類の順序・2組構成・自動移動速度は、2026年10月のライブ画面の計測に基づきます。受賞時と同じ版かは未確認です。",
    "写真はリポジトリ内の既存素材、文章と名前はデモ用へ置換しています。元の写真・ロゴ・実績数値は使用していません。",
    "自動移動速度は262msの短い測定値です。ドラッグ後の再開条件は未確認のため、このデモではPause/Playで明示的に再開します。",
    "600px以下の寸法、矢印・キーボード・停止ボタン・画面外停止はデモの補助機能です。モバイル版の完全一致は主張していません。"
  ],
  "usability": {
    "benefit": "異なる情報を同じ列で見比べられます。自動移動は停止でき、ドラッグ以外でも送れます。",
    "caution": "流れ続ける内容は読みづらくなるため、操作やフォーカスで停止します。自動で再開せずPlayを用意します。",
    "smallScreen": "縦に動かした場合はページスクロールを優先。横ドラッグ、左右キー、Home・End、前後ボタンでも選べます。",
    "reducedMotion": "自動移動を止めます。直接ドラッグ、矢印、キーボード操作と位置表示は残します。"
  },
  "implementation": [
    "2組の9枚のカードをtransformで移動。1組分の幅で剰余を取り、端でクランプしません。",
    "rAFの経過時間に測定速度を掛け、描画頻度に依存しない移動量を計算します。",
    "pointer captureで直接ドラッグし、横6pxの意図が出るまで縦スクロールを妨げません。観測のない慣性は追加していません。",
    "複製側はaria-hidden/inert。Abort、Reset、非表示、画面外で描画を停止し、Observerを破棄します。"
  ],
  "xPost": "9種類のカードが、操作する前からゆっくり左へ流れます。高さを変えて上端をそろえ、ドラッグで位置を直接動かす、ループするレールの再現です。"
};
