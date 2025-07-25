/* routes/api/GET/booking.js */
const router  = require('express').Router();
const Booking = require('../../../models/Booking');

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient',  'fullName')
      .populate('driver',   'fullName')
      .lean();
    if (!booking) return res.json({ success:false, message:'Booking not found' });
    res.json({ success:true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
