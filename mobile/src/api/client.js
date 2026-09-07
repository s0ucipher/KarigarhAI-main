import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend base URL. On a physical device use your LAN IP, e.g.
// EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000');

export const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('kalasetu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const imgUrl = (path) =>
  !path ? null : path.startsWith('http') ? path : `${BASE_URL}${path}`;

export default api;
