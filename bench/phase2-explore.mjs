import {execFileSync} from 'node:child_process';import {resolve} from 'node:path';
const zip=resolve(import.meta.dirname,'../data/web_bot_detection_dataset.zip');
const read=p=>execFileSync('unzip',['-p',zip,p],{encoding:'utf8',maxBuffer:80*1024*1024});
const labels=Object.fromEntries(read('phase2/annotations/humans_and_moderate_and_advanced_bots/humans_and_moderate_and_advanced_bots').trim().split(/\r?\n/).map(x=>x.trim().split(/\s+/)));
const rows=[];for (const [kind,p] of [['human','humans/mouse_movements_humans.json'],['moderate_bot','bots/mouse_movements_moderate_bots.json'],['advanced_bot','bots/mouse_movements_advanced_bots.json']]){
 const lines=read(`phase2/data/mouse_movements/${p}`).trim().split('\n');for(const line of lines){let d=JSON.parse(line);let xy=Array.from(d.mousemove_total_behaviour.matchAll(/\[m\((-?\d+),(-?\d+)\)\]/g),m=>[+m[1],+m[2]]);let ts=d.mousemove_times.split(',').map(Number);let id=d.session_id;const z=rows.filter(x=>x.session===id).length;rows.push({kind,session:id,index:z,labeled:labels[`${id}_${z}`],points:Math.min(xy.length,ts.length),first:xy.slice(0,2),times:ts.slice(0,2)})}
}
console.log(JSON.stringify({count:rows.length,match:rows.filter(x=>x.kind===x.labeled).length,unlabeled:rows.filter(x=>!x.labeled).length,sample:rows.slice(0,6),group:rows.reduce((a,x)=>(a[x.kind]=(a[x.kind]||0)+1,a),{})},null,2));
