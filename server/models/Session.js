const { Schema, model } = require('mongoose');

// Refresh-token session (ADR-02, SR-04). Only the SHA-256 hash of the token is stored.
const sessionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token_hash: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  revoked_at: { type: Date },
  replaced_by: { type: String }, // hash of the token that replaced this one on rotation
  user_agent: { type: String, maxlength: 200 },
  created_at: { type: Date, default: Date.now },
});
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL clean-up

module.exports = model('Session', sessionSchema);
