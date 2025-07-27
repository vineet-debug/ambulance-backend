// backend/routes/api/POST/acceptBooking.js
const router   = require('express').Router();
const Booking  = require('../../../models/Booking');
const Driver   = require('../../../models/Driver');

const genOtp = () => Math.floor(100000 + Math.random()*900000).toString();

router.post('/', async (req, res) => {
  try {
    const { bookingId, driverId } = req.body;

    const driver  = await Driver.findById(driverId).populate('assignedAmbulance');
    const booking = await Booking.findById(bookingId);
    if (!driver || !booking)
      return res.status(404).json({ success:false, message:'Not found' });

    // 🛑 Already assigned to someone else
    if (booking.driver && String(booking.driver) !== driverId)
      return res.json({ success:false, code:'ALREADY_ASSIGNED', message:'Another driver took it.' });

    // ✅ If same driver already assigned → skip reassigning
    if (String(booking.driver) === driverId && booking.status === 'on_the_way') {
      const populated = await Booking.findById(booking._id)
        .populate('driver', 'fullName profilePic')
        .populate('ambulance', 'vehicleNumber')  // ✅ use vehicleNumber here
        .populate('patient', 'fullName email phone');
      return res.json({ success:true, booking:populated });
    }

    // ✅ Assign and generate new OTP
    booking.driver    = driverId;
    booking.ambulance = driver.assignedAmbulance || null;
    booking.otp       = genOtp();
    booking.status    = 'on_the_way';
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('driver', 'fullName profilePic')
      .populate('ambulance', 'vehicleNumber')  // ✅ make sure vehicleNumber is populated
      .populate('patient', 'fullName email phone');

    const io = req.app.get('io');
    io?.to(populated.patient._id.toString()).emit('booking_assigned', populated);
    io?.to(driverId.toString()).emit('booking_update', populated);

    res.json({ success:true, booking:populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
