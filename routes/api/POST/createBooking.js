// routes/api/POST/createBooking.js
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
          maxDistance: 10_000,
          query: {
            verified: true,
            available: true,
            assignedAmbulance: { $ne: null },
          },
        },
      },
      { $limit: 1 },
    ]);

    if (!nearest) {
      return res.json({ success: false, message: 'No driver nearby' });
    }

    const booking = await Booking.create({
      patient: patientId,
      pickupAddress,
      pickupLocation: { type: 'Point', coordinates: [pickupLng, pickupLat] },
      dropAddress,
      dropLocation: { type: 'Point', coordinates: [dropLng, dropLat] },
      status: 'new',
    });

    const io = req.app.get('io');
    io?.to(nearest._id.toString()).emit('newBooking', {
      bookingId: booking._id,
      pickupAddress,
    });

    // ✅ Send push if token exists
    if (nearest.pushToken) {
      await sendPush({
        to: nearest.pushToken,
        title: 'New Ambulance Request',
        body: `Pickup at ${pickupAddress}`,
        data: {
          type: 'new_booking',
          bookingId: booking._id.toString(),
        },
      });
    } else {
      console.warn('[Push] No pushToken for driver:', nearest._id);
    }

    res.json({ success: true, bookingId: booking._id, patientId });
  } catch (e) {
    console.error('[createBooking] Error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
