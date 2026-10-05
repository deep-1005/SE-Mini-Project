// FR-06 / SR-05: server-side RBAC. A refused call is answered with 403 and written to the audit log.
const auditService = require('../services/auditService');
const { E } = require('../utils/AppError');

module.exports = function authorizeRoles(...allowed) {
  return async function authorize(req, res, next) {
    if (!req.user) return next(E.unauthorized('TOKEN_MISSING'));
    if (allowed.includes(req.user.role)) return next();
    try {
      await auditService.record({
        actorId: req.user.id,
        action: 'ACCESS_DENIED',
        targetType: 'ROUTE',
        targetId: `${req.method} ${req.baseUrl}${req.route ? req.route.path : ''}`,
        reason: `role ${req.user.role} not in [${allowed.join(', ')}]`,
        requestId: req.id,
      });
    } catch (e) {
      // Audit failure must not turn a 403 into a 500; it is logged by auditService.
    }
    return next(E.forbidden());
  };
};
