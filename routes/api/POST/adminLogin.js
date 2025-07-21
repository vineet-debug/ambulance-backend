// routes/api/POST/adminLogin.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin credentials
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';

  if (email === adminEmail && password === adminPassword) {
    return res.json({ success: true, message: 'Admin logged in successfully' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

module.exports = router;
