"""Exploratory leave-one-task-category-out diagnostic on released FP-Agent vectors.

A fresh eight-class classifier learns from two categories and tests the third.
Human visitors may overlap between tasks; this is not an unseen-person or new-site test.
"""
import json,os
import numpy as np
import xgboost as xgb
from sklearn.metrics import accuracy_score,classification_report
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
labels=sorted(D);mapping={label:i for i,label in enumerate(labels)}
rows=[]
for label,items in D.items():
 for source,v in items.items():
  task=json.loads(source)['task_name'].split()[0]
  assert task in ('Shopping','Flight-booking','Forums')
  rows.append((label,task,v))
for feature in ['behavioral','combined']:
 vector=lambda v:v['behavioral'] if feature=='behavioral' else v['fpjs']+v['behavioral']
 print('feature',feature)
 for held in ('Shopping','Flight-booking','Forums'):
  train=[(label,v) for label,task,v in rows if task!=held]
  test=[(label,v) for label,task,v in rows if task==held]
  X=np.array([vector(v) for label,v in train],dtype=float);y=np.array([mapping[label] for label,v in train])
  Z=np.array([vector(v) for label,v in test],dtype=float);q=np.array([mapping[label] for label,v in test])
  model=xgb.XGBClassifier(objective='multi:softprob',num_class=len(labels),max_depth=6,learning_rate=.1,n_estimators=150,random_state=32,n_jobs=4)
  model.fit(X,y);pred=model.predict(Z)
  print('held',held,'train',len(train),'test',len(test),'accuracy',round(accuracy_score(q,pred),4))
  print('human errors',int(((q==mapping['Human'])&(pred!=mapping['Human'])).sum()),'/',int((q==mapping['Human']).sum()))
  print('agent class errors',int(((q!=mapping['Human'])&(pred!=q)).sum()),'/',int((q!=mapping['Human']).sum()))
  print('agent misclassified human',int(((q!=mapping['Human'])&(pred==mapping['Human'])).sum()),'/',int((q!=mapping['Human']).sum()))
