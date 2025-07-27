const router = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, bookingId } = req.body;

  console.log('[arriveBooking] Request:', { bookingId, driverId });

  if (!driverId || !bookingId) {
    return res.status(400).json({ success: false, message: 'Missing driverId or bookingId' });
  }

  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      driver: driverId,
      status: { $in: ['assigned', 'on_the_way', 'arrived'] }, // ✅ allow repeat
    });

    if (!booking) {
      return res.status(400).json({ success: false, message: 'Cannot mark arrived.' });
    }

    const io = req.app.get('io');

    // Only update and emit if not already marked
    if (booking.status !== 'arrived') {
      booking.status = 'arrived';
      await booking.save();

      io.to(booking._id.toString()).emit('driver_arrived', { bookingId });
    }

    return res.json({ success: true, booking });
  } catch (err) {
    console.error('arriveBooking error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
