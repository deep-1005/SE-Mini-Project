# Online Bookstore - Group 2 (UE24CS341A, Section C)

A multi-seller e-commerce platform for buying and selling books, built on the MERN stack.

| Member | SRN | Owns (SRS section 5) |
|---|---|---|
| Chenchu Sreekrishna Koushik | PES1UG24CS128 | Identity, accounts and access control (FR-01 to FR-06) |
| Deeptha S | PES1UG24CS144 | Catalogue, search and reviews (FR-07 to FR-12) |
| G H Pramod | PES1UG24CS162 | Cart, checkout, payment and orders (FR-13 to FR-18) |
| Hardhick M Gowda | PES1UG24CS179 | Seller operations, administration and reporting (FR-19 to FR-24) |

## Part-1 documents

| Document | Files |
|---|---|
| Software Requirements Specification v1.1 | `SRS_Document.pdf`, `SRS_Document.docx` |
| Software Architecture and Design Specification v1.0 | `SAD_Document.pdf`, `SAD_Document.docx` |
| Software Test Plan v1.0 (32 functional and non-functional test cases + 10 security test cases) | `Test_Plan_Document.pdf`, `Test_Plan_Document.docx` |
| API contract (Sprint 1 endpoints) | `docs/api/openapi.yaml` |
| Sprint 1 plan and full backlog | `docs/sprints/SPRINT_1_PLAN.md`, `docs/sprints/product_backlog_jira.csv` |
| Manual test cases | `docs/testing/manual-cases.md` |

The sprint itself is run on Jira (backlog imported from `docs/sprints/product_backlog_jira.csv`).

## Running locally

Requirements: Node.js 20+, and either a local MongoDB 7 or a free MongoDB Atlas cluster. Redis is optional.

### API

```bash
cd server
cp .env.example .env          # set MONGO_URI and JWT_ACCESS_SECRET
npm install
npm run seed                  # 12 accounts, 60 categories, 2,500 titles, 10,000 listings
npm run dev                   # http://localhost:5000/api/v1/health
```

### Client (second terminal)

```bash
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api to :5000)
```

### Seeded accounts

- `buyer1@bookstore.test` to `buyer4@bookstore.test`
- `seller1@bookstore.test` to `seller4@bookstore.test`
- `admin1@bookstore.test` to `admin4@bookstore.test`

All seeded accounts use the password `Book@2026`.

### E-mail

With `SMTP_URL` empty, e-mails (OTPs and password-reset links) are not sent; they are captured by the mail stub and written to the debug log. Set `LOG_LEVEL=debug` to see them, or set `SMTP_URL` to a Mailtrap/Ethereal SMTP URL.

## Tests

```bash
cd server
npm test               # all tests
npm run test:unit      # no database needed
npm run test:coverage  # with the 70 per cent service-coverage target (NFR-06)
npm run lint
```

API tests need MongoDB 7. By default they start an in-memory MongoDB through `mongodb-memory-server` (it downloads the MongoDB binary on the first run). To use an existing MongoDB instead, set `MONGO_URI_TEST`, for example:

```bash
MONGO_URI_TEST=mongodb://127.0.0.1:27017 npm test
```

Each run uses a throwaway database name. Test names start with the Test Plan IDs (`TC-A-01`, `TC-C-02`, ...) so results map straight onto the traceability matrix.

## Repository layout

```text
SRS_Document.pdf / .docx        Software Requirements Specification
SAD_Document.pdf / .docx        Software Architecture and Design Specification
Test_Plan_Document.pdf / .docx  Software Test Plan
server/
  app.js            API Gateway Layer: middleware order (helmet, CORS, rate limit, sanitise, routes, errors)
  config/           env validation, MongoDB connection, logger with redaction
  middleware/       verifyJWT, authorizeRoles, validate, rateLimit, requestId, errorHandler
  routes/           auth, users, books, health (cart/orders/seller/admin arrive in Sprints 2-3)
  controllers/      thin HTTP layer
  services/         business rules: auth, otp, token, user, catalogue, audit, notification
  models/           all 17 collections from SRS v1.1 Appendix B
  adapters/         mailer (SMTP or stub), cache (Redis or in-memory)
  validators/       Joi schemas (unknown fields rejected)
  scripts/seed.js   deterministic seed data
  tests/            unit/ and api/
client/
  src/api/client.js Axios client with silent token refresh
  src/pages/        Catalogue, BookDetail, Login, Register, VerifyOtp, Forgot/Reset password
docs/
  api/              OpenAPI specification
  sprints/          Sprint 1 plan and Jira backlog
  testing/          Manual test cases
```

## Sprint 1 status

Implemented in the starter code:

- FR-01 to FR-06: registration, OTP verification, login with rotating refresh tokens, password reset, profile and addresses, role-based access control with audit logging
- FR-07 to FR-10 and FR-12: catalogue, search, filters, sorting, book details, related books
- Health endpoint, error model, all 17 data models and seed data

Next: cart and wishlist (FR-13, FR-14), listing creation (FR-19), staging deployment. See `docs/sprints/SPRINT_1_PLAN.md`.

## Branching

Work on `feature/<jira-id>-short-name`, open a pull request, get a review from another owner, then merge into `main`.
