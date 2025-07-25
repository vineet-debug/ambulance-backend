// backend/routes/api/POST/startRide.js
const router  = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, bookingId, otp } = req.body;
  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      driver: driverId,
      status: 'arrived',
      otp,
    });
    if (!booking) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or ride not arrived yet.' });
    }
    booking.status = 'ride_started';
    await booking.save();

    const io = req.app.get('io');
    io.to(booking._id.toString()).emit('ride_started', { bookingId });

    return res.json({ success: true, booking });
  } catch (err) {
    console.error('startRide error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
