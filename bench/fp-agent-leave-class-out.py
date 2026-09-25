"""Exploratory OOD binary diagnostic on FP-Agent released vectors.

Each run trains on six agent classes and human visitor groups excluding held-out IDs,
then tests one withheld agent class and held-out human visitors. Classes and site-version
IDs are not crossed; this is not a prospective unseen-site benchmark.
"""
import json,os
import numpy as np
import xgboost as xgb
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
classes=[k for k in D if k!='Human']
human=[]
for source,v in D['Human'].items():
 visitor=json.loads(source)['task_name'].split()[1]
 human.append((visitor,v))
ids=sorted({i for i,_ in human});rng=np.random.default_rng(1729)
held=set(rng.choice(ids,size=round(len(ids)*.2),replace=False))
print('held human visitor IDs',len(held),'of',len(ids),'trials',sum(i in held for i,_ in human))
for feature in ['behavioral','combined']:
 print('feature',feature)
 vector=lambda v:v['behavioral'] if feature=='behavioral' else v['fpjs']+v['behavioral']
 human_train=[vector(v) for i,v in human if i not in held]
 human_test=[vector(v) for i,v in human if i in held]
 for withheld in classes:
  agents_train=[vector(v) for label in classes if label!=withheld for v in D[label].values()]
  agents_test=[vector(v) for v in D[withheld].values()]
  X=np.array(human_train+agents_train,dtype=float)
  y=np.array([0]*len(human_train)+[1]*len(agents_train))
  model=xgb.XGBClassifier(max_depth=6,n_estimators=150,learning_rate=.1,random_state=32,n_jobs=4)
  model.fit(X,y)
  agent_pred=model.predict(np.array(agents_test,dtype=float))
  human_pred=model.predict(np.array(human_test,dtype=float))
  print(withheld,'unseen agent detected',int(agent_pred.sum()),'/',len(agent_pred),
        'held-visitor human false positives',int(human_pred.sum()),'/',len(human_pred))
