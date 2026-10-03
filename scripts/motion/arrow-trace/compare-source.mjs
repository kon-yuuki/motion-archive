/** Compare the replica with independently recorded REJOUICE rendered-DOM samples.
 * Source timestamps were not frame-synchronized. Infer each source phase from its
 * label position, then compare the OTHER channels. This does not measure an
 * absolute input latency or establish pixel identity across different fonts.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const evidence = resolve(process.env.UI_ARROW_SOURCE ?? '../motion-benchmark-correction/arrow-audit');
const output = resolve(process.env.UI_ARROW_OUTPUT ?? '../motion-benchmark-correction/arrow-audit/recovery');
mkdirSync(output, {recursive:true});
const source = JSON.parse(readFileSync(resolve(evidence, 'source-enter-frames.json'), 'utf8'));
const components = text => text.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
const bezier = (t,a,b) => 3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;
function sourcePhase(label) {
  const p = components(label)[4]/20;
  let lo=0, hi=1;
  for(let i=0;i<60;i++){const t=(lo+hi)/2; if(bezier(t,0,1)<p)lo=t;else hi=t;}
  return bezier((lo+hi)/2,.52,0)*700;
}
const server = await createServer({root,server:{host:'127.0.0.1',port:4192,strictPort:true}});
await server.listen();
const browser = await chromium.launch({headless:true, ...(process.env.UI_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.UI_CHROMIUM_EXECUTABLE_PATH}:{}),args:JSON.parse(process.env.UI_CHROMIUM_ARGS??'[]')});
const rows=[];
try {
 const context = await browser.newContext({viewport:{width:1180,height:757}});
 await context.route('**/*',route=> {
  const url=new URL(route.request().url());
  if(url.pathname.startsWith('/_vercel/'))return route.fulfill({body:'',contentType:'application/javascript'});
  return url.origin==='http://127.0.0.1:4192'?route.continue():route.abort();
 });
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4192/ui-gallery/buttons/arrow-swap/');
 await page.waitForSelector('[data-demo-ready=true]');
 const link=page.locator('.arrow-swap__link');
 await link.scrollIntoViewIfNeeded();
 const box=await link.boundingBox();
 const clip={x:Math.floor(box.x-12),y:Math.floor(box.y-12),width:100,height:40};
 const animationCount=await link.evaluate(e=>{
  e.closest('.arrow-swap').classList.add('is-active');
  void getComputedStyle(e.querySelector('.arrow-swap__label')).transform;
  window.__arrowTimeline=e.getAnimations({subtree:true});
  window.__arrowTimeline.forEach(a=>{a.pause();a.currentTime=0;});
  return window.__arrowTimeline.map(a=>({property:a.transitionProperty,duration:a.effect.getTiming().duration,pseudo:a.effect.pseudoElement}));
 });
 for(let i=0;i<source.length;i++){
  const sourceSample=source[i],phaseMs=sourcePhase(sourceSample.label);
  const replica=await link.evaluate((e,t)=>{
   window.__arrowTimeline.forEach(a=>a.currentTime=t);
   const read=selector=>{const s=getComputedStyle(e.querySelector(selector));return{transform:s.transform,opacity:Number(s.opacity)};};
   return {label:read('.arrow-swap__label').transform,left:read('.arrow-swap__left'),right:read('.arrow-swap__right'),underline:getComputedStyle(e,'::after').transform};
  },phaseMs);
  const leftSource=components(sourceSample.left.transform),rightSource=components(sourceSample.right.transform);
  const leftReplica=components(replica.left.transform),rightReplica=components(replica.right.transform);
  const errors={
   leftX:Math.abs(leftSource[4]-leftReplica[4]),leftY:Math.abs(leftSource[5]-leftReplica[5]),
   rightX:Math.abs(rightSource[4]-rightReplica[4]),rightY:Math.abs(rightSource[5]-rightReplica[5]),
   leftOpacity:Math.abs(Number(sourceSample.left.opacity)-replica.left.opacity),
   rightOpacity:Math.abs(Number(sourceSample.right.opacity)-replica.right.opacity),
   underlineScale:Math.abs(components(sourceSample.underline)[0]-components(replica.underline)[0])
  };
  rows.push({frame:i,phaseMs,sourceCaptureWindow:{begin:sourceSample.begin,end:sourceSample.end},source:sourceSample,replica,errors});
  if(i<9)await page.screenshot({path:resolve(output,`replica-source-phase-${i}.png`),clip});
 }
 const maxErrors=Object.fromEntries(Object.keys(rows[0].errors).map(key=>[key,Math.max(...rows.map(r=>r.errors[key]))]));
 const pass=Object.entries(maxErrors).every(([key,value])=>value < ((key.includes('Opacity') || key.includes('Scale')) ? .001 : .01));
 const visualPhasePath=resolve(output,'screenshot-phase-estimates.json');
 if(existsSync(visualPhasePath)) {
  const estimates=JSON.parse(readFileSync(visualPhasePath,'utf8'));
  for(const sample of estimates.samples) {
   await page.evaluate(t=>window.__arrowTimeline.forEach(a=>a.currentTime=t),sample.estimatedMs);
   await page.screenshot({path:resolve(output,`replica-visual-phase-${sample.sourceFrame}.png`),clip});
  }
 }
 const report={method:'Label-derived phase alignment; 700ms and the source easing convert the independently recorded label displacement to time. Other channels are checked independently. Screenshot pairs are approximate visual phase comparisons, not frame-synchronized pixel diffs.',sourceFiles:['source-enter-frames.json','source-baseline.json','source-css.json'],animationCount,maxErrors,pass,rows};
 writeFileSync(resolve(output,'source-comparison.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({pass,maxErrors,rows:rows.length,output},null,2));
 if(!pass)process.exitCode=1;
} finally {await browser.close();await server.close();}
