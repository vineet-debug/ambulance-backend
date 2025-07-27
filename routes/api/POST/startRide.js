const router = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, bookingId, otp } = req.body;

  console.log('\n[startRide] Incoming →', { driverId, bookingId, otp });

  if (!driverId || !bookingId || !otp) {
    return res.status(400).json({ success: false, message: 'Missing driverId, bookingId, or otp' });
  }

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log('[startRide] Booking not found');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('[startRide] Booking status   :', booking.status);
    console.log('[startRide] Booking.otp      :', booking.otp);
    console.log('[startRide] Booking.driver   :', booking.driver?.toString());
    console.log('[startRide] Incoming.driverId:', driverId);

    if (booking.driver?.toString() !== driverId) {
      return res.status(400).json({ success: false, message: 'Driver mismatch' });
    }

    if (booking.status !== 'arrived') {
      return res.status(400).json({ success: false, message: 'You must mark as arrived before starting the ride.' });
    }

    // ✅ Fix comparison — trim and convert both to string
    if (String(booking.otp).trim() !== String(otp).trim()) {
      console.log('[startRide] OTP mismatch →', { expected: booking.otp, received: otp });
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    booking.status = 'ride_started';
    await booking.save();

    const io = req.app.get('io');
    io.to(booking._id.toString()).emit('ride_started', { bookingId });

    return res.json({ success: true, booking });
  } catch (err) {
    console.error('startRide error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
