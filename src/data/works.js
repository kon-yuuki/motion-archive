export const works = [
  {
    slug: "section-layer-transition",
    title: "Layered Section Transition",
    thumbnail: "/thumbnails/section-layer-transition.jpg",
    date: "2026.08.10",
    description: "次の背景を5本の横帯に分割し、下から順にscaleYで立ち上げて画面を覆うセクション切り替え実験。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Scroll", "Transition"]
  },
  {
    slug: "hover-video-cards",
    title: "Hover Video Cards",
    thumbnail: "/thumbnails/hover-video-cards.jpg",
    date: "2026.07.20",
    description: "2枚の映像カードにポインターを重ねると、選んだカードだけが静かに再生されるホバーインタラクション実験。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Hover", "Transition"]
  },
  {
    slug: "rainy-neon-cylinder",
    title: "Rainy Neon Cylinder",
    thumbnail: "/thumbnails/rainy-neon-cylinder.jpg",
    date: "2026.07.19",
    description: "雨の夜景10枚を発光する円筒状に配置し、ドラッグ・前後ボタン・自動送りで滑らかに巡るWebGLギャラリー。",
    techniques: ["WebGL", "JavaScript", "Shader"],
    expressions: ["Hover", "Image", "Transition"],
    reference: {
      label: "ApeChain",
      url: "https://apechain.com/"
    }
  },
  {
    slug: "spiral-infinite-gallery",
    title: "Spiral Infinite Gallery",
    thumbnail: "/thumbnails/spiral-infinite-gallery.jpg",
    date: "2026.07.19",
    description: "画像を奥行きのある螺旋上に配置し、ホイールやドラッグの入力で前後へ途切れなく巡るWebGLギャラリー実験。",
    techniques: ["WebGL", "JavaScript", "Shader"],
    expressions: ["Scroll", "Image", "Loop"],
    reference: {
      label: "Pacôme Pertant Portfolio",
      url: "https://pacomepertant.com/"
    }
  },
  {
    slug: "rotating-scroll-gallery",
    title: "Rotating Scroll Gallery",
    thumbnail: "/thumbnails/rotating-scroll-gallery.jpg",
    date: "2026.06.29",
    description: "縦に並ぶ画像列の上に、スクロール量で横に流れる固定タイトルを重ねるスクロール実験。画像の回転表現を追加する前のレイアウト土台。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Scroll", "Image", "Text"],
    reference: {
      label: "Codrops: Rotating On-Scroll Animations",
      url: "https://tympanus.net/Development/RotatingOnScrollAnimations/index4.html"
    }
  },
  {
    slug: "rgb-cursor-stalker",
    title: "RGB Cursor Stalker",
    thumbnail: "/thumbnails/rgb-cursor-stalker.jpg",
    date: "2026.06.17",
    description: "画像カードをWebGLのplaneとして描画し、カーソル位置から外方向へ頂点とUVを押し出しながらRGBチャンネルを分離するホバー演出。",
    techniques: ["WebGL", "JavaScript", "Shader"],
    expressions: ["Hover", "Image", "Cursor"],
    reference: {
      label: "Pixelismo",
      url: "https://www.pixelismo.it/"
    }
  },
  {
    slug: "cursor-pixel-field",
    title: "Cursor Pixel Field",
    thumbnail: "/thumbnails/cursor-pixel-field.jpg",
    date: "2026.06.14",
    description: "カーソルの動きをグリッド単位の背景色ピクセルに変換し、大きなタイポグラフィの背面で反応させるホバー演出。",
    techniques: ["JavaScript", "CSS"],
    expressions: ["Hover", "Text", "Background"]
  },
  {
    slug: "cylindrical-image-flow",
    title: "Cylindrical Image Flow",
    thumbnail: "/thumbnails/cylindrical-image-flow.jpg",
    date: "2026.06.14",
    description: "横長の画像面を円柱面に沿う曲面メッシュとして配置し、スクロール入力で回転速度と画像内の視差が一時的に強まる3Dギャラリー実験。",
    techniques: ["WebGL", "JavaScript"],
    expressions: ["Scroll", "Image"],
    reference: {
      label: "Otsuka Plus One: AIR top",
      url: "https://www.otsuka-plus1.com/shop/formlp/air_top.aspx"
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
