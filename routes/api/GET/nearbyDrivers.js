/* routes/api/GET/nearbyDrivers.js */
const router  = require('express').Router();
const Driver  = require('../../../models/Driver');

router.get('/', async (req, res) => {
  const { lat, lng, radius = 8000 } = req.query;
  const latitude  = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res
      .status(400)
      .json({ success: false, message: 'lat & lng are required numbers' });
  }

  try {
    const drivers = await Driver.aggregate([
      /* 1️⃣  geo filter + basic flags + ambulance already assigned */
      {
        $geoNear: {
          near          : { type: 'Point', coordinates: [longitude, latitude] },
          distanceField : 'distanceMeters',
          maxDistance   : Number(radius),        // metres
          spherical     : true,
          query         : {
            verified          : true,
            available         : true,
            assignedAmbulance : { $ne: null },   // <-- keep only assigned drivers
          },
        },
      },

      /* 2️⃣  join the ambulance document */
      {
        $lookup: {
          from         : 'ambulances',           // collection name
          localField   : 'assignedAmbulance',
          foreignField : '_id',
          as           : 'ambulance',
        },
      },
      { $set: { ambulance: { $arrayElemAt: ['$ambulance', 0] } } },

      /* 3️⃣  add distance / ETA & readable ambulance number */
      {
        $set: {
          distance      : { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] }, // km
          duration      : { $ceil : { $divide: ['$distanceMeters', 667] } },       // ~40 km/h
          ambulanceName : '$ambulance.vehicleNumber',                              // adjust if needed
        },
      },

      /* 4️⃣  trim payload */
      {
        $project: {
          fullName      : 1,
          profilePic    : 1,
          ambulanceName : 1,
          distance      : 1,
          duration      : 1,
        },
      },
    ]);

    res.json({ success: true, drivers });
  } catch (err) {
    console.error('nearbyDrivers aggregation error →', err.message);
    res.status(500).json({ success: false, message: 'Query failed' });
  }
});

module.exports = router;
