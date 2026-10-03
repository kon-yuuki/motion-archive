import { listen } from "../../_motion/demo-helpers.js";

// Original packaging artwork, deliberately matched to the measured tub/sachet silhouettes.
// No More Nutrition logo, photography, marketing claim or product artwork is reused.
function pack(color, flavor, id, shape = "tub") {
  const base = shape === "base", baseSachet = shape === "base-sachet", sachet = shape === "sachet" || baseSachet;
  const w = baseSachet ? 182 : sachet ? 266 : base ? 197 : 295, h = baseSachet ? 284 : sachet ? 195 : base ? 410 : 251;
  const top = sachet ? 5 : base ? 44 : 45, bottom = h - (sachet ? 8 : 12);
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="${id}-light"><stop stop-color="#fff" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient><linearGradient id="${id}-lid" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#d6d8d5"/></linearGradient></defs><path d="${sachet ? `M4 3H${w-4}L${w-11} ${h-3}H11Z` : `M4 ${top}Q${w/2} ${top-17} ${w-4} ${top}L${w-8} ${bottom}Q${w/2} ${h+4} 8 ${bottom}Z`}" fill="${color}"/><path d="${sachet ? `M4 3H${w-4}L${w-11} ${h-3}H11Z` : `M4 ${top}Q${w/2} ${top-17} ${w-4} ${top}L${w-8} ${bottom}Q${w/2} ${h+4} 8 ${bottom}Z`}" fill="url(#${id}-light)"/>${sachet ? `<path d="M6 9H${w-6}M10 ${h-11}H${w-10}" stroke="#fff" opacity=".45" stroke-width="3"/>` : `<path d="M1 13Q${w/2} -2 ${w-1} 13V${top+3}Q${w/2} ${top+17} 1 ${top+3}Z" fill="url(#${id}-lid)"/><path d="M3 ${top-4}Q${w/2} ${top+11} ${w-3} ${top-4}" stroke="#afb2ae" fill="none" stroke-width="2"/>`}
  <g fill="#fff" font-family="Arial, sans-serif"><text x="${w*.085}" y="${top+(h-top)*.3}" font-size="${w*.245}" font-weight="800" letter-spacing="-${w*.017}">blend</text><text x="${w*.1}" y="${top+(h-top)*.46}" font-size="${w*.105}" font-weight="900">${base || baseSachet ? "ICED MATCHA" : "DAILY MIX"}</text><text x="${w*.1}" y="${top+(h-top)*.59}" font-size="${w*.105}" font-weight="900">${base || baseSachet ? "LATTE" : "FLAVOUR"}</text><text x="${w*.1}" y="${top+(h-top)*.72}" font-size="${w*.045}">${flavor}</text><path d="M${w*.1} ${h*.82}H${w*.68}" stroke="#fff" stroke-width="1" opacity=".6"/><text x="${w*.1}" y="${h*.9}" font-size="${w*.035}">ORIGINAL PACKAGING STUDY</text></g></svg>`;
}
const items = [
  ["STRAWBERRY<br>CLOUD", "Strawberry", "#e88585"],
  ["COCOA<br>CRUNCH", "Cocoa", "#8b739e"],
  ["VANILLA<br>COOKIE", "Vanilla", "#d4bc79"],
  ["BLUEBERRY<br>CREAM", "Blueberry", "#7b9bb7"],
  ["CINNAMON<br>SWIRL", "Cinnamon", "#b28767"],
];
const bundlePose = (side) => side < 0 ? "translate3d(-60%,15%,0) rotate(-15deg) scale(.35)" : side > 0 ? "translate3d(50%,15%,0) rotate(35deg) scale(.6)" : "translate3d(0%,0%,0) rotate(0deg) scale(1)";
const titlePose = (side) => `translate3d(${side * 40}%,${side ? 15 : 0}%,0) scale(${side ? .5 : 1})`;
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="layered-bundle${reducedMotion ? " is-reduced" : ""}"><header><h2>New taste, same ritual.</h2><p>A base you know, with a different daily mix.<br>Five original packaging studies.</p></header><div class="layered-bundle__stage" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="5種類の組み合わせ。左右キーで循環"><div class="layered-bundle__base" aria-hidden="true"><div class="layered-bundle__base-pack is-second">${pack("#8d9e5d","Original taste","base-b","base-sachet")}</div><div class="layered-bundle__base-pack is-first">${pack("#9aaa6d","Original taste","base-a","base-sachet")}</div><div class="layered-bundle__base-dose">${pack("#9caa6b","Original taste","base","base")}</div></div><span class="layered-bundle__plus" aria-hidden="true">+</span><div class="layered-bundle__variants">${items.map((item,i) => `<div class="layered-bundle__variant ${i === 0 ? "is-current" : ""}" data-variant="${i}" aria-hidden="${i !== 0}"><div class="layered-bundle__piece layered-bundle__piece--second">${pack(item[2],item[1],`mix${i}-b`,"sachet")}</div><div class="layered-bundle__piece layered-bundle__piece--first">${pack(item[2],item[1],`mix${i}-a`,"sachet")}</div><div class="layered-bundle__piece layered-bundle__piece--dose">${pack(item[2],item[1],`mix${i}`)}</div></div>`).join("")}</div><div class="layered-bundle__captions">${items.map((item,i) => `<div class="layered-bundle__caption" data-caption="${i}" aria-hidden="${i !== 0}"><p>Daily blend</p><h3>${item[0]}</h3><span class="layered-bundle__label">Explore this mix ↗</span></div>`).join("")}</div><div class="layered-bundle__nav"><button type="button" data-previous aria-label="前の組み合わせ">←</button><button type="button" data-next aria-label="次の組み合わせ">→</button></div></div><footer><span data-status role="status" aria-live="polite">01 / 05 · STRAWBERRY CLOUD</span><span>Original artwork / Drag or use arrows</span></footer></section>`;
  const section = root.firstElementChild;
  const stage = root.querySelector(".layered-bundle__stage");
  const variants = [...root.querySelectorAll("[data-variant]")];
  const captions = [...root.querySelectorAll("[data-caption]")];
  const status = root.querySelector("[data-status]");
  const events = new AbortController();
  let selected = 0, timer = 0, pointer = null, x = 0, y = 0, dragging = false, destroyed = false;
  const modulo = (n) => (n + items.length) % items.length;
  function updateState() {
    root.dataset.position = String(selected);
    status.textContent = `${String(selected + 1).padStart(2,"0")} / 05 · ${items[selected][0].replace("<br>"," ")}`;
    variants.forEach((el,i) => { el.setAttribute("aria-hidden",String(i !== selected)); el.classList.toggle("is-current",i === selected); captions[i].setAttribute("aria-hidden",String(i !== selected)); });
  }
  function pose(el, transform, opacity, instant = false) {
    el.style.transition = instant || reducedMotion ? "none" : "transform 300ms ease, opacity 300ms ease";
    el.style.transform = transform; el.style.opacity = String(opacity);
  }
  function go(index, direction = Math.sign(index - selected)) {
    const target = modulo(index);
    if (destroyed || target === selected) return;
    clearTimeout(timer);
    // Re-entering a partially visible bundle continues from its current CSS blend.
    // A fully hidden candidate is first placed on the measured incoming side.
    if (Number(getComputedStyle(variants[target]).opacity) < .001) {
      pose(variants[target], bundlePose(direction), 0, true);
      pose(captions[target], titlePose(direction), 0, true);
      void variants[target].offsetWidth;
    }
    selected = target;
    updateState();
    variants.forEach((el,i) => {
      el.style.zIndex = i === selected ? "2" : "1";
      captions[i].style.zIndex = i === selected ? "2" : "1";
      pose(el, bundlePose(i === selected ? 0 : -direction), i === selected ? 1 : 0);
      pose(captions[i], titlePose(i === selected ? 0 : -direction), i === selected ? 1 : 0);
    });
    root.dataset.state = reducedMotion ? "settled" : "moving";
    if (!reducedMotion) timer = setTimeout(() => { root.dataset.state = "settled"; timer = 0; },950);
  }
  listen(root.querySelector("[data-previous]"),"click",() => go(selected-1,-1),events.signal);
  listen(root.querySelector("[data-next]"),"click",() => go(selected+1,1),events.signal);
  listen(stage,"keydown",(event) => {
    if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "End") go(event.key === "Home" ? 0 : 4);
    else go(selected+(event.key === "ArrowRight"?1:-1),event.key === "ArrowRight"?1:-1);
  },events.signal);
  listen(stage,"pointerdown",(event) => { if (event.button !== 0 || event.target.closest("button")) return; pointer=event.pointerId;x=event.clientX;y=event.clientY;dragging=false; },events.signal);
  listen(stage,"pointermove",(event) => {
    if (pointer!==event.pointerId) return;
    const dx=event.clientX-x,dy=event.clientY-y;
    if (!dragging && Math.abs(dy)>Math.abs(dx)+8) { pointer=null;return; }
    if (!dragging && Math.abs(dx)>8) {dragging=true;stage.setPointerCapture(pointer);}
  },events.signal);
  function release(event) {
    if(pointer!==event.pointerId)return;
    const dx=event.clientX-x,dy=event.clientY-y,id=pointer;pointer=null;
    if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);
    if(event.type==="pointerup" && Math.abs(dx)>35 && Math.abs(dx)>Math.abs(dy)) go(selected+(dx<0?1:-1),dx<0?1:-1);
    dragging=false;
  }
  listen(stage,"pointerup",release,events.signal); listen(stage,"pointercancel",release,events.signal);listen(stage,"lostpointercapture",event=>{if(event.target===stage)release(event);},events.signal);listen(window,"pointerup",release,events.signal);
  function reset() {
    clearTimeout(timer);timer=0;if(pointer!==null&&stage.hasPointerCapture(pointer))stage.releasePointerCapture(pointer);pointer=null;selected=0;
    section.classList.add("is-instant");updateState();
    variants.forEach((el,i)=> { pose(el,bundlePose(i===0?0:-1),i===0?1:0,true);pose(captions[i],titlePose(i===0?0:-1),i===0?1:0,true); });
    void section.offsetWidth;section.classList.remove("is-instant");root.dataset.state="settled";
  }
  function replay(){reset();go(1,1);}
  function destroy(){if(destroyed)return;destroyed=true;clearTimeout(timer);if(pointer!==null&&stage.hasPointerCapture(pointer))stage.releasePointerCapture(pointer);pointer=null;events.abort();root.getAnimations({subtree:true}).forEach(a=>a.cancel());signal?.removeEventListener("abort",destroy);}
  signal?.addEventListener("abort",destroy,{once:true});reset();
  return {replay,reset,destroy};
}
