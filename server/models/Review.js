const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  book_id: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order_item_id: { type: Schema.Types.ObjectId, ref: 'OrderItem', required: true, unique: true }, // one per order line (BR-01)
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  is_blocked: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = model('Review', reviewSchema);
