import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:4000/api'
  : (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.12:4000/api');
if (!API_URL) console.warn('Configure EXPO_PUBLIC_API_URL antes de iniciar la aplicación.');

export async function saveToken(token) {
  if (Platform.OS === 'web') return AsyncStorage.setItem('catastro.jwt', token);
  await SecureStore.setItemAsync('catastro.jwt', token);
}
export async function clearToken() {
  if (Platform.OS === 'web') return AsyncStorage.removeItem('catastro.jwt');
  await SecureStore.deleteItemAsync('catastro.jwt');
}
export async function getToken() {
  if (Platform.OS === 'web') return AsyncStorage.getItem('catastro.jwt');
  return SecureStore.getItemAsync('catastro.jwt');
}
export async function request(path, options = {}) {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Error HTTP ${response.status}`);
  }
  return response.json();
}
