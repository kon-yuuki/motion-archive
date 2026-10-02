export const metadata = {
  slug: "menu-icon-morph",
  category: "buttons",
  title: "Menu icon morph",
  subtitle: "開くと閉じるを、同じ場所で伝える",
  description:
    "二本の横線が交差して、閉じる印へ変わります。ひとつのボタンが現在の状態と次の操作を伝える、小さなメニューのデモです。",
  trigger: "Click / tap / Enter / Space / Escape",
  duration: "400ms",
  easing: "cubic-bezier(.65, 0, .35, 1)",
  status: "WIP",
  source: {
    name: "Dennis Snellenberg",
    url: "https://dennissnellenberg.com/",
    awardUrl: "https://www.awwwards.com/sites/dennis-snellenberg",
    awardDate: "2022-04-04",
    observedAt: "2026-10-02",
    location: "ホームをスクロールすると右上に現れる円形のメニューボタン",
    observation:
      "PageDown 後に現れた円の中には二本の横線がありました。クリックしてメニューを開くと斜めの二本線が交差する X に変化。再度クリックすると横線へ戻ることを公開画面で確認しています。",
    evidence: [
      "ホームで PageDown、右上のボタンをクリック、ポインターを離して X を確認。その後もう一度クリックして横線への復帰を確認。",
    ],
    observationMode: "live interaction",
  },
  takeaways: [
    "開くボタンをそのまま閉じるボタンにすると、戻る操作を探さずに済みます。",
    "二本の線を同じ中心へ寄せて交差させれば、印が変わってもひとつの部品として理解できます。",
    "図形だけに頼らず、ボタン名と開閉状態も同時に変えると操作後が伝わります。",
  ],
  limitations: [
    "2026年10月2日の現行公開版で確認しています。受賞時の見た目と動きが同じとは限りません。",
    "参考サイトの画面全体を覆うメニューは再現せず、ボタンの横線から X への切り替えだけを独立した学習用部品にしています。",
    "400ms と角度の変化はこのデモの調整値です。原サイトのコードや値を抽出していません。",
  ],
  usability: {
    benefit:
      "開いた後も閉じる場所が変わらず、状態が文字と印の両方で分かります。",
    caution:
      "よくある『アイコンだけを変えて中身は閉じたまま』の状態を防ぐため、開閉をひとつの値で管理します。このデモのパネルは画面を占有しない開閉領域です。",
    smallScreen:
      "十分な大きさの固定ボタンをタップできます。Enter・Space で開閉し、Escape で閉じてボタンへ戻れます。",
    reducedMotion:
      "回転・移動を省き、横線と X を即座に切り替えます。開いた内容と操作名は同じように更新します。",
  },
  implementation: [
    "一本の線を上下に二つ配置し、閉じた状態の translateY から開いた状態の rotate へ切り替えます。",
    "aria-expanded と aria-controls を設定し、閉じた領域は hidden でキーボード移動の対象から外します。",
    "Escape で閉じたときは開閉ボタンにフォーカスを戻します。Replay 中でも操作すると自動進行を止め、Reset・破棄時に予定を解除します。",
  ],
  xPost:
    "二本の線が、閉じる印になる。メニューを開く場所と閉じる場所を揃えると、次の操作を探さずに済みます。見た目の変形と開閉状態をひとつに管理する、小さな UI の検証。",
};
