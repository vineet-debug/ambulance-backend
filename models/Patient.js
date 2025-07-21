const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    /* ---------- Required data ---------- */
    fullName: { type: String, required: true, trim: true },

    email: {
      type    : String,
      required: true,
      unique  : true,
      lowercase: true,
      trim    : true,
    },

    phone   : { type: String, required: true, trim: true },
    gender  : { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    password: { type: String, required: true }, // bcrypt-hashed

    /* ---------- OTP workflow ---------- */
    otp        : { type: String },              // six-digit code
    otpExpires : { type: Date },
    verified   : { type: Boolean, default: false },

    /* ---------- Admin flags ---------- */
    active: { type: Boolean, default: true },

    /* ---------- New patient details ---------- */
    profilePic : { type: String, default: '' },       // filename (uploads/...)
    age        : { type: Number },
    bloodGroup : { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: null },
    address    : { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
