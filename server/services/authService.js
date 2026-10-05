// Auth & User Service business logic (FR-01 to FR-04, FR-06; SR-01, SR-04, SR-10).
const bcrypt = require('bcrypt');
const config = require('../config/env');
const User = require('../models/User');
const tokenService = require('./tokenService');
const otpService = require('./otpService');
const notificationService = require('./notificationService');
const { sha256, randomToken } = require('../utils/crypto');
const { E } = require('../utils/AppError');

const RESET_TTL_MS = 30 * 60 * 1000;
// Compared against when the e-mail is unknown so that response time does not reveal it.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 10);

async function register({ name, email, phone, password, role }) {
  const existing = await User.exists({ email: email.toLowerCase() });
  if (existing) throw E.conflict('EMAIL_TAKEN', 'An account with this e-mail already exists.', [{ field: 'email', issue: 'already registered' }]);
  const password_hash = await bcrypt.hash(password, config.bcryptCost);
  const user = await User.create({ name, email, phone, role, password_hash });
  const withSecurity = await User.findById(user._id).select('+security');
  await otpService.issue(withSecurity);
  return { userId: String(user._id), status: 'PENDING_VERIFICATION' };
}

async function verifyOtp({ email, otp }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+security');
  if (!user) throw E.badRequest('OTP_INVALID', 'The code is incorrect.');
  if (user.is_verified) return { verified: true };
  await otpService.verify(user, otp);
  return { verified: true };
}

async function resendOtp({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+security');
  // Same response whether or not the address exists or is already verified (no enumeration).
  if (user && !user.is_verified) await otpService.issue(user, { isResend: true });
  return { sent: true };
}

async function issueTokens(user, userAgent) {
  const accessToken = tokenService.signAccessToken(user);
  const session = await tokenService.createSession(user._id, userAgent);
  return { accessToken, expiresIn: config.jwt.accessTtlSec, refreshToken: session.token, refreshExpiresAt: session.expiresAt };
}

async function login({ email, password }, userAgent) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw E.unauthorized('INVALID_CREDENTIALS', 'E-mail or password is incorrect.');
  if (user.is_blocked) throw E.forbidden('ACCOUNT_BLOCKED', 'This account has been blocked.');
  if (!user.is_verified) throw E.forbidden('ACCOUNT_NOT_VERIFIED', 'Verify your e-mail address before signing in.');
  user.last_login = new Date();
  await user.save();
  const tokens = await issueTokens(user, userAgent);
  return { ...tokens, user: user.toPublic() };
}

async function refresh(refreshToken, userAgent) {
  const rotated = await tokenService.rotate(refreshToken, userAgent);
  const user = await User.findById(rotated.userId);
  if (!user) throw E.unauthorized('REFRESH_INVALID', 'Please sign in again.');
  if (user.is_blocked) {
    await tokenService.revokeAll(user._id);
    throw E.forbidden('ACCOUNT_BLOCKED', 'This account has been blocked.');
  }
  return {
    accessToken: tokenService.signAccessToken(user),
    expiresIn: config.jwt.accessTtlSec,
    refreshToken: rotated.token,
    refreshExpiresAt: rotated.expiresAt,
  };
}

async function logout(refreshToken) {
  await tokenService.revoke(refreshToken);
}

async function forgotPassword({ email }, linkBase) {
  const user = await User.findOne({ email: email.toLowerCase(), is_verified: true }).select('+security');
  if (user) {
    const token = randomToken(32);
    user.security.reset_hash = sha256(token);
    user.security.reset_expires_at = new Date(Date.now() + RESET_TTL_MS);
    user.markModified('security');
    await user.save();
    await notificationService.notify(user, 'PASSWORD_RESET', { link: `${linkBase}/reset-password?token=${token}` });
  }
  // Identical response for registered and unregistered addresses (SR-10).
  return { message: 'If that address is registered, a reset link has been sent.' };
}

async function resetPassword({ token, newPassword }) {
  const user = await User.findOne({
    'security.reset_hash': sha256(token),
    'security.reset_expires_at': { $gt: new Date() },
  }).select('+security +password_hash');
  if (!user) throw E.badRequest('RESET_TOKEN_INVALID', 'This reset link is invalid or has expired.');
  user.password_hash = await bcrypt.hash(newPassword, config.bcryptCost);
  user.security.reset_hash = undefined; // single use
  user.security.reset_expires_at = undefined;
  user.token_version += 1; // invalidates outstanding access tokens
  user.markModified('security');
  await user.save();
  await tokenService.revokeAll(user._id); // FR-04: all refresh tokens invalidated
  await notificationService.notify(user, 'PASSWORD_CHANGED', {});
  return { reset: true };
}

module.exports = { register, verifyOtp, resendOtp, login, refresh, logout, forgotPassword, resetPassword, RESET_TTL_MS };
