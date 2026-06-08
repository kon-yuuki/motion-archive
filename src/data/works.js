import dummy1 from "../assets/images/dummy_1.png";
import dummy2 from "../assets/images/dummy_2.png";

export const works = [
  {
    slug: "scroll-type-reveal",
    title: "Scroll Type Reveal",
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
    title: "Fluid Animation",
    status: "WIP",
    date: "2026.06.02",
    description: "画像の流体シミュレーションを外し、次の実験のために全画面を空の状態へ戻したページ。",
    techniques: ["CSS"],
    expressions: ["Background"],
    reference: {
      label: "Motion Archive",
      url: "./works/fluid-image/"
    }
  },
  {
    slug: "pixel-glitch",
    title: "Pixel Glitch",
    thumbnail: dummy2,
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
    slug: "green-marble",
    title: "Latte Marble",
    thumbnail: dummy1,
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
  techniques: ["CSS", "JavaScript", "SVG", "Canvas"],
  expressions: ["Text", "Hover", "Loading", "Background", "Scroll", "Transition", "Image"]
};
