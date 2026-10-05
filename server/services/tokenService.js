// Access and refresh tokens (ADR-02, SR-04).
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Session = require('../models/Session');
const { sha256, randomToken } = require('../utils/crypto');
const { E } = require('../utils/AppError');

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, tv: user.token_version }, config.jwt.accessSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessTtlSec,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw E.unauthorized('TOKEN_EXPIRED', 'Your session has expired.');
    throw E.unauthorized('TOKEN_INVALID', 'Your session is not valid.');
  }
}

async function createSession(userId, userAgent) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + config.jwt.refreshTtlDays * 24 * 3600 * 1000);
  await Session.create({ user_id: userId, token_hash: sha256(token), expires_at: expiresAt, user_agent: (userAgent || '').slice(0, 200) });
  return { token, expiresAt };
}

// Rotation with reuse detection: a token can be exchanged exactly once. Presenting a token that
// was already rotated revokes every session of that user.
async function rotate(token, userAgent) {
  const hash = sha256(token || '');
  const now = new Date();
  const current = await Session.findOneAndUpdate(
    { token_hash: hash, revoked_at: null, expires_at: { $gt: now } },
    { $set: { revoked_at: now } },
    { new: true },
  );
  if (!current) {
    const old = await Session.findOne({ token_hash: hash });
    if (old && old.replaced_by) {
      await revokeAll(old.user_id);
      throw E.unauthorized('REFRESH_REUSED', 'Session reuse detected. Please sign in again.');
    }
    throw E.unauthorized('REFRESH_INVALID', 'Please sign in again.');
  }
  const next = await createSession(current.user_id, userAgent);
  current.replaced_by = sha256(next.token);
  await current.save();
  return { userId: current.user_id, ...next };
}

async function revoke(token) {
  if (!token) return;
  await Session.updateOne({ token_hash: sha256(token), revoked_at: null }, { $set: { revoked_at: new Date() } });
}

async function revokeAll(userId) {
  await Session.updateMany({ user_id: userId, revoked_at: null }, { $set: { revoked_at: new Date() } });
}

module.exports = { signAccessToken, verifyAccessToken, createSession, rotate, revoke, revokeAll };
