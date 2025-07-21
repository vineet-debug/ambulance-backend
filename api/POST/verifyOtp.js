// routes/api/POST/verifyPatientOtp.js

const express = require('express');
const router = express.Router();
const Patient = require('../../../models/Patient');

router.post('/', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark email as verified (optional step)
    patient.otp = null; // clear the OTP
    await patient.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
