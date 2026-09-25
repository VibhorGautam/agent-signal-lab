/** Human browser negative control, Attentive Cursor data.
 * Source: https://gitlab.com/iarapakis/the-attentive-cursor-dataset
 * 2,909 crowdworkers; one transactional search task each; mousemove polled every 150ms.
 * Raw logs stay ignored locally. This script prints counts, not participant IDs.
 */
import {readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {scoreSignals} from '../src/detect.js';

const folder=resolve('data/attentive-cursor/logs');
const stats={sessions:0,'likely-automated':0,review:0,unknown:0,signalCounts:{},mousemoveCounts:[],clickCounts:[]};
for(const file of readdirSync(folder).filter(x=>x.endsWith('.csv'))){
  const rows=readFileSync(resolve(folder,file),'utf8').trim().split('\n');
  let moves=0,clicks=0;
  const events=[];
  for(const line of rows.slice(1)){
    // The first five fields are fixed; XPath and attributes can contain spaces.
    const [cursor,t,x,y,type]=line.trim().split(/\s+/,5);
    if(type==='click') clicks++;
    if(type==='mousemove'&&Number.isFinite(+t)&&Number.isFinite(+x)&&Number.isFinite(+y)){
      moves++;
      if(events.length<500)events.push({type:'pointermove',t:+t,x:+x,y:+y});
    }
  }
  const result=scoreSignals({events});
  stats.sessions++;
  stats[result.classification]++;
  for(const signal of result.signals)stats.signalCounts[signal.id]=(stats.signalCounts[signal.id]??0)+1;
  stats.mousemoveCounts.push(moves);stats.clickCounts.push(clicks);
}
for(const [field,output] of [['mousemoveCounts','mousemovesP05P50P95'],['clickCounts','clicksP05P50P95']]){
  const values=stats[field].sort((a,b)=>a-b);
  stats[output]=[.05,.5,.95].map(q=>values[Math.floor(q*(values.length-1))]);
  delete stats[field];
}
console.log(JSON.stringify(stats,null,2));
