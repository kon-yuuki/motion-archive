import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const output = resolve(process.env.ICON_TRACE_OUTPUT ?? '../motion-benchmark-correction/icon-audit/replica');
mkdirSync(output,{recursive:true});
const checks=[], errors=[], samples=[];
const check=(name,pass,detail)=>{checks.push({name,pass,detail}); if(!pass) console.error(name,detail);};
const near=(a,b,t=1)=>Math.abs(a-b)<=t;
const origin='http://127.0.0.1:4192';
const harness=`<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ui-gallery/buttons/icon-sequence/style.scss"><style>html,body{margin:0}*{box-sizing:border-box}.skip-link{display:none}</style></head><body><main id="fixture"></main><script type="module">import{createDemo}from'/ui-gallery/buttons/icon-sequence/demo.js';window.mount=(reducedMotion=false)=>{window.demo?.destroy();window.controller=new AbortController();window.demo=createDemo(document.querySelector('#fixture'),{signal:controller.signal,reducedMotion})};mount();</script></body></html>`;
const server=await createServer({server:{host:'127.0.0.1',port:4192,strictPort:true},plugins:[{name:'icon-fixture',configureServer(s){s.middlewares.use('/__icon/',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__icon/',harness));});}}]});
await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH??'/tmp/chromium',args:['--disable-dev-shm-usage']});
try{
 const ctx=await browser.newContext({viewport:{width:918,height:656}});
 await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/_vercel/'))return route.fulfill({body:''});return u.origin===origin?route.continue():route.abort();});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.goto(origin+'/__icon/');await p.waitForFunction(()=>!!window.demo);await p.clock.pauseAt(new Date());
 const read=()=>p.locator('.icon-sequence').evaluate(s=>({time:+s.dataset.traceTime,phase:s.dataset.phase,box:s.querySelector('button').getBoundingClientRect().toJSON(),background:getComputedStyle(s).backgroundColor,color:getComputedStyle(s.querySelector('button')).backgroundColor,first:+s.querySelector('.icon-sequence__first').style.opacity,last:+s.querySelector('.icon-sequence__last').style.opacity,flames:[...s.querySelectorAll('.icon-sequence__flames>span')].map(e=>+e.style.opacity)}));
 const rest=await read();check('Recorded capsule geometry',near(rest.box.x,321)&&near(rest.box.y,283)&&near(rest.box.width,278)&&near(rest.box.height,94),rest.box);
 check('Source yellow / near-white',rest.background==='rgb(247, 205, 73)'&&rest.color==='rgb(253, 253, 253)',rest);
 check('Four actual flame characters',await p.locator('.icon-sequence__flames').textContent()==='🔥🔥🔥🔥');
 check('No invented selection toggle',await p.locator('button').getAttribute('aria-pressed')===null);
 await p.screenshot({path:resolve(output,'replica-0000.png')});
 await p.evaluate(()=>demo.replay());let elapsed=0;
 for(const time of [100,233,300,400,500,600,700,800,900,1000,1200,1400,1600,1800,1850]){await p.clock.runFor(time-elapsed);elapsed=time;const state=await read();samples.push({requestedTime:time,...state});await p.screenshot({path:resolve(output,`replica-${String(time).padStart(4,'0')}.png`)});}
 const flame600=samples.find(s=>s.requestedTime===600);check('Four flames visible around600ms',flame600.flames.slice(0,3).every(v=>v>.95)&&flame600.flames[3]>.7,flame600);
 const flame800=samples.find(s=>s.requestedTime===800);check('Flames leave in original left-to-right order',flame800.flames[0]===0&&flame800.flames[1]<.2&&flame800.flames[1]<flame800.flames[2]&&flame800.flames[2]>.7,flame800);
 const end=await read();check('1800ms blue / final label',end.color==='rgb(50, 51, 193)'&&end.first===0&&end.last===1&&end.flames.every(v=>v===0),end);
 for(const time of [0,300,600,800,1200,1600,1800]){await p.evaluate(t=>demo.seek(t),time);await p.screenshot({path:resolve(output,`aligned-${String(time).padStart(4,'0')}.png`)});}
 await p.evaluate(()=>{demo.replay();demo.reset()});await p.clock.runFor(2200);check('Reset cancels sequence', (await read()).phase==='rest');
 await p.evaluate(()=>demo.replay());await p.clock.runFor(400);await p.evaluate(()=>demo.replay());await p.clock.runFor(200);check('Replay starts a fresh timeline',(await read()).time<230);
 await p.evaluate(()=>controller.abort());const before=await p.locator('.icon-sequence').innerHTML();await p.clock.runFor(2200);await p.evaluate(()=>{demo.replay();demo.reset();demo.destroy()});check('Abort stops all future updates',before===await p.locator('.icon-sequence').innerHTML());
 await p.evaluate(()=>mount(true));await p.evaluate(()=>demo.replay());const reduced=await read();check('Reduced motion switches immediately',reduced.phase==='settled'&&reduced.last===1);await p.evaluate(()=>demo.reset());check('Reduced Reset is immediate',(await read()).phase==='rest');
 await p.evaluate(()=>mount());await p.locator('button').focus();await p.clock.runFor(500);check('Keyboard focus replays',(await read()).time>450);await p.locator('button').press('Enter');await p.clock.runFor(100);check('Enter restarts without selection',(await read()).time<130);await p.locator('button').press('Space');await p.clock.runFor(100);check('Space restarts',(await read()).time<130);
 for(const width of [390,320]){await p.setViewportSize({width,height:844});check(`${width}px no overflow`,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await p.screenshot({path:resolve(output,`replica-mobile-${width}.png`)});}
 await p.goto(origin+'/ui-gallery/buttons/icon-sequence/');await p.waitForSelector('[data-demo-ready=true]');check('Gallery shows new source title',(await p.locator('h1').textContent()).includes('Hall of Fame'));await p.locator('[data-motion-toggle]').check();await p.locator('[data-demo-replay]').click();check('Gallery reduced toggle uses immediate endpoint',await p.locator('.icon-sequence').getAttribute('data-phase')==='settled');
 await p.locator('[data-demo-reset]').click();check('Gallery Reset restores initial state',await p.locator('.icon-sequence').getAttribute('data-phase')==='rest');
 check('No page errors',errors.length===0,errors);
 writeFileSync(resolve(output,'report.json'),JSON.stringify({checks,errors,scope:'Local implementation tests. Source footage time origin and OS emoji glyph differ; these checks are not a fidelity certification.'},null,2));writeFileSync(resolve(output,'samples.json'),JSON.stringify(samples,null,2));console.log(JSON.stringify({passed:checks.filter(c=>c.pass).length,total:checks.length,output},null,2));if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{await browser.close();await server.close();}
