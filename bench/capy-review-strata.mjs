/** Summarize human game control stress test by mouse/touch and game. */
import {createReadStream} from 'node:fs';import {createInterface} from 'node:readline';import {scoreSignals} from '../src/detect.js';
const path=new URL('../data/capy-test.jsonl',import.meta.url);const stats={};
for await(const line of createInterface({input:createReadStream(path)})){
 const r=JSON.parse(line);const key=(r.touchscreen?'touch':'mouse')+'/'+r.gameType;const s=stats[key]??={n:0,review:0,likely:0};
 let events=[],prior=null;for(let i=0;i<r.tickInputs.length&&events.length<500;i++){const x=r.tickInputs[i];if(prior&&prior.x===x.x&&prior.y===x.y)continue;prior=x;events.push({type:'pointermove',t:i*1000/240,x:x.x,y:x.y})}
 let verdict=scoreSignals({events});s.n++;s[verdict.classification==='likely-automated'?'likely':verdict.classification==='review'?'review':'unknown']=(s[verdict.classification==='likely-automated'?'likely':verdict.classification==='review'?'review':'unknown']??0)+1;
}
console.log(JSON.stringify(stats,null,2));
