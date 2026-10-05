const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true }, // OTP_EMAIL, PASSWORD_RESET, ORDER_CONFIRMED, LOW_STOCK_ALERT ...
  channel: { type: String, required: true, enum: ['EMAIL'], default: 'EMAIL' },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, required: true, enum: ['QUEUED', 'SENT', 'FAILED'], default: 'QUEUED' },
  attempts: { type: Number, default: 0 },
  sent_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

module.exports = model('Notification', notificationSchema);
