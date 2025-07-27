const express = require('express');
const router = express.Router();
const Booking = require('../../../models/Booking');

router.get('/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    const bookings = await Booking.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate('driver', 'fullName')
      .populate('ambulance', 'vehicleNumber');

    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
