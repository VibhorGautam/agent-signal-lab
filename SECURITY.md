# Security and privacy

This is a research prototype, not an access-control system. It does not upload events, store sessions, or call a backend. The demo samples pointer positions locally and checks selected browser properties when asked. Do not copy the prototype into a production login or anti-fraud flow without a consent, retention, accessibility, and abuse review.

- Client properties are attacker-controllable; a missed bot and a falsely flagged person are both expected failure modes.
- `unknown` means insufficient evidence. `review` must not silently turn into a ban or CAPTCHA.
- An authorized agent or an assistive tool can be automated without being abusive.
- Keep raw human behavior and fingerprint data out of public issues, commits, and benchmark output.

If you find a vulnerability in the prototype, contact the maintainer privately rather than publishing a working exploit. No security response SLA or production support is promised.
