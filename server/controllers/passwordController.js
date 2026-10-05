// FR-04 password recovery.
const config = require('../config/env');
const authService = require('../services/authService');

module.exports = {
  forgot: async (req, res) => res.status(202).json(await authService.forgotPassword(req.body, config.clientOrigin)),
  reset: async (req, res) => res.json(await authService.resetPassword(req.body)),
};
