// FR-02: six-digit OTP, valid 10 minutes, 3 wrong attempts lock it, at most 3 resends per hour.
const bcrypt = require('bcrypt');
const { sixDigitCode } = require('../utils/crypto');
const notificationService = require('./notificationService');
const { E } = require('../utils/AppError');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const MAX_RESENDS_PER_HOUR = 3;

// `user` must be loaded with +security.
async function issue(user, { isResend = false } = {}) {
  const now = Date.now();
  if (isResend) {
    const recent = (user.security.otp_sent_at || []).filter((t) => now - new Date(t).getTime() < 3600 * 1000);
    if (recent.length >= MAX_RESENDS_PER_HOUR) throw E.tooMany('OTP_RATE_LIMITED', 'You can request a new code at most three times an hour.');
    user.security.otp_sent_at = [...recent, new Date(now)];
  }
  const otp = sixDigitCode();
  user.security.otp_hash = await bcrypt.hash(otp, 8);
  user.security.otp_expires_at = new Date(now + OTP_TTL_MS);
  user.security.otp_attempts = 0;
  user.markModified('security');
  await user.save();
  await notificationService.notify(user, 'OTP_EMAIL', { otp });
  return { expiresAt: user.security.otp_expires_at };
}

async function verify(user, otp) {
  const s = user.security || {};
  if (!s.otp_hash) throw E.locked('OTP_LOCKED', 'This code is no longer valid. Request a new one.');
  if (new Date(s.otp_expires_at).getTime() < Date.now()) throw E.gone('OTP_EXPIRED', 'This code has expired. Request a new one.');
  const ok = await bcrypt.compare(String(otp), s.otp_hash);
  if (!ok) {
    user.security.otp_attempts = (s.otp_attempts || 0) + 1;
    const locked = user.security.otp_attempts >= MAX_ATTEMPTS;
    if (locked) user.security.otp_hash = undefined;
    user.markModified('security');
    await user.save();
    if (locked) throw E.locked('OTP_LOCKED', 'Too many wrong attempts. Request a new code.');
    throw E.badRequest('OTP_INVALID', 'The code is incorrect.');
  }
  user.security.otp_hash = undefined;
  user.security.otp_expires_at = undefined;
  user.security.otp_attempts = 0;
  user.is_verified = true;
  user.markModified('security');
  await user.save();
}

module.exports = { issue, verify, OTP_TTL_MS, MAX_ATTEMPTS, MAX_RESENDS_PER_HOUR };
