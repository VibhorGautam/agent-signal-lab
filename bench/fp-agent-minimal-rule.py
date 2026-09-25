"""Minimal, non-deployable FP-Agent mouse-count threshold diagnostic.

Threshold selected only on training human visitor groups at <=5% empirical FPR;
agent trials are assigned by stable hash. This is a single-site dataset diagnostic,
not evidence that absence of mouse movement proves automation.
"""
import hashlib,json,os
import numpy as np
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
h=[];a=[]
for label,records in D.items():
 for source,v in records.items():
  s=json.loads(source)
  count=float(v['behavioral'][0])
  if label=='Human':h.append((s['task_name'].split()[1],count))
  else:a.append((label,source,count))
ids=sorted({x for x,_ in h});rng=np.random.default_rng(1729);held=set(rng.choice(ids,size=13,replace=False))
htrain=np.array([v for i,v in h if i not in held]);htest=np.array([v for i,v in h if i in held])
atrain=[];atest=[]
for label,source,v in a:
 digest=int(hashlib.sha256((label+'|'+source).encode()).hexdigest()[:8],16)
 (atest if digest%5==0 else atrain).append(v)
# Search integer thresholds using only train-human empirical FPR, choosing the
# largest permissible threshold. This is a permissive 5% training-FPR operating point.
candidates=sorted(set(htrain))
valid=[t for t in candidates if np.mean(htrain<=t)<=.05]
threshold=max(valid) if valid else -1
for name,vals in [('train humans',htrain),('test humans',htest),('train agents',np.array(atrain)),('test agents',np.array(atest))]:
 print(name,'flagged',int(np.sum(vals<=threshold)),'/',len(vals),'median moves',np.median(vals))
print('threshold: flag num_mouse_movements <=',threshold,'(train human FPR <=5%)')
