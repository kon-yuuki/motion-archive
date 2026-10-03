import{createServer}from'vite';import{chromium}from'playwright';import{mkdirSync,writeFileSync}from'node:fs';
const out='../motion-benchmark-correction/depth-correction';mkdirSync(out,{recursive:true});
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true},cacheDir:`${out}/.vite`,server:{port:5193,host:'127.0.0.1',strictPort:true,hmr:false,watch:{ignored:['**']}}});await server.listen();
const browser=await chromium.launch({executablePath:'/tmp/chromium',headless:true,args:['--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1660,height:1380},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')console.log(m.text());});
 await page.goto('http://127.0.0.1:5193/scripts/motion/depth-trace/fixture.html');await page.waitForSelector('[data-assets-ready=true]',{timeout:60000});
 await page.addStyleTag({content:'.motion-page{max-width:none;padding:0}.motion-header,[data-demo-heading],.motion-toolbar{display:none}.depth-tunnel__scroller,.depth-tunnel__sticky{height:1200px!important;width:1600px!important}.motion-stage,.motion-lab{width:1600px!important;border:0!important;border-radius:0!important}'});
 await page.locator('.depth-tunnel__sticky').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
 for(const p of [0,.10,.16,.21,.30,.475,.5625,.675,.7375,.7875,.8375,.9375]){await page.locator('.depth-tunnel__controls input').evaluate((el,value)=>{el.value=value*1000;el.dispatchEvent(new Event('input',{bubbles:true}));},p);await page.waitForTimeout(200);await page.locator('.depth-tunnel__sticky').screenshot({path:`${out}/render-${p.toFixed(4)}.png`});console.log('captured',p);}
 writeFileSync(`${out}/capture-errors.json`,JSON.stringify(errors,null,2));
}finally{await browser.close();await server.close();}
