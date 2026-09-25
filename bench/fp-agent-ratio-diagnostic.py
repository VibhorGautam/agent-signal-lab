"""Exploratory behavior-only ratio test on FP-Agent private sanitized data.
No claim of generalization: thresholds picked on this study's training rows.
Human group split by original feature-vector metadata; agent trial split by hash.
"""
import collections,hashlib,json,os
import numpy as np
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
metadata={}
for label,records in D.items():
 for source in records:
  s=json.loads(source);s['class_label']=label
  key=hashlib.sha256(json.dumps(s,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  metadata[key]=(label,s['task_name'].split()[1] if label=='Human' else s['trial_index'])
ids=sorted({v[1] for v in metadata.values() if v[0]=='Human'})
held=set(np.random.default_rng(1729).choice(ids,size=13,replace=False))
S=collections.defaultdict(list)
for line in open(os.path.join(root,'data/fp-agent/sanitized-events.ndjson')):
 r=json.loads(line);key=r['source_hash']
 if key not in metadata:continue
 label,group=metadata[key];clicks=r['aggregate']['event_counts'].get('md',0)
 ratio=r['observed_moves']/(clicks+1)
 if label=='Human':partition='human_test' if group in held else 'human_train'
 else:partition='agent_test' if int(key[:8],16)%5==0 else 'agent_train'
 S[partition].append((ratio,r['observed_moves'],clicks,label))
# For each target FPR, tune only on train human *and* agents, select best rule
# ratio <= threshold with a minimum of one click (avoid zero-action sessions).
for fpr in [.001,.01,.05]:
 vals=sorted({x[0] for x in S['human_train']+S['agent_train']})
 eligible=[]
 for threshold in vals:
  fp=sum(x[2]>=1 and x[0]<=threshold for x in S['human_train'])
  if fp/len(S['human_train'])<=fpr:eligible.append((threshold,fp))
 threshold,fp=eligible[-1] if eligible else (-1,0)
 print('target train FPR',fpr,'ratio threshold',threshold,'human train FP',fp,'/',len(S['human_train']))
 for part in ['human_test','agent_train','agent_test']:
  rows=S[part];flag=sum(x[2]>=1 and x[0]<=threshold for x in rows)
  print(' ',part,flag,'/',len(rows))
