const { Schema, model } = require('mongoose');

const wishlistSchema = new Schema({
  buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  added_at: { type: Date, default: Date.now },
});
wishlistSchema.index({ buyer_id: 1, listing_id: 1 }, { unique: true });

module.exports = model('Wishlist', wishlistSchema);
