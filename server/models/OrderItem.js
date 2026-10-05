const { Schema, model } = require('mongoose');

// Unit price and title are copied at purchase so later listing changes cannot alter an order.
const orderItemSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  seller_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true },
  item_status: { type: String, required: true, default: 'PLACED' },
  delivered_at: { type: Date },
});

module.exports = model('OrderItem', orderItemSchema);
