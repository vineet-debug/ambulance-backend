const router = require('express').Router();
const Booking = require('../../../models/Booking');
const Driver = require('../../../models/Driver');

router.post('/', async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'bookingId required' });
  }

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ✅ Update status
    booking.status = 'completed';
    await booking.save();

    // ✅ Set driver available again
    const driverId = booking.driver?.toString();
    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, { available: true });
    }

    // ✅ Emit socket to patient
    const io = req.app.get('io');
    io.to(booking._id.toString()).emit('ride_completed', { bookingId });

    res.json({ success: true });
  } catch (err) {
    console.error('[completeRide] error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
