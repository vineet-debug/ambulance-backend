const express = require('express');
const router = express.Router();
const Driver = require('../../../models/Driver');

router.post('/', async (req, res) => {
  const { driverId, token } = req.body;
  await Driver.findByIdAndUpdate(driverId, { pushToken: token });
  res.json({ success: true });
});

module.exports = router;
