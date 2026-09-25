/** Audit whether long time gaps plausibly separate annotated sub-sessions. */
import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),zip=resolve(root,'data/web_bot_detection_dataset.zip');
const labels=Object.fromEntries(execFileSync('unzip',['-p',zip,'phase2/annotations/humans_and_moderate_and_advanced_bots/humans_and_moderate_and_advanced_bots'],{encoding:'utf8'}).trim().split(/\r?\n/).map(x=>x.trim().split(/\s+/)));
for(const kind of ['humans','advanced_bots','moderate_bots']){
 const file=kind==='humans'?'mouse_movements_humans.json':`mouse_movements_${kind}.json`;
 const rows=readFileSync(resolve(root,'data',file),'utf8').trim().split('\n').map(JSON.parse);let totalLabeled=0,match=0,issues=[];
 for(const r of rows){
  let t=r.mousemove_times.split(',').map(Number), gaps=[];
  for(let i=1;i<t.length;i++)if(t[i]>1e12&&t[i-1]>1e12&&t[i]-t[i-1]>20*60*1000)gaps.push(i);
  const labeled=Object.keys(labels).filter(id=>id.startsWith(r.session_id+'_'));
  totalLabeled+=labeled.length;if(labeled.length===gaps.length+1)match++;else if(labeled.length)issues.push({session:r.session_id,labels:labeled.length,segments:gaps.length+1,maxGapMin:Math.max(0,...gaps.map(i=>t[i]-t[i-1]))/60000});
 }
 console.log(JSON.stringify({kind,records:rows.length,recordsMatching20minGapCount:match,labeledSegments:totalLabeled,issues:issues.slice(0,10),issueCount:issues.length}));
}
