import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';

function AuthGuard() {
  const { isHydrating, token, session, fortState, lockedUserId } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return;

    const topSegment = segments[0];

    if (!token || !session) {
      if (topSegment !== 'login') {
        router.replace('/login');
      }
      return;
    }

    if (session.forts.length === 0) {
      if (topSegment !== 'welcome' && topSegment !== 'wizard') {
        router.replace('/welcome');
      }
      return;
    }

    if (!fortState) {
      return;
    }

    if (topSegment === undefined || topSegment === 'login' || topSegment === 'welcome') {
      if (lockedUserId || session.supervisedUsers.length === 0) {
        router.replace('/(tabs)');
      } else {
        router.replace('/profiles');
      }
    }
  }, [fortState, isHydrating, lockedUserId, router, segments, session, token]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppProvider>
          <AuthGuard />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          />
        </AppProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
