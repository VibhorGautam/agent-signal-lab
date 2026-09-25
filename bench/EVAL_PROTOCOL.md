# Prospective evaluation protocol, private draft 2026-09-25

## Claim being tested
An opt-in, privacy-conscious site-side detector distinguishes automated browser sessions from human-driven sessions. It does not identify an LLM's decision-making or the user's legitimacy. Accuracy on a controlled local test is not state of the art in the wild.

## Labels and units
A session is one task attempt on one site in one browser profile. Label human-driven, conventional browser automation, or AI-agent-directed browser automation from execution provenance, not from the detector's own observations. Record whether assistive technology, remote desktop, macros, or hybrid human/agent control was used; these are separate strata, not automatic bot labels. Group repeated trials by participant, agent implementation/version, site/template, device/browser profile, and collection day. Capture only consented sessions and avoid sensitive content or raw fingerprint redistribution.

## Freeze before optimizing
1. Create a manifest of sites, task prompts, code versions, model versions, browser builds, OS, browser mode, launch flags, permitted masking, and seed. Publish protocol before looking at held-out labels/results; keep an immutable hash.
2. Use a factorial design where humans and every agent family attempt the same tasks on the same site versions. Randomize order. Block by site, task, browser, and time to avoid easy confounding.
3. Training and tuning use development sites, people and agent versions only. Lock the final test on separate sites/templates and human participant IDs, plus newly released or unseen agent implementations. An identical site template with only a new URL is not an unseen site.
4. Include headed/headless, stock and predeclared masking/evasion conditions, at least two browser engines, keyboard-only and accessibility-assisted humans. Do not tune after test inspection; subsequent changes require a newly frozen test.
5. If no adequate independent human participants or compatible FP-Agent raw-event adapter exists, report that comparison as unavailable, not zero or a victory.

## Metrics and baselines
Report raw confusion counts, per-class precision/recall, automation detection at fixed 0.1%, 1%, and 5% human false-positive operating points, AUROC/AUPRC only with deployment prevalence context, abstention/unknown coverage, latency, bytes collected, and confidence intervals clustered by person/site/agent. Include a permitted-agent policy separate from detection. Compare BotD, bot-signal (instant and full behavioral surfaces only where inputs truly match), and a faithfully retrained FP-Agent under identical test sessions and input windows. A baseline missing the required input must be marked not comparable. Preselect thresholds on development data; no tuning to test.

## Release gate
No public SOTA claim unless a materially sized independent test shows a statistically supported win against the strongest comparable baseline at a useful human FPR, including subgroup and evasion results; publish failures and uncertainty. Obtain license/privacy review, code security review, and Vibhor's review of final repo and quote-post before any release.
