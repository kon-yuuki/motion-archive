export const metadata = {
  "status": "WIP",
  "source": {
    "name": "Exo Ape",
    "url": "https://www.exoape.com/",
    "awardUrl": "https://www.awwwards.com/sites/exo-ape",
    "awardDate": "2022-05-23",
    "observedAt": "2026-10-02",
    "observationMode": "live interaction / rendered DOM measurements",
    "location": "Menu 内、主リンクに連動する左側の縦長画像",
    "observation": "1180×757画面で枠はx233.531/y200.688、251.563×355.625px。背景#0d0e13。Studioへの切替では観測185ms時点でopacity .2127、scale約1.236、rotation約5.51°、861ms時点でopacity .9665、scale約1.010、rotation約.235°。画像は枠内でクリップされ、前後のopacityが入れ替わります。",
    "evidence": [
      "Work→Studio→Newsの実操作を連続取得。",
      "画像transform行列を分解し、回転と拡大がopacityに連動することを確認。"
    ]
  },
  "limitations": [
    "現行公開版を2026年10月2日に観察しています。2022年の受賞版と同一とは確認していません。",
    "原作のLausanneは同梱せず、既存のLibre Franklin 400（見た目の太さを近似）で近似しています。文字の形と幅には差が残ります。",
    "独立したデモ領域へ正規化しています。スマホの配置は追加した対応で、原作のモバイル実装を実測したものではありません。",
    "原作の人物・オフィス・アワード写真は再配布せず、既存の人物・彫刻写真へ置換。写真の内容と切替前後の明暗は完全一致しません。",
    "観測値に合わせた動作モデルです。原作のプログラムそのものを取得したものではありません。",
    "フォーカスとタップは追加対応です。クリックしても他ページへ移動しません。"
  ],
  "title": "Menu crossfade",
  "subtitle": "縦長の枠の中で回転が落ち着く",
  "description": "Exo Ape のメニューで観察した、写真の重なりと回転・縮小。枠の比率と位置は固定し、入る画像を大きく傾けた状態から静かに落ち着かせます。",
  "trigger": "Hover / focus / tap",
  "duration": "約1秒（時系列観察からの近似）",
  "easing": "Cubic-out fit（原作の正確なeaseは未取得）",
  "timingDisclosure": "枠・色・下線は実測値。画像のscale=1+.3×(1-opacity)、rotation=7°×(1-opacity)は観測行列との一致から採用。開始1.3/7°と1秒cubic-outは近似です。計測開始の遅れがあり、原作の正確なduration/easeは断定していません。",
  "takeaways": [
    "画像の枠は1228:1736の縦長比率を維持します。",
    "単なるフェードではなく、次の画像の回転と拡大も同時に収束します。",
    "途中で別の項目へ移っても、その時点のopacityを引き継ぎます。"
  ],
  "usability": {
    "benefit": "文字を固定しながら、行き先の雰囲気を画像で伝えられます。",
    "caution": "写真の明暗・質感・縦横比を変えると、同じフェードでも見え方が変わります。",
    "smallScreen": "タップ・Tab・Enter・Spaceで画像を確認。狭い画面でも縦長比率を保ちます。",
    "reducedMotion": "回転・拡大・フェードを省き、画像を直ちに切り替えます。"
  },
  "implementation": [
    "前後の画像を同一フレームに重ね、incomingのz-indexを最前面にします。",
    "opacity・scale・rotationを一つの進捗から更新。途中切替では現在値を新しい開始値へ引き継ぎます。",
    "Resetは全画像を確定状態に戻し、破棄時はRAF・タイマー・イベントを解除します。"
  ],
  "xPost": "同じ枠でも、フェードだけでは同じ動きにならない。写真が重なり、回転と拡大が同時に落ち着くメニューを時系列で追う。",
  "slug": "menu-crossfade",
  "category": "image-reveals"
};
