import { easingCss } from "../scripts/easing-functions.js";

const orderedNames = [
  "easeInSine", "easeOutSine", "easeInOutSine",
  "easeInQuad", "easeOutQuad", "easeInOutQuad",
  "easeInCubic", "easeOutCubic", "easeInOutCubic",
  "easeInQuart", "easeOutQuart", "easeInOutQuart",
  "easeInQuint", "easeOutQuint", "easeInOutQuint",
  "easeInExpo", "easeOutExpo", "easeInOutExpo",
  "easeInCirc", "easeOutCirc", "easeInOutCirc",
  "easeInBack", "easeOutBack", "easeInOutBack",
  "easeInElastic", "easeOutElastic", "easeInOutElastic",
  "easeInBounce", "easeOutBounce", "easeInOutBounce"
];

const usage = {
  easeOutCubic: [
    { label: "Cylindrical Image Flow", href: "../works/cylindrical-image-flow/" },
    { label: "Scroll Type Reveal", href: "../works/scroll-type-reveal/" },
    { label: "Pixel Glitch", href: "../works/pixel-glitch/" }
  ],
  easeInOutCubic: [
    { label: "Buttons", href: "../ui-gallery/buttons/" }
  ],
  easeOutQuint: [
    { label: "CSS Pie Chart / Reveal", href: "../works/css-pie-chart/" }
  ],
  easeOutExpo: [
    { label: "Cursor Pixel Field", href: "../works/cursor-pixel-field/" },
    { label: "Hero Mask Shift", href: "../works/hero-mask-shift/" },
    { label: "Image Wipe Grid", href: "../works/image-wipe-grid/" },
    { label: "Tooltips", href: "../ui-gallery/tooltip-behavior/" },
    { label: "Work List", href: "../motion-archive/" },
    { label: "Smooth Scroll", href: "../works/scroll-type-reveal/" }
  ],
  easeInOutSine: [
    { label: "Green Noise Gradient", href: "../works/green-noise-gradient/" }
  ],
  easeOutQuart: [
    { label: "Scroll Tilt Gallery", href: "../works/scroll-tilt-gallery/" }
  ],
  easeOutBack: [
    { label: "Cursor Image Burst", href: "../works/cursor-image-burst/" }
  ],
  easeInOutExpo: []
};

const familyDescriptions = {
  Sine: "正弦波を使った穏やかな加減速。",
  Quad: "2次関数による軽い加減速。",
  Cubic: "3次関数による明確な加減速。",
  Quart: "4次関数による強めの加減速。",
  Quint: "5次関数によるさらに強い加減速。",
  Expo: "指数関数による急激な加速・長い減速。",
  Circ: "円弧を基にした鋭い立ち上がり。",
  Back: "移動方向と逆へ一度溜めるオーバーシュート。",
  Elastic: "終点を越えて振動する弾性表現。",
  Bounce: "終点で複数回跳ねるバウンド表現。"
};

function familyOf(name) {
  if (name.startsWith("easeInOut")) return "in-out";
  if (name.startsWith("easeIn")) return "in";
  return "out";
}

function curveOf(name) {
  return name.replace(/^ease(?:InOut|In|Out)/, "");
}

function displayName(name) {
  return name.replace(/^ease/, "Ease ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function functionCode(name) {
  return `import { easingFunctions } from "/src/scripts/easing-functions.js";\nconst easing = easingFunctions.${name};`;
}

export const easings = orderedNames.map((name) => {
  const curve = curveOf(name);
  const direction = familyOf(name);
  const directionText = direction === "in"
    ? "開始側で加速する"
    : direction === "out"
      ? "終了側で減速する"
      : "開始と終了の両側を滑らかにする";

  return {
    id: name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`),
    name: displayName(name),
    key: name,
    family: direction,
    curve,
    css: easingCss[name] ?? null,
    functionCode: functionCode(name),
    description: `${familyDescriptions[curve]} ${directionText}バリエーション。`,
    uses: usage[name] ?? []
  };
});
