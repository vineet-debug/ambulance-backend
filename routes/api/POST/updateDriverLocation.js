// routes/api/POST/updateDriverLocation.js
const express = require('express');
const router  = express.Router();
const Driver  = require('../../../models/Driver');
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  // 1️⃣ Pull fields from the request body
  const { driverId, latitude, longitude, available } = req.body;
  console.log('[api] updateDriverLocation called', { driverId, latitude, longitude, available });

  // 2️⃣ Basic validation
  if (!driverId || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // 3️⃣ Update the Driver document's location & availability
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        location: {
          type       : 'Point',
          coordinates: [ parseFloat(longitude), parseFloat(latitude) ],
        },
        // only include `available` if it's a boolean
        ...(typeof available === 'boolean' && { available }),
      },
      { new: true }
    ).populate('assignedAmbulance');

    if (!driver) {
      console.log('[api] driver not found', driverId);
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // 4️⃣ Find any “active” Booking for this driver
    //    (anything not yet completed or cancelled)
    const booking = await Booking.findOne({
      driver: driverId,
      status: { $nin: ['completed', 'cancelled'] },
    }).populate('patient');

    if (!booking) {
      console.log('[api] active booking not found for driver', driverId);
      // no booking → just return the updated driver
      return res.json({ success: true, driver });
    }

    // 5️⃣ Emit the live location to the booking room
    const payload = {
      bookingId     : booking._id.toString(),
      latitude,
      longitude,
      vehicleNumber : driver.assignedAmbulance?.vehicleNumber || '--',
    };
    console.log('[api] emit driver_location → room:', booking._id.toString(), payload);

    const io = req.app.get('io');
    io.to(booking._id.toString()).emit('driver_location', payload);

    // 6️⃣ Respond with success + updated driver
    return res.json({ success: true, driver });

  } catch (err) {
    console.error('[api] updateDriverLocation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
