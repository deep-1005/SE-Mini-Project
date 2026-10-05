const { Schema, model } = require('mongoose');

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount_type: { type: String, required: true, enum: ['FLAT', 'PERCENT'] },
  value: { type: Number, required: true, min: 1 }, // paise for FLAT, percent for PERCENT
  min_order: { type: Number, default: 0 }, // paise
  valid_from: { type: Date, required: true },
  valid_to: { type: Date, required: true },
  max_uses: { type: Number, required: true },
  used_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
});

module.exports = model('Coupon', couponSchema);
