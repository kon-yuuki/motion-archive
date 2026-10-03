/** Original, procedural orbital material. This is not Exo Ape's video or animation. */
export function createOrbit(canvas, { reducedMotion = false } = {}) {
  const ctx=canvas.getContext('2d'); if(!ctx)return{destroy(){}};
  canvas.width=820;canvas.height=820;
  const texture=document.createElement('canvas');texture.width=texture.height=320;
  const tc=texture.getContext('2d'),pixels=tc.createImageData(320,320);
  let seed=70931;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<320;y++)for(let x=0;x<320;x++){
    const i=(y*320+x)*4,grain=random(),vein=Math.sin(x*.066+Math.sin(y*.03)*3)*.2;
    const n=grain*.7+vein+.15;
    pixels.data[i]=147+n*100;pixels.data[i+1]=137+n*92;pixels.data[i+2]=119+n*80;pixels.data[i+3]=255;
  }
  tc.putImageData(pixels,0,0);
  const bumps=Array.from({length:600},()=>({x:random()*2-1,y:random()*2-1,r:random()*2+.5}));
  let frame=0,destroyed=false,visible=true,start=performance.now(),last=-1;
  function sphere(x,y,r){
    ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();
    const base=ctx.createRadialGradient(-r*.3,-r*.5,1,0,0,r);base.addColorStop(0,'#777263');base.addColorStop(.4,'#38372f');base.addColorStop(1,'#040505');ctx.fillStyle=base;ctx.fillRect(-r,-r,r*2,r*2);
    for(const b of bumps){if(b.x*b.x+b.y*b.y>.98)continue;const shade=Math.max(0,1-Math.hypot(b.x+.3,b.y+.4)/1.7);ctx.strokeStyle=`rgba(8,9,8,${.6*shade})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x*r,b.y*r,b.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(198,194,168,${.18*shade})`;ctx.fill();}
    ctx.restore();
  }
  function draw(time){
    const phase=(time-start)/15000*Math.PI*2,tilt=-.055+Math.sin(phase*.4)*.04;
    ctx.clearRect(0,0,820,820);ctx.save();ctx.translate(410,420);ctx.rotate(tilt);
    const fog=ctx.createRadialGradient(0,0,30,0,0,320);fog.addColorStop(0,'#3a302415');fog.addColorStop(1,'#0000');ctx.fillStyle=fog;ctx.fillRect(-400,-300,800,600);
    const sx=Math.cos(phase+.3)*232,sy=Math.sin(phase+.3)*78;
    if(sy<0)sphere(sx,sy,38);
    ctx.save();ctx.shadowColor='#d9bea978';ctx.shadowBlur=10;ctx.strokeStyle='#8d7964';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,266,50,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.save();ctx.rotate(-.08);ctx.scale(1,.16);ctx.beginPath();ctx.ellipse(-23,0,151,136,0,0,Math.PI*2);ctx.clip();ctx.drawImage(texture,-174,-136,302,272);const shade=ctx.createLinearGradient(-180,-140,180,140);shade.addColorStop(0,'#fff7d66e');shade.addColorStop(.5,'#46371d22');shade.addColorStop(1,'#100c0788');ctx.fillStyle=shade;ctx.fillRect(-190,-150,380,300);ctx.restore();
    if(sy>=0)sphere(sx,sy,38);
    const lx=Math.cos(phase+2.7)*267,ly=Math.sin(phase+2.7)*50;
    const glow=ctx.createRadialGradient(lx,ly,1,lx,ly,70);glow.addColorStop(0,'#fff8ce90');glow.addColorStop(.24,'#ffe3a925');glow.addColorStop(1,'#0000');ctx.fillStyle=glow;ctx.fillRect(lx-75,ly-75,150,150);
    ctx.shadowColor='#fff8e8';ctx.shadowBlur=9;ctx.fillStyle='#fffef4';ctx.beginPath();ctx.arc(lx,ly,14,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function tick(t){frame=0;if(destroyed||!visible||document.hidden||reducedMotion)return;if(t-last>32){draw(t);last=t;}frame=requestAnimationFrame(tick);}
  function update(){cancelAnimationFrame(frame);frame=0;if(visible&&!document.hidden&&!reducedMotion&&!destroyed)frame=requestAnimationFrame(tick);}
  const observer=new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting);update();});observer.observe(canvas);
  document.addEventListener('visibilitychange',update);draw(start+1900);update();
  return{destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',update);}};
}
