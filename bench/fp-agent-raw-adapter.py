"""Stream the authors' OSF raw JSON to private, minimal event snapshots.
No headers, typed text, selectors, visitor IDs, IP or raw payload leave data/.
Uses ijson on the 4.3 GB data; events are first 500 observed mousemoves.
"""
import ijson,json,os,collections,hashlib
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
source=os.path.join(root,'data/fp-agent/raw_dataset.json')
out=os.path.join(root,'data/fp-agent/sanitized-events.ndjson')
counts=collections.Counter();bad=0
with open(source,'rb') as stream,open(out,'w') as dest:
 builder=None;active=False
 for prefix,event,value in ijson.parse(stream):
  if not active:
   if event=='start_map' and prefix.endswith('.item') and prefix.count('.')==1:
    label=prefix.split('.')[0];builder=ijson.common.ObjectBuilder();builder.event(event,value);active=True
   continue
  builder.event(event,value)
  if event=='end_map' and prefix==label+'.item':
   record=builder.value;active=False;builder=None
   s=record['source'];events=[];observed=0;counts_by_type=collections.Counter();click_points=[];click_samples=[];key_samples=[];scroll_samples=[];duration_min=None;duration_max=None
   for item in record['behavioral_data']:
    try:frames=json.loads(item['req_body']).get('eventFrames',[])
    except (ValueError,TypeError):bad+=1;continue
    for e in frames:
     counts_by_type[e[0]]+=1
     try:
      stamp=float(e[-1]);duration_min=stamp if duration_min is None else min(duration_min,stamp);duration_max=stamp if duration_max is None else max(duration_max,stamp)
     except (ValueError,TypeError):pass
     if e[0]=='md' and len(e)>=6:
      try:click_points.append((float(e[-3]),float(e[-2])));click_samples.append({'x':float(e[-3]),'y':float(e[-2]),'t':float(e[-1])})
      except (ValueError,TypeError):pass
     if e[0]=='kd' and len(e)>=5:
      try:key_samples.append({'t':float(e[-1])})
      except (ValueError,TypeError):pass
     if e[0]=='sc' and len(e)>=5:
      try:scroll_samples.append({'t':float(e[-1]),'deltaY':float(e[-2])})
      except (ValueError,TypeError):pass
     if e[0]=='mm' and len(e)>=5:
      observed+=1
      if len(events)<500:
       try:events.append({'type':'pointermove','x':float(e[-3]),'y':float(e[-2]),'t':float(e[-1])})
       except (ValueError,TypeError):bad+=1
   # metadata key permits split alignment but contains no raw visitor ID in output
   s=dict(s);s['class_label']=label
   key=hashlib.sha256(json.dumps(s,sort_keys=True,separators=(',',':')).encode()).hexdigest()
   jumps=[((click_points[i][0]-click_points[i-1][0])**2+(click_points[i][1]-click_points[i-1][1])**2)**.5 for i in range(1,len(click_points))]
   aggregate={'event_counts':dict(counts_by_type),'click_distinct_positions':len(set(click_points)),'click_jumps_over_150':sum(v>150 for v in jumps),'duration_ms':round(duration_max-duration_min,1) if duration_max is not None and duration_min is not None else 0}
   dest.write(json.dumps({'label':label,'source_hash':key,'events':events,'click_samples':click_samples,'key_samples':key_samples,'scroll_samples':scroll_samples,'observed_moves':observed,'aggregate':aggregate},separators=(',',':'))+'\n')
   counts[label]+=1
print('per-class records',dict(counts),'bad_frames',bad,'private output bytes',os.path.getsize(out))
