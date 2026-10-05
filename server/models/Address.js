const { Schema, model } = require('mongoose');

const addressSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    line1: { type: String, required: true, maxlength: 120 },
    line2: { type: String, maxlength: 120 },
    city: { type: String, required: true, maxlength: 60 },
    state: { type: String, required: true, maxlength: 60 },
    pincode: { type: String, required: true, match: /^[1-9]\d{5}$/ }, // six-digit Indian PIN (SRS 6.6)
    is_default: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

addressSchema.methods.toPublic = function toPublic() {
  const { _id, line1, line2, city, state, pincode, is_default: isDefault } = this;
  return { id: String(_id), line1, line2, city, state, pincode, isDefault };
};

module.exports = model('Address', addressSchema);
