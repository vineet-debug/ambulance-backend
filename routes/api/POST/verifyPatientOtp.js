const express = require('express');
const router = express.Router();
const Patient = require('../../../models/Patient');

// POST /api/POST/verifyPatientOtp
router.post('/', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // Optionally clear OTP after verification
    patient.otp = null;
    await patient.save();

    res.json({ success: true, message: 'OTP verified successfully' });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

module.exports = router;
