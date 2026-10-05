const { Schema, model } = require('mongoose');

const cartSchema = new Schema(
  { buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true } },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

module.exports = model('Cart', cartSchema);
