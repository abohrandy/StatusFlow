import { apiClient } from '../lib/apiClient';

export async function registerForPushNotificationsAsync() {
  const token = 'ExponentPushToken[mock_mobile_push_token_98f]';

  try {
    // Register device push token with backend API
    await apiClient.post('/notifications/register-device', { token });
  } catch (err) {
    console.log('Mobile Push Registration token:', token);
  }

  return token;
}
