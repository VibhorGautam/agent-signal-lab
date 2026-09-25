"""Independently evaluate FP-Agent's published all-class XGBoost model on its OSF split.

Research only. Downloads not vendored. No training or benchmark superiority claim.
"""
import json, os
import numpy as np
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p=os.path.join(root,'data/fp-agent/train_test_split.npz')
if not os.path.isfile(p):
 raise SystemExit('Get OSF split from https://osf.io/j6b5p/overview?view_only=ac4ad89fbde540269aaaa85a2249cad6')
z=np.load(p,allow_pickle=True)
X_train,X_test,y_train,y_test=(z[k] for k in ['X_train','X_test','y_train','y_test'])
labels=['Atlas Agent','Browser Use','ChatGPT Agent','Claude','Comet','Human','Manus','Skyvern']
if set(y_test.tolist()) != set(range(len(labels))): raise SystemExit('Unexpected label mapping')
print('Dataset:',len(X_train),'train,',len(X_test),'test; label mapping:',labels)
for name,modelpath,feature in [
 ('browser','browser_fingerprint_all_classes.json','fpjs'),
 ('behavioral','behavioral_fingerprint_all_classes.json','behavioral'),
 ('combined','combined_fingerprint_all_classes.json',None),
]:
 model=xgb.XGBClassifier();model.load_model(os.path.join(root,'data/fp-agent/models',modelpath))
 X=np.asarray([list(x['fpjs'])+list(x['behavioral']) if feature is None else x[feature] for x in X_test],dtype=float)
 pred=model.predict(X)
 print(name,'accuracy',round(accuracy_score(y_test,pred),4),'feature count',X.shape[1])
 print(classification_report(y_test,pred,target_names=labels,digits=4,zero_division=0))
 print('confusion matrix:',confusion_matrix(y_test,pred).tolist())
