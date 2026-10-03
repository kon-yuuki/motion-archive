export const metadata = {
  slug: "proximity-weight",
  category: "text-reveals",
  title: "Proximity weight",
  subtitle: "近い文字だけ、太さが変わる",
  description:
    "Casa di Solareの記録に合わせ、クリーム色の画面・大文字4行・ハイコントラストのセリフ書体・局所的な太さの変化を組み直したWIPです。",
  trigger: "Pointer proximity / keyboard（追加）",
  duration: "追従100ms（estimated / 推定）",
  easing: "局所 weight 300–470（代替書体で調整）",
  status: "WIP",
  source: {
    name: "Casa di Solare",
    url: "https://casadisolare.com/",
    awardUrl: "https://www.awwwards.com/sites/casa-di-solare",
    awardDate: "2024-02-19",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/variable-type-hover-effect-casa-di-solare",
    location: "中央に組まれた4行の文字のホバー効果",
    observation:
      "公式映像では、薄いセリフ書体の段落上をポインターが通ると、近くの文字だけが太くなります。太い範囲がポインターを追い、通り過ぎた文字は細い状態へ戻りました。",
    evidence: [
      "公式記録映像の複数フレームを比較し、ポインターの位置と文字の見え方の変化を確認。",
    ],
  },
  takeaways: [
    "文字の拡大ではなく、可変フォントのウェイト軸を動かして線の厚さを変えます。",
    "近さをなだらかな強弱へ変えることで、太い部分がポインターと一緒に移動します。",
    "文字の送り幅を固定し、太さが変わっても行や単語の位置が大きく揺れないようにします。",
  ],
  usability: {
    benefit:
      "読む位置や操作位置に、静かな反応を加えられます。全文を読めるまま、触れている場所を視覚的に強調できます。",
    caution:
      "行組みまで動いてしまうと、文字を追うのが疲れやすくなります。動かすのは文字の太さだけにし、短い装飾文へ限定します。",
    smallScreen:
      "画面比率を維持して縮小します。Tab・矢印キーとタップ、外側のReplay / Resetから操作できます。これらはデモ側の追加仕様です。",
    reducedMotion:
      "太さの追従を補間せず、指定位置の太さへ即座に切り替えます。文字が常に読める状態は変えません。",
  },
  implementation: [
    "OFLライセンスのCormorant Garamond可変フォントをローカルに同梱。Solare専用書体との違いを残した代替です。",
    "記録の4行を維持し、文字サイズ・各行の幅・配置を1600×1200の映像に合わせて調整。送り幅は基準ウェイトの値で固定します。",
    "ポインターとの距離から300〜470の範囲でwghtを変更。半径と100msの補間は映像からの推定です。",
    "描画は収束時に停止し、Reset・連続Replay・abort・再マウントで古い処理を解除します。",
  ],
  xPost:
    "近づいた文字だけ、線が太くなる。可変フォントのウェイトを距離で動かすと、ポインターが通った場所にやわらかな反応が生まれる。行組みを動かさないことが、読みやすさのポイント。",
  limitations: [
    "上部の小さな案内文字と中央のラベルは、ギャラリーでの読み取りを補うため記録より暗い色へ調整。主文の色・4行の配置・太さの動きは記録に沿って維持しています。",
    "Solare専用書体に対し、同梱のCormorant Garamondを使用。Rの脚・Aのセリフ・曲線とウェイト軸の変化量は異なり、完全一致ではありません。",
    "背景の細かな紙テクスチャ、購入リンクの動作は対象外。記録由来の画面構成のみを表示します。",
    "keyboard・touch・Replayはデモの追加操作。原作のアクセシビリティ動作を観察した主張ではありません。",
  ],
  timingDisclosure:
    "measured: 1600×1200の記録フレーム。estimated: 影響半径270px、追従100ms。unknown: 原作のウェイト数値・減衰式。",
};
