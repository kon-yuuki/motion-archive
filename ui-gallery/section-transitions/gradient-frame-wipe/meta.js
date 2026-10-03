export const metadata = {
  "slug": "gradient-frame-wipe",
  "category": "section-transitions",
  "title": "Gradient frame wipe",
  "subtitle": "写真を縮め、白い幕を経由して次の写真へ",
  "description": "写真の画面が少し縮み、青緑から黄・錆色へ変わる枠が現れます。下から白い面で覆い、中央のマークを残して待ってから、幕の向こうに次の写真が出る段階を再現しています。",
  "trigger": "ページ遷移の記録 / デモは場面ボタン・Replay",
  "duration": "映像 5.483333秒（実測）/ 変化開始 約0.78秒、主要段階終了 約3.44秒（推定）",
  "easing": "記録の途中形を補間 / 元の easing・shader は不明",
  "status": "WIP",
  "source": {
    "name": "Ciel Rose",
    "url": "https://cielrose.tv/",
    "awardUrl": "https://www.awwwards.com/sites/ciel-rose",
    "awardDate": "2025-02-20",
    "observedAt": "2026-10-03",
    "location": "Global page navigation transition",
    "observation": "Full-resolution frames show a 1210×730 inset source viewport. The outgoing photographic page scales to about 80%, a bottom-up white cover rises inside it, the framed inner page expands back to full size, the centered two-line mark holds, then the white curtain clears upward while a small curved photographic plane grows and settles behind it.",
    "observationMode": "full official recording observed and frame measured",
    "recordingUrl": "https://www.awwwards.com/inspiration/global-transition-ciel-rose",
    "evidence": [
      "Official downloaded MP4: measured 1600×1200, 60fps, 329 frames, 5.483333s",
      "Source viewport measured approximately x195 y235 width1210 height730; frame colors sampled at x200",
      "Same-state source/replica crops inspected at .86, 1.146, 1.432, 1.58, 1.719, 2.005, 2.578, 2.865, 3.151, 3.438 and 4.5 seconds"
    ]
  },
  "takeaways": [
    "写真を縮める段階、下から覆う段階、白い面で待つ段階を分けると、場面転換の順番が読めます。",
    "色の枠は写真の外に残し、白い面が広がってから消します。最初から透明度だけを変える動きとは途中の形が違います。",
    "次の写真はすぐ全画面にせず、小さな曲面から現れて落ち着く時間を作ります。"
  ],
  "limitations": [
    "実際の公式記録映像を全体とフル解像度の途中フレームで観察しました。現在のライブサイトとの同一性、クリック対象、入力時刻は未確認です。",
    "写真2点はこの再現用に生成したオリジナルの写真風素材です。元の写真・動画そのもの、人物、映像の中の動きは複製していません。",
    "中央マークは元ロゴと同じ小さな二段・斜体・上段輪郭の配置を持つ film / room の代替です。元ロゴや専用書体は同梱していません。",
    "出現時の曲がる写真はCanvasのメッシュで近似しています。元のWebGL/shader・曲率・easingは不明です。",
    "進行段階と色は記録から比較していますが、フレーム間の補間、Replay、キーボード、動きを控える動作はこのデモの設計です。"
  ],
  "usability": {
    "benefit": "一度明るい面で区切るため、異なる画像やレイアウトへの切り替えを落ち着いて見られます。",
    "caution": "毎回長い覆いを挟むと待たされる感覚が強くなります。主要な場面転換へ絞り、連打したときに古い遷移をためないようにします。",
    "smallScreen": "場面ボタンはデモの外に置き、タップ・Tab・Enterで操作できます。写真の比率は狭い画面でも維持します。",
    "reducedMotion": "写真の縮小、幕、曲面の拡大を省き、場面ボタンで瞬時に切り替えます。"
  },
  "implementation": [
    "枠の中の写真・白い面を一緒に中央基準で縮小し、約80%を保ってから100%へ戻します。",
    "白い面は下から上へclip-pathで進めます。枠が消えた後、別の幕の退出と中央マークの上移動を始めます。",
    "24相当以上の細かな写真メッシュを描き、出現時の反り、傾き、拡大の行き過ぎを別々に近似します。",
    "ReplayはrequestAnimationFrameを一本だけ使います。Reset・別の場面・Abortは古い再生を中止し、遅い画像ロードは破棄した要素を更新しません。"
  ],
  "xPost": "次の画像を直接すべり込ませる代わりに、一枚の明るい面で画面をつなぐ。色の枠が細くなる時間と、内容を入れ替える時間を分けたページ転換のスタディ。",
  "timingDisclosure": "MP4は1600×1200・60fps・5.483333秒。時刻は映像時間です。約0.78秒をデモの開始に対応させ、写真の落ち着きまで3.72秒で再生します。元のクリック時刻・CSS時間・曲面shaderは確認できていません。"
};
