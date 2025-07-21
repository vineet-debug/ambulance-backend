const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Patient = require('../../../models/Patient');

// Generate a 6-digit random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/', async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const otp = generateOTP();

    const newPatient = new Patient({
      fullName,
      email,
      phone,
      password, // (You should hash this in production)
      otp
    });

    await newPatient.save();

    // Send OTP via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for MyAmbulance App',
      html: `<p>Hello ${fullName},</p>
             <p>Your OTP for registration is:</p>
             <h2>${otp}</h2>
             <p>Please enter this code to verify your account.</p>`
    });

    res.status(200).json({ message: 'Signup successful. OTP sent to email.', email });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Please try again later.' });
  }
});

module.exports = router;
