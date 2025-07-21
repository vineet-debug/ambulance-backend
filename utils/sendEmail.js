// utils/sendEmail.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

/* -------------------------------------------------------------
   1. Setup reusable transporter for Gmail (App Password required)
------------------------------------------------------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -------------------------------------------------------------
   2. Send OTP email (Patient Signup)
------------------------------------------------------------- */
async function sendOtpEmail(to, otp) {
  return transporter.sendMail({
    from   : `"MyAmbulance App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    html   : `
      <h2>Your OTP is: <strong>${otp}</strong></h2>
      <p>Please use this to verify your account.</p>
    `,
  });
}

/* -------------------------------------------------------------
   3. Driver Verification Email
------------------------------------------------------------- */
async function sendDriverVerifiedEmail({ to, name }) {
  return transporter.sendMail({
    from   : `"Ambulance Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Driver Account Is Verified',
    html   : `
      <p>Hi ${name},</p>
      <p>Your driver account has been <strong>verified</strong> by our admin team.</p>
      <p>You can now log in to the Ambulance Driver app and start accepting trips.</p>
      <p style="margin-top:24px">— Ambulance Booking Team</p>
    `,
  });
}

/* -------------------------------------------------------------
   4. Generic Mail Helper
------------------------------------------------------------- */
async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: `"Ambulance App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendOtpEmail,
  sendDriverVerifiedEmail,
  sendMail,
};
