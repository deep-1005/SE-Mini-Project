// Single exit point for errors (SAD 4.4). Unknown errors never leak details to the client.
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { AppError } = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let error = err;

  if (err instanceof mongoose.Error.CastError) {
    error = new AppError('NOT_FOUND', 404, 'The requested resource was not found.');
  } else if (err && err.type === 'entity.parse.failed') {
    error = new AppError('VALIDATION_FAILED', 400, 'Request body is not valid JSON.');
  } else if (err && err.type === 'entity.too.large') {
    error = new AppError('PAYLOAD_TOO_LARGE', 413, 'Request body is too large.');
  } else if (err && err.code === 11000) {
    error = new AppError('DUPLICATE', 409, 'A record with this value already exists.');
  }

  if (!(error instanceof AppError)) {
    logger.error({ err, requestId: req.id }, 'Unhandled error');
    error = new AppError('INTERNAL_ERROR', 500, 'Something went wrong. Please try again.');
  } else if (error.status >= 500) {
    logger.error({ err, requestId: req.id }, error.message);
  }

  const body = { error: { code: error.code, message: error.message, requestId: req.id } };
  if (error.details) body.error.details = error.details;
  res.status(error.status).json(body);
};
