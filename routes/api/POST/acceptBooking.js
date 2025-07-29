// backend/routes/api/POST/acceptBooking.js
const router = require('express').Router();
const Booking = require('../../../models/Booking');
const Driver = require('../../../models/Driver');
const sendPush = require('../../../utils/sendPush'); // ✅ make sure this exists

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/', async (req, res) => {
  try {
    const { bookingId, driverId } = req.body;

    const driver = await Driver.findById(driverId).populate('assignedAmbulance');
    const booking = await Booking.findById(bookingId);
    if (!driver || !booking)
      return res.status(404).json({ success: false, message: 'Not found' });

    if (booking.driver && String(booking.driver) !== driverId)
      return res.json({ success: false, code: 'ALREADY_ASSIGNED', message: 'Another driver took it.' });

    if (String(booking.driver) === driverId && booking.status === 'on_the_way') {
      const populated = await Booking.findById(booking._id)
        .populate('driver', 'fullName profilePic')
        .populate('ambulance', 'vehicleNumber')
        .populate('patient', 'fullName email phone');
      return res.json({ success: true, booking: populated });
    }

    booking.driver = driverId;
    booking.ambulance = driver.assignedAmbulance || null;
    booking.otp = genOtp();
    booking.status = 'on_the_way';
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('driver', 'fullName profilePic pushToken')
      .populate('ambulance', 'vehicleNumber')
      .populate('patient', 'fullName email phone');

    const io = req.app.get('io');
    io?.to(populated.patient._id.toString()).emit('booking_assigned', populated);
    io?.to(driverId.toString()).emit('booking_update', populated);

    // ✅ Send push notification to driver
    if (populated.driver?.pushToken) {
      await sendPush({
        to: populated.driver.pushToken,
        title: 'New Booking Assigned',
        body: `Pickup at ${booking.pickupAddress || 'Unknown location'}`,
        data: { type: 'booking_assigned', bookingId: booking._id.toString() }
      });
    }

    res.json({ success: true, booking: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
