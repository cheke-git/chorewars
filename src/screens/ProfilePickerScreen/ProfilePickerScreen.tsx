import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRankInfo } from '@/shared/types';

import { styles } from './ProfilePickerScreen.styles';

export function ProfilePickerScreen() {
  const { session, fortState, selectActiveUser, lockedUserId, unlockDevice } = useApp();
  const [lockOnSelect, setLockOnSelect] = useState(Boolean(lockedUserId));

  if (!session) {
    return null;
  }

  const familyProfiles = [session.user, ...session.supervisedUsers];

  const handleChoose = async (userId: string) => {
    await selectActiveUser(userId, lockOnSelect);
    router.replace('/(tabs)');
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <BrandLogo />

            <View style={styles.header}>
              <Text style={styles.fortName}>{fortState?.fort.name ?? 'Your Squad'}</Text>
              <Text style={styles.title}>Who&apos;s Playing?</Text>
              <Text style={styles.subtitle}>Pick your Character to enter the Battle Board.</Text>
            </View>

            <View style={styles.grid}>
              {familyProfiles.map((profile) => {
                const rank = getRankInfo(profile.careerXp);
                const isLockedHere = lockedUserId === profile.id;
                return (
                  <Pressable
                    key={profile.id}
                    onPress={() => handleChoose(profile.id)}
                    style={({ pressed }) => [
                      styles.profileCard,
                      pressed && styles.profileCardPressed,
                      isLockedHere && styles.profileCardLocked,
                    ]}>
                    <CharacterAvatar
                      name={profile.name}
                      avatarKey={profile.avatarKey}
                      avatarUrl={profile.avatarUrl}
                      xpTotal={profile.careerXp}
                      claimedArtTier={profile.claimedArtTier}
                      size="xl"
                      variant="hero"
                      highlighted={!profile.isSupervised}
                      showTierBadge
                    />
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileRank}>{rank.title}</Text>
                    <Text style={styles.profileXp}>{profile.careerXp} XP</Text>
                    <Text style={styles.roleTag}>
                      {profile.isSupervised ? 'Supervised' : 'Guardian'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.lockBox}>
              <View style={styles.lockTextCol}>
                <Text style={styles.lockTitle}>Lock this device to selected player</Text>
                <Text style={styles.lockSub}>
                  Great for personal phones—skips this screen next time.
                </Text>
              </View>
              <Switch
                value={lockOnSelect}
                onValueChange={async (val) => {
                  setLockOnSelect(val);
                  if (!val && lockedUserId) {
                    await unlockDevice();
                  }
                }}
                trackColor={{ false: Colors.border, true: Colors.brandOrange }}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
