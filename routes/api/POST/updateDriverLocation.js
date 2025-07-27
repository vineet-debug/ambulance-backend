const express = require('express');
const router = express.Router();
const Driver = require('../../../models/Driver');
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, latitude, longitude, available } = req.body;

  console.log('[api] updateDriverLocation called', {
    driverId,
    latitude,
    longitude,
    available,
  });

  if (!driverId || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        ...(typeof available === 'boolean' && { available }),
      },
      { new: true }
    ).populate('assignedAmbulance');

    if (!driver) {
      console.log('[api] driver not found', driverId);
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const booking = await Booking.findOne({
      driver: driverId,
      status: { $nin: ['completed', 'cancelled'] },
    }).populate('patient');

    if (!booking) {
      console.log('[api] active booking not found for driver', driverId);
      return res.json({ success: true, driver });
    }

    // ✅ Validate coordinates before emitting
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (
      isNaN(lat) || isNaN(lng) ||
      lat == null || lng == null
    ) {
      console.warn('[api] Skipping socket emit: Invalid coordinates', { lat, lng });
    } else {
      const payload = {
        bookingId: booking._id.toString(),
        latitude: lat,
        longitude: lng,
        vehicleNumber: driver.assignedAmbulance?.vehicleNumber || '--',
      };

      console.log('[api] emit driver_location → room:', booking._id.toString(), payload);

      const io = req.app.get('io');
      io.to(booking._id.toString()).emit('driver_location', payload);
    }

    return res.json({ success: true, driver });
  } catch (err) {
    console.error('[api] updateDriverLocation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
