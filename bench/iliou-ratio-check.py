"""Check FP-Agent's frozen move/click ratio rule against Iliou phase-1 records.
Distinct dataset, but event capture schemes differ. No claim of SOTA.
"""
import json,re,zipfile,collections,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
z=zipfile.ZipFile(os.path.join(root,'data/web_bot_detection_dataset.zip'))
for split in ['train','test']:
 print(split)
 for folder in ['humans_and_advanced_bots','humans_and_moderate_bots']:
  labels=z.read(f'phase1/annotations/{folder}/{split}').decode().strip().splitlines()
  scores=collections.defaultdict(list)
  for line in labels:
   name,label=line.split()
   p=f'phase1/data/mouse_movements/{folder}/{name}/mouse_movements.json'
   r=json.loads(z.read(p))
   tokens=re.findall(r'\[([^\]]+)\]',r['total_behaviour'])
   move=sum(x.startswith('m(') for x in tokens)
   click=sum(x.startswith('c(') for x in tokens)
   ratio=move/(click+1)
   scores[label].append((move,click,ratio,click>=1 and ratio<=10))
  for label,rows in scores.items():
   print(folder,label,'n',len(rows),'flag',sum(x[-1] for x in rows),'median ratio',sorted(x[2] for x in rows)[len(rows)//2], 'min/max move',min(x[0] for x in rows),max(x[0] for x in rows))
