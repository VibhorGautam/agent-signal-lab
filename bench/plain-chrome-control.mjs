/** Exploratory local Chrome runtime control. Chrome is launched directly without WebDriver or Playwright launch flags, with
 * the AutomationControlled Blink flag disabled, then observed via CDP.
 * Still not a human-driven session or an independent false-positive estimate.
 * Run: node bench/plain-chrome-control.mjs [--headed under Xvfb].
 */
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {scoreSignals} from '../src/detect.js';
const tmp=await mkdtemp(join(tmpdir(),'asl-chrome-'));
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Local control</title><p>Blank local control page</p>')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 `--user-data-dir=${tmp}`,'--no-first-run','--no-default-browser-check','--remote-debugging-port=0',
 '--no-sandbox','--disable-blink-features=AutomationControlled',...(process.argv.includes('--headed')?[]:['--headless=new'])
],{stdio:'ignore'});
let browser;
try{
 let port;
 for(let attempt=0;attempt<100;attempt++){
   try{port=(await readFile(join(tmp,'DevToolsActivePort'),'utf8')).split('\n')[0];break}catch{await new Promise(resolve=>setTimeout(resolve,50))}
 }
 if(!port)throw Error('Chrome did not start with a DevTools port');
 browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
 const page=await browser.contexts()[0].newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const snap=await page.evaluate(()=>({navigator:{webdriver:navigator.webdriver,webdriverOwnProperty:Object.prototype.hasOwnProperty.call(navigator,'webdriver'),userAgent:navigator.userAgent},window:{globalNames:Object.getOwnPropertyNames(window).filter(x=>/^(__playwright|__pw_|__puppeteer|_selenium|__webdriver|cdc_[a-zA-Z0-9]{10,}_(?:Array|JSON|Object|Promise|Proxy|Symbol|Window)$)/i.test(x))}}));
 console.log(JSON.stringify({mode:process.argv.includes('--headed')?'headed':'headless',control:'Chrome direct launch with AutomationControlled disabled, CDP readback, no human interaction',snapshot:snap,verdict:scoreSignals(snap)},null,2));
}finally{await browser?.close();chrome.kill('SIGTERM');await new Promise(resolve=>{if(chrome.exitCode!==null||chrome.signalCode!==null)return resolve();chrome.once('exit',resolve);setTimeout(resolve,1500)});server.close();await rm(tmp,{recursive:true,force:true})}
