const router = require('express').Router();
const Booking = require('../../../models/Booking');
const Driver = require('../../../models/Driver');
const sendPush = require('../../../utils/sendPush');

router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      pickupLat, pickupLng, pickupAddress,
      dropLat, dropLng, dropAddress,
    } = req.body;

    const [nearest] = await Driver.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [pickupLng, pickupLat] },
          distanceField: 'distance',
          spherical: true,
          maxDistance: 10000,
          query: { verified: true, available: true, assignedAmbulance: { $ne: null } },
        },
      },
      { $limit: 1 },
    ]);

    if (!nearest) return res.json({ success: false, message: 'No nearby driver' });

    const booking = await Booking.create({
      patient: patientId,
      pickupAddress,
      pickupLocation: { type: 'Point', coordinates: [pickupLng, pickupLat] },
      dropAddress,
      dropLocation: { type: 'Point', coordinates: [dropLng, dropLat] },
      status: 'new',
    });

    if (nearest.pushToken) {
      await sendPush({
        to: nearest.pushToken,
        title: 'New Booking Request',
        body: `Pickup at ${pickupAddress}`,
        data: { bookingId: booking._id.toString(), type: 'new_booking' },
      });
    }

    const io = req.app.get('io');
    io?.to(nearest._id.toString()).emit('newBooking', {
      bookingId: booking._id,
      pickupAddress,
    });

    res.json({ success: true, bookingId: booking._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
