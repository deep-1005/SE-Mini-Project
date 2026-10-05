const config = require('../config/env');
const authService = require('../services/authService');

const COOKIE = 'rt';
const cookieOptions = (expires) => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict',
  path: '/api/v1/auth',
  expires,
});

function sendTokens(res, status, { refreshToken, refreshExpiresAt, ...body }) {
  res.cookie(COOKIE, refreshToken, cookieOptions(refreshExpiresAt));
  res.status(status).json(body);
}

module.exports = {
  register: async (req, res) => res.status(201).json(await authService.register(req.body)),
  verifyOtp: async (req, res) => res.json(await authService.verifyOtp(req.body)),
  resendOtp: async (req, res) => res.status(202).json(await authService.resendOtp(req.body)),
  login: async (req, res) => sendTokens(res, 200, await authService.login(req.body, req.get('User-Agent'))),
  refresh: async (req, res) => sendTokens(res, 200, await authService.refresh(req.cookies[COOKIE], req.get('User-Agent'))),
  logout: async (req, res) => {
    await authService.logout(req.cookies[COOKIE]);
    res.clearCookie(COOKIE, cookieOptions(undefined));
    res.status(204).end();
  },
  COOKIE,
};
