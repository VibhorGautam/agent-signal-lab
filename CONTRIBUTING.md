# Contributing

This project is deliberately conservative: a detector that catches more automation by mislabeling people is not a win.

## Local checks

```bash
npm ci
npm test
npm run bench:frameworks
```

Chrome defaults to `/usr/bin/google-chrome` for the browser benchmark (override with `CHROME_PATH`), and Xvfb is needed for `npm run bench:headed`. Never include private sessions, cookies, passwords, visitor IDs, or licensed datasets in pull requests. `data/` and result files are ignored; check the staged diff before any commit.

For a new signal, provide a threat model, reproducible fixtures, a same-surface human negative control, and an independent agent positive control. State the collection method and the possible accessibility impact. Don't turn a behavioral anomaly into `likely-automated` without separately validating false positives, and don't claim that automation is AI authorship.

## Reports

Issue reports should include Node, OS and browser versions; whether the browser was headed, headless, or remotely controlled; and an anonymized, minimal repro. Remove all personal interaction traces and account identifiers. Security issues should not include exploit details or credentials in a public issue; contact the maintainer privately instead.
