const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const User  = require('../models/Driver'); // or union of both

module.exports = async function sendPush(userId, message) {
  const user = await User.findById(userId);
  if (!user?.pushToken) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify([{ to: user.pushToken, ...message }]),
  });
};
