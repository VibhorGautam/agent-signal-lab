/** Our unchanged behavioral scorer on FP-Agent OSF raw events (no browser metadata). */
import {createReadStream,readFileSync} from 'node:fs';import {createInterface} from 'node:readline';import {scoreSignals} from '../src/detect.js';
const D=JSON.parse(readFileSync(new URL('../data/fp-agent/feature_vectors.json',import.meta.url)));
const counts=Object.fromEntries(Object.entries(D).map(([k,v])=>[k,Object.keys(v).length]));
const path=new URL('../data/fp-agent/sanitized-events.ndjson',import.meta.url);const stat={};
for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
 const row=JSON.parse(line);const verdict=scoreSignals({events:row.events});const a=stat[row.label]??={raw:0,likely:0,review:0,unknown:0,moveCounts:[]};a.raw++;a[verdict.classification==='likely-automated'?'likely':verdict.classification]++;a.moveCounts.push(row.observed_moves);
}
for(const [label,x] of Object.entries(stat)){x.moveCounts.sort((a,b)=>a-b);x.medianObservedMoves=x.moveCounts[Math.floor(x.raw/2)];delete x.moveCounts;x.publishedProcessed=counts[label]}console.log(JSON.stringify(stat,null,2));
