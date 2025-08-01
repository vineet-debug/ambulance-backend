HEAD
const fetch = require('node-fetch');

const admin = require('firebase-admin');
const path = require('path');


// Only initialize once
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async function sendPush(expoPushToken, notification) {
  try {
HEAD
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

    await admin.messaging().send({
      token: expoPushToken,
      notification: {
        title: notification.title,
        body: notification.body,
d44e2b7 (Push backend updates with push notification integration)
      },
      data: notification.data || {},
    });

    const result = await res.json();
    console.log('🔔 Push response:', result);
  } catch (err) {
    console.error('❌ Push notification error', err.message);
  }
};
