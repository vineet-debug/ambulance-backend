// utils/useRegisterPush.js
import * as Notifications from 'expo-notifications';
import Constants           from 'expo-constants';

export default async function registerPush(userId) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await fetch(buildUrl('/api/POST/savePushToken'), { // simple route that stores token on user
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ userId, token }),
  });
}
