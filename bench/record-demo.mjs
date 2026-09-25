/** Real screen capture of the local demo under headed Playwright/Puppeteer in Xvfb.
 * No synthetic verdict or overlaid text. The browser drives the page live.
 * A terminal is optional; start Xvfb yourself (a free display).
 * Usage: DISPLAY=:104 node bench/record-demo.mjs [--puppeteer] [--masked] [--terminal]
 */
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import puppeteer from 'puppeteer-core';
const masked=process.argv.includes('--masked');
const usePuppeteer=process.argv.includes('--puppeteer');
const framework=usePuppeteer?'puppeteer':'playwright';
const withTerminal=process.argv.includes('--terminal');
const root=resolve(import.meta.dirname,'..');
const server=createServer(async(req,res)=>{
 const path=req.url==='/'?'examples/demo.html':decodeURIComponent(req.url.slice(1));
 if(path.includes('..')){res.writeHead(400).end();return}
 try{const body=await readFile(resolve(root,path));res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(body)}catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const out=`/downloads/agent-signal-live-${masked?'masked':'stock'}-${framework}${withTerminal?'-terminal':''}-1080p.mp4`;
let browser,record,terminal;
try{
 let page;
 if(usePuppeteer){
   browser=await puppeteer.launch({headless:false,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--window-position=700,0','--window-size=1220,1080'],defaultViewport:{width:1180,height:900}});
   page=await browser.newPage();
   if(masked){await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36');await page.evaluateOnNewDocument('Object.defineProperty(navigator,"webdriver",{get:()=>undefined})')}
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.bringToFront();
 }else{
   browser=await chromium.launch({headless:false,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--window-position=700,0','--window-size=1220,1080']});
   const context=await browser.newContext({viewport:{width:1180,height:900},...(masked?{userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'}:{})});
   if(masked)await context.addInitScript('Object.defineProperty(navigator,"webdriver",{get:()=>undefined})');
   page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.bringToFront();
 }
 await page.waitForSelector('#assess');await new Promise(resolve=>setTimeout(resolve,800));
 if(withTerminal){
   terminal=spawn('xfce4-terminal',['--disable-server','--hide-menubar','--hide-toolbar','--title',`${framework} demo run`,'--geometry','77x39+0+50','--command',`bash -lc 'cd ${root}; echo ${framework} ${masked?'masked':'stock'} live demo; sed -n 1,55p bench/record-demo.mjs; echo; echo Browser run in progress; sleep 40'`],{env:{...process.env,DISPLAY:process.env.DISPLAY||':99'},stdio:'ignore'});
   await new Promise(resolve=>setTimeout(resolve,900));
   spawn('wmctrl',['-r',`${framework} demo run`,'-e','0,0,50,740,900'],{stdio:'ignore'});
   await page.bringToFront();
 }
 record=spawn('ffmpeg',['-y','-loglevel','error','-f','x11grab','-framerate','30','-video_size','1920x1080','-i',process.env.DISPLAY||':99','-t','13','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',out],{stdio:['ignore','ignore','pipe']});
 await new Promise(resolve=>setTimeout(resolve,1400));
 await page.mouse.move(430,570,{steps:4});
 for(let i=0;i<45;i++){await page.mouse.move(430+i*12,570+Math.sin(i/4)*85,{steps:3});await new Promise(resolve=>setTimeout(resolve,45))}
 await new Promise(resolve=>setTimeout(resolve,600));await page.click('#assess');await new Promise(resolve=>setTimeout(resolve,4200));
 const result=await page.evaluate(()=>({count:document.querySelector('#count').textContent,verdict:document.querySelector('#state').textContent,evidence:JSON.parse(document.querySelector('#result').textContent)}));
 console.log(JSON.stringify({framework,masked,url:page.url(),...result},null,2));
 const code=await new Promise(resolve=>{if(record.exitCode!==null)return resolve(record.exitCode);record.once('exit',resolve)});if(code!==0)throw Error(`ffmpeg failed: ${code}`);
 console.log(out)
}finally{if(record&&!record.killed)record.kill('SIGTERM');if(terminal)terminal.kill('SIGTERM');await browser?.close();server.close()}
