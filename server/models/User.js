const { Schema, model } = require('mongoose');

// USER (SRS Appendix B.2). The security sub-document holds OTP, reset and token-version state;
// it is never returned by any endpoint (select: false).
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 120, unique: true },
    password_hash: { type: String, required: true, select: false },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    role: { type: String, required: true, enum: ['BUYER', 'SELLER', 'ADMIN'] },
    is_verified: { type: Boolean, required: true, default: false },
    is_blocked: { type: Boolean, required: true, default: false },
    last_login: { type: Date },
    token_version: { type: Number, required: true, default: 0 },
    security: {
      type: new Schema(
        {
          otp_hash: String,
          otp_expires_at: Date,
          otp_attempts: { type: Number, default: 0 },
          otp_sent_at: { type: [Date], default: [] },
          reset_hash: String,
          reset_expires_at: Date,
        },
        { _id: false },
      ),
      select: false,
      default: () => ({}),
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

userSchema.methods.toPublic = function toPublic() {
  return { id: String(this._id), name: this.name, email: this.email, phone: this.phone, role: this.role, isVerified: this.is_verified };
};

module.exports = model('User', userSchema);
