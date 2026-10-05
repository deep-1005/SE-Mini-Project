// SR-10: throttling. Counters live in Redis when configured (ADR-03), in memory otherwise.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../config/env');
const { E } = require('../utils/AppError');

const handler = (req, res, next) => next(E.tooMany());

// Global ceiling per IP.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  handler,
});

// Failed logins: 5 per 15 minutes per e-mail + IP (successful logins are not counted).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String((req.body && req.body.email) || '').toLowerCase()}`,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

module.exports = { globalLimiter, loginLimiter };
