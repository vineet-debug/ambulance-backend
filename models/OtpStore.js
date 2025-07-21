// models/OtpStore.js
const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema(
  {
    fullName  : { type: String, required: true, trim: true },
    email     : { type: String, required: true, lowercase: true, trim: true },
    phone     : { type: String, required: true, trim: true },
    gender    : { type: String, enum: ['Male', 'Female'], default: 'Male' },
    password  : { type: String, required: true }, // bcrypt-hashed

    otp       : { type: String, required: true },
    otpExpires: { type: Date,   required: true },
  },
  { timestamps: true }
);

/* TTL index → auto-deletes after otpExpires */
otpStoreSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpStore', otpStoreSchema);
