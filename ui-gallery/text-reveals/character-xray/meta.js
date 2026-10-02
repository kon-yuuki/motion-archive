export const metadata = {
  slug: "character-xray",
  category: "text-reveals",
  title: "Character X-ray",
  subtitle: "文字の輪郭を、丸い窓でのぞく",
  description:
    "文字の上に丸いレンズを重ねると、塗りつぶされた形の内側だけが線と制御点へ切り替わる。文字を別の見方で見せる、ポインター追従のスタディです。",
  trigger: "Hover / pointer / keyboard / range",
  duration: "レンズ表示 180ms・追従 約80ms",
  easing: "Exponential pointer interpolation",
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
    "同じ場所に二つの文字表現を重ね、レンズの中だけを切り替えます。",
    "レンズが文字全体を動かさないので、元の形と内部の輪郭を見比べられます。",
    "円が動く量と表示のフェードを分けると、細かな操作でも軽い反応になります。",
  ],
  usability: {
    benefit:
      "文字の形や構造を、文章を増やさずに比較できます。装飾としてだけでなく、書体の説明や図解の補助にも使えます。",
    caution:
      "レンズに隠した情報が重要な説明なら、通常の本文にも置く必要があります。ここでは見た目の違いを試すだけにしています。",
    smallScreen:
      "固定ボタンと位置スライダーを用意しています。図をTabで選択し、矢印キーでもレンズを動かせます。Escapeで初期状態へ戻します。",
    reducedMotion:
      "追従の遅れと出入りのフェードを省きます。円の中で表示が切り替わる仕組みはそのまま残します。",
  },
  implementation: [
    "独自に描いたRのSVGパスを、塗りの面と輪郭の面で共有します。制御点もこのデモ用の図形です。",
    "輪郭側をSVG clipPathのcircleで切り抜き、円のcx・cyをポインター位置へ合わせます。",
    "画面座標をviewBoxの520×360へ変換することで、画面サイズが変わっても同じ場所を指せます。",
    "フォーカス・固定ボタン・range入力も同じ座標更新を通します。Replayと追従の描画ループは中断時に止めます。",
  ],
  xPost:
    "文字に丸いレンズを重ねると、中だけが輪郭に変わる。元の形を残したまま、別の見方を見せる。マウスだけでなくスライダーと矢印キーでも試せる、文字のX-rayスタディ。",
  limitations: [
    "公式の記録映像から観察した独立実装です。元サイトの現在の操作や実装コードを検証したものではありません。",
    "原作の書体と図形は使用せず、このデモ専用のSVG文字と輪郭へ置き換えています。",
    "追従速度・影響する範囲・キーボード操作は、このデモの調整値と追加仕様です。",
  ],
};
