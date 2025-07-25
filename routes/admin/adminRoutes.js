// routes/admin/adminRoutes.js
const express    = require('express');
const router     = express.Router();
const path       = require('path');
const multer     = require('multer');
const Patient    = require('../../models/Patient');
const Driver     = require('../../models/Driver');
const Ambulance  = require('../../models/Ambulance');
const Booking    = require('../../models/Booking');               // ← New
const { sendDriverVerifiedEmail } = require('../../utils/sendEmail');
require('dotenv').config();

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// ─── Multer setup for file uploads ───────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// ─── Admin guard ─────────────────────────────────────────────────
function ensureAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/');
}

// ─── Login / Logout ──────────────────────────────────────────────
router.get('/', (req, res) => {
  res.render('login', { error: null });
});
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { error: 'Invalid credentials' });
});
router.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ─── Dashboard ───────────────────────────────────────────────────
router.get('/admin/dashboard', ensureAdmin, (req, res) => {
  res.render('dashboard');
});

// ─── Patients CRUD ───────────────────────────────────────────────
router.get('/admin/patients', ensureAdmin, async (req, res) => {
  const { name, email, gender } = req.query;
  const filter = {};
  if (name)   filter.fullName = new RegExp(name, 'i');
  if (email)  filter.email    = new RegExp(email, 'i');
  if (gender) filter.gender   = gender;

  const patients = await Patient.find(filter).sort({ createdAt: -1 });
  res.render('patients', { patients, query:{ name, email, gender } });
});
router.get('/admin/patients/:id', ensureAdmin, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.redirect('/admin/patients');
  res.render('patientDetails', { patient });
});
router.post('/admin/patients/:id/update', ensureAdmin, async (req, res) => {
  const { fullName, email, phone, gender } = req.body;
  await Patient.findByIdAndUpdate(req.params.id, { fullName, email, phone, gender });
  res.redirect(`/admin/patients/${req.params.id}`);
});
router.post('/admin/patients/toggle/:id', ensureAdmin, async (req, res) => {
  const p = await Patient.findById(req.params.id);
  if (p) {
    p.active = !p.active;
    await p.save();
  }
  res.redirect('/admin/patients');
});
router.post('/admin/patients/delete/:id', ensureAdmin, async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.redirect('/admin/patients');
});

// ─── Drivers CRUD ────────────────────────────────────────────────
router.get('/admin/drivers', ensureAdmin, async (req, res) => {
  const drivers    = await Driver.find().populate('assignedAmbulance').sort({ createdAt: -1 });
  const ambulances = await Ambulance.find().sort({ createdAt: -1 });
  res.render('drivers', { drivers, ambulances });
});
router.get('/admin/drivers/add', ensureAdmin, (req, res) => {
  res.render('addDriver');
});
router.post(
  '/admin/drivers/add',
  ensureAdmin,
  upload.fields([{ name:'profilePic' }, { name:'licenseCopy' }]),
  async (req, res) => {
    const {
      fullName, email, phone, gender,
      licenseNumber, addressLine1, addressLine2,
      city, state, postalCode, password
    } = req.body;

    const profilePic  = req.files.profilePic?.[0]?.path.replace('public/','')  || '';
    const licenseCopy = req.files.licenseCopy?.[0]?.path.replace('public/','') || '';

    await new Driver({
      fullName, email, phone, gender, licenseNumber, password,
      profilePic, licenseCopy,
      address:{ line1:addressLine1, line2:addressLine2, city, state, postalCode },
      verified:false
    }).save();

    res.redirect('/admin/drivers');
  }
);
router.post(
  '/admin/drivers/:id/update',
  ensureAdmin,
  upload.fields([{ name:'profilePic' }, { name:'licenseCopy' }]),
  async (req, res) => {
    const {
      fullName, email, phone, gender,
      licenseNumber, addressLine1, addressLine2,
      city, state, postalCode, password, confirmPassword
    } = req.body;

    const updateFields = {
      fullName, email, phone, gender, licenseNumber,
      address:{ line1:addressLine1, line2:addressLine2, city, state, postalCode }
    };

    if (req.files.profilePic)  updateFields.profilePic  = req.files.profilePic[0].path.replace('public/','');
    if (req.files.licenseCopy) updateFields.licenseCopy = req.files.licenseCopy[0].path.replace('public/','');
    if (password && password === confirmPassword) {
      updateFields.password = password;
    }

    await Driver.findByIdAndUpdate(req.params.id, updateFields);
    res.redirect('/admin/drivers');
  }
);
router.post('/admin/drivers/delete/:id', ensureAdmin, async (req, res) => {
  await Driver.findByIdAndDelete(req.params.id);
  res.redirect('/admin/drivers');
});
router.post('/admin/drivers/verify/:id', ensureAdmin, async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, { verified:true }, { new:true });
  if (driver) {
    try {
      await sendDriverVerifiedEmail({ to:driver.email, name:driver.fullName });
      console.log(`✅ Verification email sent to ${driver.email}`);
    } catch(err) {
      console.error('❌ Failed to send email:', err.message);
    }
  }
  res.redirect('/admin/drivers');
});
router.post('/admin/drivers/assignAmbulance/:id', ensureAdmin, async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver || !driver.verified) {
    return res.status(400).send('Driver not verified or does not exist');
  }
  const { ambulanceId } = req.body;
  await Driver.findByIdAndUpdate(req.params.id, { assignedAmbulance:ambulanceId });
  res.redirect('/admin/drivers');
});
router.get('/admin/drivers/:id', ensureAdmin, async (req, res) => {
  const driver = await Driver.findById(req.params.id).populate('assignedAmbulance');
  if (!driver) return res.status(404).send('Driver not found');
  res.render('driverDetail', { driver });
});

