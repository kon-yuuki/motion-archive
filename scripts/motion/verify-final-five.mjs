import { preview } from 'vite';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const output=resolve(process.env.UI_TEST_OUTPUT||'.ui-motion-final-five');mkdirSync(output,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4249,strictPort:true}}),origin='http://127.0.0.1:4249';
const cases=['sliders/bending-cards','sliders/ferris-wheel','sliders/lateral-panels','sliders/vertical-aperture','section-transitions/depth-tunnel'];
const result={at:new Date().toISOString(),scope:'Final five built-page integration; not pixel or continuous-motion approval',checks:[],errors:[],failedAssets:[],axe:[]};
const check=(name,pass,detail)=>{result.checks.push({name,pass,detail});console.log(pass?'PASS':'FAIL',name);};
let browser;
try{for(const id of cases){
 browser=await chromium.launch({executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH||'/tmp/chromium',headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1180,height:900}});await context.route('**/*',r=>{const u=new URL(r.request().url());return u.pathname.startsWith('/_vercel/')?r.fulfill({body:'',contentType:'application/javascript'}):u.origin===origin?r.continue():r.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>result.errors.push({id,message:e.message}));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)result.failedAssets.push({id,status:r.status(),url:r.url()});});
 await page.goto(`${origin}/ui-gallery/${id}/`,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-demo-ready=true]');
 if(['sliders/bending-cards','sliders/ferris-wheel','section-transitions/depth-tunnel'].includes(id))await page.waitForFunction(()=>document.querySelector('[data-demo-stage]').dataset.assetsReady==='true',null,{timeout:45000});
 const stage=page.locator('[data-demo-stage]');await stage.evaluate(e=>e.scrollIntoView({block:'start'}));
 check(`${id}: built page mounts`,await stage.locator('section').count()>0);
 if(id==='sliders/bending-cards')await page.locator('[data-pause]').click();
 if(id==='sliders/ferris-wheel'){await stage.locator('input').focus();await page.keyboard.press('ArrowRight');check('Ferris: focused range advances by keyboard',await stage.getAttribute('data-position')==='1');await page.keyboard.press('Home');check('Ferris: focused range Home',await stage.getAttribute('data-position')==='0');}
 if(id==='sliders/vertical-aperture'){
  const viewport=page.locator('.vertical-aperture__viewport');await viewport.evaluate(e=>e.addEventListener('pointerdown',v=>e.dataset.testPointer=String(v.pointerId),{once:true}));const box=await viewport.boundingBox();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.25,box.y+box.height*.5,{steps:5});check('Ciel: drag captures pointer',await viewport.evaluate(e=>e.hasPointerCapture(Number(e.dataset.testPointer))));await page.locator('[data-demo-reset]').evaluate(e=>e.click());check('Ciel: reset releases active capture',await viewport.evaluate(e=>!e.hasPointerCapture(Number(e.dataset.testPointer))));await page.mouse.up();
 }
 await page.locator('[data-demo-reset]').click();
 check(`${id}: reset handler remains ready`,await stage.getAttribute('data-destroyed')!=='true');
 if(id==='section-transitions/depth-tunnel'){check('Lusion: visible continuous-replay warning',await page.locator('.depth-tunnel__warning').isVisible());await stage.locator('input').evaluate(e=>{e.value='1000';e.dispatchEvent(new Event('input',{bubbles:true}));});check('Lusion: manual endpoint',Number(await stage.getAttribute('data-progress'))>.99);await page.locator('[data-demo-reset]').click();}
 const axe=await new AxeBuilder({page}).include('main').analyze();result.axe.push({id,violations:axe.violations});check(`${id}: no serious/critical axe findings`,!axe.violations.some(v=>['serious','critical'].includes(v.impact)),axe.violations.map(v=>({id:v.id,impact:v.impact})));
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.waitForTimeout(120);check(`${id}: ${width}px no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.screenshot({path:resolve(output,id.split('/')[1]+'.png')});
 await browser.close();browser=null;
 writeFileSync(resolve(output,'report.json'),JSON.stringify(result,null,2));
}
check('No JavaScript errors',result.errors.length===0,result.errors);check('No failed local assets',result.failedAssets.length===0,result.failedAssets);
}catch(e){result.error=String(e);check('Bounded integration runner',false,String(e));}finally{if(browser)await browser.close();await new Promise(r=>server.httpServer.close(r));writeFileSync(resolve(output,'report.json'),JSON.stringify(result,null,2));}
if(result.checks.some(x=>!x.pass))process.exitCode=1;
