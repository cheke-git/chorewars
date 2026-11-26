import { Redirect } from 'expo-router';

import { useApp } from '@/context/AppContext';
import { ProfilePickerScreen } from '@/screens/ProfilePickerScreen/ProfilePickerScreen';

export default function ProfilesRoute() {
  const { token, fortState } = useApp();

  if (!token) {
    return <Redirect href="/" />;
  }
  if (!fortState) {
    return <Redirect href="/wizard" />;
  }

  return <ProfilePickerScreen />;
}
