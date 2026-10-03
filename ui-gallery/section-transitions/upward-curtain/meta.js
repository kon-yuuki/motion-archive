export const metadata = {
  "slug": "upward-curtain",
  "category": "section-transitions",
  "title": "Upward curtain",
  "subtitle": "文字を動かさず、境界を引き上げる",
  "description": "黒い面が下から上へ開き、閉じるときも上へ抜けます。開くときは項目と大きな文字が順に入り、閉じるときは文字を止めたまま面の下端が引き上がります。",
  "trigger": "Click / Enter / Escape",
  "duration": "Clip 850ms (estimate) / staggered content",
  "easing": "Clip cubic-bezier(.76,0,.24,1) (estimate)",
  "status": "WIP",
  "source": {
    "name": "Akaru",
    "url": "https://www.akaru.fr/",
    "awardUrl": "https://www.awwwards.com/sites/akaru-2",
    "awardDate": "2024-04-01",
    "observedAt": "2026-10-02",
    "location": "Global menu layer over homepage",
    "observation": "開く面はinset(top 100%→0%)で下から上へ展開し、閉じる面はinset(bottom 0%→100%)で上へ退場。開く間は4項目が順に上昇し、5文字ロゴが別々に現れます。退出中の本文とロゴの外枠は移動しません。1180×757で黒面が全域、ロゴ外枠は右下565.4×340.6px。",
    "observationMode": "live rendered-DOM measurements and screenshots",
    "recordingUrl": "https://www.awwwards.com/inspiration/menu-akaru-2",
    "evidence": [
      "akaru-open-trace.json: top inset100%→15.8784%; staggered item bounds change independently.",
      "akaru-close-trace.json: bottom inset90.1389%→100%; text/logo wrapper positions unchanged.",
      "akaru-open-dom.json and menu-open.png: 4 menu links, large five-letter mark in the lower right, preview in the lower left."
    ]
  },
  "takeaways": [
    "開くときも閉じるときも上方向に進め、境界の向きをそろえます。",
    "開く際には文字が順に現れ、閉じる際には文字を運ばずクリップします。",
    "背後のホーム画面は固定し、閉じた後の位置関係を保ちます。"
  ],
  "limitations": [
    "開閉方向、本文の段階的な上昇、5文字ロゴの分割、退出時の固定レイアウトはライブ画面で確認しています。",
    "clipの正確な時間・曲線は未計測です。850msとcubic-bezier(.76,0,.24,1)は推定値で、元の動きと一致した検証済み数値ではありません。",
    "5文字の個別変形は未計測のため、上昇と傾きによる代替です。開始量、stagger、文字の時間も推定値です。",
    "ロゴは独自のFRAME文字、写真はリポジトリ内素材に置換。元のロゴ、写真、書体は使用していません。",
    "モバイル配置と途中で逆操作した際の継続処理はデモの補助実装です。実際のページ移動は行いません。"
  ],
  "usability": {
    "benefit": "ホームを動かさずに覆い、閉じると元の位置で内容が戻ります。",
    "caution": "開くときの文字演出と閉じる面を分け、退出中は文字自体を動かしません。",
    "smallScreen": "メニューボタンは44px以上。Tab移動、Escape、項目選択後のフォーカス復帰に対応します。",
    "reducedMotion": "面と文字の動きを省き、メニュー状態・操作可能範囲・フォーカスだけ切り替えます。"
  },
  "implementation": [
    "通常の開きはinset(100% 0 0)→inset(0)、閉じはinset(0)→inset(0 0 100%)。同じ下辺を往復させません。",
    "開く本文と5文字は独立したWeb Animations。閉じる前に現在値を固定し、クリップだけ進めます。",
    "逆操作は現在のclipから継続。前のPromiseとReplayタイマーを世代番号・cancelで無効化します。",
    "下の画面はinert、閉じたメニューもinert。Reset/Abort/destroyで全アニメーションとイベントを解除します。"
  ],
  "xPost": "黒い面が下から上へ開き、閉じるときも上へ抜けます。開くときは項目と大きな文字が順に入り、閉じるときは文字を止めたまま面の下端が引き上がります。"
};
