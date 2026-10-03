export const metadata = {
  slug: "character-xray",
  category: "text-reveals",
  title: "Character X-ray",
  subtitle: "文字の輪郭を、丸い窓でのぞく",
  description:
    "Casaの記録にある大きな2行の見出し、中央のアーチ、橙色のレンズへ構成を戻しました。レンズ内では、代替グリフの輪郭と実際のベジェ制御点が現れます。",
  trigger: "Pointer / glyph arrows / keyboard（追加）",
  duration: "追従90ms（estimated / 推定）",
  easing: "Local circular clipping / recorded sequence preview",
  status: "WIP",
  source: {
    name: "Casa di Solare",
    url: "https://casadisolare.com/",
    awardUrl: "https://www.awwwards.com/sites/casa-di-solare",
    awardDate: "2024-02-19",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/character-xray-effect-casa-di-solare",
    location: "文字の形と構造を見せるインタラクション",
    observation:
      "公式映像では、濃い色で塗られた文字にポインターを近づけると、オレンジ色の円が追従しました。円の内側だけが輪郭線と制御点の表示に変わり、外へ離すと元の塗りに戻ります。",
    evidence: [
      "公式記録映像の複数フレームを比較し、ポインターの位置と文字の見え方の変化を確認。",
    ],
  },
  takeaways: [
    "横並びの説明と単独のRをやめ、記録の中央アーチと5種類の文字へ戻しました。",
    "大きな橙色の円がアーチ外にも重なり、円内の文字だけを淡い輪郭へ置き換えます。",
    "制御点は適当な飾りではなく、同梱した代替グリフのベジェ輪郭から作っています。",
  ],
  usability: {
    benefit:
      "文字の形や構造を、文章を増やさずに比較できます。装飾としてだけでなく、書体の説明や図解の補助にも使えます。",
    caution:
      "レンズに隠した情報が重要な説明なら、通常の本文にも置く必要があります。ここでは見た目の違いを試すだけにしています。",
    smallScreen:
      "記録の画面比率を保って縮小します。外側のReplay/Reset、Tabからのキーボード操作を残しています。これらはデモに追加した支援で、原作の動作保証ではありません。",
    reducedMotion:
      "追従とレンズ半径の補間を省きます。円の中で表示が切り替わる仕組みはそのまま残します。",
  },
  implementation: [
    "OFLのCormorant Garamondを見出しに、Bodoni Moda / Cormorant / Noto Serifをグリフに使用。専用のSolare字形ではありません。",
    "ローカルのフォント輪郭からSVGパスと制御点を生成。記録の橙色レンズで同じ場所の第二表現を切り抜きます。",
    "左右の小さな矢印で文字を切り替えます。Replayは約13秒の記録の順序を試すデモ操作で、原作の自動切替と断定していません。",
    "矢印キー・PageUp/Down・Escape、連続Replay、Reset、abort、縮小表示を検証しました。",
  ],
  xPost:
    "文字に丸いレンズを重ねると、中だけが輪郭に変わる。元の形を残したまま、別の見方を見せる。マウスだけでなく左右のボタンと矢印キーでも試せる、文字のX-rayスタディ。",
  limitations: [
    "Solare専用書体の字形は未解決。Notoの漏、Bodoniのa/b、Cormorantの@、©の代替グリフは、原作の細い払い・リガチャ・輪郭と異なります。",
    "大見出しもCormorantによる代替。The/ofのフラリッシュと文字の重なりは一致しません。紙の微細なテクスチャも含みません。",
    "2026-10-03に公開サイトのStoryへ移動し、Nextクリックによる漏→aへの切替を確認しました。自動進行の有無は未確認。Replayの記録順序は追加の比較操作です。",
  ],
  timingDisclosure:
    "measured: 記録1600×1200。estimated: アーチx550〜1050/y358〜1086、レンズ直径416、追従90ms。observed: 公開サイトのNextクリックで漏→aを確認。unknown: 自動進行の有無・間隔。",
};
