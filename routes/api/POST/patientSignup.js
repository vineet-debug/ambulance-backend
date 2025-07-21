const express  = require('express');
const bcrypt   = require('bcryptjs');
const Patient  = require('../../../models/Patient');
const { sendMail } = require('../../../utils/sendEmail');   // ⬅ destructure the helper

const router = express.Router();

router.post('/', async (req, res) => {
  const { fullName, email, phone, gender, password } = req.body;

  try {
    /* duplicate check */
    if (await Patient.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    /* hash + otp */
    const hashed   = await bcrypt.hash(password, 10);
    const otp      = Math.floor(100000 + Math.random() * 900000).toString();
    const expires  = Date.now() + 600_000; // 10 min

    /* save */
    await Patient.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      gender,
      password : hashed,
      otp,
      otpExpires: expires,
      verified : false,
      active   : true,
    });

    /* e-mail the otp */
    await sendMail({
      to      : email,
      subject : 'Your Ambulance App OTP',
      text    : `Hi ${fullName}, your one-time password is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ success: true, message: 'Signup successful. OTP sent.' });
  } catch (err) {
    console.error('Patient signup error:', err);
    res.status(500).json({ success: false, message: 'Server error – signup failed' });
  }
});

module.exports = router;
