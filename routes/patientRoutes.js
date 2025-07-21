const express = require('express');
const router = express.Router();

const patientSignup = require('../api/POST/patientSignup');
const verifyOtp = require('../api/POST/verifyOtp');
const patientLogin = require('../api/POST/patientLogin');
const getPatient = require('../api/GET/getPatient');

// POST routes
router.post('/signup', patientSignup);
router.post('/verify-otp', verifyOtp);
router.post('/login', patientLogin);

// GET routes
router.get('/get-patient', getPatient);

module.exports = router;
