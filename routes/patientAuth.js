const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const sendOtpEmail = require('../utils/sendEmail');

// Sign up
router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const patient = new Patient({ name, email, phone, password });
    await patient.save();

    const otp = '000000'; // Static for now

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to email', otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// OTP Verification
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (otp !== '000000') {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  try {
    const patient = await Patient.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Account verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await Patient.findOne({ email });

    if (!patient || patient.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!patient.isVerified) {
      return res.status(401).json({ message: 'Please verify your account' });
    }

    res.status(200).json({ message: 'Login successful', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
