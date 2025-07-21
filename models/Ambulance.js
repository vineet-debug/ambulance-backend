const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  vehicleModel: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ambulance', ambulanceSchema);
