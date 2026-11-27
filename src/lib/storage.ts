import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cw_auth_token',
  ACTIVE_USER_ID: 'cw_active_user_id',
  ACTIVE_FORT_ID: 'cw_active_fort_id',
  LOCKED_USER_ID: 'cw_locked_user_id',
} as const;

export async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
