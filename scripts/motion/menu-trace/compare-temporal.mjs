import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const evidence=resolve('../motion-benchmark-correction/menu-audit');
const out=resolve(evidence,'temporal');mkdirSync(out,{recursive:true});
const source=JSON.parse(readFileSync(resolve(evidence,'source-open-frames.json')));
const fits=JSON.parse(readFileSync(resolve(evidence,'phase-fit.json'))).frames;
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ui-gallery/buttons/menu-icon-morph/style.scss"><style>html,body{margin:0}.skip-link{position:absolute;transform:translateY(-200%)}*{box-sizing:border-box}button{font:inherit}#fixture .menu-icon-morph{width:100vw;height:100vh;min-height:0}</style></head><body><main id="fixture"></main><script type="module">import {createDemo} from '/ui-gallery/buttons/menu-icon-morph/demo.js';window.controller=createDemo(document.querySelector('#fixture'));</script></body></html>`;
const server=await createServer({server:{host:'127.0.0.1',port:4188,strictPort:true},plugins:[{name:'temporal-menu-fixture',configureServer(server){server.middlewares.use('/__temporal__/',async(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__temporal__/',fixture))})}}]});
await server.listen();
const browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH??'/tmp/chromium',headless:true,args:['--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1180,height:757}});
 await page.goto('http://127.0.0.1:4188/__temporal__/');await page.waitForFunction(()=>!!window.controller);
 const stageBounds=await page.locator('.menu-icon-morph').boundingBox();
 if(stageBounds.x!==0||stageBounds.y!==0||stageBounds.width!==1180||stageBounds.height!==757)throw new Error(`Unaligned fixture: ${JSON.stringify(stageBounds)}`);
 await page.mouse.move(1120.9,59.1);await page.waitForTimeout(1800);
 await page.locator('.menu-icon-morph__toggle').evaluate(el=>el.click());
 await page.waitForTimeout(20);
 await page.locator('.menu-icon-morph').evaluate(el=>{window.animations=el.getAnimations({subtree:true});for(const a of window.animations)a.pause()});
 const freeze=ms=>page.evaluate(t=>{for(const a of window.animations)a.currentTime=t},ms);
 const read=()=>page.locator('.menu-icon-morph').evaluate(stage=>{const el=s=>stage.querySelector(s),css=s=>getComputedStyle(el(s));return {panel:el('.menu-icon-morph__panel').getBoundingClientRect().toJSON(),curve:parseFloat(css('.menu-icon-morph__curve-width').width),overlay:parseFloat(css('.menu-icon-morph__backdrop').opacity),linkX:new DOMMatrix(css('.menu-icon-morph__item').transform).m41}});
 const measured=[];
 for(let i=0;i<source.length;i++){
   const s=source[i];const translation=s.panel.x-702.649658203125;
   const ms=inverse(1-translation/548.140625)*800;
   await freeze(ms);const r=await read();
   measured.push({sourceFrame:i,inferredSourceCssTimeMs:ms,source:{panelX:s.panel.x,curve:parseFloat(s.curveWidth),overlay:+s.overlayOpacity,linkX:+s.firstLink.split(', ')[4]},replica:r,delta:{panelX:r.panel.x-s.panel.x,curve:r.curve-parseFloat(s.curveWidth),overlay:r.overlay-(+s.overlayOpacity),linkX:r.linkX-(+s.firstLink.split(', ')[4])}});
 }
 for(const fit of fits){await freeze(fit.fittedCssTimeMs);await page.screenshot({path:resolve(out,`replica-phase-${fit.sourceFrame}.png`)});}
 const preFix=await page.addStyleTag({content:'.menu-icon-morph__curve-width{overflow:visible}.menu-icon-morph__ellipse{left:0}'});
 for(const fit of fits){await freeze(fit.fittedCssTimeMs);await page.screenshot({path:resolve(out,`replica-before-phase-${fit.sourceFrame}.png`)});}
 await preFix.evaluate(el=>el.remove());
 await freeze(900);await page.screenshot({path:resolve(out,'replica-settled.png')});
 // Closing is also sampled exactly. Reset initial open transitions before closing.
 await page.evaluate(()=>{window.controller.reset();window.controller.replay()});await page.waitForTimeout(1100);
 await page.locator('.menu-icon-morph__toggle').evaluate(el=>el.click());await page.waitForTimeout(20);
 await page.locator('.menu-icon-morph').evaluate(el=>{window.animations=el.getAnimations({subtree:true});for(const a of window.animations)a.pause()});
 const closing=[];for(const ms of [0,100,200,300,400,500,600,750,900]){await freeze(ms);closing.push({ms,...await read()});await page.screenshot({path:resolve(out,`replica-close-${ms}.png`)});}
 const max=key=>Math.max(...measured.map(m=>Math.abs(m.delta[key])));
 const report={scope:'Source DOM samples compared at the CSS progress independently inferred from source panel translation. This tests the coupled temporal relationship of curve, link and overlay, not wall-clock input latency. Separate source screenshots are phase aligned by silhouette. Font/background/cursor remain excluded. Closing frames document replica only; no synchronized source close series was available.',source:'https://dennissnellenberg.com/',measured,maxAbsDelta:{panelX:max('panelX'),curve:max('curve'),overlay:max('overlay'),linkX:max('linkX')},closing};
 writeFileSync(resolve(out,'temporal-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.maxAbsDelta,null,2));
}finally{await browser.close();await server.close()}
function ease(t){let lo=0,hi=1;for(let i=0;i<32;i++){const u=(lo+hi)/2;const x=3*(1-u)**2*u*.7+3*(1-u)*u*u*.2+u**3;if(x<t)lo=u;else hi=u}const u=(lo+hi)/2;return 3*(1-u)*u*u+u**3}
function inverse(y){let lo=0,hi=1;for(let i=0;i<32;i++){const t=(lo+hi)/2;if(ease(t)<y)lo=t;else hi=t}return (lo+hi)/2}
