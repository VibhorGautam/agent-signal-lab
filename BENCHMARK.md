# Benchmark, 25 September 2026

Run `npm ci && npm run bench` in this repository with Node 20+ and Google Chrome 151.0.7922.137 at `/usr/bin/google-chrome` for the recorded run. The script launches headless Chrome through Playwright, serves files on a random `127.0.0.1` port, and compares local page verdicts. To use another Chrome path, set `CHROME_PATH=/path/to/chrome`. Baselines are exact dependencies locked in `package-lock.json`. The script creates a fresh browser context for each case and does not visit an external website.

| Controlled case (all Playwright) | Agent Signal Lab | BotD 2.0.0 | bot-signal 2.0.14 |
|---|---|---|---|
| Stock Playwright | likely automated | bot | not legitimate |
| `navigator.webdriver` getter hidden | likely automated | bot | not legitimate |
| UA explicitly says Playwright | likely automated | bot | not legitimate |
| `navigator.webdriver` hidden + ordinary Chrome UA | likely automated (own-property shadowing) | not bot | not legitimate |

These are **4/4 for bot-signal, 4/4 for this prototype, and 3/4 for BotD** on controlled automation only. These numbers are not accuracy rates: there are no human or real-world AI-agent samples, and the manipulated cases are not independent draws. We cannot establish false-positive rate or prove any method detects AI agents. Our prototype does not outperform the best baseline here. No reason to claim otherwise in a social post.

The primary contribution at this stage is explainable evidence and a conservative `unknown` verdict, not a new benchmark record. A serious claim needs a public held-out dataset, realistic positives and negatives, consent and accessibility checks, cross-browser replication, confidence intervals, and a threat model for evasion.

## Public behavioral dataset, preliminary

Dataset: https://m4d.iti.gr/web-bot-detection-dataset/ , CC BY-NC-SA. Download to `data/web_bot_detection_dataset.zip`; raw data and derived per-session outputs remain ignored by git. `npm run bench:public -- --train` checks the original phase-1 training split; `npm run bench:public` checks its untouched test split. `node bench/phase2.mjs` explores only matched phase-2 base records and is incomplete, as explained below. Train/test split is provided by the dataset. Phase-1 training data set the `repeated-step-trajectory` thresholds (step repeat >0.32 and timing CV <0.8, with at least 100 pointer points). No phase-2 threshold tuning has been done. Scores are not calibrated probabilities and behavioral flag alone should not automatically block a person.

| Phase | Human review / total | Moderate bot review / total | Advanced bot review / total |
|---|---:|---:|---:|
| Phase 1 training (review only) | 0/70 | 35/35 | 35/35 |
| Phase 1 held-out test (review only) | 0/30 | 15/15 | 15/15 |
| Phase 2 | not reportable | not reportable | not reportable |

**Important:** phase-1 human sessions are duplicated in two comparison folders. Counts are per comparison record, not distinct people; do not pool them. Phase-2 annotations include sub-sessions concatenated in base JSONL records; the first adapter incorrectly treated each base record as one `_0` label and returned a possible human hit. A tentative timestamp-gap split excluded five ambiguous human IDs and gave a different answer. Neither result is reliable. See `bench/phase2-audit-result.md` and do not publish phase-2 performance. Older human data does not cover assistive technologies, mobile touch, or demographic variation. This dataset cannot benchmark live browser fingerprint checks or AI decision-making.

### Behavioral baseline on identical traces

The `bot-signal/browser` package exposes `analyzeBehavioralSamples`, permitting its behavioral module to score the same first 500 mouse points as our rule. We set `isTrusted: true` only because the dataset contains native browser-logged movements rather than script-dispatched DOM events; there are no click/scroll/keyboard fields available in this adapter. On phase-1 held-out test, this behavioral-only baseline flagged 0/30 simulated bots and 0/30 human comparison records, while our rule sent 30/30 bots and 0/30 humans to **review**, not to `likely-automated`. This is a narrow separation on **this 2020 mouse-trace dataset and this behavioral API**, not an end-to-end comparison: bot-signal's instant browser and server signals are absent, and the dataset is not a modern AI-agent sample. The separate instant browser matrix now ties bot-signal on controlled positives only; this trace comparison is not an end-to-end product win.

## Three-framework controlled browser matrix

