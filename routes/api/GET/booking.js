// routes/api/GET/booking.js
const router = require('express').Router();
const Booking = require('../../../models/Booking');

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient')
      .populate('driver')
      .populate('ambulance');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    console.error('GET /booking/:id →', err.message);
    res.status(400).json({ success: false, message: 'Invalid booking ID' });
  }
});

module.exports = router;
