const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// TEMPORARY IN-MEMORY OTP STORE (use DB in production)
const otpStore = {};

router.post('/', async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Step 1: Validate input
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Step 2: Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  // Step 3: Send OTP Email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,     // your Gmail address
      pass: process.env.GMAIL_PASS      // your Gmail App Password
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify Your Email for MyAmbulance App',
    html: `<p>Hello ${name},</p>
           <p>Your OTP code is:</p>
           <h2>${otp}</h2>
           <p>This code will expire in 10 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'OTP sent to email.', email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to send OTP email.' });
  }
});

module.exports = router;
