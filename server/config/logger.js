// Structured JSON logging with secret redaction (SR-01, SAD 4.4).
const pino = require('pino');
const config = require('./env');

const redact = {
  paths: [
    'req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
    '*.password', '*.newPassword', '*.otp', '*.token', '*.accessToken', '*.refreshToken',
  ],
  censor: '[REDACTED]',
};

const logger = pino({ level: config.isTest ? 'silent' : config.logLevel, redact });
module.exports = logger;
