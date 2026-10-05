const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const address = {
  line1: Joi.string().trim().max(120),
  line2: Joi.string().trim().max(120).allow(''),
  city: Joi.string().trim().max(60),
  state: Joi.string().trim().max(60),
  pincode: Joi.string().pattern(/^[1-9]\d{5}$/).message('pincode must be a valid six-digit PIN code'),
  isDefault: Joi.boolean(),
};

module.exports = {
  // Whitelist only: role, email, is_verified and is_blocked can never be changed here (SAD 3.9).
  updateMe: { body: Joi.object({ name: Joi.string().trim().min(2).max(60), phone: Joi.string().pattern(/^\d{10}$/) }).min(1) },
  addAddress: { body: Joi.object({ ...address, line1: address.line1.required(), city: address.city.required(), state: address.state.required(), pincode: address.pincode.required() }) },
  updateAddress: { params: Joi.object({ id: objectId.required() }), body: Joi.object(address).min(1) },
  addressId: { params: Joi.object({ id: objectId.required() }) },
};
