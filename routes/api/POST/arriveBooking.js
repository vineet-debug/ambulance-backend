// backend/routes/api/POST/arriveBooking.js
const router  = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { driverId, bookingId } = req.body;
  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      driver: driverId,
      status: 'assigned',
    });
    if (!booking) {
      return res.status(400).json({ success: false, message: 'Cannot mark arrived.' });
    }
    booking.status = 'arrived';
    await booking.save();

    // emit to patient room
    const io = req.app.get('io');
    io.to(booking._id.toString()).emit('driver_arrived', { bookingId });

    return res.json({ success: true, booking });
  } catch (err) {
    console.error('arriveBooking error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
