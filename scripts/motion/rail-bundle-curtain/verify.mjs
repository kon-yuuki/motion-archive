import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const output=resolve(root,'../motion-benchmark-correction/live-trio-corrections');
const source=resolve(root,'../motion-benchmark-correction/remaining-live-audit');
mkdirSync(output,{recursive:true});
const paths={rail:'sliders/free-drag-rail',bundle:'sliders/layered-bundle',curtain:'section-transitions/upward-curtain'};
const report={date:new Date().toISOString(),checks:[],errors:[],sourceComparison:{},screenshots:[]};
const check=(name,pass,data)=>{report.checks.push({name,pass,data});if(!pass)report.errors.push(name);};
const server=await createServer({root,server:{host:'127.0.0.1',port:4215,strictPort:true,watch:{ignored:['**/scripts/**','**/docs/**']}},optimizeDeps:{include:['@vercel/analytics','@vercel/speed-insights']},plugins:[{name:'trio-fixture',configureServer(s){s.middlewares.use((req,res,next)=>{if(!req.url.startsWith('/__trio_fixture'))return next();const url=new URL(req.url,'http://local'),which=url.searchParams.get('demo'),path=paths[which];if(!path){res.statusCode=404;res.end();return;}res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ui-gallery/${path}/style.scss"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}button{font:inherit;cursor:pointer}#root{width:100%;}button:focus-visible,[tabindex]:focus-visible{outline:3px solid #446a36;outline-offset:3px}</style></head><body><main id="root"></main><script type="module">import {createDemo} from '/ui-gallery/${path}/demo.js';window.controller=new AbortController();window.root=document.querySelector('#root');window.study=createDemo(root,{signal:controller.signal,reducedMotion:${url.searchParams.get('reduced')==='true'}});window.ready=true;</script></body></html>`);});}}]});
await server.listen();
const browser=await chromium.launch({headless:true,...(process.env.UI_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH}:{}),args:JSON.parse(process.env.UI_CHROMIUM_ARGS??'[]')});
const errors=[];
async function context(options={}){const c=await browser.newContext({viewport:{width:1180,height:900},...options});await c.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4215'?r.continue():r.abort());return c;}
const c=await context(),page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));
async function fixture(which,reduced=false){await page.goto(`http://127.0.0.1:4215/__trio_fixture?demo=${which}&reduced=${reduced}`);await page.waitForFunction(()=>window.ready);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));}
async function shot(name){await page.screenshot({path:resolve(output,name),fullPage:true});report.screenshots.push(name);}
const matrix=t=>t==='none'?[1,0,0,1,0,0]:t.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
const cubic=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;
function phaseForOpacity(p){let lo=0,hi=1;for(let i=0;i<60;i++){const t=(lo+hi)/2;if(cubic(t,.1,1)<p)lo=t;else hi=t;}return cubic((lo+hi)/2,.25,.25)*300;}
try{
 await fixture('rail');await page.mouse.move(1175,895);
 const railGeometry=await page.evaluate(()=>[...root.querySelectorAll('.free-drag-rail__group:first-child article')].map(e=>{const r=e.getBoundingClientRect();return{width:r.width,height:r.height,top:r.top,left:r.left};}));
 const expected=[325,503,325,503,325,325,440,325,503];
 check('rail: nine measured source card dimensions',railGeometry.length===9&&railGeometry.every((r,i)=>Math.abs(r.width-440)<.05&&Math.abs(r.height-expected[i])<.05&&r.top===railGeometry[0].top),railGeometry);
 check('rail: eight 30px gaps',railGeometry.slice(1).every((r,i)=>Math.abs(r.left-railGeometry[i].left-470)<.05));
 check('rail: measured4237.59375px group span',Math.abs(await page.locator('.free-drag-rail__group').first().evaluate(e=>e.getBoundingClientRect().width)-4237.59375)<.05);
 check('rail: two groups, clone inaccessible',await page.evaluate(()=>root.querySelectorAll('.free-drag-rail__group').length===2&&root.querySelectorAll('.free-drag-rail__group')[1].inert));
 const idle=await page.evaluate(async()=>{const x=Number(root.dataset.offset),t=performance.now();await new Promise(r=>setTimeout(r,500));return{delta:Number(root.dataset.offset)-x,ms:performance.now()-t};});
 check('rail: idle before interaction approximately 52.4px/s',Math.abs(idle.delta/idle.ms*1000-52.4)<5,idle);
 await shot('rail-idle-desktop.png');
 const rail=page.locator('.free-drag-rail__viewport'),box=await rail.boundingBox();
 await page.mouse.move(box.x+600,box.y+140);await page.mouse.down();await page.mouse.move(box.x+250,box.y+140,{steps:10});await page.mouse.up();
 const postDrag=await page.evaluate(async()=>{const x=root.dataset.offset;await new Promise(r=>setTimeout(r,300));return{x,after:root.dataset.offset,playing:root.dataset.playing};});
 check('rail: post-drag holds position without invented inertia',postDrag.x===postDrag.after&&postDrag.playing==='false',postDrag);
 await rail.focus();await page.keyboard.press('End');for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');
 check('rail: wraps after last card',await page.evaluate(()=>Number(root.dataset.position)<3));
 await page.keyboard.press('Home');check('rail: Home restores first card',await page.evaluate(()=>root.dataset.position==='0'));
 await page.evaluate(()=>study.reset());await page.waitForTimeout(60);await page.evaluate(()=>controller.abort());
 const deadRail=await page.evaluate(async()=>{const before=root.dataset.offset;await new Promise(r=>setTimeout(r,100));root.querySelector('[data-next]').click();return{before,after:root.dataset.offset};});check('rail: abort stops loop and handlers',deadRail.before===deadRail.after,deadRail);
 report.sourceComparison.rail={source:'rejouice-rail-dom.json / rejouice-autoplay-trace.json',method:'Direct geometry and pre-input speed, viewport1180; no source mobile/restart claim',geometry:railGeometry,idle};

 await fixture('bundle');
 const pieceGeometry=await page.evaluate(()=>[...root.querySelectorAll('[data-variant="0"] .layered-bundle__piece')].map(e=>{const s=getComputedStyle(e);return{width:parseFloat(s.width),height:parseFloat(s.height),rotate:s.rotate,scale:s.scale};}));
 check('bundle: source piece sizes and resting rotations',pieceGeometry.every((e,i)=>Math.abs(e.width-[266.312,266.312,295][i])<.05&&Math.abs(e.height-[194.938,194.938,250.922][i])<.05&&Math.abs(parseFloat(e.rotate)-[28,8,-5.5][i])<.001),pieceGeometry);
 await shot('bundle-initial-desktop.png');
 await page.evaluate(()=>{root.querySelector('[data-next]').click();window.anims=root.getAnimations({subtree:true});anims.forEach(a=>{a.pause();a.currentTime=0;});});
 const animationTimings=await page.evaluate(()=>anims.map(a=>({duration:a.effect.getTiming().duration,easing:a.effect.getTiming().easing,property:a.transitionProperty})));
 check('bundle: 300ms outer and 950ms spring coexist',animationTimings.some(a=>a.duration===300)&&animationTimings.some(a=>a.duration===950),animationTimings);
 const samples=JSON.parse(readFileSync(resolve(source,'more-next-trace.json'),'utf8')),comparison=[];
 for(const [i,s] of samples.entries()){
   const srcIncoming=s.data.find(e=>e.idx==='1'&&e.cls.startsWith('flavour-slide ')),srcOutgoing=s.data.find(e=>e.idx==='0'&&e.cls.startsWith('flavour-slide '));
   const srcTitle=s.data.find(e=>e.idx==='1'&&e.cls.startsWith('flavour-content-slide '));
   const p=Number(srcIncoming.opacity),time=phaseForOpacity(p);
   const local=await page.evaluate(t=>{anims.forEach(a=>a.currentTime=t);const read=selector=>{const s=getComputedStyle(root.querySelector(selector));return{opacity:Number(s.opacity),transform:s.transform};};return{incoming:read('[data-variant="1"]'),outgoing:read('[data-variant="0"]'),title:read('[data-caption="1"]')};},time);
   const a=matrix(srcIncoming.tf),b=matrix(srcOutgoing.tf),title=matrix(srcTitle.tf);a[4]+=1804;b[4]+=1353;title[4]+=1428;
   const la=matrix(local.incoming.transform),lb=matrix(local.outgoing.transform),lt=matrix(local.title.transform);
   const error={incoming:Math.max(...a.map((v,j)=>Math.abs(v-la[j]))),outgoing:Math.max(...b.map((v,j)=>Math.abs(v-lb[j]))),title:Math.max(...title.map((v,j)=>Math.abs(v-lt[j])))};
   comparison.push({sample:i,sourceOpacity:p,phaseMs:time,sourceNormalized:{incoming:a,outgoing:b,title},local,error});
   if([0,2,5,10].includes(i))await shot(`bundle-source-phase-${i}.png`);
 }
 const maxBundleError=Math.max(...comparison.flatMap(r=>Object.values(r.error)));
 check('bundle: independent source matrix channels at opacity-aligned phases',maxBundleError<.15,{maxBundleError});
 report.sourceComparison.bundle={method:'Opacity-derived phase from observed CSS ease300ms, compare independent matrix channels after removing Swiper layout offsets. Not absolute input-latency or photographic pixel identity.',samples:comparison,animationTimings};
 await page.evaluate(()=>{anims.forEach(a=>a.cancel());study.reset();});
 for(let i=0;i<6;i++)await page.locator('[data-next]').click();await page.waitForTimeout(1100);
 check('bundle: six forward clicks loop to index1',await page.evaluate(()=>root.dataset.position==='1'));
 await page.locator('[data-previous]').click();await page.locator('[data-previous]').click();await page.waitForTimeout(1000);
 check('bundle: reverse loops0→4',await page.evaluate(()=>root.dataset.position==='4'));
 await page.locator('.layered-bundle__stage').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await page.waitForTimeout(1000);
 check('bundle: rapid reversal settles latest selection',await page.evaluate(()=>root.dataset.position==='0'&&Number(getComputedStyle(root.querySelector('[data-variant="0"]')).opacity)===1));
 await page.evaluate(()=>{study.replay();study.reset();});await page.waitForTimeout(350);
 check('bundle: reset cancels in-flight transition',await page.evaluate(()=>root.dataset.position==='0'&&root.getAnimations({subtree:true}).length===0));
 await page.evaluate(()=>controller.abort());const old=await page.evaluate(()=>root.dataset.position);await page.locator('[data-next]').click();check('bundle: abort removes handlers',old===await page.evaluate(()=>root.dataset.position));

 await fixture('curtain');await shot('curtain-home-desktop.png');
 await page.evaluate(()=>{root.querySelector('[data-toggle]').click();window.anims=root.getAnimations({subtree:true});anims.forEach(a=>{a.pause();a.currentTime=0;});});
 const opening=[];
 for(const time of [0,212.5,425,637.5,850,1400]){
  const sample=await page.evaluate(t=>{anims.forEach(a=>a.currentTime=t);const menu=root.querySelector('.upward-curtain__menu');return{time:t,clip:getComputedStyle(menu).clipPath,nav:[...root.querySelectorAll('[data-nav-text]')].map(e=>e.getBoundingClientRect().y),word:root.querySelector('.upward-curtain__word').getBoundingClientRect().toJSON()};},time);opening.push(sample);await shot(`curtain-opening-${time}.png`);
 }
 check('curtain: opens upward from top inset100 to0',opening[0].clip.includes('100% 0% 0%')&&opening.at(-1).clip==='inset(0%)',opening.map(s=>s.clip));
 await page.evaluate(()=>{anims.forEach(a=>a.finish());});await page.waitForTimeout(30);await shot('curtain-open-desktop.png');
 await page.evaluate(()=>{root.querySelector('[data-toggle]').click();window.anims=root.getAnimations({subtree:true});anims.forEach(a=>{a.pause();a.currentTime=0;});});
 const closing=[];
 for(const time of [0,212.5,425,637.5,850]){
  closing.push(await page.evaluate(t=>{anims.forEach(a=>a.currentTime=t);return{time:t,clip:getComputedStyle(root.querySelector('.upward-curtain__menu')).clipPath,nav:[...root.querySelectorAll('[data-nav-text]')].map(e=>e.getBoundingClientRect().y),letters:[...root.querySelectorAll('[data-letter]')].map(e=>e.getBoundingClientRect().toJSON())};},time));await shot(`curtain-closing-${time}.png`);
 }
 check('curtain: closes upward and keeps content fixed',closing.at(-1).clip.includes('0% 0% 100%')&&closing.every(s=>JSON.stringify(s.nav)===JSON.stringify(closing[0].nav)&&JSON.stringify(s.letters)===JSON.stringify(closing[0].letters)),closing.map(s=>s.clip));
 report.sourceComparison.curtain={method:'Topology/direction, static layout and closing-content stationarity. Exact source duration/easing and individual letter transforms unavailable; no temporal-fidelity claim.',opening,closing};
 await page.evaluate(()=>{study.reset();root.querySelector('[data-toggle]').click();});await page.waitForTimeout(150);await page.locator('[data-toggle]').click();await page.waitForTimeout(150);await page.locator('[data-toggle]').click();await page.waitForTimeout(1450);
 check('curtain: interrupted open-close-open latest intent',await page.evaluate(()=>root.dataset.state==='open'&&getComputedStyle(root.querySelector('.upward-curtain__menu')).clipPath==='inset(0%)'));
 await page.keyboard.press('Escape');await page.waitForTimeout(900);check('curtain: Escape closes and returns focus',await page.evaluate(()=>root.dataset.state==='closed'&&document.activeElement===root.querySelector('[data-toggle]')));
 await page.locator('[data-toggle]').click();await page.waitForTimeout(1400);await page.locator('[data-item="Contact"]').focus();await page.keyboard.press('Tab');check('curtain: keyboard focus stays in menu',await page.evaluate(()=>document.activeElement===root.querySelector('[data-toggle]')));
 await page.evaluate(()=>{study.replay();study.reset();});await page.waitForTimeout(1800);check('curtain: reset cancels scheduled replay close',await page.evaluate(()=>root.dataset.state==='closed'&&root.getAnimations({subtree:true}).length===0));
 await page.evaluate(()=>controller.abort());await page.locator('[data-toggle]').click();check('curtain: abort removes handlers',await page.evaluate(()=>root.dataset.state==='closed'));

 for(const which of ['rail','bundle','curtain']){
  await fixture(which,true);if(which==='rail') {const d=await page.evaluate(async()=>{const a=root.dataset.offset;await new Promise(r=>setTimeout(r,100));return a===root.dataset.offset;});check('rail: reduced motion has no idle',d);await page.locator('[data-next]').click();}
  else await page.locator(which==='bundle'?'[data-next]':'[data-toggle]').click();
  check(`${which}: reduced motion immediate and animation-free`,await page.evaluate(()=>root.getAnimations({subtree:true}).length===0));
  await shot(`${which}-reduced.png`);
 }
 const mobile=await context({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
 for(const which of ['rail','bundle','curtain']){
  await mp.goto(`http://127.0.0.1:4215/__trio_fixture?demo=${which}`);await mp.waitForFunction(()=>window.ready);await mp.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  if(which==='curtain'){await mp.locator('[data-toggle]').tap();await mp.waitForTimeout(1400);}else{
   const selector=which==='rail'?'.free-drag-rail__viewport':'.layered-bundle__stage';
   const region=await mp.locator(selector).boundingBox();
   const touchY=region.y+Math.min(region.height*.4,140),session=await mobile.newCDPSession(mp);
   const before=await mp.evaluate(()=>({position:root.dataset.position,offset:root.dataset.offset}));
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y:touchY}]});
   for(const x of [250,220,180,140,100]){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:touchY}]});await mp.waitForTimeout(16);}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await mp.waitForTimeout(1000);
   const after=await mp.evaluate(()=>({position:root.dataset.position,offset:root.dataset.offset}));
   check(`${which}: real touch swipe changes selection/offset`,which==='rail'?Number(after.offset)>Number(before.offset)+150:after.position==='1',{before,after});
   const cancelSession=await mobile.newCDPSession(mp);
   await cancelSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y:touchY}]});
   await cancelSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:230,y:touchY}]});
   await cancelSession.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cancelSession.detach();
   await mp.locator('[data-next]').tap();await mp.waitForTimeout(1100);
   check(`${which}: touch cancellation leaves next control usable`,await mp.evaluate(()=>!root.querySelector('.is-dragging')&&Number(root.dataset.position)>0));
  }
  check(`${which}: mobile no document horizontal overflow`,await mp.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await mp.screenshot({path:resolve(output,`${which}-mobile.png`),fullPage:true});report.screenshots.push(`${which}-mobile.png`);
 }
 await mobile.close();
 for(const [which,path]of Object.entries(paths)){
  await page.goto(`http://127.0.0.1:4215/ui-gallery/${path}/`);await page.waitForSelector('[data-demo-ready=true]');
  check(`${which}: full gallery page mounts`,await page.locator('[data-demo-stage] > section').count()===1);
 }
 check('no browser page errors',errors.length===0,errors);
}catch(error){report.errors.push(error.stack);}
finally{writeFileSync(resolve(output,'verification.json'),JSON.stringify(report,null,2));await browser.close();await server.close();}
console.log(JSON.stringify({checks:report.checks.length,failures:report.errors,output},null,2));
if(report.errors.length)process.exitCode=1;
