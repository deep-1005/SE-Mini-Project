const { Schema, model } = require('mongoose');

const paymentSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  gateway_order_id: { type: String, required: true },
  gateway_txn_ref: { type: String, unique: true, sparse: true }, // idempotency key (SR-08)
  amount: { type: Number, required: true },
  attempt_no: { type: Number, required: true, min: 1, max: 3 },
  method: { type: String },
  payment_status: { type: String, required: true, enum: ['CREATED', 'SUCCESS', 'FAILED', 'REFUND_PENDING', 'REFUNDED'], default: 'CREATED' },
  created_at: { type: Date, default: Date.now },
});

module.exports = model('Payment', paymentSchema);
