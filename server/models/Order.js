const { Schema, model } = require('mongoose');

const STATES = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

const orderSchema = new Schema(
  {
    order_no: { type: String, required: true, unique: true, match: /^OB-\d{8}-\d{5}$/ },
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address_id: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    coupon_id: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    item_total: { type: Number, required: true },
    shipping_fee: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    total_amount: { type: Number, required: true },
    order_status: { type: String, required: true, enum: STATES, default: 'PLACED' },
    status_history: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);
orderSchema.index({ buyer_id: 1, created_at: -1 });

module.exports = model('Order', orderSchema);
module.exports.STATES = STATES;
