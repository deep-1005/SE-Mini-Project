# Online Bookstore - Group 2 (UE24CS341A, Section C)

A multi-seller e-commerce platform for buying and selling books, built on the MERN stack.

| Member | SRN | Owns (SRS section 5) |
|---|---|---|
| Chenchu Sreekrishna Koushik | PES1UG24CS128 | Identity, accounts and access control (FR-01 to FR-06) |
| Deeptha S | PES1UG24CS144 | Catalogue, search and reviews (FR-07 to FR-12) |
| G H Pramod | PES1UG24CS162 | Cart, checkout, payment and orders (FR-13 to FR-18) |
| Hardhick M Gowda | PES1UG24CS179 | Seller operations, administration and reporting (FR-19 to FR-24) |

## Documents

| Document | File |
|---|---|
| Software Requirements Specification v1.1 | `SRS_Group2_Online_Bookstore_v1.1.docx` |
| Software Architecture and Design Specification v1.0 | `SAD_Group2_Online_Bookstore.docx` |
| Software Test Plan v1.0 (with 42 test cases) | `Test_Plan_Group2_Online_Bookstore.docx` |
| API contract (Sprint 1 endpoints) | `docs/api/openapi.yaml` |
| Sprint 1 plan and full backlog | `docs/sprints/SPRINT_1_PLAN.md`, `docs/sprints/product_backlog_jira.csv` |
| Manual test cases | `docs/testing/manual-cases.md` |

## Running locally

Requirements: Node.js 20+, and either a local MongoDB 7 or a free MongoDB Atlas cluster. Redis is optional.

```bash
# API
cd server
cp .env.example .env          # set MONGO_URI and JWT_ACCESS_SECRET
npm install
npm run seed                  # 12 accounts (password Book@2026), 60 categories, 2,500 titles, 10,000 listings
npm run dev                   # http://localhost:5000/api/v1/health

# Client (second terminal)
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api to :5000)
```

Seeded accounts: `buyer1@bookstore.test` to `buyer4@...`, `seller1@...` to `seller4@...`, `admin1@...` to `admin4@...`, all with password `Book@2026`.

With `SMTP_URL` empty, e-mails (OTP, reset links) are not sent; they are captured by the mail stub and written to the debug log. Set `LOG_LEVEL=debug` to see them, or set `SMTP_URL` to a Mailtrap/Ethereal SMTP URL.

## Tests

```bash
cd server
npm test               # all tests
npm run test:unit      # no database needed
npm run test:coverage  # with the 70 per cent service-coverage gate (NFR-06)
npm run lint
```

<<<<<<< HEAD
API tests need MongoDB 7. By default they start an in-memory MongoDB through `mongodb-memory-server` (it downloads the MongoDB binary on first run; this is what CI does). To use an existing MongoDB instead, set `MONGO_URI_TEST`, for example `MONGO_URI_TEST=mongodb://127.0.0.1:27017 npm test`. Each run uses a throwaway database name.

Test names start with the Test Plan IDs (TC-A-01, TC-C-02, ...) so CI output maps straight onto the RTM.
=======
API tests need MongoDB 7. By default they start an in-memory MongoDB through `mongodb-memory-server` (it downloads the MongoDB binary on first run). To use an existing MongoDB instead, set `MONGO_URI_TEST`, for example `MONGO_URI_TEST=mongodb://127.0.0.1:27017 npm test`. Each run uses a throwaway database name.

Test names start with the Test Plan IDs (TC-A-01, TC-C-02, ...) so results map straight onto the RTM.
>>>>>>> 921c0f1 (Add online bookstore project)

## Repository layout

```
server/
  app.js            API Gateway Layer: middleware order (helmet, CORS, rate limit, sanitise, routes, errors)
  config/           env validation, MongoDB connection, pino logger with redaction
  middleware/       verifyJWT, authorizeRoles, validate, rateLimit, requestId, errorHandler
  routes/           auth, users, books, health  (cart/orders/seller/admin arrive in Sprints 2-3)
  controllers/      thin HTTP layer
  services/         business rules: auth, otp, token, user, catalogue, audit, notification
  models/           all 17 collections from SRS v1.1 Appendix B
  adapters/         mailer (SMTP or stub), cache (Redis or in-memory)
  validators/       Joi schemas (unknown fields rejected)
  scripts/seed.js   deterministic seed data
  tests/            unit/ and api/
client/
  src/api/client.js Axios with silent token refresh
  src/pages/        Catalogue, BookDetail, Login, Register, VerifyOtp, Forgot/Reset password
<<<<<<< HEAD
.github/workflows/ci.yml   lint, tests + coverage, npm audit, client build, gitleaks
=======
>>>>>>> 921c0f1 (Add online bookstore project)
```

## Sprint 1 status

<<<<<<< HEAD
Implemented in this starter code: FR-01 to FR-06 (registration, OTP, login with rotating refresh tokens, password reset, profile and addresses, RBAC with audit), FR-07 to FR-10 and FR-12 (catalogue, search, filters, sort, detail, related), the health endpoint, the error model, all 17 data models, seed data and CI. Next: cart and wishlist (FR-13, FR-14), listing creation (FR-19), staging deployment. See `docs/sprints/SPRINT_1_PLAN.md`.

## Branching

