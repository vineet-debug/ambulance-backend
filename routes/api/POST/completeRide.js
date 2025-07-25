// backend/routes/api/POST/completeRide.js
const router  = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, bookingId } = req.body;
  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      driver: driverId,
      status: 'ride_started',
    });
    if (!booking) {
      return res.status(400).json({ success: false, message: 'Ride not in progress.' });
    }
    booking.status = 'completed';
    await booking.save();

    const io = req.app.get('io');
    // notify patient
    io.to(booking._id.toString()).emit('ride_completed', { bookingId });
    // optionally notify driver as well
    io.to(driverId).emit('ride_completed', { bookingId });

    return res.json({ success: true, booking });
  } catch (err) {
    console.error('completeRide error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
