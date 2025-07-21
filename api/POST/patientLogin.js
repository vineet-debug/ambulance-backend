const Patient = require('../../models/Patient');

const patientLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await Patient.findOne({ email });

    if (!patient || patient.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!patient.isVerified) {
      return res.status(401).json({ message: 'Please verify your account' });
    }

    res.status(200).json({ message: 'Login successful', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = patientLogin;
