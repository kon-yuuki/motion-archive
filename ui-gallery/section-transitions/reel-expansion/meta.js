export const metadata = {
  "status": "WIP",
  "source": {
    "name": "Exo Ape",
    "url": "https://www.exoape.com/",
    "awardUrl": "https://www.awwwards.com/sites/exo-ape",
    "awardDate": "2022-05-23",
    "observedAt": "2026-10-02",
    "observationMode": "live interaction / rendered DOM measurements",
    "location": "Homepage / Work in motion / Play Reel セクション",
    "observation": "1180×757画面でセクション高1514px、固定表示757px。映像はscale .25から1、opacity .3で一定。見出しは118px、左右±236px（画面幅の20%）から0へ収束。セクション上端−364.235pxでscale .6109、文字±122.447pxとなり、線形のスクロール対応と一致しました。",
    "evidence": [
      "初期・途中・終盤の画面と変換行列を取得。",
      "上端−742.734pxでscale .9859、文字±4.447px。逆スクロールも同じ経路を戻ることを確認。"
    ]
  },
  "limitations": [
    "現行公開版を2026年10月2日に観察しています。2022年の受賞版と同一とは確認していません。",
    "原作のLausanneは同梱せず、既存のLibre Franklin 400（見た目の太さを近似）で近似しています。文字の形と幅には差が残ります。",
    "独立したデモ領域へ正規化しています。スマホの配置は追加した対応で、原作のモバイル実装を実測したものではありません。",
    "原作リールは同梱せず、リポジトリ内の人物映像へ置換。暗さは原作のopacity .3を保ちます。",
    "動画内容と専用書体は一致しません。再生ボタンや動画モーダルは対象外です。"
  ],
  "title": "Reel expansion",
  "subtitle": "映像が広がり、文字が中央へ集まる",
  "description": "暗い画面の中央で、映像が25%から全画面へ均等に広がります。離れていたPlayとReelは中央へ集まる。Exo Apeのスクロール連動を、実測の比率で確かめるデモです。",
  "trigger": "Scroll / progress slider",
  "duration": "1画面分のスクロール（実測）",
  "easing": "Linear scroll mapping（実測）",
  "timingDisclosure": "scale=.25+.75p、文字offset=±.2×画面幅×(1-p)、p=スクロール量/表示高。いずれも実測3相と一致。Replayの1.8秒は観察を助ける任意の自動スクロール時間です。",
  "takeaways": [
    "幅と高さを別々に伸ばさず、同じ倍率で映像全体を拡大します。",
    "PlayとReelは左右へ開かず、広がる映像の中央へ収束します。",
    "上部ラベルと下部の文章は画面内の同じ位置に留まります。"
  ],
  "usability": {
    "benefit": "スクロールと映像の面積が連続して対応し、現在位置を追いやすくします。",
    "caution": "映像・文字・余白が別々の比率になると、原作と異なる場面転換になります。",
    "smallScreen": "内側の縦スクロール、上下キー、下のスライダーで操作。モバイルの表示高は追加調整です。",
    "reducedMotion": "映像の拡大と文字の横移動、動画の自動再生を止め、静止した完成構図を表示します。"
  },
  "implementation": [
    "表示高の2倍のrunwayに1画面のstickyを置きます。",
    "videoのtransform:scaleを.25→1へ、見出しを±20%幅→0へ。角丸は付けません。",
    "新しいスクロール入力はReplayを中断。ResizeObserver・動画・RAFは破棄時に止めます。"
  ],
  "xPost": "映像は25%から全画面へ。文字は外へ開かず、中央へ集まる。実際のスクロール中間値から組み直したリールのスタディ。",
  "slug": "reel-expansion",
  "category": "section-transitions"
};
