// routes/api/POST/updateDriverLocation.js
const express = require('express');
const router = express.Router();
const Driver = require('../../../models/Driver');

router.post('/', async (req, res) => {
  const { driverId, latitude, longitude, available } = req.body;

  try {
    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const updated = await Driver.findByIdAndUpdate(
      driverId,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
        },
        ...(typeof available === 'boolean' && { available }),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ success: true, driver: updated });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
