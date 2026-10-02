/** UI motion references are owned by their component folder, not a second copy. */
const modules = import.meta.glob("../../ui-gallery/*/*/meta.js", {
  eager: true,
});
export const motionCategories = [
  {
    slug: "buttons",
    title: "Buttons",
    label: "ボタン",
    description: "触れる前から、押した後まで。小さな反応の違いを確かめる。",
  },
  {
    slug: "sliders",
    title: "Sliders",
    label: "スライダー",
    description: "次の一枚へ進む動き。位置、方向、切り替わり方を比べる。",
  },
  {
    slug: "section-transitions",
    title: "Section transitions",
    label: "セクション切り替え",
    description: "ページの流れをつなぐ。スクロールと場面転換の関係を調べる。",
  },
  {
    slug: "text-reveals",
    title: "Text motion",
    label: "テキスト演出",
    description:
      "読む順序や触れたときの手応えをつくる。文字の出現・変化・消失を観察する。",
  },
  {
    slug: "image-reveals",
    title: "Image reveals",
    label: "画像出現",
    description: "画像をどう見せ始めるか。マスク、奥行き、ポインターへの反応。",
  },
];
export const motionReferences = Object.values(modules)
  .map((module) => module.metadata)
  .sort((a, b) => a.title.localeCompare(b.title));
export const referencesFor = (category) =>
  motionReferences.filter((reference) => reference.category === category);
export const motionReferenceCount = motionReferences.length;
