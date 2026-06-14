export const works = [
  {
    slug: "cursor-pixel-field",
    title: "Cursor Pixel Field",
    thumbnail: "/thumbnails/cursor-pixel-field.jpg",
    date: "2026.06.14",
    status: "WIP",
    description: "カーソル位置に背景画像のピクセル片を生成し、ヒーロー画像を粒状に露出させるインタラクション実験。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Hover", "Image", "Reveal"],
    reference: {
      label: "Farm Minerals: CropTab promo",
      url: "https://www.farmminerals.com/promo"
    }
  },
  {
    slug: "green-noise-gradient",
    title: "Green Noise Gradient",
    thumbnail: "/thumbnails/green-noise-gradient.jpg",
    date: "2026.06.14",
    status: "WIP",
    description: "Canvasで複数の緑の色面と粒状ノイズを合成し、ゆっくり流動する背景グラデーションを描く実験。",
    techniques: ["Canvas", "JavaScript"],
    expressions: ["Background", "Loop"],
    reference: {
      label: "Otsuka AIR: About",
      url: "https://otsuka-air.jp/about/"
    }
  },
  {
    slug: "cylindrical-image-flow",
    title: "Cylindrical Image Flow",
    thumbnail: "/thumbnails/cylindrical-image-flow.jpg",
    date: "2026.06.14",
    status: "WIP",
    description: "画像面を円柱状に配置し、スクロール入力の勢いで回転速度が一時的に上がる3Dヒーロー実験。",
    techniques: ["CSS", "JavaScript"],
    expressions: ["Scroll", "Image"],
    reference: {
      label: "Otsuka Plus One: AIR top",
      url: "https://www.otsuka-plus1.com/shop/formlp/air_top.aspx"
    }
  },
  {
    slug: "scroll-tilt-gallery",
    title: "Scroll Tilt Gallery",
    thumbnail: "/thumbnails/scroll-tilt-gallery.jpg",
    date: "2026.06.14",
    status: "WIP",
    description: "スクロール中の画像カードが画面中央で平坦になり、上下に抜けるほどX軸方向へ傾くギャラリー実験。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Scroll", "Image", "Transition"],
    reference: {
      label: "Made with GSAP",
      url: "https://x.com/madewithgsap/status/2065056246747570255"
    }
  },
  {
    slug: "cursor-image-burst",
    title: "Cursor Image Burst",
    thumbnail: "/thumbnails/cursor-image-burst.jpg",
    date: "2026.06.14",
    description: "カーソルの軌跡に沿って画像カードを短く生成し、回転とフェードでポップに消していくポインタ演出。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Hover", "Image", "Transition"],
    reference: {
      label: "Collect UI",
      url: "https://x.com/CollectUI/status/2065252751505019020"
    }
  },
  {
    slug: "hero-mask-shift",
    title: "Hero Mask Shift",
    thumbnail: "/thumbnails/hero-mask-shift.jpg",
    date: "2026.06.14",
    description: "Canvasで角丸マスクを拡大・回転させ、縁から広がる屈折ノイズとフェードで次ビューへつなぐFV遷移実験。",
    techniques: ["Canvas", "JavaScript"],
    expressions: ["Scroll", "Image", "Reveal"],
    reference: {
      label: "Takenaka: Fresh recruit",
      url: "https://www.takenaka.co.jp/recruit/fresh/recruit/"
    }
  },
  {
    slug: "image-wipe-grid",
    title: "Image Wipe Grid",
    thumbnail: "/thumbnails/image-wipe-grid.jpg",
    date: "2026.06.13",
    description: "カバーを横へ退かせながら、下の画像を逆方向の移動とズームから定位置へ収束させる商品一覧向けのスクロールリビール。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Scroll", "Image", "Reveal"],
    reference: {
      label: "OUTFIT by ++hellohello",
      url: "https://outfit.hellohello.is/"
    }
  },
  {
    slug: "scroll-type-reveal",
    title: "Scroll Type Reveal",
    thumbnail: "/thumbnails/scroll-type-reveal.jpg",
    date: "2026.06.08",
    description: "スクロール量を文章全体の進捗へ変換し、文字ごとにずらした不透明度・移動・ぼかしで一文字ずつ言葉を立ち上げるタイポグラフィ実験。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Scroll", "Text"],
    reference: {
      label: "Noomo: The power of digital Storytelling",
      url: "https://storytelling.noomoagency.com/"
    }
  },
  {
    slug: "css-pie-chart",
    title: "CSS Pie Chart",
    thumbnail: "/thumbnails/css-pie-chart.jpg",
    date: "2026.06.07",
    description: "親要素に置いた割合を型付き attr() で読み取り、CSS変数の累積計算だけでスライスを配置するJavaScript不要の円グラフ。",
    techniques: ["CSS"],
    expressions: ["Transition"],
    reference: {
      label: "CSS-Tricks: Another Stab at the Perfect CSS Pie Chart",
      url: "https://css-tricks.com/another-stab-at-the-perfect-css-pie-chart-sans-javascript/"
    }
  },
  {
    slug: "fluid-image",
    title: "Ink Bleed",
    thumbnail: "/thumbnails/fluid-image.jpg",
    date: "2026.06.10",
    description: "カーソルの動きを流れの力に変換し、墨が和紙の上で滲み広がる様子を再現した WebGL の流体シミュレーション実験。",
    techniques: ["WebGL", "JavaScript"],
    expressions: ["Background", "Hover"],
    reference: {
      label: "PavelDoGreat: WebGL Fluid Simulation",
      url: "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation"
    }
  },
  {
    slug: "pixel-glitch",
    title: "Pixel Glitch",
    thumbnail: "/thumbnails/pixel-glitch.jpg",
    date: "2026.06.02",
    description: "画像が画面内に入ったタイミングを検知して、ピクセルグリッチ演出の発火フラグを立てるスクロール実験。",
    techniques: ["JavaScript"],
    expressions: ["Scroll", "Image"],
    reference: {
      label: "MDN: Intersection Observer API",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
    }
  },
  {
    slug: "latte-marble",
    title: "Latte Marble",
    thumbnail: "/thumbnails/latte-marble.jpg",
    date: "2026.05.29",
    description: "画面中央に固定した 2D canvas で、ミルクとコーヒーが混ざるようなマーブル模様がゆっくり流動する背景実験。",
    techniques: ["Canvas", "JavaScript"],
    expressions: ["Background"],
    reference: {
      label: "MDN: Canvas API",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
    }
  }
];

export const categories = {
  techniques: ["CSS", "JavaScript", "SVG", "Canvas", "WebGL"],
  expressions: ["Text", "Hover", "Loading", "Background", "Scroll", "Transition", "Image", "Reveal", "Loop"]
};