Run `npm run bench:frameworks` with Chrome 151, Playwright, Puppeteer and Selenium (dependencies pinned in the lockfile). Six controlled **headless** sessions on a local loopback test page: each framework stock and with an ordinary Chrome UA plus a hidden `navigator.webdriver` (for Selenium, Chrome's AutomationControlled flag is disabled). All three detectors execute in the same page, so the comparison includes browser-runtime checks.

| Framework | Profile | Ours | BotD | bot-signal instant |
|---|---|---|---|---|
| Playwright | stock | likely automated | bot | not legitimate |
| Playwright | masked UA/webdriver | likely automated (own-property shadowing) | not bot | not legitimate |
| Puppeteer | stock | likely automated | bot | not legitimate |
| Puppeteer | masked UA/webdriver | likely automated (own-property shadowing) | not bot | not legitimate |
| Selenium | stock | likely automated | bot | not legitimate |
| Selenium | masked UA/webdriver | likely automated (ChromeDriver constructor alias) | bot | not legitimate |

Totals on these six controlled automation cases: ours 6/6, BotD 4/6, bot-signal 6/6. No live human controls in this matrix; no field accuracy or AI-agent inference. The own-property and ChromeDriver-alias checks were developed on these exact cases: the new 6/6 is development-set performance, not a held-out confirmation. They have not been tested in a matched human browser cohort. Do not infer a product superiority claim. The measured raw output is written to the gitignored `bench/framework-results.json` locally; the sample matrix above is from the run on Sep 25, 2026.

### Additional Chrome runtime sanity control

`node bench/plain-chrome-control.mjs` launches Chrome directly with `--disable-blink-features=AutomationControlled` and a fresh profile, then reads a blank local page via CDP; `xvfb-run -a node bench/plain-chrome-control.mjs --headed` repeats in headed Chrome. The headed run has `navigator.webdriver=false`, no own-property shadow, ordinary Chrome UA and no detected ChromeDriver alias; our scorer returns `unknown`. The headless run still declares HeadlessChrome and returns `likely-automated`. These are **automated CDP-observed sessions**, not genuine human/browser negative controls. The headed result only checks that the new runtime rules do not flag one clean Chrome configuration. It is not an FPR estimate.

## Stronger academic baseline

We independently loaded [FP-Agent's](https://github.com/ethanbwang/fp-agent) released all-class XGBoost models and [OSF split](https://osf.io/j6b5p/overview?view_only=ac4ad89fbde540269aaaa85a2249cad6). On their 1,544 test feature vectors, browser-only accuracy was 82.12%, behavior-only 99.94%, and combined 100%; all 109 human test vectors were classified human. These are **their model's reproduced results**, not ours; see `bench/fp-agent-repro-notes.md`. We audited human visitor-token overlap and exact feature-vector repeats, but have not established cross-site or new-agent-version generalization. It is not credible to claim SOTA from four or six controlled cases while this baseline exists.

Split audit: 1,542/1,544 test browser fingerprint vectors exactly match some training vector; 47/50 distinct test-side human visitor ID tokens occur in training, identified using the study code's own `task_name.split()[1]` convention. These are not proof of invalid research, but the random trial split is not an unseen-participant test. See `bench/fp-agent-repro-notes.md`.

A one-seed diagnostic with 13 held-out human visitor ID tokens, trained on FP-Agent's published vectors, still gave 89/89 correct human classifications and 1,503/1,503 combined-feature classifications; agent classes remained trial-split. This is not a new-agent or new-site test. It cautions against blaming the published 100% solely on visitor overlap; see `bench/fp-agent-group-split.py`.

Version-path audit: although human and agent classes use disjoint `website_version` IDs, the authors' source identifies these as random URL-path aliases of one honey site, not different site designs. All classes cover shopping, flights, and forums. This evidence corrects an earlier mistaken site-confounding inference. We still lack a genuinely different site and prospective agent-version test; see `bench/fp-agent-repro-notes.md`.

Prospective protocol: see `bench/EVAL_PROTOCOL.md`. It requires crossed human and agent conditions on the same site versions, grouped people and agent versions, frozen test sites and thresholds, and matched input surfaces before any SOTA claim. No prospective corpus has been collected yet.

## Headed Chrome sensitivity check

`xvfb-run -a node bench/frameworks-headed.mjs` repeats the six-framework-profile matrix in headed Chrome under a virtual display (same local test page). Sep 25 result: ours 6/6, BotD 4/6, bot-signal instant 6/6, identical to headless. These are *automated sessions* under Xvfb, not human headed sessions; no false-positive or AI-agent claim follows. The result is written locally to ignored `bench/framework-headed-results.json`.

Task-shift diagnostic: fresh eight-class XGBoost trained on two FP-Agent task categories and tested on the third got behavioral-only 68.51%-82.57% accuracy and combined 93.35%-97.01%. Across the three held-out tasks, 0/546 human trials were assigned an agent label. These are same-site, potentially overlapping human visitors and unchanged agent versions; eight-class agent attribution error is not human-vs-bot miss. The actual agent-to-human errors are 1/2,444, 7/2,397, 57/2,332 for behavioral-only and 3/2,444, 5/2,397, 18/2,332 for combined (shopping/flights/forums). See `bench/fp-agent-leave-task-out.py`.

One-feature sanity check on FP-Agent vectors: a <=28-mouse-movement threshold selected at <=5% training human FPR flagged 1/89 held-visitor human trials and 1,354/1,409 test agent trials. This does **not** outperform FP-Agent and is not safe for keyboard-only or accessibility-assisted humans; see `bench/fp-agent-minimal-rule.py`.

## Our event scorer on FP-Agent's raw corpus (private reproducibility)

The authors' OSF `raw_dataset.json` (~4.3 GB) can be streamed privately with `python bench/fp-agent-raw-adapter.py` (requires `ijson`) into ignored `data/fp-agent/sanitized-events.ndjson`, then evaluated with `node bench/fp-agent-ours-on-raw.mjs`. The adapter copies only the first 500 mousemove coordinates/timestamps, class label, total mousemove count and a SHA-256 of source metadata; no headers, IPs, visitor IDs, selectors, text or raw corpus enter this source package. It does not make the private derived file safe to publish without review.

On 7,728 raw sessions (7,182 agent, 546 human), our **unchanged behavioral-only** scorer returned `unknown` for every session: 0/7,182 agent catches and 0/546 human flags. Nine raw agent records are absent from the authors' processed feature corpus (seven Manus, two ChatGPT Agent); for the other 7,719 records, extracted mousemove counts exactly match their released behavioral feature zero. This is a negative result for our event rule, not a full browser comparison: raw data does not supply a current live navigator state to our scorer, and FP-Agent uses 50 behavioral plus 418 browser features. Raw data stays ignored locally; do not distribute it or use a privacy-sensitive field as a model shortcut. One controlled honey website is also not an independent fresh-site benchmark.

## Raw mousemove-to-click ratio, failed portability check

We evaluated an exploratory ratio `observed mousemoves / (mouse-downs + 1)` on the same private FP-Agent corpus. A threshold <=10 chosen at 0/457 false positives on the training human visitor groups flagged 1,399/1,400 trial-split agents but **1/89 held-out-visitor humans**. Raising to a nominal <=1% training FPR threshold made held-visitor FPs 2/89 without increasing agent detection. The seven agent classes' median ratios were 0.8-1.2, and human median was 44.7. This is a single honey site's collection signature, not a safe detector. Testing the *same frozen <=10 ratio* on Iliou et al.'s phase-1 test caught 0/30 simulated bots and flagged 0/30 duplicated human comparison records: the bots have many mousemoves per click (median ratios 269-477), unlike FP-Agent's browser agents. Capture methods and bot types differ, but the rule plainly does not transfer. See `bench/fp-agent-ratio-diagnostic.py` and `bench/iliou-ratio-check.py`; never deploy the rule to block a person, particularly a keyboard-only or mobile user.

## Exploratory bot-signal behavioral adapter, not a product comparison

We streamed FP-Agent's private raw UI events to bot-signal 2.0.14 `analyzeBehavioralSamples` as a diagnostic (`bench/fp-agent-bot-signal-raw.mjs`). The source lacks `isTrusted`, click `detail`, touch records, page/screen coordinates and some browser-provided movement deltas, so the adapter assumes trusted pointer/key/scroll events and pointer clicks, and passes an empty touch array. The behavioral-only default verdict flagged 109/7,182 raw agents and 63/546 humans. Those figures are **not** bot-signal's real-world end-to-end performance or an apples-to-apples comparison: browser instant/server modules are absent, and touch and origin assumptions can cause false positives. Do not cite it as a product failure or a win. On controlled live Chrome, bot-signal instant still caught all six automations while our live scorer caught three.

## Human motor-input safety check and changed classification

The [CaptchaSolve30k](https://huggingface.co/datasets/Capycap-AI/CaptchaSolve30k) public test split has 5,000 human game sessions (4,397 mouse and 603 touch in the downloaded test rows). We use `tickInputs` as 240 Hz physics-tick states, retain only changed coordinates and the first 500 positions (`bench/capy-human-control.mjs`). Before the safety change, our repeated-step behavioral rule labeled 170/5,000 (3.4%) human sessions `likely-automated` (106/1,737 in thread-the-needle). This is **not** a browser false-positive rate: the data is a game, sampling can create regularity, and there is no browser runtime metadata. Yet it is direct evidence that the rule is unsafe as a standalone automation verdict. `scoreSignals` now reports all behavior-only scores as `review`; explicit webdriver/UA/global artifacts alone retain `likely-automated`. After the change, 170/5,000 game sessions enter review and 0/5,000 get an automation verdict. On Iliou phase-1 test, the same 30/30 bot comparison records also enter review, not a likely-automated bucket; 0/30 duplicated human comparison records enter review. Do not conflate review with a detected bot. The binary `inputStream` is documented as 9-byte samples but all 60 inspected test rows decode to exactly 4 bytes per declared sample, so this adapter does not use or interpret it. The raw dataset is not packaged.

The same 5,000-session game stress test has uneven review rates: touch/thread-the-needle 35/230, mouse/thread-the-needle 71/1,507, touch/sheep-herding 21/194, mouse/sheep-herding 32/1,446, touch/polygon-stacking 5/179, mouse/polygon-stacking 6/1,444. No group got a likely-automated verdict after the safety change. These game/task strata are not demographic, disability, or browser-fairness measurements, but they illustrate why even a review queue can burden some users disproportionately (`bench/capy-review-strata.mjs`).

## Independent human browser-session negative control

[The Attentive Cursor Dataset](https://gitlab.com/iarapakis/the-attentive-cursor-dataset) includes 2,909 crowdworker mouse logs from a transactional web-search task, one trajectory per participant, collected on static search-result pages. Its [paper](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2020.565664/full) describes mousemove polling every 150 ms, with other events listener-based. Clone the public repository privately to `data/attentive-cursor`, then run `node bench/attentive-human-control.mjs`. The adapter reads the timestamp, x/y, and event name from each CSV and passes the first 500 mousemove points to our unchanged scorer, without navigator or runtime values; the participant and event data stay ignored by git. On all 2,909 logs, 0 received `likely-automated`, 1 entered `review` for the repeated-step rule, and 2,908 were `unknown`. The three mousemove-count quantiles (5%, median, 95%) were 2, 11, and 48. This is a useful **independent human web-task negative control**, not a field false-positive rate or a matched human/agent benchmark. The single-site-family, older browser cohort, sparse trajectories, 150-ms polling, and absent accessibility/mobile cases limit its reach. The one review case was `20170210183209.csv`, 104 mouse moves, 0.340 nearly repeated step fraction, and timing CV 0.093; it is human-labeled, showing why review must not be mistaken for a bot verdict.

## Cross-site industry comparator (reported, not reproduced)

[Akamai's August 2026 part 1](https://www.akamai.com/blog/security-research/identifying-agentic-automation-behavioral-telemetry) describes a proprietary two-stage mouse-telemetry transformer and MLP, with 2,190 labeled agentic sequences from real customer sites. Its [part 2](https://www.akamai.com/blog/security-research/identifying-agentic-automation-behavioral-telemetry-part-2) reports ROC-AUC 0.981 and agent recall 92.4% for **request sequences with at least five mouse events**, human specificity 94.7%; all-session agent recall is 52.6% across 816 labeled sessions because only 53.7% had a scorable request. Leave-one-customer-out cross-validation across five customers reports ROC-AUC 0.956 ± 0.014 and recall 56.3% ± 14.3%, compared to ~92.1% in-distribution recall. These are Akamai's claims, not independently reproduced, and no public raw data, weights or code were found. Request- vs session-level denominators and site-transfer losses matter more than a headline AUC. Our prototype has not met or beaten that bar.
