/** Exploratory composite: original repeated-step trajectory OR short sparse moves/clicks.
 * Short-sparse threshold is a post-hoc choice on the FP-Agent corpus, not test-frozen.
 * The combined output is a diagnostic review queue, never a bot verdict.
 * Never use for blocking; this script measures diagnostic transfer only.
 */
import {createReadStream} from 'node:fs';import {createInterface} from 'node:readline';import {scoreSignals} from '../src/detect.js';
const stats={};
for await(const line of createInterface({input:createReadStream(new URL('../data/fp-agent/sanitized-events.ndjson',import.meta.url))})){
 const row=JSON.parse(line), click=row.aggregate.event_counts.md??0;
 const shortSparse=click>=3 && row.observed_moves/(click+1)<=3;
 const trajectoryReview=scoreSignals({events:row.events}).classification==='review';
 const s=stats[row.label]??={n:0,shortSparse:0,trajectoryReview:0,compositeReview:0};s.n++;s.shortSparse+=+shortSparse;s.trajectoryReview+=+trajectoryReview;s.compositeReview+=+(shortSparse||trajectoryReview);
}
console.log(JSON.stringify(stats,null,2));
