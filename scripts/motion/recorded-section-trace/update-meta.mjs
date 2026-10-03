import {writeFileSync,readFileSync} from 'node:fs';
for(const slug of ['gradient-frame-wipe','numeral-mask']){
 const {metadata:m}=await import(`../../../ui-gallery/section-transitions/${slug}/meta.js`);
 m.source.observedAt='2026-10-03';m.source.observationMode='full official recording observed and frame measured';
 if(slug==='gradient-frame-wipe'){
  m.subtitle='写真を縮め、白い幕を経由して次の写真へ';
  m.description='写真の画面が少し縮み、青緑から黄・錆色へ変わる枠が現れます。下から白い面で覆い、中央のマークを残して待ってから、幕の向こうに次の写真が出る段階を再現しています。';
  m.trigger='ページ遷移の記録 / デモは場面ボタン・Replay';
  m.duration='映像 5.483333秒（実測）/ 変化開始 約0.78秒、主要段階終了 約3.44秒（推定）';
  m.easing='記録の途中形を補間 / 元の easing・shader は不明';
  m.timingDisclosure='MP4は1600×1200・60fps・5.483333秒。時刻は映像時間です。約0.78秒をデモの開始に対応させ、写真の落ち着きまで3.72秒で再生します。元のクリック時刻・CSS時間・曲面shaderは確認できていません。';
  m.source.observation='Full-resolution frames show a 1210×730 inset source viewport. The outgoing photographic page scales to about 80%, a bottom-up white cover rises inside it, the framed inner page expands back to full size, the centered two-line mark holds, then the white curtain clears upward while a small curved photographic plane grows and settles behind it.';
  m.source.evidence=['Official downloaded MP4: measured 1600×1200, 60fps, 329 frames, 5.483333s','Source viewport measured approximately x195 y235 width1210 height730; frame colors sampled at x200','Same-state source/replica crops inspected at .86, 1.146, 1.432, 1.58, 1.719, 2.005, 2.578, 2.865, 3.151, 3.438 and 4.5 seconds'];
  m.takeaways=['写真を縮める段階、下から覆う段階、白い面で待つ段階を分けると、場面転換の順番が読めます。','色の枠は写真の外に残し、白い面が広がってから消します。最初から透明度だけを変える動きとは途中の形が違います。','次の写真はすぐ全画面にせず、小さな曲面から現れて落ち着く時間を作ります。'];
  m.limitations=['実際の公式記録映像を全体とフル解像度の途中フレームで観察しました。現在のライブサイトとの同一性、クリック対象、入力時刻は未確認です。','写真2点はこの再現用に生成したオリジナルの写真風素材です。元の写真・動画そのもの、人物、映像の中の動きは複製していません。','中央マークは元ロゴと同じ小さな二段・斜体・上段輪郭の配置を持つ film / room の代替です。元ロゴや専用書体は同梱していません。','出現時の曲がる写真はCanvasのメッシュで近似しています。元のWebGL/shader・曲率・easingは不明です。','進行段階と色は記録から比較していますが、フレーム間の補間、Replay、キーボード、動きを控える動作はこのデモの設計です。'];
  m.implementation=['枠の中の写真・白い面を一緒に中央基準で縮小し、約80%を保ってから100%へ戻します。','白い面は下から上へclip-pathで進めます。枠が消えた後、別の幕の退出と中央マークの上移動を始めます。','24相当以上の細かな写真メッシュを描き、出現時の反り、傾き、拡大の行き過ぎを別々に近似します。','ReplayはrequestAnimationFrameを一本だけ使います。Reset・別の場面・Abortは古い再生を中止し、遅い画像ロードは破棄した要素を更新しません。'];
  m.usability.smallScreen='場面ボタンはデモの外に置き、タップ・Tab・Enterで操作できます。写真の比率は狭い画面でも維持します。';
  m.usability.reducedMotion='写真の縮小、幕、曲面の拡大を省き、場面ボタンで瞬時に切り替えます。';
 }else{
  m.description='明るい黄色の上にある黒い8が、回転しながら拡大します。数字の穴が画面の外へ抜け、黒い面に変わってから、暗い引き出しの縁と右下の説明が順に上がってきます。';
  m.trigger='スクロール連動の公式記録 / デモは内部スクロール・範囲スライダー';
  m.duration='映像 7.583333秒（実測）/ デモReplay 6750ms（入力を含む観察軌跡の再生）';
  m.easing='8の輪郭と変形をフレーム適合 / 元の scroll・easing は不明';
  m.timingDisclosure='MP4は1600×1200・60fps・7.583333秒。録画上の8の輪郭へ回転・拡大・移動を適合しました。これは元のCSS値や一定時間のアニメーションを計測したものではなく、スクロール入力を含む映像の軌跡です。';
  m.source.observation='A black 8 starts at approximately x548–1049, y259–944 in the 1600×1200 recording. Enlargement includes clockwise rotation, moving the counters upper-right and lower-left before black coverage. A nearly black drawer enters from below on the left, then a compact white text block rises lower-right. The two reveals are staggered.';
  m.source.evidence=['Official MP4 measured 1600×1200, 60fps, 455 frames, 7.583333 seconds','Raster-measured numeral outline converted to an even-odd SVG mask; fit rotation/scale/translation at 0–3.176s','Measured image-fit examples: 1.588s scale2.81745 rotation8.3488deg; 1.985s scale5.75911 rotation21.5982deg; these are image registrations, not source CSS','Same-state captures compared at 0, .794, 1.588, 1.985, 2.382, 2.779, 3.176, 3.573, 4.367, 5.161, 5.955 and 6.749 seconds'];
  m.takeaways=['数字は大きくなるだけでなく、回転します。穴の向きと抜ける位置まで追うと、黒い面へのつながりが変わります。','黒くなった後もすぐに本文は出しません。先に暗い製品の輪郭、その後に右下の文章を出します。','細い金属の縁は黒い背景との小さな明度差で見せます。明るいイラストに替えると、動きの印象も変わります。'];
  m.limitations=['公式の全記録映像とフル解像度フレームを観察しました。現在のライブサイトの同一性、実際のスクロール距離・入力速度は未確認です。','8は観察フレームの黒い領域を輪郭化したSVGです。元サイトのフォントファイルやマスクアセットではありません。輪郭の平滑化と映像圧縮による誤差があります。','製品はこの再現用のオリジナル生成レンダーです。元のGRASS製品写真や製品構造そのものではなく、暗い材質・狭い縁・構図を合わせた代替です。','ほぼ黒い後半は変換を一意に推定できないため、3.176秒以降の拡大軌道を補っています。元shaderやeasingは不明です。','本文は同じ位置と行の密度を持つ説明用の代替文です。操作補助、逆スクロール、キーボード、動きを控える動作はデモ側の追加です。'];
  m.implementation=['fill-rule: evenoddのSVGで実際の8の外形と二つの穴を保持します。元の400×500の独自ループ形は使いません。','全画面の中央基準で回転・拡大・平行移動を組み合わせ、録画の途中形へ適合した値を補間します。','暗い引き出しと右下の本文は異なる開始時刻・上移動で出現します。背景との境界で単純に全体クロスフェードしません。','スクロールはデモ内部だけで扱います。手動入力でReplayを中止し、resizeは進捗を保持、destroyはObserver・イベント・フレームを解除します。'];
  m.usability.reducedMotion='数字の回転・拡大と内容の上移動を省き、進捗の前半は8、後半は落ち着いた製品画面を表示します。';
 }
 writeFileSync(`ui-gallery/section-transitions/${slug}/meta.js`,'export const metadata = '+JSON.stringify(m,null,2)+';\n');
 let html=readFileSync(`ui-gallery/section-transitions/${slug}/index.html`,'utf8');html=html.replace('独立した学習用実装 / Original placeholder assets','記録比較の学習用実装 / Original photographic substitutes');writeFileSync(`ui-gallery/section-transitions/${slug}/index.html`,html);
}
