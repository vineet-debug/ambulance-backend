const express = require('express');
const router = express.Router();
const Booking = require('../../../models/Booking');

router.get('/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const limit = parseInt(req.query.limit) || 2;

  try {
    const bookings = await Booking.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('driver', 'fullName')
      .populate('ambulance', 'vehicleNumber');

    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
