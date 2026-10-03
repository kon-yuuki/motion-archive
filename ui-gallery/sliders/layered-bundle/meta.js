export const metadata = {
  "slug": "layered-bundle",
  "category": "sliders",
  "title": "Layered bundle swap",
  "subtitle": "変わらないベースと、重なって入れ替わる組み合わせ",
  "description": "左のベースを固定し、右のセット全体を縮小・回転・移動して切り替えます。5種類を循環し、セット内の容器と袋が別の弾む動きで整います。",
  "trigger": "Previous / next / swipe / keyboard",
  "duration": "Outer 300ms / pieces 950ms in, 600ms out",
  "easing": "Outer: ease / pieces: measured spring linear()",
  "takeaways": [
    "固定する左側と変化する右側を分け、組み合わせを見比べやすくします。",
    "セット全体の短い回転・縮小と、中の袋が整う弾む動きを重ねます。",
    "タイトルはセットと別のレイヤーで動かし、中央の読みやすい位置を保ちます。"
  ],
  "limitations": [
    "2026年10月のライブサイトのDOMと途中フレームを計測しています。受賞時と同じ版かは未確認です。",
    "More Nutritionの自主制作ケーススタディが出典です。販売機能は再現していません。",
    "ロゴ・商品写真・商品名は、同じ容器と袋の比率で描いた独自のパッケージへ置換。実在商品の宣伝や成分表示ではありません。",
    "外側の300msと内部の950/600msは別の動きです。元の素材の質感、書体、モバイル配置は完全一致しません。",
    "連打時の最新選択への連続切替、キー操作、Resetと破棄処理は独自の補助実装です。"
  ],
  "usability": {
    "benefit": "共通するベースを残し、変わるセットへ注意を向けます。5件目の後も先頭へ戻って比較を続けられます。",
    "caution": "外側は短く切り替え、内部の余韻は後から整います。押せない端を作らず、現在の番号を読み上げます。",
    "smallScreen": "44px以上の前後ボタン、横スワイプ、左右キー、Home・Endで選べます。",
    "reducedMotion": "移動・回転・拡縮を省き、最新の組み合わせへ即座に切り替えます。"
  },
  "implementation": [
    "外側のセットと中央のタイトルを別々に重ね、300ms easeでtransformとopacityを変えます。",
    "内部の容器と袋は独立したrotate/scaleプロパティを使い、計測した950msのlinear()カーブを重ねます。",
    "選択番号は5件で循環。見えている候補への再操作はCSSの現在値から続き、見えていない候補だけ入口へ戻します。",
    "Resetは全transitionを即時化し、destroy/Abortでイベント・タイマー・実行中アニメーションを破棄します。"
  ],
  "xPost": "左のベースを固定し、右のセット全体を縮小・回転・移動して切り替えます。5種類を循環し、セット内の容器と袋が別の弾む動きで整います。",
  "status": "WIP",
  "source": {
    "name": "More Nutrition",
    "url": "https://more-nutrition.webflow.io/",
    "awardUrl": "https://www.awwwards.com/sites/more-nutrition",
    "awardDate": "2025-11-03",
    "observedAt": "2026-10-02",
    "location": "Chunky Flavour section below reviews",
    "observation": "5種類のループするスライダー。外側は300ms easeで、前進時の新セットはtranslate(50%,15%) rotate(35deg) scale(.6)から、旧セットはtranslate(-60%,15%) rotate(-15deg) scale(.35)へ。内部の容器と2袋はscale .75→1、回転0→-5.5/8/28deg。タイトルは別レイヤーの±40%移動・scale .5で同時に切り替わります。",
    "observationMode": "live rendered-DOM measurements and screenshots",
    "evidence": [
      "more-bundle-dom.json and more-next-trace.json: five IDs, whole-set transforms, title transforms, 300ms CSS transition.",
      "more-active-pieces-dom.json: measured 295×250.922px tub and two 266.312×194.938px sachets at 1180px viewport.",
      "more-outer-inner-timing.json: outer ease; inner entry 950ms linear() spring, exit 600ms cubic-bezier(.32,.72,0,1), opacity 250ms ease-out."
    ]
  }
};
