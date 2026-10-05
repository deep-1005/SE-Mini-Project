// Every expected failure is an AppError with a stable code (SAD 4.4). The error handler turns it
// into { error: { code, message, details, requestId } }.
class AppError extends Error {
  constructor(code, status, message, details) {
    super(message || code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const E = {
  validation: (details) => new AppError('VALIDATION_FAILED', 400, 'One or more fields are invalid.', details),
  badRequest: (code, msg, details) => new AppError(code, 400, msg, details),
  unauthorized: (code = 'UNAUTHORIZED', msg = 'Authentication is required.') => new AppError(code, 401, msg),
  forbidden: (code = 'FORBIDDEN_ROLE', msg = 'You do not have permission to perform this action.') => new AppError(code, 403, msg),
  notFound: (code = 'NOT_FOUND', msg = 'The requested resource was not found.') => new AppError(code, 404, msg),
  conflict: (code, msg, details) => new AppError(code, 409, msg, details),
  gone: (code, msg) => new AppError(code, 410, msg),
  locked: (code, msg) => new AppError(code, 423, msg),
  unprocessable: (code, msg, details) => new AppError(code, 422, msg, details),
  tooMany: (code = 'RATE_LIMITED', msg = 'Too many requests. Please try again later.') => new AppError(code, 429, msg),
};

module.exports = { AppError, E };