// ─── Ambulances CRUD ────────────────────────────────────────────
router.get('/admin/ambulances', ensureAdmin, async (req, res) => {
  const ambulances = await Ambulance.find().populate('assignedDriver').sort({ createdAt:-1 });
  res.render('ambulances', { ambulances });
});
router.get('/admin/ambulances/:id', ensureAdmin, async (req, res) => {
  const ambulance = await Ambulance.findById(req.params.id).populate('assignedDriver');
  res.render('ambulanceDetail', { ambulance });
});
router.get('/admin/addAmbulance', ensureAdmin, async (req, res) => {
  const assignedDrivers = await Ambulance.find({ assignedDriver:{ $ne:null } }).distinct('assignedDriver');
  const drivers = await Driver.find({ verified:true, _id:{ $nin:assignedDrivers } });
  res.render('addAmbulance', { drivers });
});
router.post('/admin/addAmbulance', ensureAdmin, async (req, res) => {
  const { vehicleNumber, vehicleModel, isActive, assignedDriver } = req.body;
  const newAmbulance = new Ambulance({
    vehicleNumber,
    vehicleModel,
    isActive: isActive === 'on',
    assignedDriver: assignedDriver || null,
  });
  const savedAmbulance = await newAmbulance.save();
  if (assignedDriver) {
    await Driver.findByIdAndUpdate(assignedDriver, { assignedAmbulance:savedAmbulance._id });
  }
  res.redirect('/admin/ambulances');
});
router.get('/admin/editAmbulance/:id', ensureAdmin, async (req, res) => {
  const ambulance = await Ambulance.findById(req.params.id);
  const assignedDrivers = await Ambulance.find({
    assignedDriver:{ $ne:null, $ne:ambulance.assignedDriver }
  }).distinct('assignedDriver');
  const drivers = await Driver.find({
    verified:true,
    _id:{ $nin:assignedDrivers }
  });
  res.render('editAmbulance', { ambulance, drivers });
});
router.post('/admin/editAmbulance/:id', ensureAdmin, async (req, res) => {
  const { vehicleNumber, vehicleModel, isActive, assignedDriver } = req.body;
  const updatedAmbulance = await Ambulance.findByIdAndUpdate(req.params.id,{
    vehicleNumber,
    vehicleModel,
    isActive: isActive === 'on',
    assignedDriver: assignedDriver || null,
  }, { new:true });

  // unassign from any old drivers
  await Driver.updateMany(
    { assignedAmbulance:updatedAmbulance._id },
    { $unset:{ assignedAmbulance:"" } }
  );
  if (assignedDriver) {
    await Driver.findByIdAndUpdate(assignedDriver, {
      assignedAmbulance:updatedAmbulance._id
    });
  }
  res.redirect('/admin/ambulances');
});
router.post('/admin/deleteAmbulance/:id', ensureAdmin, async (req, res) => {
  const ambulance = await Ambulance.findById(req.params.id);
  if (ambulance) {
    await Driver.updateMany(
      { assignedAmbulance:ambulance._id },
      { $unset:{ assignedAmbulance:"" } }
    );
    await Ambulance.findByIdAndDelete(req.params.id);
  }
  res.redirect('/admin/ambulances');
});

// ─── Bookings listing & detail ───────────────────────────────────
router.get('/admin/bookings', ensureAdmin, async (req, res) => {
  const bookings = await Booking.find()
    .populate('patient driver ambulance')
    .sort({ createdAt:-1 });
  res.render('bookings', { bookings });
});

router.get('/admin/bookings/:id', ensureAdmin, async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('patient driver ambulance');
  if (!booking) return res.redirect('/admin/bookings');
  res.render('bookingDetail', {
    booking,
    googleApiKey: process.env.GOOGLE_API_KEY
  });
});

module.exports = router;
