// routes/api/GET/driverInfo.js

const express = require('express');
const router = express.Router();
const Driver = require('../../../models/Driver');

router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedAmbulance'); // ✅ pulls full ambulance object

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver); // includes assignedAmbulance.number, etc.
  } catch (err) {
    console.error('Driver fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
