/**
 * backend/server.js
 */
require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const MongoStore = require('connect-mongo');
const os         = require('os');

const app = express();

/* ───────────────── 1. MongoDB ───────────────── */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser   : true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅  Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/* ──────────────── 2. Global middleware ───────── */
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret            : process.env.SESSION_SECRET || 'secret-key',
    resave            : false,
    saveUninitialized : false,
    store             : MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie            : { maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

/* ───────────── 3. View engine & static ───────── */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ────────────── 4. Routes ────────────────────── */
app.use('/', require('./routes/admin/adminRoutes'));

/* Patient APIs */
app.use('/api/POST/patientSignup',    require('./routes/api/POST/patientSignup'));
app.use('/api/patients/register',     require('./routes/api/POST/patientSignup'));
app.use('/api/POST/verifyPatientOtp', require('./routes/api/POST/verifyPatientOtp'));
app.use('/api/POST/patientLogin',     require('./routes/api/POST/patientLogin'));
app.use('/api/patients/login',        require('./routes/api/POST/patientLogin'));
app.use('/api/GET/patientInfo', require('./routes/api/GET/patientInfo'));
app.use('/api/POST/updatePatientProfile', require('./routes/api/POST/updatePatientProfile'));


/* Driver APIs */
app.use('/api/POST/driverSignup', require('./routes/api/POST/driverSignup'));
app.use('/api/POST/driverLogin',  require('./routes/api/POST/driverLogin'));
app.use('/api/POST/loginDriver',  require('./routes/api/POST/driverLogin'));

// 🚨 New APIs for driver status/location
app.use('/api/POST/updateDriverStatus', require('./routes/api/POST/updateDriverStatus'));
app.use('/api/GET/driverInfo',          require('./routes/api/GET/driverInfo'));
app.use('/api/GET/nearbyDrivers', require('./routes/api/GET/nearbyDrivers'));
app.use('/api/POST/updateDriverLocation', require('./routes/api/POST/updateDriverLocation'));



/* Admin login API */
app.use('/api/POST/adminLogin', require('./routes/api/POST/adminLogin'));

/* 4.1 Log unmatched /api requests */
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`🛑  Unmatched API request → ${req.method} ${req.originalUrl}`);
  }
  next();
});

/* 4.2 JSON 404 for unmatched /api/* */
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  next();
});

/* 4.3 Unified JSON error handler */
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api')) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }
    return res
      .status(err.status || 500)
      .json({ success: false, message: err.message || 'Server error' });
  }
  next(err);
});

/* ───────────────── 5. Start server ───────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  console.log('🚑  Ambulance backend running on:');
  Object.values(nets)
    .flat()
    .forEach(({ family, address, internal }) => {
      if (family === 'IPv4' && !internal) {
        console.log(`   → http://${address}:${PORT}`);
      }
    });
});
