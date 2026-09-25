# How to read the results

This page is for people who want to audit the headline numbers before trying the code. All data were assessed locally on September 25, 2026. The versioned scripts and dependencies are in this repository, while external corpora are deliberately excluded.

| Evaluation | Unit and data source | Ours | Comparator | Claim supported |
|---|---|---|---|---|
| Chrome instant checks | 6 controlled automated sessions, stock/masked Playwright, Puppeteer, Selenium | 6/6 likely automated | BotD 4/6 bot; bot-signal 6/6 not legitimate | Our prototype ties bot-signal on these controlled positives only |
| Headed Chrome instant checks | Same 6 setup types under Xvfb, not human-driven | 6/6 | BotD 4/6; bot-signal 6/6 | Same controlled-positive result in headed mode; no human control |
| Older human browsing | 2,909 unique crowdworkers on static search result pages, native mouse logs sampled 150 ms | 0 likely automated; 1 review; 2,908 unknown | No equivalent live comparator | Behavioral-only review is rare on this narrow cohort; no field FPR follows |
| 2020 mouse traces | 30 simulated bots and 30 human comparison records; human records duplicated across comparison folds | 30/30 bots reviewed; 0/30 human records reviewed | bot-signal behavioral-only 0/30 bots and 0/30 humans, with incomplete inputs | Review-level separation only on this old trace format, not end-to-end superiority |
| Modern academic raw events | 7,182 FP-Agent agent and 546 human trials on one honey site | 0/7,182 agents and 0/546 humans flagged by our unchanged behavioral-only scorer | FP-Agent's trained model scores strongly on its own feature vectors | Our rule does not transfer to this agent corpus |
| Game-input stress test | 5,000 human game sessions, changed 240 Hz tick inputs | 0 likely automated; 170 review | No browser comparison | Standalone behavior-only verdict was unsafe and was demoted to review |

The first two rows are development-set results: the new runtime checks were chosen after inspecting these cases. They are **not** paired to the remaining rows, so you cannot divide by a pooled denominator to claim a real-world accuracy or a fixed false-positive rate. `review` and `likely-automated` are separate outcomes. The browser matrix tests instant detectors; mouse traces lack browser-runtime fields. Neither a fingerprint nor a behavior pattern proves AI decision-making.

The full [benchmark record](../BENCHMARK.md) documents dataset terms, FP-Agent split leakage diagnostics, Akamai's proprietary published comparator and retracted phase-2 mappings. The [prospective protocol](../bench/EVAL_PROTOCOL.md) describes what a credible cross-site test needs. Do not claim SOTA from this record.
