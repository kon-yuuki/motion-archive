import { createServer } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const output = resolve(process.env.UI_BENCHMARK_OUTPUT ?? ".ui-motion-qa/dennis-benchmark");
mkdirSync(output, { recursive: true });
const server = await createServer({ server: { host: "127.0.0.1", port: 4178, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true, ...(process.env.UI_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH} : {}), args: process.env.UI_CHROMIUM_ARGS ? JSON.parse(process.env.UI_CHROMIUM_ARGS) : [] });
const results=[];const errors=[];
const check=(name,pass,details)=>{results.push({name,pass,details});if(!pass)console.error(name,details)};
try {
 const context=await browser.newContext({viewport:{width:1180,height:757}});
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/_vercel/'))return route.fulfill({body:'',contentType:'application/javascript'});return url.origin==='http://127.0.0.1:4178'?route.continue():route.abort()});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4178/ui-gallery/buttons/magnetic-fill/');
 await page.waitForSelector('[data-demo-ready=true]');
 await page.locator('.motion-lab').screenshot({path:resolve(output,'replica-context.png')});
 const target=page.locator('.magnetic-fill__target');
 await target.scrollIntoViewIfNeeded();
 const box=await target.boundingBox(); const center={x:box.x+box.width/2,y:box.y+box.height/2};
 const rect={x:center.x-130.359375,y:center.y-138.887512,width:300,height:230};
 const state=()=>target.evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).backgroundColor,labelRect:e.querySelector('.magnetic-fill__label > span').getBoundingClientRect().toJSON(),orb:getComputedStyle(e).transform,label:getComputedStyle(e.querySelector('.magnetic-fill__label')).transform,fill:getComputedStyle(e.querySelector('.magnetic-fill__fill')).transform,blue:getComputedStyle(e.querySelector('.magnetic-fill__fill')).backgroundColor}));
 check('144px source diameter',Math.abs(box.width-144)<0.1,box.width);
 check('Source dark color',(await state()).color==='rgb(28, 29, 32)');
 check('Source blue color',(await state()).blue==='rgb(69, 92, 233)');
 check('Plain About me label',(await target.textContent()).trim()==='About me');
 check('No arrow or orbit',await page.locator('.magnetic-fill svg, .magnetic-fill__orbit').count()===0);
 check('Real link not toggle',await target.getAttribute('href')==='https://dennissnellenberg.com/about' && await target.getAttribute('aria-pressed')===null);
 await page.mouse.move(center.x-200,center.y);
 await page.screenshot({path:resolve(output,'replica-rest.png'),clip:rect});
 const samples=[];
 await page.mouse.move(center.x+42,center.y-38);
 let start=Date.now();let previous=0;
 for(const ms of [100,200,300,400,500,650,1500]) {await page.waitForTimeout(Math.max(0,ms-(Date.now()-start)));const s=await state();samples.push({phase:'enter',ms:Date.now()-start,...s});await page.screenshot({path:resolve(output,`replica-enter-${ms}.png`),clip:rect});previous=ms;}
 const hover=await state();const matrix=new DOMMatrixFallback(hover.orb),labelMatrix=new DOMMatrixFallback(hover.label);
 check('Circle follows source strength 100',Math.abs(matrix.x-42/144*100)<0.4&&Math.abs(matrix.y+38/144*100)<0.4,hover);
 check('Nested label follows strength 50',Math.abs(labelMatrix.x-matrix.x/2)<0.1&&Math.abs(labelMatrix.y-matrix.y/2)<0.1,hover.label);
 check('Fill covers circle after enter',new DOMMatrixFallback(hover.fill).y===0);
 await page.screenshot({path:resolve(output,'replica-hover.png'),clip:rect});
 await page.mouse.move(center.x-200,center.y);start=Date.now();
 for(const ms of [100,200,300,400,500,650,1500]){await page.waitForTimeout(Math.max(0,ms-(Date.now()-start)));samples.push({phase:'exit',ms:Date.now()-start,...await state()});await page.screenshot({path:resolve(output,`replica-exit-${ms}.png`),clip:rect});}
 const rest=await state();check('Fill exits upward',Math.abs(new DOMMatrixFallback(rest.fill).y+218.88)<0.1,rest.fill);
 check('Circle returns to origin',Math.abs(new DOMMatrixFallback(rest.orb).x)<0.1,rest.orb);
 // Interrupted entry/exit and repeated input must not leave stale animations.
 for(let i=0;i<8;i++){await page.mouse.move(center.x+35,center.y-25);await page.waitForTimeout(40);await page.mouse.move(center.x-200,center.y);await page.waitForTimeout(30)}
 await page.waitForTimeout(1700);check('Repeated enter/exit settles',Math.abs(new DOMMatrixFallback((await state()).orb).x)<0.1);
 for(let i=0;i<4;i++){await page.locator('[data-demo-replay]').click();await page.locator('[data-demo-reset]').click()}
 await page.waitForTimeout(1800);check('Reset cancels replay',new DOMMatrixFallback((await state()).fill).y< -218);
 await target.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');check('Keyboard fallback visible',await target.evaluate(e=>e.matches(':focus-visible')&&getComputedStyle(e).outlineStyle!=='none'));
 // Inspect a popup with local routing; do not make network requests to the source.
 let requestedAbout=false;context.on('request',req=>{if(req.url()==='https://dennissnellenberg.com/about')requestedAbout=true});const popupPromise=context.waitForEvent('page');await target.press('Enter');const popup=await popupPromise;await popup.waitForTimeout(100);check('Keyboard activation requests source About',requestedAbout);await popup.close();
 await page.locator('[data-motion-toggle]').check();await page.locator('[data-demo-replay]').click();await page.waitForTimeout(250);
 check('Reduced motion keeps circle at origin',await page.locator('.magnetic-fill__target').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41===0));
 await page.locator('.motion-lab').screenshot({path:resolve(output,'replica-reduced-motion.png')});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('[data-demo-reset]').click();check(`${width}px no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.motion-lab').screenshot({path:resolve(output,`replica-mobile-${width}.png`)});}
 const axe=await new AxeBuilder({page}).include('.motion-lab').analyze();check('No serious/critical accessibility issue',axe.violations.filter(v=>['serious','critical'].includes(v.impact)).length===0,axe.violations);
 // Touch/coarse-pointer fallback is tested separately from reduced motion.
 const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const mobile=await touch.newPage();await mobile.goto('http://127.0.0.1:4178/ui-gallery/buttons/magnetic-fill/');await mobile.waitForSelector('[data-demo-ready=true]');
 await mobile.locator('[data-demo-replay]').click();await mobile.waitForTimeout(300);
 check('Touch fallback has no magnetic translation',await mobile.locator('.magnetic-fill__target').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41===0));
 check('Touch fallback is a link',await mobile.locator('.magnetic-fill__target').getAttribute('href')==='https://dennissnellenberg.com/about');
 await touch.close();
 check('No page errors',errors.length===0,errors);
 writeFileSync(resolve(output,'samples.json'),JSON.stringify(samples,null,2));
 writeFileSync(resolve(output,'report.json'),JSON.stringify({results,errors,sourceViewport:{width:1180,height:757},scope:'Component trace. Source typeface and full-page transition excluded.'},null,2));
 console.log(JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,output},null,2));
 if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();await server.close()}
function DOMMatrixFallback(value){const n=value.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number);this.x=n?.[4]??0;this.y=n?.[5]??0}