`main` is protected. Work on `feature/<issue-id>-short-name`, open a PR, get a review from another owner, merge when CI is green.
=======
Implemented in this starter code: FR-01 to FR-06 (registration, OTP, login with rotating refresh tokens, password reset, profile and addresses, RBAC with audit), FR-07 to FR-10 and FR-12 (catalogue, search, filters, sort, detail, related), the health endpoint, the error model, all 17 data models, seed data. Next: cart and wishlist (FR-13, FR-14), listing creation (FR-19), staging deployment. See `docs/sprints/SPRINT_1_PLAN.md`.

## Branching

Work on `feature/<jira-id>-short-name`, open a pull request, get a review from another owner, then merge into `main`.
>>>>>>> 921c0f1 (Add online bookstore project)
# Online Bookstore - Group 2 (UE24CS341A, Section C)

A multi-seller e-commerce platform for buying and selling books, built on the MERN stack.

| Member | SRN | Owns (SRS section 5) |
|---|---|---|
| Chenchu Sreekrishna Koushik | PES1UG24CS128 | Identity, accounts and access control (FR-01 to FR-06) |
| Deeptha S | PES1UG24CS144 | Catalogue, search and reviews (FR-07 to FR-12) |
| G H Pramod | PES1UG24CS162 | Cart, checkout, payment and orders (FR-13 to FR-18) |
| Hardhick M Gowda | PES1UG24CS179 | Seller operations, administration and reporting (FR-19 to FR-24) |

## Documents

| Document | File |
|---|---|
| Software Requirements Specification v1.1 | `SRS_Group2_Online_Bookstore_v1.1.docx` |
| Software Architecture and Design Specification v1.0 | `SAD_Group2_Online_Bookstore.docx` |
| Software Test Plan v1.0 (with 42 test cases) | `Test_Plan_Group2_Online_Bookstore.docx` |
| API contract (Sprint 1 endpoints) | `docs/api/openapi.yaml` |
| Sprint 1 plan and full backlog | `docs/sprints/SPRINT_1_PLAN.md`, `docs/sprints/product_backlog_jira.csv` |
| Manual test cases | `docs/testing/manual-cases.md` |

## Running locally

Requirements: Node.js 20+, and either a local MongoDB 7 or a free MongoDB Atlas cluster. Redis is optional.

### API

```bash
cd server
cp .env.example .env
# Set MONGO_URI and JWT_ACCESS_SECRET
npm install
npm run seed
npm run dev
```

The API runs at:

```text
http://localhost:5000/api/v1/health
```

The seed command creates 12 accounts, 60 categories, 2,500 titles, and 10,000 listings.

### Client

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The client runs at:

```text
http://localhost:5173
```

The client proxies `/api` requests to the backend on port 5000.

### Seeded accounts

Seeded accounts include:

- `buyer1@bookstore.test` to `buyer4@bookstore.test`
- `seller1@bookstore.test` to `seller4@bookstore.test`
- `admin1@bookstore.test` to `admin4@bookstore.test`

All seeded accounts use:

```text
Password: Book@2026
```

### Email configuration

With `SMTP_URL` empty, emails such as OTPs and password-reset links are not sent. They are captured by the mail stub and written to the debug log.

Set:

```text
LOG_LEVEL=debug
```

to see them, or configure `SMTP_URL` with a Mailtrap/Ethereal SMTP URL.

## Tests

From the `server` directory:

```bash
cd server
npm test
npm run test:unit
npm run test:coverage
npm run lint
```

API tests require MongoDB 7. By default, they start an in-memory MongoDB through `mongodb-memory-server`. The MongoDB binary is downloaded on the first run, which is also how CI executes the tests.

To use an existing MongoDB instance:

```bash
MONGO_URI_TEST=mongodb://127.0.0.1:27017 npm test
```

Each test run uses a throwaway database name.

Test names start with the Test Plan IDs such as `TC-A-01` and `TC-C-02`, allowing CI output to map directly onto the Requirements Traceability Matrix (RTM).

## Repository layout

```text
server/
  app.js            API Gateway Layer: middleware order
  config/           Environment validation, MongoDB connection, logger
  middleware/       Authentication, authorization, validation, rate limiting
  routes/            Auth, users, books, health
  controllers/      HTTP layer
  services/         Business logic
  models/           Database models
  adapters/         Mailer and cache adapters
  validators/       Joi validation schemas
  scripts/seed.js   Deterministic seed data
  tests/            Unit and API tests

client/
  src/api/client.js     Axios client with silent token refresh
  src/pages/            Catalogue, BookDetail, Login, Register,
                        VerifyOtp, Forgot/Reset password

docs/
  api/                  OpenAPI specification
  sprints/              Sprint plans and backlog
  testing/              Manual test cases

.github/workflows/ci.yml
```

## Sprint 1 status

Implemented in the starter code:

- FR-01 to FR-06
  - Registration
  - OTP verification
  - Login with rotating refresh tokens
  - Password reset
  - Profile and addresses
  - RBAC with audit logging
- FR-07 to FR-10 and FR-12
  - Catalogue
  - Search
  - Filters
  - Sorting
  - Book details
  - Related books
- Health endpoint
- Error model
- All 17 data models
- Seed data
- CI pipeline

Next planned features include:

- Cart and wishlist (FR-13, FR-14)
- Listing creation (FR