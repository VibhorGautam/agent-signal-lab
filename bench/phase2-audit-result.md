# Phase 2 annotation audit, exploratory only

Source: Iliou et al. [dataset](https://m4d.iti.gr/web-bot-detection-dataset/), 2020; archive CC BY-NC-SA.

The official phase-2 annotation has 56 human and 28 each moderate and advanced bot sub-session labels. JSONL stores 59 human base records. Many base records combine two or more sub-sessions with a large timestamp gap, while labels append `_0`, `_1`, `_2`. Our first adapter took only the first 500 points of each base record and treated that as `_0`: that made a human record look positive (1/43), but the flagged record had multiple long gaps and no verified `_0` mapping. **Retract the 1/43 as a false-positive estimate.**

A tentative >20-minute timestamp-gap split matches the number of labels for 39 of 44 labeled human base IDs. Those 39 yield 47 mapped sub-sessions, none flagged by our rule. Five base IDs are ambiguous and excluded; they account for nine labels. The split threshold is a hypothesis inferred from data shape, not documented by the authors. Some raw timestamps are malformed. This is still not a valid held-out performance estimate: mapping and event alignment need author guidance or a verified parser. Do not publish 0/47 or 1/43 as a false-positive rate.

The phase-1 test split is unambiguous about session IDs but is old, one website, and has duplicated human records in two folds. Its 30/30 bot vs 0/30 human comparison-record results remain an exploratory dataset-specific measure, not modern SOTA.
