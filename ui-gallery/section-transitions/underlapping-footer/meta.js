export const metadata = {
  "status": "WIP",
  "source": {
    "name": "Exo Ape",
    "url": "https://www.exoape.com/",
    "awardUrl": "https://www.awwwards.com/sites/exo-ape",
    "awardDate": "2022-05-23",
    "observedAt": "2026-10-02",
    "observationMode": "live interaction / rendered DOM measurements",
    "location": "Spread the News と黒い Our Story フッターの境界",
    "observation": "1180×757画面でフッター高738.406px、背景#070707、文字#e0ccbb。境界y439.060のとき内容transform−210.233px、背景−191.121px。境界y22.709では内容−2.058px、背景−1.871px。残るスクロール量に対し文字−.5倍、背景−1/2.2倍の別移動と一致しました。",
    "evidence": [
      "境界の途中と終端でfooter・container・backgroundの矩形と行列を取得。",
      "白面の境界で文字と背景が切り取られること、境界に影がないことを画像比較。"
    ]
  },
  "limitations": [
    "現行公開版を2026年10月2日に観察しています。2022年の受賞版と同一とは確認していません。",
    "原作のLausanneは同梱せず、既存のLibre Franklin 400（見た目の太さを近似）で近似しています。文字の形と幅には差が残ります。",
    "独立したデモ領域へ正規化しています。スマホの配置は追加した対応で、原作のモバイル実装を実測したものではありません。",
    "原作の軌道動画は再配布せず、暗い球・石の円盤・発光する軌道をCanvasで独自制作。材質感を保つ代替で、原作動画の完全複製ではありません。",
    "住所・文章は学習用の記述へ置換。表示中の文字はリンクとして外部へ送信しません。"
  ],
  "title": "Underlapping footer",
  "subtitle": "文字と背景を別の速さで引き出す",
  "description": "白い面が上へ抜けると、黒いフッターの文字と立体素材が現れます。一つのsticky面ではなく、文字と背景を別々の距離で動かす、Exo Apeの境界のスタディです。",
  "trigger": "Scroll / reveal slider",
  "duration": "フッター高のスクロールに連動",
  "easing": "Linear / text −.5 / backdrop −1÷2.2",
  "timingDisclosure": "文字のcounter-translationは残り距離×−.5、背景は×−1/2.2。2相の実測値から再構成。Replayの1.8秒と代替の軌道素材の動きは原作の時間値ではありません。",
  "takeaways": [
    "白い面の境界は動きますが、奥の文字はその半分の速さで進みます。",
    "背景は文字と異なる変換を持ち、奥行きの差が残ります。",
    "フッターの黒い矩形で上側を切り取り、白面の下に内容が隠れているように見せます。"
  ],
  "usability": {
    "benefit": "ページの終わりを、急な切替ではなく連続した境界として見せられます。",
    "caution": "隠れている操作部品にフォーカスが入らないよう、このデモの奥面は読める内容だけにしています。",
    "smallScreen": "内側の縦スクロールとスライダーに対応。Tabで領域を選び、上下キーでも確認できます。",
    "reducedMotion": "追加のパララックスと軌道アニメーションを止め、通常の縦スクロールで読む構成を残します。"
  },
  "implementation": [
    "白いセクションとフッターを通常フローで並べ、footerにoverflow:hiddenを設定。",
    "内容・背景へ別のtranslateYを与え、元の画面の位置・比率を正規化。sticky一枚の移動は使いません。",
    "軌道素材は画面外・非表示時に停止。Reset・destroyでスクロールRAFとCanvas RAF、Observerを解除します。"
  ],
  "xPost": "ページの下に隠れたフッター。文字と背景を別の速さで動かすと、境界の向こうに奥行きが生まれる。実測比率で組み直すスクロールのスタディ。",
  "slug": "underlapping-footer",
  "category": "section-transitions"
};
