import "../_shared/detail-shell.js";

const cards = [...document.querySelectorAll("[data-video-card]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function setCardState(card, isPlaying) {
  const state = card.querySelector("[data-video-state]");
  card.classList.toggle("is-playing", isPlaying);
  card.setAttribute("aria-pressed", String(isPlaying));
  if (state) state.textContent = isPlaying ? "Now playing" : "Hover to play";
}

function pauseCard(card) {
  const video = card.querySelector("video");
  video.pause();
  setCardState(card, false);
}

async function playCard(card) {
  cards.forEach((otherCard) => {
    if (otherCard !== card) pauseCard(otherCard);
  });

  const video = card.querySelector("video");
  try {
    await video.play();
    setCardState(card, true);
  } catch {
    setCardState(card, false);
  }
}

cards.forEach((card) => {
  card.addEventListener("pointerenter", () => {
    if (finePointer.matches && !reducedMotion.matches) playCard(card);
  });

  card.addEventListener("pointerleave", () => {
    if (finePointer.matches) pauseCard(card);
  });

  card.addEventListener("focus", () => {
    if (!reducedMotion.matches) playCard(card);
  });

  card.addEventListener("blur", () => pauseCard(card));

  card.addEventListener("click", () => {
    if (finePointer.matches && !reducedMotion.matches) return;
    if (card.classList.contains("is-playing")) pauseCard(card);
    else playCard(card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (card.classList.contains("is-playing")) pauseCard(card);
    else playCard(card);
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) cards.forEach((card) => pauseCard(card));
});
