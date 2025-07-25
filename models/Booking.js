const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type       : { type:String, enum:['Point'], default:'Point' },
  coordinates: { type:[Number], required:true }, // [lng, lat]
});

const bookingSchema = new mongoose.Schema({
  patient  : { type:mongoose.Schema.Types.ObjectId, ref:'Patient',  required:true },
  driver   : { type:mongoose.Schema.Types.ObjectId, ref:'Driver',   default:null },
  ambulance: { type:mongoose.Schema.Types.ObjectId, ref:'Ambulance',default:null },

  pickupAddress : { type:String, required:true },
  pickupLocation: { type:pointSchema, index:'2dsphere', required:true },
  dropAddress   : { type:String, required:true },
  dropLocation  : { type:pointSchema, index:'2dsphere', required:true },

  otp   : { type:String },   // generated when driver accepts
  status: {
    type   : String,
    enum   : ['new','assigned','on_the_way','arrived','ride_started','completed','cancelled'],
    default: 'new',
  },
}, { timestamps:true });

module.exports = mongoose.model('Booking', bookingSchema);
