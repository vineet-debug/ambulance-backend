const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  licenseNumber: { type: String, required: true },
  profilePic: { type: String, default: '' },
  licenseCopy: { type: String, default: '' },
  address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  phone: String,
  email: String,
  password: String,
  pushToken: { type: String },
  verified: { type: Boolean, default: false },
  assignedAmbulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance', default: null },
  available: { type: Boolean, default: true },
 location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [lng, lat]
    default: [0, 0]
  }
},
}, { timestamps: true });

driverSchema.index({ location: '2dsphere' }); // 🗺️ Enable Geo queries

module.exports = mongoose.model('Driver', driverSchema);
