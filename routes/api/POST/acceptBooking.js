// backend/routes/api/POST/acceptBooking.js
const router = require('express').Router();
const Booking = require('../../../models/Booking');
const Driver = require('../../../models/Driver');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/', async (req, res) => {
  try {
    const { bookingId, driverId } = req.body;

    const driver = await Driver.findById(driverId).populate('assignedAmbulance');
    const booking = await Booking.findById(bookingId);
    if (!driver || !booking) return res.status(404).json({ success: false, message: 'Not found' });

    // 🛑 Already taken
    if (booking.driver && String(booking.driver) !== driverId)
      return res.json({ success: false, code: 'ALREADY_ASSIGNED', message: 'Another driver took it.' });

    // ✅ Already assigned to this driver
    if (String(booking.driver) === driverId && booking.status === 'on_the_way') {
      const populated = await Booking.findById(booking._id)
        .populate('driver', 'fullName profilePic')
        .populate('ambulance', 'vehicleNumber')
        .populate('patient', 'fullName email phone');
      return res.json({ success: true, booking: populated });
    }

    // ✅ Assign and notify
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
    const token = populated.driver?.pushToken;
    if (Expo.isExpoPushToken(token)) {
      await expo.sendPushNotificationsAsync([{
        to: token,
        title: 'New Booking Assigned',
        body: `Pickup at ${booking.pickupAddress}`,
        data: {
          type: 'booking_assigned',
          bookingId: populated._id
        }
      }]);
    }

    res.json({ success: true, booking: populated });
  } catch (e) {
    console.error('acceptBooking error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
