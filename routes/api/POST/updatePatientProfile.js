const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Patient = require('../../../models/Patient');

// 🔧 Setup storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// 📌 Route: POST /api/POST/updatePatientProfile
router.post('/', upload.single('profilePic'), async (req, res) => {
  const { email, fullName, phone, gender, age, bloodGroup, address } = req.body;
  const profilePic = req.file?.filename;

  try {
    const updateFields = {
      fullName,
      phone,
      gender,
      age,
      bloodGroup,
      address,
    };

    if (profilePic) updateFields.profilePic = profilePic;

    const updated = await Patient.findOneAndUpdate(
      { email },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, patient: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
