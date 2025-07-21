// backend/routes/api/POST/driverLogin.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Driver   = require('../../../models/Driver');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'driver-secret';   // add to .env for prod

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  try {
    /* 1. Find driver */
    const driver = await Driver.findOne({ email: cleanEmail });
    if (!driver)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    /* 2. Compare pw */
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    /* 3. Verify */
    if (!driver.verified)
      return res.status(403).json({ success: false, verified: false, message: 'Account not verified by admin yet.' });

    /* 4. Success */
    const { password: _pw, ...driverSafe } = driver.toObject();
    const token = jwt.sign({ id: driverSafe._id }, JWT_SECRET, { expiresIn: '7d' }); // STRING!

    res.json({
      success : true,
      message : 'Login successful',
      verified: true,      // always present
      token,               // always a string
      driver  : driverSafe,
    });
  } catch (err) {
    console.error('Driver login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
