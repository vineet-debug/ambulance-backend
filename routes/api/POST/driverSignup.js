// routes/api/POST/driverSignup.js
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');                     // NEW – for hashing
const router   = express.Router();
const Driver   = require('../../../models/Driver');

/* ─────────────────────────────────────────────
   1. Ensure uploads/ exists
────────────────────────────────────────────── */
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

/* ─────────────────────────────────────────────
   2. Multer config
────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename   : (_req, file, cb)  =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '')),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB each
}).fields([
  { name: 'profilePic',  maxCount: 1 },
  { name: 'licenseCopy', maxCount: 1 },
]);

/* ─────────────────────────────────────────────
   3. POST /api/POST/driverSignup
────────────────────────────────────────────── */
router.post('/', (req, res) => {
  upload(req, res, async (multerErr) => {
    if (multerErr) {
      console.error('Multer error:', multerErr);
      return res.status(400).json({ success: false, message: multerErr.message });
    }

    try {
      /* ---------- 3-A. Validate body ---------- */
      const {
        fullName, email, phone, gender,
        licenseNumber, address1, city, state, pincode, password,
      } = req.body;

      if (!fullName || !email || !phone || !licenseNumber || !password) {
        return res.status(400).json({ success: false, message: 'Required fields missing.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (await Driver.findOne({ email: cleanEmail })) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }

      /* ---------- 3-B. Files ---------- */
      const profilePic  = req.files?.profilePic?.[0]?.filename;
      const licenseCopy = req.files?.licenseCopy?.[0]?.filename;
      if (!profilePic || !licenseCopy) {
        return res.status(400).json({ success: false, message: 'Both files are required.' });
      }

      /* ---------- 3-C. Hash password ---------- */
      const salt           = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      /* ---------- 3-D. Save ---------- */
      const newDriver = new Driver({
        fullName,
        email        : cleanEmail,
        phone,
        gender,
        licenseNumber,
        password     : hashedPassword,
        address      : { line1: address1, city, state, zip: pincode },
        profilePic,
        licenseCopy,
        verified     : false,
      });

      await newDriver.save();
      res.json({ success: true, message: 'Driver registered. Awaiting admin approval.' });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

module.exports = router;
