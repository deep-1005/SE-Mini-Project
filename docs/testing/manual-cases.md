# Manual test cases

The full specification of every test case is in the Software Test Plan, section 16 (functional and
non-functional) and section 5.1 (security). Automated cases carry their ID in the Jest test name.
The cases below are wholly or partly manual and are executed on staging at the end of the sprint
shown.

| ID | What is manual | Sprint |
|---|---|---|
| TC-N-02 | Export the uptime monitor report for the evaluation window | 4 |
| TC-N-04 | Four-screen checkout count, 360 px walkthrough, axe scan, keyboard-only purchase | 3 |
| TC-N-07 | Edge and Safari runs (Chromium, Firefox and WebKit are automated in Playwright) | 3 |
| TC-SEC-02 | testssl.sh against the staging API host; check redirect and HSTS | 2, 4 |
| TC-SEC-03 | Search DB dump, logs and browser traffic for the sandbox test card number | 2, 4 |
| TC-SEC-05 | Burp Suite token-tampering and IDOR checks in addition to the automated role matrix | 2 |
| TC-SEC-06 | OWASP ZAP active scan on staging | 2, 4 |
| TC-SEC-10 | gitleaks on full history, npm audit, OWASP Top 10 checklist walk-through | 4 |

Record results (pass/fail, build SHA, date, tester) in the sprint test report.
