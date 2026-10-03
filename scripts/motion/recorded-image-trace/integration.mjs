import {createServer} from 'vite';import{chromium}from'playwright';import{resolve}from'node:path';import{writeFileSync}from'node:fs';
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4197,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--disable-dev-shm-usage']});const results=[];
try{
const page=await browser.newPage({viewport:{width:1180,height:1000},deviceScaleFactor:1});const errors=[];await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/_vercel/'))return route.fulfill({body:'',contentType:'application/javascript'});return url.origin==='http://127.0.0.1:4197'?route.continue():route.abort();});page.on('pageerror',e=>errors.push(e.message));
for(const slug of ['accordion-unfold','cube-tiles','texture-mask']){
 const checks=[],check=(name,pass)=>{checks.push({name,pass});if(!pass)process.exitCode=1;};
 await page.goto(`http://127.0.0.1:4197/ui-gallery/image-reveals/${slug}/`);await page.waitForSelector('[data-demo-ready=true]');await page.locator('[data-demo-stage]').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
 check('mounted-on-full-page',await page.locator(`.${slug}`).count()===1);check('source-link-metadata',await page.getByRole('link',{name:'観察した記録映像 ↗︎'}).count()===1);
 await page.locator('[data-demo-replay]').click();await page.waitForTimeout(400);await page.locator('[data-demo-reset]').click();await page.waitForTimeout(200);
 check('shell-reset',slug==='texture-mask'?await page.locator(`.${slug}`).getAttribute('data-band-visible')==='false':await page.locator(`.${slug}`).getAttribute('data-phase')==='blank');
 await page.locator('[data-motion-toggle]').check();await page.waitForTimeout(300);check('shell-reduced-remount',slug==='texture-mask'?await page.locator('[data-material-image]').getAttribute('mask')===null:await page.locator(`.${slug}`).getAttribute('data-phase')===(slug==='accordion-unfold'?'letters':'complete'));
 await page.locator('[data-demo-stage]').screenshot({path:resolve(`../motion-benchmark-correction/image-corrections/${slug}/integrated-desktop.png`)});
 check('raster-images-load',await page.locator(`.${slug} img`).evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);check('integrated-mobile-no-overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-demo-stage]').screenshot({path:resolve(`../motion-benchmark-correction/image-corrections/${slug}/integrated-mobile.png`)});
 await page.setViewportSize({width:1180,height:1000});await page.locator('[data-motion-toggle]').uncheck();await page.waitForTimeout(200);await page.locator('.motion-eyebrow a').first().click();await page.waitForURL('**/ui-gallery/image-reveals/');await page.locator(`.${slug}`).waitFor({state:'detached'});await page.goBack();await page.waitForSelector(`.${slug}`);await page.waitForSelector('[data-demo-ready=true]');check('category-back-remount',await page.locator(`.${slug}`).count()===1);
 results.push({slug,checks});
}
results.push({browserErrors:errors});if(errors.length)process.exitCode=1;
}finally{writeFileSync(resolve('../motion-benchmark-correction/image-corrections/integration.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}console.log(JSON.stringify(results,null,2));
