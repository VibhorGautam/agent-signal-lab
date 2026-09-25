/**
 * Evaluation-only adapter for Iliou et al. Web Bot Detection Dataset.
 * Downloads are not redistributed: CC BY-NC-SA, not compatible with project's MIT code license.
 * Usage: curl -L <official dataset URL> -o data/web_bot_detection_dataset.zip; npm run bench:public
 */
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {scoreSignals} from '../src/detect.js';
import {analyzeBehavioralSamples} from 'bot-signal/browser';
const archive=resolve(import.meta.dirname,'../data/web_bot_detection_dataset.zip');
if(!existsSync(archive)) throw Error('Download dataset from https://m4d.iti.gr/web-bot-detection-dataset/ into data/web_bot_detection_dataset.zip');
const read=(path)=>execFileSync('unzip',['-p',archive,path],{encoding:'utf8',maxBuffer:20*1024*1024});
const split=/\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/g;
function parseMouse(obj){
 const coords=Array.from(obj.mousemove_total_behaviour.matchAll(split),m=>[Number(m[1]),Number(m[2])]);
 const times=obj.mousemove_times.split(',').map(Number).filter(Number.isFinite);
 return coords.slice(0,500).map(([x,y],i)=>({type:'pointermove',t:times[i],x,y})).filter(e=>Number.isFinite(e.t));
}
const splitName=process.argv.includes('--train')?'train':'test';
const rows=[];
const stats=events=>{
  const dt=events.slice(1).map((e,i)=>e.t-events[i].t).filter(x=>x>0&&x<200);
  const dx=events.slice(1).map((e,i)=>e.x-events[i].x);
  const dy=events.slice(1).map((e,i)=>e.y-events[i].y);
  const steps=dx.map((v,i)=>Math.hypot(v,dy[i]));
  const quant=(arr,p)=>arr.length?[...arr].sort((a,b)=>a-b)[Math.min(arr.length-1,Math.floor(p*arr.length))]:0;
  const m=dt.reduce((a,b)=>a+b,0)/(dt.length||1);
  const cv=Math.sqrt(dt.reduce((a,b)=>a+(b-m)**2,0)/(dt.length||1))/(m||1);
  const straight=steps.filter((v,i)=>i>0&&Math.abs(v-steps[i-1])<0.05*Math.max(v,steps[i-1],1)).length/(steps.length||1);
  return {n:events.length,dtP10:quant(dt,.1),dtMedian:quant(dt,.5),dtP90:quant(dt,.9),dtCV:cv,stepP10:quant(steps,.1),stepMedian:quant(steps,.5),stepP90:quant(steps,.9),straight};
};
for(const [segment,folder] of [['advanced','humans_and_advanced_bots'],['moderate','humans_and_moderate_bots']]){
 const labels=read(`phase1/annotations/${folder}/${splitName}`).trim().split(/\r?\n/).map(line=>line.trim().split(/\s+/));
 for(const [session,label] of labels){
  const obj=JSON.parse(read(`phase1/data/mouse_movements/${folder}/${session}/mouse_movements.json`));
  const events=parseMouse(obj);
  // Dataset doesn't expose live navigator/UA; measure behavioral rules ONLY, not whole-browser detection.
  const output=scoreSignals({events});const base=analyzeBehavioralSamples({mouseMoves:events.map(e=>({...e,isTrusted:true})),scrolls:[],keyPresses:[],clicks:[],observationMs:Math.max(0,events.at(-1)?.t-events[0]?.t||0)});rows.push({segment,session,label,events:events.length,class:output.classification,signals:output.signals.map(s=>s.id),botSignal:{isLegitClient:base.isLegitClient,score:base.suspicionScore,signals:base.signals.filter(x=>x.triggered).map(x=>x.id)},stats:stats(events)});
 }
}
const metrics={};for(const group of ['human','moderate_bot','advanced_bot']){
 const items=rows.filter(x=>x.label===group);metrics[group]={n:items.length,likely:items.filter(x=>x.class==='likely-automated').length,review:items.filter(x=>x.class==='review').length,unknown:items.filter(x=>x.class==='unknown').length,botSignalFlagged:items.filter(x=>!x.botSignal.isLegitClient).length};
}
console.log(JSON.stringify({dataset:`Iliou et al. phase1 ${splitName} labels, behavior only`,license:'CC BY-NC-SA; do not redistribute raw data',limitations:'A 2020 dataset of browsing sessions, not modern browser/AI-agent sessions. Browser metadata absent. Human comparison records duplicate across the moderate/advanced folds; do not pool counts as independent people.',metrics,rows},null,2));
