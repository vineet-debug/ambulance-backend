// routes/api/POST/updateDriverStatus.js
const express = require('express');
const router = express.Router();
const Driver = require('../../../models/Driver');

router.post('/', async (req, res) => {
  const { driverId, latitude, longitude, available } = req.body;

  try {
    const updateData = {};
    if (latitude && longitude) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
    }
    if (typeof available === 'boolean') {
      updateData.available = available;
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ success: true, driver: updatedDriver });
  } catch (err) {
    console.error('Update driver status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
