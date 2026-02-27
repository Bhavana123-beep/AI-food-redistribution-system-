import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️  Change this to your computer's local IP when testing on a physical device
// e.g. http://192.168.1.5:5000  (run `ipconfig` on Windows to find it)
export const API_BASE = 'http://10.0.2.2:5000'; // 10.0.2.2 = localhost for Android emulator

const client = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
