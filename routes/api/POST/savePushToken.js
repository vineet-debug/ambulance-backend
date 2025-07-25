// routes/api/POST/savePushToken.js
const express = require('express');
const router  = express.Router();

const Patient = require('../../../models/Patient');
const Driver  = require('../../../models/Driver');

/**
 * Body  { userId, role, token }
 *  role = 'patient' | 'driver'
 * Stores Expo push token on the appropriate user document.
 */
router.post('/', async (req, res) => {
  const { userId, role, token } = req.body;

  if (!userId || !role || !token) {
    return res.status(400).json({ success:false, message:'userId, role, token required' });
  }

  try {
    const Model = role === 'patient' ? Patient : Driver;
    const updated = await Model.findByIdAndUpdate(
      userId,
      { pushToken: token },
      { new:true }
    );

    if (!updated) {
      return res.status(404).json({ success:false, message:'User not found' });
    }

    res.json({ success:true });
  } catch (err) {
    console.error('savePushToken error', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
