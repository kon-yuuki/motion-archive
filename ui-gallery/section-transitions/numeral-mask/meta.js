export const metadata = {
  "slug": "numeral-mask",
  "category": "section-transitions",
  "title": "Numeral mask",
  "subtitle": "数字の面が、そのまま次の背景になる",
  "description": "明るい黄色の上にある黒い8が、回転しながら拡大します。数字の穴が画面の外へ抜け、黒い面に変わってから、暗い引き出しの縁と右下の説明が順に上がってきます。",
  "trigger": "スクロール連動の公式記録 / デモは内部スクロール・範囲スライダー",
  "duration": "映像 7.583333秒（実測）/ デモReplay 6750ms（入力を含む観察軌跡の再生）",
  "easing": "8の輪郭と変形をフレーム適合 / 元の scroll・easing は不明",
  "status": "WIP",
  "source": {
    "name": "GRASS Vionaro V8",
    "url": "https://vionaro-v8.com/en/home#highlights",
    "awardUrl": "https://www.awwwards.com/sites/grass-vionaro-v8",
    "awardDate": "2023-01-16",
    "observedAt": "2026-10-03",
    "location": "Highlights section, bright numeral 8 to dark product story",
    "observation": "A black 8 starts at approximately x548–1049, y259–944 in the 1600×1200 recording. Enlargement includes clockwise rotation, moving the counters upper-right and lower-left before black coverage. A nearly black drawer enters from below on the left, then a compact white text block rises lower-right. The two reveals are staggered.",
    "observationMode": "full official recording observed and frame measured",
    "recordingUrl": "https://www.awwwards.com/inspiration/section-transition-8-grass-vionaro-v8",
    "evidence": [
      "Official MP4 measured 1600×1200, 60fps, 455 frames, 7.583333 seconds",
      "Raster-measured numeral outline converted to an even-odd SVG mask; fit rotation/scale/translation at 0–3.176s",
      "Measured image-fit examples: 1.588s scale2.81745 rotation8.3488deg; 1.985s scale5.75911 rotation21.5982deg; these are image registrations, not source CSS",
      "Same-state captures compared at 0, .794, 1.588, 1.985, 2.382, 2.779, 3.176, 3.573, 4.367, 5.161, 5.955 and 6.749 seconds"
    ]
  },
  "takeaways": [
    "数字は大きくなるだけでなく、回転します。穴の向きと抜ける位置まで追うと、黒い面へのつながりが変わります。",
    "黒くなった後もすぐに本文は出しません。先に暗い製品の輪郭、その後に右下の文章を出します。",
    "細い金属の縁は黒い背景との小さな明度差で見せます。明るいイラストに替えると、動きの印象も変わります。"
  ],
  "limitations": [
    "公式の全記録映像とフル解像度フレームを観察しました。現在のライブサイトの同一性、実際のスクロール距離・入力速度は未確認です。",
    "8は観察フレームの黒い領域を輪郭化したSVGです。元サイトのフォントファイルやマスクアセットではありません。輪郭の平滑化と映像圧縮による誤差があります。",
    "製品はこの再現用のオリジナル生成レンダーです。元のGRASS製品写真や製品構造そのものではなく、暗い材質・狭い縁・構図を合わせた代替です。",
    "ほぼ黒い後半は変換を一意に推定できないため、3.176秒以降の拡大軌道を補っています。元shaderやeasingは不明です。",
    "本文は同じ位置と行の密度を持つ説明用の代替文です。操作補助、逆スクロール、キーボード、動きを控える動作はデモ側の追加です。"
  ],
  "usability": {
    "benefit": "前のセクションの象徴的な形を引き継ぎ、次の内容への連続性を作れます。",
    "caution": "数字が大きく動いている間は長い文章が読みにくくなります。大きな形だけを動かし、次の説明は停止に近い状態で見せます。",
    "smallScreen": "タッチの縦スクロール、領域を選んだ後の上下キー、進み具合スライダー、次のセクションボタンで同じ状態へ進めます。ページ全体のスクロールは横取りしません。",
    "reducedMotion": "数字の回転・拡大と内容の上移動を省き、進捗の前半は8、後半は落ち着いた製品画面を表示します。"
  },
  "implementation": [
    "fill-rule: evenoddのSVGで実際の8の外形と二つの穴を保持します。元の400×500の独自ループ形は使いません。",
    "全画面の中央基準で回転・拡大・平行移動を組み合わせ、録画の途中形へ適合した値を補間します。",
    "暗い引き出しと右下の本文は異なる開始時刻・上移動で出現します。背景との境界で単純に全体クロスフェードしません。",
    "スクロールはデモ内部だけで扱います。手動入力でReplayを中止し、resizeは進捗を保持、destroyはObserver・イベント・フレームを解除します。"
  ],
  "xPost": "数字の8が大きくなり、黒い線がそのまま次のセクションの背景になる。拡大の中心と本文が出る順番を調整して、形の意味を場面転換へつなぐスタディ。",
  "timingDisclosure": "MP4は1600×1200・60fps・7.583333秒。録画上の8の輪郭へ回転・拡大・移動を適合しました。これは元のCSS値や一定時間のアニメーションを計測したものではなく、スクロール入力を含む映像の軌跡です。"
};
