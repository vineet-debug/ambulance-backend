const express = require('express');
const router = express.Router();
const Booking = require('../../../models/Booking');

// GET /api/GET/bookingsByDriver/:driverId
router.get('/:driverId', async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.params.driverId })
      .populate('patient') // if you want patient name
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Bookings fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
