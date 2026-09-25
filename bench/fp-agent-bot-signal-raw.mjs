/** Compare bot-signal behavioral-only on matching recorded events where possible.
 * Missing fields (isTrusted, click detail, touches, browser coordinates) are assumptions,
 * NOT a faithful full product benchmark. Report all assumptions and label sensitivity.
 */
import {createReadStream} from 'node:fs';import {createInterface} from 'node:readline';import {analyzeBehavioralSamples} from 'bot-signal/browser';
const out={};
for await(const line of createInterface({input:createReadStream(new URL('../data/fp-agent/sanitized-events.ndjson',import.meta.url))})){
 const row=JSON.parse(line);const mins=Math.min(...[row.events[0]?.t,row.click_samples[0]?.t,row.key_samples[0]?.t,row.scroll_samples[0]?.t].filter(Number.isFinite));
 const maxs=Math.max(...[row.events.at(-1)?.t,row.click_samples.at(-1)?.t,row.key_samples.at(-1)?.t,row.scroll_samples.at(-1)?.t].filter(Number.isFinite));
 const samples={mouseMoves:row.events.map(e=>({...e,isTrusted:true})),clicks:row.click_samples.map(e=>({...e,isTrusted:true,detail:1})),keyPresses:row.key_samples.map(e=>({...e,isTrusted:true})),scrolls:row.scroll_samples.map(e=>({...e,isTrusted:true})),touches:[],observationMs:Number.isFinite(maxs-mins)?maxs-mins:0};
 const verdict=analyzeBehavioralSamples(samples);const r=out[row.label]??={n:0,flag:0,signals:{}};r.n++;r.flag+=+(!verdict.isLegitClient);for(const s of verdict.signals.filter(s=>s.triggered))r.signals[s.id]=(r.signals[s.id]??0)+1;
}
console.log(JSON.stringify(out,null,2));
