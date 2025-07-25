const router  = require('express').Router();
const Booking = require('../../../models/Booking');

router.post('/', async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success:false });

  booking.status = 'arrived';
  booking.otp    = Math.floor(100000 + Math.random()*900000).toString();
  await booking.save();

  const io = req.app.get('io');
  io.to(booking.patient.toString()).emit('driver_arrived', booking);
  io.to(booking.driver .toString()).emit('booking_update', booking);

  res.json({ success:true, booking });
});
module.exports = router;
