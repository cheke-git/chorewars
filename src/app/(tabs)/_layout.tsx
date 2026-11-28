import { Tabs } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveCharacterPortrait } from '@/constants/characterArt';
import { getEffectiveArtTier } from '@/constants/evolutionVideos';
import { getRankInfo } from '@/constants/ranks';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function TabsLayout() {
  const { session, activeUser, activeMember } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const isActiveUserCoch = Boolean(activeUser && !activeUser.isSupervised && activeMember?.role === 'coch');
  const pendingCount =
    session && activeUser && !activeUser.isSupervised ? session.pendingInvitations.length : 0;

  const activePortrait = activeUser
    ? resolveCharacterPortrait(
        activeUser.avatarKey,
        getEffectiveArtTier(getRankInfo(activeUser.careerXp).artTier, activeUser.claimedArtTier)
      )
    : null;

  const profileTabTitle = activeUser?.name ? activeUser.name.slice(0, 12) : 'Profile';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.brandOrange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
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
          href: isActiveUserCoch ? undefined : null,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⚙</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: profileTabTitle,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.brandOrange,
            color: Colors.textPrimary,
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ focused, color }) =>
            activePortrait ? (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: focused ? 1.5 : 1,
                  borderColor: focused ? Colors.brandOrange : Colors.border,
                  backgroundColor: Colors.surfaceElevated,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={activePortrait}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Text style={{ color, fontSize: 16 }}>🛡</Text>
            ),
        }}
      />
    </Tabs>
  );
}
