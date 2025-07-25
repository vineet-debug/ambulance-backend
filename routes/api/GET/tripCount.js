const express = require('express');
const router = express.Router();
const Booking = require('../../../models/Booking');

// GET /api/GET/tripCount/:driverId
router.get('/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const completed = await Booking.countDocuments({
      driver: driverId,
      status: 'completed',
    });

    const ongoing = await Booking.countDocuments({
      driver: driverId,
      status: { $in: ['accepted', 'in_progress'] }, // or other values based on your setup
    });

    res.json({ completed, ongoing });
  } catch (err) {
    console.error('Trip count error:', err);
    res.status(500).json({ message: 'Failed to fetch trip counts' });
  }
});

module.exports = router;
