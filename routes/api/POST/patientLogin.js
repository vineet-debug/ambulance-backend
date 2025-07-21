// routes/api/POST/patientLogin.js
const express  = require('express');
const router   = express.Router();

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Patient  = require('../../../models/Patient');
require('dotenv').config();

/*  POST /api/POST/patientLogin  (alias /api/patients/login)
    Body: { email, password }
------------------------------------------------------------ */
router.post('/', async (req, res) => {
  const { email = '', password = '' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success:false, message:'Email and password required' });
  }

  try {
    const patient = await Patient.findOne({ email: email.toLowerCase().trim() });
    if (!patient) {
      return res.status(400).json({ success:false, message:'Invalid email or password' });
    }

    /* 1️⃣  Block if not verified */
    if (patient.otp) {
      return res.status(403).json({ success:false, message:'Please verify your email first.' });
    }

    /* 2️⃣  Check password */
    let passwordValid = false;

    // a. First try bcrypt (hashed accounts)
    if (await bcrypt.compare(password, patient.password)) {
      passwordValid = true;
    } else {
      // b. Fallback for legacy plaintext rows
      if (patient.password === password) {
        passwordValid = true;

        // auto-upgrade: re-hash & save
        patient.password = await bcrypt.hash(password, 10);
        await patient.save();
        console.log(`🔐  Upgraded plaintext password for ${email}`);
      }
    }

    if (!passwordValid) {
      return res.status(400).json({ success:false, message:'Invalid email or password' });
    }

    /* 3️⃣  Issue JWT */
    const token = jwt.sign(
      { id: patient._id, role: 'patient' },
      process.env.JWT_SECRET || 'jwt-secret',
      { expiresIn: '12h' },
    );

    /* 4️⃣  Send patient object minus pw */
    const { password: _, ...patientSafe } = patient.toObject();

    res.status(200).json({
      success : true,
      message : 'Login successful',
      token,
      patient : patientSafe,
    });

  } catch (err) {
    console.error('Patient login error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
