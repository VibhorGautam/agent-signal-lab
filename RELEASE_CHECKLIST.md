# Release checklist

This list is a gate, not a claim that the repository has already been published.

- [ ] Owner reviews the final repository contents, name, license, screenshot, and words in the public post.
- [ ] Run `npm ci && npm test`; record Node, Chrome, baseline versions and date for every published number.
- [ ] Run `npm run bench:frameworks` and `npm run bench:headed` on a machine with Chrome and Xvfb. Confirm the README table still matches fresh results.
- [ ] Open the demo through a local HTTP server in desktop and mobile widths. Check both the untouched and assessed states; verify no interaction data is transmitted.
- [ ] Do not narrate a CDP-controlled Chrome or an Xvfb automation as a human session. Human-browser validation requires real, consented participants using ordinary and accessible workflows.
- [ ] Review dependency licenses and run `npm audit`. No audit result proves the project is secure.
- [ ] Inspect the entire staged diff for credentials, copyrighted third-party data, sensitive traces, visitor IDs, generated outputs and accidental large files. Only include source, docs, tests, screenshots and the MIT LICENSE.
- [ ] Keep the repo private until the owner explicitly approves public release. Add a public URL only after the page resolves. Verify the exact quote target in X and get review of recipient plus final wording before posting.
- [ ] Label the six controlled cases as sensitivity smoke tests, not general accuracy; never imply an AI-authorship classifier, zero field false positives, or SOTA.
