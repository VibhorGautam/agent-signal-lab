"""Group-human visitor holdout diagnostic on the FP-Agent released feature vectors.

Not an apples-to-apples comparison with the authors' trained model; trains a new model
from their published features, excluding all samples of held-out human visitor IDs.
"""
import json,hashlib,os,collections
import numpy as np
import xgboost as xgb
from sklearn.metrics import classification_report,accuracy_score
from sklearn.model_selection import GroupShuffleSplit
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=json.load(open(os.path.join(root,'data/fp-agent/feature_vectors.json')))
labels=sorted(D)
rows=[]
for label,records in D.items():
 for source,v in records.items():
  s=json.loads(source);key=s['task_name'].split()[1] if label=='Human' else s['class_label']+':'+s['website_version']
  rows.append((label,key,v))
# Stable visitor-token partition, and trial stratification for non-human classes.
humans=sorted({key for label,key,v in rows if label=='Human'});rng=np.random.default_rng(1729);held=set(rng.choice(humans,size=max(1,round(len(humans)*.2)),replace=False))
train=[];test=[]
for label,key,v in rows:
 if label=='Human': (test if key in held else train).append((label,v))
 else:
  # Fixed trial assignment for this diagnostic; agent environment is NOT held out.
  digest=int(hashlib.sha256((label+'|'+str(v['behavioral'])).encode()).hexdigest()[:8],16)
  (test if digest%5==0 else train).append((label,v))
Y={x:i for i,x in enumerate(labels)}
for feature in ['behavioral','combined']:
 def arrays(rows):
  X=np.array([v['behavioral'] if feature=='behavioral' else v['fpjs']+v['behavioral'] for label,v in rows],dtype=float)
  y=np.array([Y[label] for label,v in rows]);return X,y
 X,y=arrays(train);Z,q=arrays(test)
 model=xgb.XGBClassifier(objective='multi:softprob',num_class=len(labels),max_depth=6,learning_rate=.1,n_estimators=150,random_state=32,n_jobs=4)
 model.fit(X,y);pred=model.predict(Z)
 print(feature,'human visitor IDs held out',len(held),'train',len(X),'test',len(Z),'accuracy',accuracy_score(q,pred))
 print(classification_report(q,pred,target_names=labels,digits=4,zero_division=0))
 print('Human misclassified:',int(((q==Y['Human'])&(pred!=Y['Human'])).sum()),'of',int((q==Y['Human']).sum()))
