// FR-03 / SR-04: verifies the 15-minute access token and loads the caller.
// The token version check means a password change invalidates outstanding access tokens,
// and the is_blocked check refuses a blocked account immediately (FR-06, BR-10).
const tokenService = require('../services/tokenService');
const User = require('../models/User');
const { E } = require('../utils/AppError');

module.exports = async function verifyJWT(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw E.unauthorized('TOKEN_MISSING', 'Sign in to continue.');

    const payload = tokenService.verifyAccessToken(token); // throws TOKEN_EXPIRED / TOKEN_INVALID
    const user = await User.findById(payload.sub).select('role is_blocked token_version name').lean();
    if (!user || user.token_version !== payload.tv) throw E.unauthorized('TOKEN_INVALID', 'Your session is no longer valid.');
    if (user.is_blocked) throw E.forbidden('ACCOUNT_BLOCKED', 'This account has been blocked.');

    req.user = { id: String(user._id), role: user.role, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
};
