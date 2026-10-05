// SR-07: every body, query and params object is validated; unknown fields are rejected.
const { E } = require('../utils/AppError');

module.exports = function validate(schemas) {
  return function validator(req, res, next) {
    const details = [];
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const { value, error } = schemas[part].validate(req[part], { abortEarly: false, stripUnknown: false, convert: true });
      if (error) {
        error.details.forEach((d) => details.push({ field: d.path.join('.') || part, issue: d.message.replace(/"/g, '') }));
      } else if (part === 'query') {
        // Express 4 allows reassigning req.query; keep the coerced values (numbers, defaults).
        req.validatedQuery = value;
      } else {
        req[part] = value;
      }
    }
    if (details.length) return next(E.validation(details));
    return next();
  };
};
