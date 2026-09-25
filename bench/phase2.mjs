/** Out-of-era validation: 2020 phase 2 sessions, no threshold tuning on these data. */
import {readFile,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {scoreSignals} from '../src/detect.js';
import {analyzeBehavioralSamples} from 'bot-signal/browser';
const root=resolve(import.meta.dirname,'..');
const zip=resolve(root,'data/web_bot_detection_dataset.zip');
const labels=Object.fromEntries(execFileSync('unzip',['-p',zip,'phase2/annotations/humans_and_moderate_and_advanced_bots/humans_and_moderate_and_advanced_bots'],{encoding:'utf8'}).trim().split(/\r?\n/).map(x=>x.trim().split(/\s+/)));
if (!process.argv.includes('--diagnostic-only')) {
 console.error('Phase 2 sub-session mapping is unresolved. See bench/phase2-audit-result.md. Add --diagnostic-only to inspect incomplete base records; do not publish its counts.');
 process.exit(2);
}
const paths={human:'mouse_movements_humans.json',moderate_bot:'mouse_movements_moderate_bots.json',advanced_bot:'mouse_movements_advanced_bots.json'};
const rows=[];
for(const [kind,file] of Object.entries(paths)){
 const bySession=new Map();
 for await (const line of createInterface({input:createReadStream(resolve(root,'data',file)),crlfDelay:Infinity})){
  if(!line.trim())continue;
  const d=JSON.parse(line), id=d.session_id;
  if(!bySession.has(id)) bySession.set(id,[]);
  bySession.get(id).push(d);
 }
 for(const [id,sessions] of bySession){
  for(let z=0;z<sessions.length;z++){
   const d=sessions[z],label=labels[`${id}_${z}`];
   if(label!==kind)continue; // evaluate exactly the official annotated subset
   const xy=Array.from(d.mousemove_total_behaviour.matchAll(/\[m\((-?\d+),(-?\d+)\)\]/g),m=>[+m[1],+m[2]]).slice(0,500);
   const t=d.mousemove_times.split(',').slice(0,500).map(Number);
   const events=xy.map(([x,y],i)=>({type:'pointermove',x,y,t:t[i]})).filter(e=>Number.isFinite(e.t));
   const result=scoreSignals({events});const base=analyzeBehavioralSamples({mouseMoves:events.map(e=>({...e,isTrusted:true})),scrolls:[],keyPresses:[],clicks:[],observationMs:Math.max(0,events.at(-1)?.t-events[0]?.t||0)});rows.push({kind,label,session:`${id}_${z}`,points:events.length,classification:result.classification,signals:result.signals.map(s=>s.id),botSignal:{isLegitClient:base.isLegitClient,signals:base.signals.filter(x=>x.triggered).map(x=>x.id)}});
  }
 }
}
const mismatch=rows.filter(x=>x.label!==x.kind);const metrics={};for(const g of Object.keys(paths)){let a=rows.filter(x=>x.kind===g);metrics[g]={n:a.length,likely:a.filter(x=>x.classification==='likely-automated').length,review:a.filter(x=>x.classification==='review').length,unknown:a.filter(x=>x.classification==='unknown').length,botSignalFlagged:a.filter(x=>!x.botSignal.isLegitClient).length}}
const out={dataset:'Iliou et al. phase2, partial base-record mapping only, behavior-only',license:'CC BY-NC-SA, raw data not redistributed',notes:'2020 simulated web bots on one research site, not 2026 AI agents. Phase2 inspected only after thresholds set on phase1 training; browser metadata missing. Sub-session labels _1/_2 are unresolved and excluded; reported partial counts are not a publication-ready metric.',metrics,mismatchedLabels:mismatch.length,missingLabels:rows.filter(x=>!x.label).length};
console.log(JSON.stringify(out,null,2));await writeFile(resolve(root,'bench/phase2-results.json'),JSON.stringify({out,rows},null,2)+'\n');
