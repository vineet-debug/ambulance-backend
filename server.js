/**
 * backend/server.js
 * --------------------------------------------------------------------
 * Main entry point for Ambulance Booking backend (Node.js + Express)
 * --------------------------------------------------------------------
 */
require('dotenv').config();

const os         = require('os');
const path       = require('path');
const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const MongoStore = require('connect-mongo');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors:{ origin:'*' } });

// ── Socket.IO setup ──────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('register', roomId => {
    console.log(`[io] socket ${socket.id} joined room ${roomId}`);
    socket.join(roomId);
  });
});
app.set('io', io);  // so routes can do: req.app.get('io')

// ── MongoDB ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser   : true,
  useUnifiedTopology: true,
})
.then(()=>console.log('✅ Connected to MongoDB'))
.catch(e=>{
  console.error('❌ MongoDB connection error:', e.message);
  process.exit(1);
});

// ── Global middleware ────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(session({
  secret           : process.env.SESSION_SECRET || 'secret-key',
  resave           : false,
  saveUninitialized: false,
  store            : MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie           : { maxAge: 1000*60*60*24 }, // 1 day
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

// ── Views & static ───────────────────────────────────────────────
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

// ── Admin UI ─────────────────────────────────────────────────────
app.use('/', require('./routes/admin/adminRoutes'));

// ── Patient APIs ─────────────────────────────────────────────────
app.use('/api/POST/patientSignup',      require('./routes/api/POST/patientSignup'));
app.use('/api/POST/verifyPatientOtp',   require('./routes/api/POST/verifyPatientOtp'));
app.use('/api/patients/login',          require('./routes/api/POST/patientLogin'));
app.use('/api/GET/patientInfo',         require('./routes/api/GET/patientInfo'));
app.use('/api/POST/updatePatientProfile', require('./routes/api/POST/updatePatientProfile'));

// ── Driver APIs ──────────────────────────────────────────────────
app.use('/api/POST/driverSignup',       require('./routes/api/POST/driverSignup'));
app.use('/api/POST/driverLogin',        require('./routes/api/POST/driverLogin'));
app.use('/api/POST/updateDriverStatus', require('./routes/api/POST/updateDriverStatus'));
app.use('/api/POST/updateDriverLocation', require('./routes/api/POST/updateDriverLocation'));
app.use('/api/GET/driverInfo',          require('./routes/api/GET/driverInfo'));
app.use('/api/GET/nearbyDrivers',       require('./routes/api/GET/nearbyDrivers'));

// ── Booking & ride flow ─────────────────────────────────────────
app.use('/api/POST/createBooking',      require('./routes/api/POST/createBooking'));
app.use('/api/POST/acceptBooking',      require('./routes/api/POST/acceptBooking'));

// ←─ Here we mount the “booking” lookup ───────────────────────────
app.use('/api/GET/booking', require('./routes/api/GET/booking'));

app.use('/api/POST/arriveBooking',  require('./routes/api/POST/arriveBooking'));
app.use('/api/POST/startRide',      require('./routes/api/POST/startRide'));
app.use('/api/POST/completeRide',   require('./routes/api/POST/completeRide'));
app.use('/api/GET/tripCount', require('./routes/api/GET/tripCount'));
app.use('/api/GET/bookingsByDriver', require('./routes/api/GET/bookingsByDriver'));
// Patient Booking APIs (ensure exact path)
app.use('/api/GET/latestBookings', require('./routes/api/GET/latestBookings'));
app.use('/api/GET/allBookings', require('./routes/api/GET/allBookings'));


// ── Push tokens & admin login ────────────────────────────────────
app.use('/api/POST/savePushToken', require('./routes/api/POST/savePushToken'));
app.use('/api/POST/adminLogin',    require('./routes/api/POST/adminLogin'));

// ── Log & handle unmatched /api/* ───────────────────────────────
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`🛑  Unmatched API request → ${req.method} ${req.originalUrl}`);
  }
  next();
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success:false, message:'Endpoint not found' });
  }
  next();
});

// ── JSON error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api')) {
    if (err instanceof SyntaxError && err.status===400 && 'body' in err) {
      return res.status(400).json({ success:false, message:'Invalid JSON payload' });
    }
    return res.status(err.status||500).json({ success:false, message:err.message||'Server error' });
  }
  next(err);
});

// ── Start HTTP + WebSocket server ───────────────────────────────
const PORT = process.env.PORT||5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚑  Ambulance backend running on:');
  Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family==='IPv4' && !i.internal)
    .forEach(i => console.log(`   → http://${i.address}:${PORT}`));
  console.log();
});
