import {chromium} from 'playwright';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {scoreSignals} from '../src/detect.js';
const chromePath=process.env.CHROME_PATH || '/usr/bin/google-chrome';
const root=resolve(import.meta.dirname,'..');
const competitor=await build({entryPoints:[resolve(root,'node_modules/bot-signal/dist/browser.js')],bundle:true,format:'iife',globalName:'BotSignal',write:false});
const baseline=await build({entryPoints:[resolve(root,'node_modules/@fingerprintjs/botd/dist/botd.esm.js')], bundle:true,format:'iife',globalName:'BotD',write:false});
const server=createServer(async (req,res)=> {
 const path=req.url==='/'?'examples/demo.html':decodeURIComponent(req.url.slice(1));
 if(path==='competitor.js'){res.setHeader('Content-Type','text/javascript');res.end(competitor.outputFiles[0].text);return;}
 if(path==='baseline.js'){res.setHeader('Content-Type','text/javascript');res.end(baseline.outputFiles[0].text);return;}
 if(path.includes('..')){res.writeHead(400).end();return;}
 try {const content=await readFile(resolve(root,path));res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(content);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox']});
const origin=`http://127.0.0.1:${server.address().port}`;
const trials=[];
try {
 for (const config of [
  {name:'stock-playwright',init:null},
  {name:'masked-webdriver',init:'Object.defineProperty(navigator,"webdriver",{get:()=>undefined})'},
  {name:'declared-agent-ua',init:null,ua:'Mozilla/5.0 AgentSignalLab/0.1 Playwright'},
  {name:'masked-webdriver-and-ua',init:'Object.defineProperty(navigator,"webdriver",{get:()=>undefined})',ua:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'},
 ]) {
  const context=await browser.newContext(config.ua?{userAgent:config.ua}:{});
  if(config.init) await context.addInitScript(config.init);
  const page=await context.newPage();await page.goto(origin+'/');
  await page.addScriptTag({url:origin+'/baseline.js'});
  await page.addScriptTag({url:origin+'/competitor.js'});
  const snap=await page.evaluate(()=>({navigator:{webdriver:navigator.webdriver,webdriverOwnProperty:Object.prototype.hasOwnProperty.call(navigator,"webdriver"),userAgent:navigator.userAgent},window:{globalNames:Object.getOwnPropertyNames(window).filter(x=>/^(__playwright|__pw_|__puppeteer|_selenium|__webdriver|cdc_[a-zA-Z0-9]{10,}_(?:Array|JSON|Object|Promise|Proxy|Symbol|Window)$)/i.test(x))}}));
  const ours=scoreSignals(snap);
  let botd;try{botd=await page.evaluate(async()=>{const inst=await BotD.load();return await inst.detect()});}catch(e){botd={error:String(e)}}
  let botSignal;try{botSignal=await page.evaluate(()=>{const r=BotSignal.detectInstantClient(window);return {isLegitClient:r.isLegitClient, suspicionScore:r.suspicionScore, confidence:r.confidence, signals:r.signals?.filter(s=>s.triggered).map(s=>s.name??s.id)}});}catch(e){botSignal={error:String(e)}}
  trials.push({profile:config.name,groundTruth:'controlled Playwright automation',ours:{classification:ours.classification,score:ours.score,signals:ours.signals.map(x=>x.id)},botd,botSignal});
  await context.close();
 }
}finally{await browser.close();server.close();}
const output={runAt:new Date().toISOString(),environment:'Google Chrome executable, Playwright, local HTTP only; record version separately',notes:'All profiles are automated; this tests feature sensitivity, not false positives, AI attribution, or field accuracy. No human sessions were collected.',trials};
await writeFile(resolve(root,'bench/results.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
