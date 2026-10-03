const photoUrl = new URL('./assets/original-headphone-campaign.webp', import.meta.url).href;
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

/** Eight connected photo bands: outer flats and three interior mountain folds.
 * Boundary coordinates are traced from the 918×656 recording, not source code.
 * elapsed=0 is the reset cut at source ~0.284s; source input/easing remain unknown.
 */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `<section class="accordion-unfold" aria-label="写真が折り目から開く記録映像の再構成"><div class="accordion-unfold__scene"><canvas width="918" height="656" aria-label="小さな写真が折り目を開き、画面幅へ広がります" role="img"></canvas></div><div class="accordion-unfold__controls"><button type="button">折り目から再生</button><span role="status" aria-live="polite"></span></div></section>`;
  const stage = root.firstElementChild;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const status = root.querySelector('[role=status]');
  const lifecycle = new AbortController();
  const image = new Image();
  let frame = 0, elapsed = 0, start = 0, destroyed = false, observer;
  const top = [[357,206],[406,206],[425,181],[453,206],[479,181],[508,206],[534,181],[561,206],[605,206]];
  const bottom = [[344,377],[395,377],[424,354],[449,377],[478,354],[506,377],[535,354],[575,377],[627,377]];

  function triangle(source, destination) {
    const [a,b,c] = source, [d,e,f] = destination;
    const den = a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
    const coeff = (axis) => [
      (d[axis]*(b[1]-c[1])+e[axis]*(c[1]-a[1])+f[axis]*(a[1]-b[1]))/den,
      (d[axis]*(c[0]-b[0])+e[axis]*(a[0]-c[0])+f[axis]*(b[0]-a[0]))/den,
      (d[axis]*(b[0]*c[1]-c[0]*b[1])+e[axis]*(c[0]*a[1]-a[0]*c[1])+f[axis]*(a[0]*b[1]-b[0]*a[1]))/den,
    ];
    const x=coeff(0), y=coeff(1);
    ctx.save();const center=[(d[0]+e[0]+f[0])/3,(d[1]+e[1]+f[1])/3];const expanded=[d,e,f].map(p=>p.map((v,i)=>center[i]+(v-center[i])*1.004));ctx.beginPath();ctx.moveTo(...expanded[0]);ctx.lineTo(...expanded[1]);ctx.lineTo(...expanded[2]);ctx.closePath();ctx.clip();
    ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();
  }
  function render(ms) {
    elapsed = ms;
    const time = ms + 284;
    const unfolding = ease((time - 1090) / 210);
    const fade = ease((time - 530) / 185);
    const compact = ease((time - 1690) / 250);
    const headerHeight = mix(104, 46, compact);
    ctx.clearRect(0,0,918,656);ctx.fillStyle='#fff';ctx.fillRect(0,0,918,656);
    ctx.fillStyle='#efefef';ctx.fillRect(14,headerHeight,890,642-headerHeight);
    ctx.fillStyle='#343535';ctx.font='bold 12px Arial';ctx.fillText('SOUND / STUDIO',18,28);
    ctx.font='14px Arial';ctx.fillStyle='#8b8b8b';
    ctx.globalAlpha=1-compact;
    ['Speakers','Headphones','Accessories','All Products','The Journal'].forEach((s,i)=>ctx.fillText(s,160+i*133,32));
    ctx.globalAlpha=1;
    ctx.font='8px Arial';['INTRO','SAND','TANGERINE','CHARCOAL'].forEach((s,i)=>ctx.fillText(s,319+i*54,mix(86,26,compact)));
    ctx.fillStyle='#343535';ctx.beginPath();ctx.roundRect(555,mix(72,15,compact),43,22,12);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillText('BUY',568,mix(86,29,compact));
    ctx.fillStyle='#393939';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.letterSpacing='2px';
    ctx.globalAlpha=fade;ctx.fillText('SPRING SUMMER 2017 COLLECTION',459,mix(130,132,compact));ctx.letterSpacing='0px';ctx.textAlign='left';
    if (image.complete && image.naturalWidth && fade > 0) {
      ctx.save();ctx.beginPath();ctx.rect(14,headerHeight,890,642-headerHeight);ctx.clip();
      // Piecewise scene geometry is aligned to inspected source frames. The fold
      // flattens before the final width settles; one global easing missed this.
      const anchors = [709,851,1134,1276,1418,1559];
      const pose = (t, i, lower) => {
        const original=(lower?bottom:top)[i];
        if(t===709)return [original[0]-2,original[1]+7];
        if(t===851)return original;
        if(t===1134)return [488+(original[0]-485)*1.13,181+(original[1]-181)*1.10];
        if(t===1276)return [mix(lower?164:181,lower?822:798,i/8),(lower?588:227)+((i>1&&i<7&&i%2===0)?-7:0)];
        if(t===1418)return [mix(34,895,i/8),lower?680:253];
        return [mix(14,904,i/8),lower?685:257];
      };
      let k=anchors.findIndex(t=>t>=time);if(k<0)k=anchors.length-1;
      const t0=anchors[Math.max(0,k-1)],t1=anchors[k];
      const blend=t1===t0?1:clamp((time-t0)/(t1-t0));
      const vertex=(i,lower)=>{const a=pose(t0,i,lower),b=pose(t1,i,lower);return a.map((v,j)=>mix(v,b[j],blend));};
      if(time>=1559) ctx.drawImage(image,14,257,890,428);
      else for(let i=0;i<8;i++) {
        const p0=vertex(i,false);
        const p1=vertex(i+1,false);
        const p2=vertex(i+1,true);
        const p3=vertex(i,true);
        const sx=i*image.width/8, ex=(i+1)*image.width/8, h=image.height;
        triangle([[sx,0],[ex,0],[sx,h]],[p0,p1,p3]);triangle([[ex,0],[ex,h],[sx,h]],[p1,p2,p3]);
        ctx.fillStyle=`rgba(18,18,18,${(1-unfolding)*(i%2 ? .11 : .015)})`;ctx.beginPath();ctx.moveTo(...p0);ctx.lineTo(...p1);ctx.lineTo(...p2);ctx.lineTo(...p3);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha=1;
    const letters=[['A',47],['N',246],['E',337],['W',620]];
    ctx.fillStyle='#333536';ctx.font='bold 98px Arial';
    letters.forEach(([letter,x],i)=>{const p=ease((time-1860-i*115)/245);ctx.globalAlpha=p;ctx.fillText(letter,x,296+(1-p)*14);});
    ctx.globalAlpha=ease((time-2160)/230);ctx.fillRect(414,259,139,3);ctx.globalAlpha=1;
    stage.dataset.phase=time<530?'blank':time<715?'fade':time<1134?'held-fold':time<1449?'unfold':time<1860?'expanded':'letters';
    stage.dataset.elapsed=String(Math.round(ms));
  }
  function stop(){cancelAnimationFrame(frame);frame=0;observer?.disconnect();}
  function reset(){if(destroyed)return;stop();render(reducedMotion?2500:0);status.textContent=reducedMotion?'動きを省いて完成状態を表示':'再生すると写真が現れ、折り目を保ってから開きます';}
  function tick(now){if(destroyed)return;render(Math.min(2500,now-start));if(elapsed<2500)frame=requestAnimationFrame(tick);else{frame=0;status.textContent='写真が開いた後に文字が現れました';}}
  function replay(){if(destroyed)return;reset();if(reducedMotion)return;start=performance.now();frame=requestAnimationFrame(tick);}
  function seek(ms){if(destroyed)return;stop();render(ms);}
  function destroy(){if(destroyed)return;destroyed=true;stop();lifecycle.abort();image.onload=null;signal?.removeEventListener('abort',destroy);}
  image.onload=()=>{if(!destroyed)render(elapsed);};image.src=photoUrl;
  root.querySelector('button').addEventListener('click',replay,{signal:lifecycle.signal});
  signal?.addEventListener('abort',destroy,{once:true});reset();
  if(!reducedMotion){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))replay();},{threshold:.25});observer.observe(stage);}
  if(signal?.aborted)destroy();
  return {replay,reset,destroy,seek};
}
