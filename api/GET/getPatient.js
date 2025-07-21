const Patient = require('../../models/Patient');

const getPatient = async (req, res) => {
  const { email } = req.query;

  try {
    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = getPatient;
