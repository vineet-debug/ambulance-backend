const fetch = require('node-fetch');

module.exports = async function sendPush({ to, title, body, data }) {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        title,
        body,
        sound: 'default',
        data,
      }),
    });

    const result = await res.json();
    console.log('🔔 Push response:', result);
  } catch (err) {
    console.error('Push notification error', err);
  }
};
