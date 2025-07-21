// utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

/* ----- 1. one transporter for the whole server ----------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ----- 2. OTP for patients (existing) -------------------------- */
async function sendOtpEmail({ to, otp }) {
  return transporter.sendMail({
    from   : `"Ambulance OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your One-Time Password',
    html   : `<p>Your OTP is <strong>${otp}</strong></p>`,
  });
}

/* ----- 3. NEW: driver verified -------------------------------- */
async function sendDriverVerifiedEmail({ to, name }) {
  return transporter.sendMail({
    from   : `"Ambulance Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Driver Account Is Verified',
    html: `
      <p>Hi ${name},</p>
      <p>Your driver account has been <strong>verified</strong>. You can now log in
      to the Ambulance Driver app.</p>
      <p>Thank you for joining us!</p>
      <p style="margin-top:24px">— Ambulance Booking Team</p>
    `,
  });
}

module.exports = { sendOtpEmail, sendDriverVerifiedEmail };
