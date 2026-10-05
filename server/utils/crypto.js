const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const sixDigitCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

module.exports = { sha256, randomToken, sixDigitCode, safeEqual };
