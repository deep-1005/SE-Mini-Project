const Joi = require('joi');
const { CONDITIONS } = require('../models/Listing');

// FR-07 / FR-09. Prices are in paise. limit is capped at 50 (SAD 3.9 DoS control).
module.exports = {
  search: {
    query: Joi.object({
      q: Joi.string().trim().max(100).allow(''),
      category: Joi.string().trim().max(60),
      minPrice: Joi.number().integer().min(0),
      maxPrice: Joi.number().integer().min(0).when('minPrice', { is: Joi.exist(), then: Joi.number().min(Joi.ref('minPrice')) }),
      condition: Joi.string().valid(...CONDITIONS),
      language: Joi.string().trim().max(30),
      minRating: Joi.number().min(1).max(5),
      sort: Joi.string().valid('price_asc', 'price_desc', 'rating', 'newest'),
      page: Joi.number().integer().min(1).max(1000).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  },
  bookId: { params: Joi.object({ id: Joi.string().hex().length(24).required() }) },
  isbn: { params: Joi.object({ isbn13: Joi.string().max(20).required() }) },
};
