import {chromium} from 'playwright';import fs from 'node:fs/promises';
const origin=process.env.UI_TEST_BASE_URL||'http://127.0.0.1:4176';const out=new URL('../../../../motion-benchmark-correction/dennis-content-corrections/',import.meta.url).pathname;
const browser=await chromium.launch({executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1180,height:757}});
await page.goto(origin+'/scripts/motion/dennis-content-trace/index.html?demo=cursor');await page.waitForFunction(()=>!!window.demo);
// Align an isolated four-row section to the actual source viewport crop.
await page.addStyleTag({content:'.cursor-preview__heading{display:none}.cursor-preview{margin-top:-44.1875px}body{min-height:757px}'});
await page.waitForTimeout(200);await page.mouse.move(643,243);await page.waitForTimeout(1000);await page.screenshot({path:out+'local-cursor-source-aligned.png'});
await page.mouse.move(5,5);await page.waitForTimeout(550);
const sequence=[];await page.mouse.move(643,373);const start=Date.now();
for(const t of [0,100,200,400,650]){await page.waitForTimeout(Math.max(0,t-(Date.now()-start)));const data=await page.locator('.cursor-preview__image,.cursor-preview__circle,.cursor-preview__view').evaluateAll(els=>els.map(el=>({r:el.getBoundingClientRect().toJSON(),transition:getComputedStyle(el).transition})));sequence.push({t:Date.now()-start,data});await page.screenshot({path:out+`local-cursor-enter-${t}.png`});}
await fs.writeFile(out+'entry-sequence.json',JSON.stringify(sequence,null,2));await browser.close();
