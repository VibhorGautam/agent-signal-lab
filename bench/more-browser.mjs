import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {scoreSignals} from '../src/detect.js';
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Local</title><button>ok</button>')}); await new Promise(r=>server.listen(0,'127.0.0.1',r));
for(const profile of [
 {name:'stock-headless',headless:true},
 {name:'headed-xvfb',headless:false},
 {name:'masked-headless',headless:true,init:`Object.defineProperty(navigator,'webdriver',{get:()=>undefined})`,ua:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'},
 {name:'masked-headed',headless:false,init:`Object.defineProperty(navigator,'webdriver',{get:()=>undefined})`},
 ]){
 let b=await chromium.launch({headless:profile.headless,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});let context=await b.newContext(profile.ua?{userAgent:profile.ua}:{});if(profile.init)await context.addInitScript(profile.init);let p=await context.newPage();await p.goto(`http://127.0.0.1:${server.address().port}`);let snap=await p.evaluate(()=>({navigator:{webdriver:navigator.webdriver,userAgent:navigator.userAgent},window:{globalNames:Object.getOwnPropertyNames(window).filter(x=>/^(__playwright|__pw_|__puppeteer|_selenium|__webdriver)/i.test(x)),outerWidth,outerHeight,innerWidth,innerHeight}}));console.log(JSON.stringify({name:profile.name,snap,ours:scoreSignals(snap)}));await b.close();
}
server.close();
