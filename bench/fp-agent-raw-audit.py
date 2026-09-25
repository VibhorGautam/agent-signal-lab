"""Cross-check extracted raw mouse counts against published behavioral feature 0.
Private OSF files required; no raw rows printed or redistributed.
"""
import json,os,collections,hashlib
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
features=collections.defaultdict(list)
for label,records in D.items():
 for source,v in records.items():
  s=json.loads(source)
  s["class_label"]=label
  key=hashlib.sha256(json.dumps(s,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  features[(label,key)].append(v['behavioral'][0])
matched=collections.Counter();missing=collections.Counter();mismatch=collections.Counter();example=[]
for line in open(os.path.join(root,'data/fp-agent/sanitized-events.ndjson')):
 row=json.loads(line);k=(row['label'],row['source_hash'])
 if k not in features:missing[row['label']]+=1;continue
 matched[row['label']]+=1
 if row['observed_moves'] not in features[k]:
  mismatch[row['label']]+=1
  if len(example)<4:example.append((row['label'],row['observed_moves'],features[k][:2]))
print('matched',dict(matched),'missing',dict(missing),'mousecount mismatch',dict(mismatch),'examples',example)
