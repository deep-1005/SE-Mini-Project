const { Schema, model } = require('mongoose');

// Append-only (SR-09 / NFR-08). Only auditService writes here and it exposes no update or delete.
const auditSchema = new Schema({
  actor_id: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target_type: { type: String, required: true },
  target_id: { type: String, required: true },
  reason: { type: String, maxlength: 500 },
  request_id: { type: String },
  created_at: { type: Date, default: Date.now, immutable: true },
});
auditSchema.index({ created_at: -1 });

module.exports = model('AuditLog', auditSchema);
