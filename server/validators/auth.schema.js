const Joi = require('joi');

// FR-01: password of at least eight characters with upper, lower, digit and symbol.
const password = Joi.string()
  .min(8)
  .max(72) // bcrypt input limit
  .pattern(/[A-Z]/, 'upper-case letter')
  .pattern(/[a-z]/, 'lower-case letter')
  .pattern(/\d/, 'digit')
  .pattern(/[^A-Za-z0-9]/, 'symbol')
  .required();
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(120).required();

module.exports = {
  register: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(60).required(),
      email,
      phone: Joi.string().pattern(/^\d{10}$/).message('phone must be exactly ten digits').required(),
      password,
      role: Joi.string().valid('BUYER', 'SELLER').required(), // ADMIN can never self-register
    }),
  },
  verifyOtp: { body: Joi.object({ email, otp: Joi.string().pattern(/^\d{6}$/).required() }) },
  emailOnly: { body: Joi.object({ email }) },
  login: { body: Joi.object({ email, password: Joi.string().max(72).required() }) },
  resetPassword: { body: Joi.object({ token: Joi.string().max(200).required(), newPassword: password }) },
};
