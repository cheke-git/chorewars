import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function TabsLayout() {
  const { token, fortState, activeProfile } = useApp();

  if (!token) {
    return <Redirect href="/" />;
  }
  if (!fortState) {
    return <Redirect href="/wizard" />;
  }
  if (!activeProfile) {
    return <Redirect href="/profiles" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.brandOrange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Battle Board',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⚔</Text>,
        }}
      />
      <Tabs.Screen
        name="scoreboard"
        options={{
          title: 'Scoreboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>★</Text>,
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          title: 'Command',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⚙</Text>,
        }}
      />
    </Tabs>
  );
}
