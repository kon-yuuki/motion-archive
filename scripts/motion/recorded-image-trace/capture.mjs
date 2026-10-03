import {createServer} from 'vite';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const slug=process.argv[2] || 'accordion-unfold';
const output=resolve(`../motion-benchmark-correction/image-corrections/${slug}`);mkdirSync(output,{recursive:true});
const times={ 'accordion-unfold': [.709,.851,1.134,1.276,1.418,1.985,2.410], 'cube-tiles':[.110,.331,.551,.881,1.102,1.432] }[slug] || [];
const offset={'accordion-unfold':.284,'cube-tiles':.110}[slug] || 0;
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4197,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});
const results={slug,sourceTiming:'Frame timestamps from downloaded MP4; phase onsets estimated visually, not extracted source timing.',checks:[],captures:[]};
const check=(name,pass,detail)=>{results.checks.push({name,pass,detail});if(!pass)process.exitCode=1;};
try{
 const page=await browser.newPage({viewport:{width:918,height:750},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:4197/scripts/motion/recorded-image-trace/fixture.html?slug=${slug}`);await page.waitForFunction(()=>window.ready);await page.waitForTimeout(350);
 for(const time of times){await page.evaluate(ms=>demo.seek(ms),(time-offset)*1000);await page.waitForTimeout(50);await page.locator(`.${slug}__scene`).screenshot({path:resolve(output,`replica-${time.toFixed(3)}.png`)});results.captures.push({sourceTimestamp:time,replicaElapsed:(time-offset)*1000});}
 await page.evaluate(()=>demo.reset());await page.waitForTimeout(100);check('reset-initial-phase',await page.locator(`.${slug}`).getAttribute('data-phase')==='blank',await page.locator(`.${slug}`).getAttribute('data-phase'));
 await page.locator('button').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(550);check('keyboard-replay',await page.locator(`.${slug}`).getAttribute('data-phase')!=='blank',await page.locator(`.${slug}`).getAttribute('data-phase'));
 await page.evaluate(()=>{for(let i=0;i<6;i++)demo.replay();demo.reset();});await page.waitForTimeout(800);check('replay-interruption-reset-cancels',await page.locator(`.${slug}`).getAttribute('data-phase')==='blank');
 await page.evaluate(()=>demo.replay());await page.waitForTimeout(slug==='accordion-unfold'?2650:1850);check('replay-completes',await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='accordion-unfold'?'letters':'complete'),await page.locator(`.${slug}`).getAttribute('data-phase'));
 await page.evaluate(()=>mount(true));await page.waitForTimeout(100);check('reduced-motion-settled',await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='accordion-unfold'?'letters':'complete'));
 await page.locator(`.${slug}__scene`).screenshot({path:resolve(output,'reduced.png')});
 await page.setViewportSize({width:390,height:740});await page.evaluate(()=>mount(false));await page.waitForTimeout(400);await page.evaluate(()=>demo.seek(2500));await page.locator(`.${slug}`).screenshot({path:resolve(output,'mobile.png')});check('mobile-no-overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>{demo.replay();controller.abort();});const before=await page.locator(`.${slug}`).getAttribute('data-elapsed');await page.waitForTimeout(500);check('abort-stops-animation',before===await page.locator(`.${slug}`).getAttribute('data-elapsed'));
 await page.evaluate(()=>{demo.destroy();demo.destroy();mount();demo.reset();});await page.waitForTimeout(600);check('destroy-remount-reset',await page.locator(`.${slug}`).getAttribute('data-phase')==='blank');check('no-page-errors',errors.length===0,errors);
 await page.close();
}finally{writeFileSync(resolve(output,'verification.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}
console.log(JSON.stringify(results,null,2));
