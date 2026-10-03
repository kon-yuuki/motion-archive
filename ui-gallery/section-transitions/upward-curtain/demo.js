import { listen } from "../../_motion/demo-helpers.js";
import city from "../../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-01.webp";
import portrait from "../../../src/assets/images/warm-neutral-tailoring/camel-tailored-seated-close.webp";
import still from "../../../src/assets/images/sculptural-still-lifes/sage-glass-forms.webp";

// The direction and layout are measured. Nominal timing and letter decomposition
// remain estimates: the live-source trace did not establish exact tween settings.
const CURTAIN_MS = 850;
const CURTAIN_EASE = "cubic-bezier(.76,0,.24,1)";
const OPEN = "inset(0% 0% 0% 0%)";
const BELOW = "inset(100% 0% 0% 0%)";
const ABOVE = "inset(0% 0% 100% 0%)";
const word = (animated = false) => `<svg viewBox="0 0 565.40625 340.640625" role="img" aria-label="FRAME"><title>FRAME, original study wordmark</title>${[..."FRAME"].map((letter,i) => `<g ${animated ? 'data-letter' : ''}><text x="${i*113}" y="310" font-family="Arial, sans-serif" font-size="400" font-weight="900" textLength="110" lengthAdjust="spacingAndGlyphs">${letter}</text></g>`).join("")}</svg>`;
export function createDemo(root,{signal,reducedMotion}) {
  root.innerHTML=`<section class="upward-curtain"><div class="upward-curtain__stage"><header><span class="upward-curtain__brand">${word()}</span><button type="button" data-toggle aria-expanded="false" aria-label="メニューを開く"><span aria-hidden="true">☰</span></button></header><div class="upward-curtain__home"><div class="upward-curtain__intro"><div class="upward-curtain__home-links" aria-hidden="true"><span>Work</span><span>Expertise</span><span>Studio</span><span>Contact</span></div><div class="upward-curtain__home-word">${word()}</div><p>A small independent design studio.<br>Making room for clear ideas, considered detail, and new perspectives.</p><div class="upward-curtain__socials" aria-hidden="true"><span>INSTAGRAM</span><span>LINKEDIN</span><span>JOURNAL</span><span>CONTACT</span></div></div><div class="upward-curtain__strips" aria-hidden="true"><div><img src="${city}" alt=""/><span>01</span></div><div><img src="${portrait}" alt=""/><span>02</span></div><div><img src="${still}" alt=""/><span>03</span></div></div></div><div class="upward-curtain__menu" role="dialog" aria-modal="false" aria-label="デモ内メニュー" aria-hidden="true" inert><div class="upward-curtain__menu-top"><nav aria-label="デモの場面">${["Work","Expertise","Studio","Contact"].map(label=>`<div class="upward-curtain__item"><button type="button" data-item="${label}"><span data-nav-text>${label}</span></button></div>`).join("")}</nav><p class="upward-curtain__address">FRAME STUDIO<br>INDEPENDENT DESIGN<br>ORIGINAL UI STUDY</p><p class="upward-curtain__network">INSTAGRAM<br>LINKEDIN<br>JOURNAL<br>CONTACT</p><p class="upward-curtain__contact">LET’S MAKE<br>SOMETHING TOGETHER</p><p class="upward-curtain__note">MOTION ARCHIVE<br>REFERENCE STUDY</p></div><div class="upward-curtain__preview" aria-hidden="true"><img src="${still}" alt=""/></div><div class="upward-curtain__word" aria-hidden="true">${word(true)}</div></div></div><footer><span data-state role="status" aria-live="polite">Menu closed</span><span>Menu → close / Esc</span></footer></section>`;
  const stage=root.querySelector(".upward-curtain__stage"),home=root.querySelector(".upward-curtain__home"),menu=root.querySelector(".upward-curtain__menu"),toggle=root.querySelector("[data-toggle]"),status=root.querySelector("[data-state]");
  const items=[...root.querySelectorAll("[data-item]")],nav=[...root.querySelectorAll("[data-nav-text]")],letters=[...root.querySelectorAll("[data-letter]")];
  const events=new AbortController();
  let open=false,animation=null,contentAnimations=[],timer=0,generation=0,destroyed=false;
  function stopContent(freeze=false) {
    for(const a of contentAnimations){ if(freeze) {try{a.commitStyles();}catch{}} a.cancel(); }
    contentAnimations=[];
  }
  function cancel(freeze=false){clearTimeout(timer);timer=0;generation++;if(animation){animation.cancel();animation=null;}stopContent(freeze);}
  function animateContent(fresh) {
    nav.forEach((element,i)=> {
      const current=fresh?"translateY(41px)":getComputedStyle(element).transform;
      element.style.transform="translateY(0px)";
      contentAnimations.push(element.animate([{transform:current},{transform:"translateY(0px)"}],{duration:520,delay:fresh?300+i*65:0,easing:"cubic-bezier(.22,1,.36,1)",fill:"backwards"}));
    });
    letters.forEach((element,i)=> {
      const current=fresh?"translateY(105%) skewY(12deg)":getComputedStyle(element).transform;
      element.style.transform="translateY(0%) skewY(0deg)";
      contentAnimations.push(element.animate([{transform:current},{transform:"translateY(0%) skewY(0deg)"}],{duration:850,delay:fresh?220+i*55:0,easing:"cubic-bezier(.22,1,.36,1)",fill:"backwards"}));
    });
    contentAnimations.forEach(a=>a.finished.catch(()=>{}));
  }
  function setOpen(next,{instant=false,focus=false,message=""}={}) {
    if(destroyed)return;
    const fresh=!open&&!animation;
    const current=fresh&&next?BELOW:getComputedStyle(menu).clipPath;
    // Freeze the current text pose on close; its moving clip is the only exit motion.
    stopContent(true);cancel();open=next;
    const target=open?OPEN:ABOVE,token=generation;
    toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"メニューを閉じる":"メニューを開く");toggle.innerHTML=`<span aria-hidden="true">${open?"×":"☰"}</span>`;
    home.inert=open;menu.inert=!open;menu.setAttribute("aria-hidden",String(!open));
    root.dataset.state=open?"open":"closed";root.dataset.phase=instant||reducedMotion?root.dataset.state:open?"opening":"closing";
    stage.classList.toggle("is-open",open);
    status.textContent=message||(open?"Menu open / Escで閉じる":"Menu closed");
    menu.style.clipPath=target;
    if(!instant&&!reducedMotion){
      animation=menu.animate([{clipPath:current},{clipPath:target}],{duration:CURTAIN_MS,easing:CURTAIN_EASE});
      animation.finished.then(()=> {if(token===generation){animation=null;root.dataset.phase=root.dataset.state;}}).catch(()=>{});
      if(open)animateContent(fresh);
    }else{nav.forEach(e=>e.style.transform="none");letters.forEach(e=>e.style.transform="none");}
    if(focus||(!open&&menu.contains(document.activeElement)))(open?items[0]:toggle).focus({preventScroll:true});
  }
  listen(toggle,"click",()=>setOpen(!open,{focus:true}),events.signal);
  items.forEach(item=>listen(item,"click",()=>setOpen(false,{focus:true,message:`${item.dataset.item} selected / デモ内のホームへ戻りました`}),events.signal));
  listen(stage,"keydown",event=> {
    if(!open)return;
    if(event.key==="Escape"){event.preventDefault();setOpen(false,{focus:true});}
    if(event.key==="Tab"){
      const order=[toggle,...items],first=order[0],last=order.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },events.signal);
  function reset(){setOpen(false,{instant:true,focus:menu.contains(document.activeElement)});}
  function replay(){reset();setOpen(true);if(!reducedMotion)timer=setTimeout(()=>setOpen(false),1750);}
  function destroy(){if(destroyed)return;destroyed=true;cancel();events.abort();signal?.removeEventListener("abort",destroy);}
  signal?.addEventListener("abort",destroy,{once:true});reset();return{replay,reset,destroy};
}
