export const metadata = {
  slug: "depth-tunnel",
  category: "section-transitions",
  title: "Depth tunnel",
  subtitle: "奥行きを通り抜けて、次の場面へ",
  description:
    "入れ子の枠が大きくなり、中心の図形へ近づいてから次の場面が現れます。奥へ進む感覚をCSSで軽く整理した、スクロール連動のスタディです。",
  trigger: "Local scroll / range / next scene",
  duration: "スクロール距離に連動 / Replay 1800ms",
  easing: "Scroll: linear progress / Replay: ease-in-out",
  status: "WIP",
  source: {
    name: "Lusion v3",
    url: "https://lusion.co/",
    awardUrl: "https://www.awwwards.com/sites/lusion-v3",
    awardDate: "2023-10-02",
    observedAt: "2026-10-02",
    location: "Homepage ending sequence toward contact CTA",
    observation:
      "The tunnel frames enlarge and rotate around the center, creating forward travel in depth. A small central figure grows toward the viewer, then the scene resolves to a large contact CTA with surrounding floating objects. This connects an immersive in-between scene to the contact section rather than moving ordinary page blocks.",
    observationMode: "official recording observed",
    recordingUrl: "https://www.awwwards.com/inspiration/scroll-animation-3",
    evidence: [
      "Recording tab 30 screenshots 15:22:07 (dark tunnel), 15:22:31 (blue portal), 15:23:44 and 15:31:36 (rotating grids), 15:35:26 UTC (contact scene)",
      "Read-only video DOM confirms 16s recording, not the actual transition duration",
      "Official award https://www.awwwards.com/sites/lusion-v3 read by web tool at 14:56:44 UTC: Site of the Day Oct 2, 2023",
    ],
  },
  takeaways: [
    "枠の拡大と回転を同じ進み具合へ結びつけると、別々の飾りではなく「進んでいる」動きとして伝わります。",
    "途中の演出では短い言葉だけにし、目的の見出しは動きが落ち着いた後に読める位置へ出します。",
    "スクロールが難しい場合も、次の場面ボタンと進み具合スライダーで同じ状態に到達できます。",
  ],
  limitations: [
    "公式のAwwwards録画を観察したものです。ライブサイトはローダーから進まず、ライブのスクロール操作を再現確認したとはしていません。",
    "この実装はCSSの入れ子枠と独自SVGを使う奥行きの近似です。光の歪み、人物、物理的な立体、元のWebGL表現は再現していません。",
    "2023年10月2日の受賞記録と録画を別々に確認しています。現行サイトと受賞時の完全な一致は未確認です。",
    "距離、角度、1800msのReplayはデモ用の独自値です。録画の16秒は映像の長さで、元の遷移時間ではありません。",
  ],
  usability: {
    benefit:
      "二つのセクションをつなぐ間の時間に、奥へ進む方向と到着先を伝えられます。",
    caution:
      "強い奥行きや回転は長文を読む場面に向きません。短い場面転換へ絞り、通常の情報閲覧では大きく動かさない選択も大切です。",
    smallScreen:
      "デモ内だけでスクロールします。画面全体のホイールを横取りせず、タッチ、上下キー、進み具合の入力に対応します。",
    reducedMotion:
      "枠と中心図形の拡大・回転を省き、入口と到着先の二つの静止画面を切り替えます。",
  },
  implementation: [
    "ローカルのスクロール領域内にstickyの表示面を置き、可動距離に対する進み具合を0〜1へ正規化します。",
    "7枚の枠へ指数的なスケール差をつけ、共通の回転量を足します。中心の図形も近づき、最後の24%で到着先を表示します。",
    "枠はCSS、中心図形は独自の幾何学SVGです。元サイトのWebGLコード・モデル・テクスチャは使用していません。",
    "Replay中にポインター、ホイール、キー操作を行うと自動進行を停止します。ResizeObserver、描画ループ、イベントを終了時に解除します。",
  ],
  xPost:
    "枠の拡大と回転、中心の図形、最後の見出し。ひとつの進み具合でつなぐと、場面の間に奥へ進む感覚をつくれる。CSSで整理した奥行きトンネルのスタディ。",
};
