const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema({
  cart_id: { type: Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  price_at_add: { type: Number, required: true }, // paise
  added_at: { type: Date, default: Date.now },
});
cartItemSchema.index({ cart_id: 1, listing_id: 1 }, { unique: true });

module.exports = model('CartItem', cartItemSchema);
