# Sprint 1 Plan - Online Bookstore (Group 2)

**Sprint 1:** Monday 5 October 2026 to Sunday 18 October 2026 (two weeks)  
**Sprint goal:** A visitor can register, verify, sign in, and find a book by search, filter and detail page on a deployed staging build, with CI gates protecting `main`.

## Ceremonies

| Event | When | Notes |
|---|---|---|
| Sprint planning | Mon 5 Oct, after class | Confirm scope below, assign Jira issues |
| Stand-up (async) | Daily, 9 pm, team WhatsApp/Slack thread | Yesterday / today / blockers, one line each |
| Mid-sprint check | Sun 11 Oct | Re-plan if any story is at risk |
| Sprint review + retro | Sun 18 Oct | Demo on staging; update RTM status; burndown screenshot |

## Definition of Done

- Code merged to `main` through a reviewed PR (reviewer = another owner) with CI green.
- Unit and API tests written for the story, test IDs from the Test Plan in the test names.
- Service-layer coverage stays at or above 70 per cent (NFR-06).
- API matches SAD section 4.3; any change is reflected in `docs/api/openapi.yaml`.
- RTM (Appendix C) status updated for the requirement.

## Sprint 1 backlog

| ID | Story / task | Req | Owner | SP | Status at start | Acceptance |
|---|---|---|---|---|---|---|
| US-01 | As a visitor I can register as a buyer or seller so that I can transact | FR-01 | Chenchu Sreekrishna Koushik | 3 | Code ready - review | TC-A-01 passes; duplicate e-mail 409; weak password 400 |
| US-02 | As a new user I verify my e-mail with a six-digit OTP | FR-02 | Chenchu Sreekrishna Koushik | 3 | Code ready - review | TC-A-02 passes; 3 wrong attempts lock; 3 resends/hour |
| US-03 | As a user I sign in and out; my session refreshes silently | FR-03 | Chenchu Sreekrishna Koushik | 5 | Code ready - review | TC-A-03 passes; refresh rotation and reuse detection |
| US-04 | As a user I can reset a forgotten password | FR-04 | Chenchu Sreekrishna Koushik | 3 | Code ready - review | TC-A-04 passes; all sessions revoked |
| US-05 | As a buyer I manage my profile and delivery addresses | FR-05 | Chenchu Sreekrishna Koushik | 3 | API ready; UI to do | TC-A-05 passes; profile and address pages built |
| US-06 | As the platform I refuse calls from roles not allowed on a route | FR-06 | Chenchu Sreekrishna Koushik | 2 | Code ready - review | TC-A-06 passes; refusals audited |
| US-07 | As a visitor I browse the catalogue 20 titles per page | FR-07 | Deeptha S | 3 | Code ready - review | TC-C-01 passes |
| US-08 | As a visitor I search by title, author, ISBN or publisher | FR-08 | Deeptha S | 5 | Code ready - verify in CI | TC-C-02 passes on MongoDB 7 in CI; explain() shows TEXT |
| US-09 | As a visitor I filter and sort results | FR-09 | Deeptha S | 5 | Code ready - verify in CI | TC-C-03 passes on MongoDB 7 in CI |
| US-10 | As a buyer I compare every seller offer for a title | FR-10 | Deeptha S | 3 | Code ready - review | TC-C-04 passes |
| US-12 | As a buyer I see up to six related titles | FR-12 | Deeptha S | 2 | Code ready - review | TC-C-06 passes |
| T-01 | Seed script: 12 accounts, 60 categories, 2,500 titles, 10,000 listings | NFR-01 | Deeptha S | 2 | Done | npm run seed completes on Atlas M0 |
| T-02 | CI pipeline: lint, tests, coverage gate, npm audit, gitleaks; branch protection on main | NFR-06 | Hardhick M Gowda | 3 | Code ready - enable on GitHub | TC-N-06: failing lint or coverage blocks merge |
| T-03 | Staging deployment (API container, static client, Atlas, Redis) and uptime monitor on /health | NFR-02 | Hardhick M Gowda | 3 | To do | Staging URL live; monitor polling every 5 min |
| US-19 | As a seller I create a listing from an ISBN with auto-filled details | FR-19 | Hardhick M Gowda | 5 | In progress (ISBN lookup done) | TC-S-01 passes; book stats refreshed on save |
| US-13 | As a buyer my cart persists across sessions and devices | FR-13 | G H Pramod | 5 | To do | TC-O-01 passes; OWN_LISTING enforced (BR-02) |
| US-14 | As a buyer I save listings to a wishlist and move them to cart | FR-14 | G H Pramod | 3 | To do | TC-O-02 passes |
| T-04 | Payment Gateway Adapter with sandbox keys, stub and signed webhook fixtures | FR-16 | G H Pramod | 3 | To do | Adapter unit tests pass with stub |

**Committed:** 61 story points. By owner: Chenchu Sreekrishna Koushik 19, Deeptha S 20, Hardhick M Gowda 11, G H Pramod 11.

"Code ready" items come from the starter code in this repository: the owner reviews it, adjusts it to the team's taste, and merges it through a PR so that the commit history shows their ownership. This front-loads Sprint 1 so that the remaining capacity goes to the stories marked "To do".

## Risks this sprint

- MongoDB-dependent tests need MongoDB 7: they run automatically in CI (mongodb-memory-server). Locally, either let mongodb-memory-server download MongoDB on first run or point `MONGO_URI_TEST` at a local MongoDB.
- Atlas M0 and the container host must be created early (T-03) so the end-of-sprint demo runs on staging, not a laptop.

## Later sprints (planned)

| Sprint | Dates | Focus |
|---|---|---|
| 2 | 19 Oct - 1 Nov | Reviews, checkout, payment and webhook, stock/price management, notification retry, first load test, automated security tests |
| 3 | 2 Nov - 15 Nov | Invoice, order lifecycle, fulfilment, seller dashboard, moderation, analytics, accessibility and cross-browser |
| 4 | 16 Nov - 22 Nov | Hardening: security scans, full regression, system tests, test summary report |

The full backlog with story points is in `product_backlog_jira.csv` (import it with Jira's CSV importer, or create the issues by hand).
