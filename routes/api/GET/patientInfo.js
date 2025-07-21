const express = require('express');
const router = express.Router();
const Patient = require('../../../models/Patient');

// GET /api/GET/patientInfo/:email
router.get('/:email', async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.email }).select('-otp -password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
