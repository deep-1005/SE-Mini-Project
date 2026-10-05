// Append-only audit trail (SR-09 / NFR-08). Deliberately exports no update or delete.
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

async function record({ actorId, action, targetType, targetId, reason, requestId }) {
  try {
    await AuditLog.create({ actor_id: actorId, action, target_type: targetType, target_id: String(targetId), reason, request_id: requestId });
  } catch (err) {
    logger.error({ err, action }, 'audit write failed');
    throw err;
  }
}

async function list({ page = 1, limit = 50, action } = {}) {
  const filter = action ? { action } : {};
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

module.exports = Object.freeze({ record, list });
