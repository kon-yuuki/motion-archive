export const metadata = {
  "status": "WIP",
  "source": {
    "name": "Exo Ape",
    "url": "https://www.exoape.com/",
    "awardUrl": "https://www.awwwards.com/sites/exo-ape",
    "awardDate": "2022-05-23",
    "observedAt": "2026-10-02",
    "observationMode": "live interaction / rendered DOM measurements",
    "location": "Menu を開いた後の Work / Studio / News / Contact の主リンク",
    "observation": "主リンクの下線は2px、500ms、cubic-bezier(1,0,0,1)。入るときの基点は左、離れるときは右です。1180×757画面でメニュー文字は42.6111px / 52.4444px、色は#e4e0dbでした。ヘッダーの小さいリンクは1pxで、このデモの対象とは異なります。",
    "evidence": [
      "主メニューの computed ::after と hover 中・退出後を確認。",
      "Studio→News の切替途中で前の線の縮小、新しい線の伸長を時系列取得。"
    ]
  },
  "limitations": [
    "現行公開版を2026年10月2日に観察しています。2022年の受賞版と同一とは確認していません。",
    "原作のLausanneは同梱せず、既存のLibre Franklin 400（見た目の太さを近似）で近似しています。文字の形と幅には差が残ります。",
    "独立したデモ領域へ正規化しています。スマホの配置は追加した対応で、原作のモバイル実装を実測したものではありません。",
    "原作の写真の代わりに既存の人物写真を使用。画像はここでは固定し、下線だけを分離しています。",
    "ページ移動は行いません。フォーカス・タップによる確認操作は学習用の追加です。"
  ],
  "title": "Directional underline",
  "subtitle": "原作メニューの細い線を追う",
  "description": "Exo Ape のメニューを観察した、文字幅の下線のスタディ。入るときは左から伸び、離れると右へ抜けます。原作の2px・500ms・急な中間加速を反映しています。",
  "trigger": "Hover / focus / tap",
  "duration": "500ms（computed style 実測）",
  "easing": "cubic-bezier(1, 0, 0, 1)（実測）",
  "timingDisclosure": "下線の時間・イージング・線幅は公開画面のcomputed styleから確認した値です。字体は代替、写真はリポジトリ内の既存素材です。",
  "takeaways": [
    "線だけが動き、ラベルの位置は変わりません。",
    "500msの中間に変化が集中するため、均等な速度の線とは手触りが異なります。",
    "退出時は基点が右へ切り替わり、線が右へ抜けます。"
  ],
  "usability": {
    "benefit": "ラベルを読みやすい位置に保ちながら、今触れている行き先を伝えます。",
    "caution": "線の速さだけでなく、線幅・文字幅・出入りの方向をセットで見る必要があります。",
    "smallScreen": "Tab と Enter・Space、タップでも下線を確認できます。狭い画面は二列の位置を調整しています。",
    "reducedMotion": "線を伸縮させず、その場で表示・非表示を切り替えます。"
  },
  "implementation": [
    "ラベルの::afterに2pxの線を重ね、scaleXのみを変えます。",
    "500ms cubic-bezier(1,0,0,1)。入るときleft、出るときrightのtransform-origin。",
    "Replay・新しい操作・Reset・destroyでプレビュータイマーを破棄します。"
  ],
  "xPost": "文字を動かさず、2pxの線で応える。原作の500msと出入りの方向を実測し、同じ途中状態へ近づけるメニュースタディ。",
  "slug": "directional-underline",
  "category": "buttons"
};
