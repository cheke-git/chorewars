import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { LoginScreen } from '@/screens/LoginScreen/LoginScreen';

export default function IndexRoute() {
  const { isHydrating, token, fortState, activeProfile } = useApp();

  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    );
  }

  if (token) {
    if (!fortState) {
      return <Redirect href="/wizard" />;
    }
    if (!activeProfile) {
      return <Redirect href="/profiles" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <LoginScreen />;
}
