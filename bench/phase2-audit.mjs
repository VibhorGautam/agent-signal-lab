/** Research-only phase-2 label audit. Does not create a benchmark verdict. */
import {readFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'), zip=resolve(root,'data/web_bot_detection_dataset.zip');
const labels=Object.fromEntries(execFileSync('unzip',['-p',zip,'phase2/annotations/humans_and_moderate_and_advanced_bots/humans_and_moderate_and_advanced_bots'],{encoding:'utf8'}).trim().split(/\r?\n/).map(x=>x.trim().split(/\s+/)));
const d=(await readFile(resolve(root,'data/mouse_movements_humans.json'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
for(const r of d.filter(x=>Object.keys(labels).some(id=>id.startsWith(x.session_id+'_1'))).slice(0,8)){
 const times=r.mousemove_times.split(',').map(Number).filter(v=>Number.isFinite(v)&&v>1e12);
 const gaps=times.slice(1).map((x,i)=>({dt:x-times[i],index:i+1})).filter(x=>x.dt>120000).sort((a,b)=>b.dt-a.dt).slice(0,3);
 const urls=r.mousemove_visited_urls.match(/\[[^\]]+\]/g)??[];
 console.log(JSON.stringify({session:r.session_id,labels:Object.entries(labels).filter(([id])=>id.startsWith(r.session_id+'_')),events:times.length,timeSpanMinutes:((times.at(-1)-times[0])/60000).toFixed(1),largestGaps:gaps,urls:urls.length}));
}
