/** Human motor-data stress test, not a browsing benchmark.
 * Source: Capycap-AI/CaptchaSolve30k, local test.jsonl (ignored).
 * Uses tickInputs at 240 Hz, keeps only changing positions, caps 500 points.
 */
import {createReadStream} from 'node:fs';import {createInterface} from 'node:readline';import {scoreSignals} from '../src/detect.js';
const path=new URL('../data/capy-test.jsonl',import.meta.url);let stats={n:0,mouse:0,touch:0,likely:0,review:0,unknown:0,signalCounts:{},short:0,byGame:{}};
for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
 const r=JSON.parse(line);let prior=null,events=[];for(let i=0;i<r.tickInputs.length&&events.length<500;i++){
  let o=r.tickInputs[i];if(prior&&prior.x===o.x&&prior.y===o.y)continue;prior=o;
  events.push({type:'pointermove',t:i*1000/240,x:o.x,y:o.y});
 }
 const v=scoreSignals({events});const g=stats.byGame[r.gameType]??={n:0,likely:0,touch:0};g.n++;g.likely+=v.classification==='likely-automated';g.touch+=!!r.touchscreen;stats.n++;stats[r.touchscreen?'touch':'mouse']++;stats[v.classification==='likely-automated'?'likely':v.classification]++;stats.short+=events.length<100;for(const s of v.signals)stats.signalCounts[s.id]=(stats.signalCounts[s.id]??0)+1;
}
console.log(JSON.stringify(stats,null,2));
