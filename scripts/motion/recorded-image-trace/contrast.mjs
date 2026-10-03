import {createServer} from 'vite';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const output=resolve('../motion-benchmark-correction/image-corrections/contrast');mkdirSync(output,{recursive:true});
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4197,strictPort:true}});await server.listen();
let browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});
const result={checkedAt:new Date().toISOString(),cases:[],errors:[]};
try{
 let context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/_vercel/'))return route.fulfill({body:'',contentType:'application/javascript'});return u.origin==='http://127.0.0.1:4197'?route.continue():route.abort();});
 let page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 for(const slug of ['cube-tiles','texture-mask']){
  for(const width of [320,390,1180]){
   await browser.close();browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});
   context=await browser.newContext();await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/_vercel/'))return route.fulfill({body:'',contentType:'application/javascript'});return u.origin==='http://127.0.0.1:4197'?route.continue():route.abort();});
   page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
   await page.setViewportSize({width,height:1000});await page.goto(`http://127.0.0.1:4197/ui-gallery/image-reveals/${slug}/`);await page.waitForSelector('[data-demo-ready=true]');await page.locator('[data-demo-stage]').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
   await page.locator('[data-demo-replay]').click();await page.waitForTimeout(500);await page.locator('[data-demo-reset]').click();
   const analysis=await new AxeBuilder({page}).analyze();
   const severe=analysis.violations.filter(v=>['serious','critical'].includes(v.impact));
   const measurements=await page.locator(`.${slug}`).evaluate((e,slug)=>{const copy=e.querySelector(slug==='texture-mask'?'.texture-mask__copy':'.cube-tiles__nav > span'),cs=getComputedStyle(copy),r=copy.getBoundingClientRect();return {color:cs.color,fontSize:cs.fontSize,copyRect:{x:r.x,y:r.y,width:r.width,height:r.height},overflow:document.documentElement.scrollWidth>innerWidth,controls:[...e.querySelectorAll('.texture-mask__finishes button')].map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height};})};},slug);
   const box=await page.locator('[data-demo-stage]').boundingBox();await page.screenshot({path:resolve(output,`${slug}-${width}.png`),clip:box});
   if(slug==='texture-mask'){
    await page.locator('.texture-mask select').selectOption('1');await page.locator('.texture-mask input').fill('70');await page.locator('.texture-mask input').dispatchEvent('input');await page.waitForTimeout(300);
    measurements.familyChanges=await page.locator('[data-word]').textContent()==='koveta';measurements.bandVisible=await page.locator('.texture-mask').getAttribute('data-band-visible')==='true';
    const after=await new AxeBuilder({page}).analyze();severe.push(...after.violations.filter(v=>['serious','critical'].includes(v.impact)));
   }
   result.cases.push({slug,width,measurements,violations:analysis.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),severe});
   if(severe.length||measurements.overflow)process.exitCode=1;
  }
 }
}catch(e){result.error=String(e);process.exitCode=1;}finally{writeFileSync(resolve(output,'axe-report.json'),JSON.stringify(result,null,2));await browser.close();await server.close();}
console.log(JSON.stringify(result.cases.map(c=>({slug:c.slug,width:c.width,severe:c.severe.length,measurements:c.measurements})),null,2));
