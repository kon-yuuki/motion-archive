import {createServer} from 'vite';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const slugs=process.argv.slice(2).length?process.argv.slice(2):['gradient-frame-wipe','numeral-mask'];
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4208,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});
try {for(const slug of slugs){
 const output=resolve(`../motion-benchmark-correction/section-corrections/${slug}`);mkdirSync(output,{recursive:true});
 const times=slug==='gradient-frame-wipe'?[.78,.86,1.146,1.432,1.58,1.719,2.005,2.578,2.865,3.151,3.438,4.5]:[0,.397,.794,1.191,1.588,1.985,2.382,2.779,3.176,3.573,3.970,4.367,4.764,5.161,5.558,5.955,6.352,6.749];
 const offset=slug==='gradient-frame-wipe'?.78:0;
 const page=await browser.newPage({viewport:slug==='gradient-frame-wipe'?{width:1210,height:850}:{width:1600,height:1280},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results={slug,checks:[],captures:[],timing:'Source MP4 timestamps are measured; phase interpolation and playback/scroll mapping are reconstruction choices.'};
 const check=(name,pass,detail)=>{results.checks.push({name,pass,detail});if(!pass)process.exitCode=1;};
 await page.goto(`http://127.0.0.1:4208/scripts/motion/recorded-section-trace/fixture.html?slug=${slug}`);await page.waitForFunction(()=>window.ready);await page.waitForTimeout(100);
 for(const time of times){await page.evaluate(ms=>demo.seek(ms),(time-offset)*1000);await page.waitForTimeout(75);await page.locator(`.${slug}__scene`).screenshot({path:resolve(output,`replica-${time.toFixed(3)}.png`)});results.captures.push({sourceTimestamp:time,replicaElapsed:(time-offset)*1000,phase:await page.locator(`.${slug}`).getAttribute('data-phase')});}
 await page.evaluate(()=>demo.reset());await page.waitForTimeout(100);check('reset',await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='gradient-frame-wipe'?'outgoing':'numeral'));
 if(slug==='gradient-frame-wipe'){
  await page.locator('button[data-scene="1"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(500);check('keyboard-start',await page.locator(`.${slug}`).getAttribute('data-phase')!=='outgoing');
  await page.locator('button[data-scene="0"]').click();await page.waitForTimeout(700);check('new-selection-cancels-old-animation',await page.locator(`.${slug}`).getAttribute('data-phase')==='outgoing');
 }else{
  const scroller=page.locator(`.${slug}__scroller`);await scroller.focus();await page.keyboard.press('End');await page.waitForTimeout(50);check('keyboard-end',await page.locator(`.${slug}`).getAttribute('data-phase')==='destination');await page.keyboard.press('Home');check('keyboard-home',await page.locator(`.${slug}`).getAttribute('data-phase')==='numeral');
  await page.evaluate(()=>demo.replay());await page.waitForTimeout(500);await scroller.dispatchEvent('wheel',{deltaY:50});const value=await page.locator(`.${slug}`).getAttribute('data-elapsed');await page.waitForTimeout(400);check('manual-scroll-interrupts-replay',value===await page.locator(`.${slug}`).getAttribute('data-elapsed'));
  await page.evaluate(()=>demo.seek(3380));const p=Number(await page.locator('#root').getAttribute('data-progress'));await page.setViewportSize({width:900,height:800});await page.waitForTimeout(100);check('resize-preserves-progress',Math.abs(Number(await page.locator('#root').getAttribute('data-progress'))-p)<.003);
 }
 await page.evaluate(()=>{for(let i=0;i<6;i++)demo.replay();demo.reset();});await page.waitForTimeout(600);check('replay-reset-interruption',await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='gradient-frame-wipe'?'outgoing':'numeral'));
 await page.evaluate(()=>demo.replay());await page.waitForTimeout(slug==='gradient-frame-wipe'?3900:7000);check('replay-completes',await page.locator(`.${slug}`).getAttribute('data-phase')==='destination');
 await page.evaluate(()=>mount(true));await page.evaluate(()=>demo.replay());await page.waitForTimeout(50);check('reduced-motion-instant-destination',await page.locator(`.${slug}`).getAttribute('data-phase')==='destination');await page.locator(`.${slug}__scene`).screenshot({path:resolve(output,'reduced.png')});
 await page.setViewportSize({width:390,height:740});await page.evaluate(()=>mount(false));await page.evaluate(ms=>demo.seek(ms),slug==='gradient-frame-wipe'?3720:6750);await page.waitForTimeout(100);await page.locator(`.${slug}`).screenshot({path:resolve(output,'mobile.png')});check('mobile-no-horizontal-overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>{demo.replay();controller.abort();});const before=await page.locator(`.${slug}`).getAttribute('data-elapsed');await page.waitForTimeout(550);check('abort-stops-frames',before===await page.locator(`.${slug}`).getAttribute('data-elapsed'));
 await page.evaluate(()=>{demo.destroy();demo.destroy();});await page.evaluate(()=>mount());await page.evaluate(()=>demo.reset());await page.waitForTimeout(300);check('destroy-remount-reset',await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='gradient-frame-wipe'?'outgoing':'numeral'));check('no-page-errors',errors.length===0,errors);
 writeFileSync(resolve(output,'verification.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await page.close();
}}finally{await browser.close();await server.close();}
