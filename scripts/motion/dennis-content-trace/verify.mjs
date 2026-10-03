import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.UI_TEST_BASE_URL||'http://127.0.0.1:4176';
const output=new URL('../../../../motion-benchmark-correction/dennis-content-corrections/',import.meta.url).pathname;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/tmp/chromium',headless:true,args:['--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1180,height:757}});
const page=await context.newPage();const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw new Error(name+': '+JSON.stringify(detail));};
const base=origin+'/scripts/motion/dennis-content-trace/index.html';
const yvalues=()=>page.locator('.masked-lines__word > span').evaluateAll(els=>els.map(el=>new DOMMatrix(getComputedStyle(el).transform).m42));
await page.goto(base);await page.waitForTimeout(1200);await page.waitForFunction(()=>!!window.demo);await page.evaluate(()=>demo.reset());
check('24 independent word masks',await page.locator('.masked-lines__word').count()===24);
const first=await yvalues();check('reset hidden at100%',first.every(y=>y>39&&y<40),first);
await page.evaluate(()=>demo.replay());
const wordTrace=[];let start=Date.now();
for(const t of [0,150,307,420,550,766,1000,1260]){
 await page.waitForTimeout(Math.max(0,t-(Date.now()-start)));
 const data=await page.locator('.masked-lines__word > span').evaluateAll(els=>els.map(el=>({word:el.textContent,tf:getComputedStyle(el).transform,r:el.getBoundingClientRect().toJSON()})));
 wordTrace.push({t:Date.now()-start,data});
 if([307,420,766,1260].includes(t))await page.screenshot({path:output+`local-word-${t}.png`});
}
check('words visibly stagger during reveal',wordTrace[2].data[0].r.y<wordTrace[2].data[1].r.y);
check('all words settle to0', (await yvalues()).every(y=>y<.1));
await page.evaluate(()=>demo.replay());await page.waitForTimeout(150);await page.evaluate(()=>demo.reset());await page.waitForTimeout(1400);
check('reset interrupts without stale reveal',(await yvalues()).every(y=>y>39));
await page.evaluate(()=>{demo.replay();demo.replay();demo.replay()});await page.waitForTimeout(1350);
check('rapid replay converges',(await yvalues()).every(y=>y<.1));
await page.locator('.masked-lines__scroll').evaluate(el=>el.scrollTop=80);await page.waitForTimeout(80);await page.evaluate(()=>demo.reset());await page.waitForTimeout(250);check('scrolled reset remains hidden',(await yvalues()).every(y=>y>39));
await page.evaluate(()=>demo.replay());await page.waitForTimeout(80);await page.evaluate(()=>cleanup());const frozen=await yvalues();await page.waitForTimeout(300);
check('abort stops word frame loop',JSON.stringify(await yvalues())===JSON.stringify(frozen));
await page.goto(base+'?reduced');await page.waitForFunction(()=>!!window.demo);await page.evaluate(()=>demo.replay());
check('reduced words immediately visible',(await yvalues()).every(y=>y===0));
await page.goto(base+'?demo=cursor');await page.waitForFunction(()=>!!window.demo);await page.waitForTimeout(100);
const row=page.locator('.cursor-preview__row').nth(2);const box=await row.boundingBox();
await page.mouse.move(600,box.y+box.height/2);await page.waitForTimeout(750);
const dimensions=await page.locator('.cursor-preview__image,.cursor-preview__circle').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));
check('source square324.5 andcircle64.9',Math.abs(dimensions[0].width-324.5)<.1&&Math.abs(dimensions[1].width-64.9)<.1,dimensions);
await page.screenshot({path:output+'local-cursor-stable.png'});
const cursorTrace=[];await page.mouse.move(830,box.y+box.height/2-100);
start=Date.now();
for(const t of [0,80,160,300,600,1100]){
 await page.waitForTimeout(Math.max(0,t-(Date.now()-start)));
 const positions=await page.locator('.cursor-preview__image-position,.cursor-preview__button-position,.cursor-preview__label-position').evaluateAll(els=>els.map(el=>({tf:getComputedStyle(el).transform,r:el.getBoundingClientRect().toJSON()})));
 cursorTrace.push({t:Date.now()-start,positions});
 if([80,300,1100].includes(t))await page.screenshot({path:output+`local-cursor-follow-${t}.png`});
}
check('three independent follower positions',new Set(cursorTrace[1].positions.map(p=>p.tf)).size===3,cursorTrace[1]);
await page.mouse.move(10,10);await page.waitForTimeout(80);await page.mouse.move(600,box.y+box.height/2);await page.waitForTimeout(750);
check('leave/reenter interrupts width collapse',(await page.locator('.cursor-preview__image').boundingBox()).width>324);
await page.evaluate(()=>demo.replay());await page.waitForTimeout(100);await page.evaluate(()=>demo.reset());await page.waitForTimeout(1800);
check('cursor reset cancels replay timers',!(await page.locator('.cursor-preview').getAttribute('class')).includes('is-visible'));
await page.locator('.cursor-preview__row').first().focus();await page.keyboard.press('ArrowDown');
check('keyboard next focusesrow2',await page.locator('.cursor-preview__row').nth(1).evaluate(el=>document.activeElement===el));
await page.keyboard.press('Enter');check('keyboard selection',await page.locator('.cursor-preview__row').nth(1).getAttribute('aria-pressed')==='true');
await page.keyboard.press('Escape');check('escape resets',await page.locator('.cursor-preview__row[aria-pressed=true]').count()===0);
await page.evaluate(()=>{demo.replay();cleanup()});await page.waitForTimeout(1700);
check('cursor teardown leaves no animations',await page.locator('.cursor-preview').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)===0);
for(const demo of ['masked','cursor'])for(const width of [390,320]){
 await page.setViewportSize({width,height:844});await page.goto(base+'?demo='+demo);await page.waitForFunction(()=>!!window.demo);await page.waitForTimeout(250);
 check(`${demo} ${width}px no horizontaloverflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(demo==='cursor'){await page.locator('.cursor-preview__row').nth(1).click();check(`mobile ${width} tapselection`,await page.locator('.cursor-preview__row').nth(1).getAttribute('aria-pressed')==='true');}
 if(width===390){await page.waitForTimeout(1400);}if(width===390)await page.screenshot({path:output+`local-${demo}-mobile.png`,fullPage:true});
}
await page.setViewportSize({width:1180,height:757});await page.goto(base+'?demo=cursor&reduced');await page.waitForFunction(()=>!!window.demo);await page.evaluate(()=>demo.replay());await page.waitForTimeout(200);
check('reduced cursor no animations',await page.locator('.cursor-preview').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)===0);
for(const path of ['text-reveals/masked-lines','image-reveals/cursor-preview']){
 await page.goto(origin+'/ui-gallery/'+path+'/');await page.locator('[data-demo-ready=true]').waitFor();await page.locator('[data-demo-replay]').click();await page.waitForTimeout(350);await page.locator('[data-demo-reset]').click();await page.locator('[data-motion-toggle]').check();await page.locator('[data-demo-replay]').click();
 check(path+' shell reduced remount',await page.locator('[data-demo-stage]').getAttribute('data-reduced-motion')==='true');
 await page.locator('[data-motion-toggle]').uncheck();await page.locator('[data-demo-replay]').click();await page.waitForTimeout(1350);await page.locator('[data-demo-stage]').screenshot({path:output+`shell-${path.split('/')[1]}.png`});
}
await page.goto(origin+'/ui-gallery/text-reveals/masked-lines/');await page.locator('[data-demo-ready=true]').waitFor();await page.goto(origin+'/ui-gallery/image-reveals/cursor-preview/');await page.locator('[data-demo-ready=true]').waitFor();await page.goBack();await page.locator('[data-demo-ready=true]').waitFor();await page.locator('[data-demo-replay]').click();await page.waitForTimeout(1350);check('browser Back restores word controls',(await yvalues()).every(y=>y<.1));await page.goForward();await page.locator('[data-demo-ready=true]').waitFor();await page.locator('[data-demo-replay]').click();await page.waitForTimeout(150);check('browser Forward restores previewcontrols',(await page.locator('.cursor-preview').getAttribute('class')).includes('is-visible'));
check('no browser runtime errors',errors.length===0,errors);
await fs.writeFile(output+'verification.json',JSON.stringify({checks,errors,wordTrace,cursorTrace},null,2));
await browser.close();console.log(JSON.stringify({passed:checks.length,output},null,2));
