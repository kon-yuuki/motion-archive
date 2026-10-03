import * as T from 'three';

/** All room marks and stickers are drawn here, not extracted from the reference. */
export function createIllustrationTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
  const c = canvas.getContext('2d'); c.fillStyle = '#0808a8'; c.fillRect(0, 0, 1024, 1024);
  c.strokeStyle = '#b6b3c9'; c.fillStyle = '#b6b3c9'; c.lineWidth = 24;
  [[130,170,92],[750,730,164],[920,130,135],[430,940,90]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();});
  c.beginPath();c.ellipse(550,340,180,105,-.4,0,Math.PI*2);c.stroke();
  c.beginPath();c.arc(175,640,140,0,Math.PI*2);c.fill();c.fillStyle='#0808a8';c.beginPath();c.arc(175,640,19,0,Math.PI*2);c.fill();
  c.strokeStyle='#b6b3c9';c.beginPath();c.moveTo(640,25);c.bezierCurveTo(760,-70,815,40,766,105);c.bezierCurveTo(876,183,765,283,696,218);c.bezierCurveTo(620,330,510,233,559,163);c.bezierCurveTo(480,82,581,-9,640,25);c.closePath();c.stroke();
  c.beginPath();c.moveTo(420,580);c.bezierCurveTo(305,480,338,400,420,450);c.bezierCurveTo(495,351,570,488,420,580);c.stroke();
  const texture = new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace; texture.wrapS=texture.wrapT=T.RepeatWrapping; texture.anisotropy=4; return texture;
}

export function createStickerTexture(kind, color) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.translate(128,128);c.lineJoin='round';c.lineCap='round';
  const path=()=>{c.beginPath();if(kind==='heart'){c.moveTo(0,88);c.bezierCurveTo(-154,-7,-87,-129,0,-44);c.bezierCurveTo(87,-129,154,-7,0,88);}
    else if(kind==='star'){for(let i=0;i<10;i++){const r=i%2?43:103,a=i*Math.PI/5-Math.PI/2;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();}
    else if(kind==='mushroom'){c.moveTo(-17,9);c.lineTo(-22,91);c.quadraticCurveTo(0,112,22,91);c.lineTo(17,9);c.lineTo(91,9);c.quadraticCurveTo(44,-133,-24,-83);c.quadraticCurveTo(-78,-40,-91,9);c.closePath();}
    else if(kind==='eyes'){c.ellipse(-44,0,49,81,-.25,0,Math.PI*2);c.ellipse(44,0,49,81,.25,0,Math.PI*2);}
    else if(kind==='planet'){c.ellipse(0,0,88,70,-.3,0,Math.PI*2);}
    else {c.arc(0,0,91,0,Math.PI*2);}};
  path();c.strokeStyle='white';c.lineWidth=18;c.stroke();c.fillStyle=color;c.fill();c.strokeStyle='#101019';c.lineWidth=5;c.stroke();
  c.fillStyle='#0b0b18';c.strokeStyle='#0b0b18';c.lineWidth=7;
  if(kind==='smile'){c.beginPath();c.ellipse(-30,-23,9,17,-.2,0,Math.PI*2);c.ellipse(30,-23,9,17,-.2,0,Math.PI*2);c.fill();c.beginPath();c.arc(0,8,48,.15,Math.PI-.15);c.stroke();}
  if(kind==='eyes'){[-44,44].forEach(x=>{c.fillStyle='#fff';c.beginPath();c.ellipse(x,0,43,74,0,0,Math.PI*2);c.fill();c.fillStyle='#1574ff';c.beginPath();c.ellipse(x+9,18,23,34,0,0,Math.PI*2);c.fill();c.fillStyle='#111';c.beginPath();c.ellipse(x+13,20,11,20,0,0,Math.PI*2);c.fill();});}
  if(kind==='mushroom'){c.fillStyle='#fff';[[-45,-18],[6,-47],[47,-14]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();});}
  if(kind==='planet'){c.beginPath();c.ellipse(0,0,115,24,-.4,0,Math.PI*2);c.strokeStyle='#fff';c.lineWidth=13;c.stroke();c.strokeStyle='#111';c.lineWidth=4;c.stroke();}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}

export function createSuitWeave() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#888';c.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=3){c.strokeStyle=i%2?'#777':'#aaa';c.beginPath();c.moveTo(i,0);c.lineTo(i,128);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(128,i);c.stroke();}
  const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(14,14);return t;
}
