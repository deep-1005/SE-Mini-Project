const crypto = require('crypto');

// Correlates logs, errors and audit entries for one request (SAD 4.4).
module.exports = function requestId(req, res, next) {
  const incoming = req.get('X-Request-Id');
  req.id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
};
