export const metadata = {
  slug: "upward-curtain",
  category: "section-transitions",
  title: "Upward curtain",
  subtitle: "文字を動かさず、境界を引き上げる",
  description:
    "黒いメニューの下端が上へ戻り、下にあるホーム画面を見せます。文字まで運ぶ動きと、文字をその場で隠す動きの違いを確かめるデモです。",
  trigger: "Click / Enter / Escape",
  duration: "760ms / Replay: 450ms hold + 760ms",
  easing: "cubic-bezier(.76, 0, .24, 1)",
  status: "WIP",
  source: {
    name: "Akaru",
    url: "https://www.akaru.fr/",
    awardUrl: "https://www.awwwards.com/sites/akaru-2",
    awardDate: "2024-04-01",
    observedAt: "2026-10-02",
    location: "Global menu layer over homepage",
    observation:
      "The black menu retracts upward as a hard horizontal edge, uncovering the stationary pale homepage from the bottom. One middle frame shows black menu occupying the upper half and the original homepage visible below; the next frame leaves only a thin black strip at top, then the homepage is fully restored. Menu links and large branding are clipped by the moving edge.",
    observationMode: "live interaction corroborated by official recording",
    recordingUrl: "https://www.awwwards.com/inspiration/menu-akaru-2",
    evidence: [
      "Live tab 32: menu opened at 15:23:44 UTC; three-frame exit sequence at 15:24:02 UTC",
      "Recording tab 29 shows same full-screen menu context",
      "Award tab 10 verified SOTD Apr 1, 2024 at 15:25:56 UTC",
    ],
  },
  takeaways: [
    "画面の下にあった内容を動かさずに見せると、メニューを閉じた後の居場所を見失いにくくなります。",
    "メニューの文字は移動させず、下の境界だけを引き上げます。読める時間と切り替わる時間を分ける考え方です。",
    "閉じる操作とEscapeを用意し、メニューを離れたら操作位置をボタンへ戻します。",
  ],
  limitations: [
    "ライブサイトで開閉を観察し、公式録画でもメニュー構成を確認しています。受賞時と現在の実装が同じとは確認していません。",
    "録画URLは補助資料です。観察できたのは特に上へ引き上がる退出で、開く方向と760msの時間設定は独自の調整です。",
    "文字・図形・色は独自のプレースホルダーです。元のロゴや画像、コードは使用していません。実際のページ移動は行いません。",
  ],
  usability: {
    benefit:
      "ホーム画面を元の位置で見せるため、メニューを閉じた後に何を見ていたか追いやすくなります。",
    caution:
      "文字まで強く移動させると読んでいる途中で目が追いつきにくくなります。短い退出に絞り、開いている間は静止させます。",
    smallScreen:
      "タップとキーボードで開閉できます。狭い画面では項目を縦に並べ、メニュー内のTab移動とEscapeで閉じる操作を残します。",
    reducedMotion:
      "メニューを瞬時に切り替えます。内容、閉じる操作、操作位置の移動は残します。",
  },
  implementation: [
    "clip-path: inset()の下辺を100%から0%へ変更します。退出時は0%から100%へ戻すため、上向きに下端が移動します。",
    "繰り返し押したときは現在のclip-pathを取得し、前のWeb Animations APIアニメーションを中止して続けます。待ち行列は作りません。",
    "開いている間は下の画面をinertにし、閉じたら操作位置を開閉ボタンへ戻します。Replayは開いた状態から退出を再現します。",
    "再生用タイマー、アニメーション、イベントリスナーをdestroyとAbortSignalで解除します。",
  ],
  xPost:
    "メニューの文字を動かすのではなく、下の境界だけを引き上げる。下にあった画面がそのまま戻るので、閉じた後も迷いにくい。上向きカーテンのUIスタディ。",
};
