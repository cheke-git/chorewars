import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRankInfo } from '@/shared/types';

import { styles } from './ProfilePickerScreen.styles';

export function ProfilePickerScreen() {
  const { fortState, selectProfile, lockedProfileId, unlockDevice } = useApp();
  const [lockOnSelect, setLockOnSelect] = useState(Boolean(lockedProfileId));

  if (!fortState) {
    return null;
  }

  const handleChoose = async (profileId: string) => {
    await selectProfile(profileId, lockOnSelect);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <BrandLogo />

          <View style={styles.header}>
            <Text style={styles.fortName}>{fortState.fort.name}</Text>
            <Text style={styles.title}>Who&apos;s Playing?</Text>
            <Text style={styles.subtitle}>Pick your Character to enter the Battle Board.</Text>
          </View>

          <View style={styles.grid}>
            {fortState.profiles.map((profile) => {
              const rank = getRankInfo(profile.xpTotal);
              const isLockedHere = lockedProfileId === profile.id;
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
                    size="lg"
                    highlighted={profile.role === 'coch'}
                  />
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileRank}>{rank.title}</Text>
                  <Text style={styles.profileXp}>{profile.xpTotal} XP</Text>
                  {profile.role === 'coch' ? (
                    <Text style={styles.roleTag}>CoCh</Text>
                  ) : profile.role === 'reviewer' ? (
                    <Text style={styles.roleTag}>Reviewer</Text>
                  ) : null}
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
                if (!val && lockedProfileId) {
                  await unlockDevice();
                }
              }}
              trackColor={{ false: Colors.border, true: Colors.brandOrange }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
