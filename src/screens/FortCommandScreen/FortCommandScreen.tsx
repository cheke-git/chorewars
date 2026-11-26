import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PinModal } from '@/components/PinModal/PinModal';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { AVATAR_PRESETS, type ProfileRole, type RecurrenceType } from '@/shared/types';

import { styles } from './FortCommandScreen.styles';

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'cooldown', label: 'Every 3d' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'one_off', label: 'One-Off' },
];

export function FortCommandScreen() {
  const {
    fortState,
    lockedProfileId,
    cochUnlocked,
    verifyCochPin,
    lockCoch,
    unlockDevice,
    logout,
    createArea,
    createTask,
    createProfile,
    createReward,
  } = useApp();

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAreaId, setTaskAreaId] = useState<string | null>(null);
  const [taskXp, setTaskXp] = useState('15');
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceType>('daily');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | null>(null);

  // Add Area form
  const [areaName, setAreaName] = useState('');
  const [areaXp, setAreaXp] = useState('15');

  // Add Profile form
  const [profileName, setProfileName] = useState('');
  const [profileAvatarKey, setProfileAvatarKey] = useState(AVATAR_PRESETS[2].key);
  const [profileIsAdult, setProfileIsAdult] = useState(false);
  const [profileRole, setProfileRole] = useState<ProfileRole>('recruit');

  // Add Reward form
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardTargetXp, setRewardTargetXp] = useState('50');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  if (!fortState) {
    return null;
  }

  const runAction = async (fn: () => Promise<void>, successText: string) => {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await fn();
      setStatusMessage(successText);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!cochUnlocked) {
    return (
      <FortBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lockedCenter}>
            <View style={styles.lockedCard}>
              <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
              <Text style={styles.lockedTitle}>Fort Command</Text>
              <Text style={styles.lockedDesc}>
                Protected by your 4-digit Commander in Chief PIN so recruits can&apos;t edit missions
                or rewards.
              </Text>
              <PrimaryButton
                label="Unlock with CoCh PIN"
                variant="primary"
                onPress={() => setPinModalOpen(true)}
              />
            </View>
          </View>

          <PinModal
            visible={pinModalOpen}
            onCancel={() => setPinModalOpen(false)}
            onVerify={async (pin) => {
              await verifyCochPin(pin);
              setPinModalOpen(false);
            }}
          />
        </SafeAreaView>
      </FortBackground>
    );
  }

  const toggleExcludedProfile = (id: string) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
              <Text style={styles.title}>Fort Command</Text>
            </View>
            <Pressable onPress={lockCoch} style={styles.lockBtn}>
              <Text style={styles.lockBtnText}>Lock</Text>
            </Pressable>
          </View>

          {statusMessage ? <Text style={styles.successBanner}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Mission</Text>
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g., Fold towels or Empty dishwasher"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Area (optional — General for area-less tasks)</Text>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setTaskAreaId(null)}
                style={[styles.chip, taskAreaId === null && styles.chipActive]}>
                <Text style={[styles.chipText, taskAreaId === null && styles.chipTextActive]}>
                  General
                </Text>
              </Pressable>
              {fortState.areas.map((area) => (
                <Pressable
                  key={area.id}
                  onPress={() => {
                    setTaskAreaId(area.id);
                    setTaskXp(String(area.defaultXp));
                  }}
                  style={[styles.chip, taskAreaId === area.id && styles.chipActive]}>
                  <Text
                    style={[styles.chipText, taskAreaId === area.id && styles.chipTextActive]}>
                    {area.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>XP Value</Text>
            <TextInput
              value={taskXp}
              onChangeText={(v) => setTaskXp(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Cadence</Text>
            <View style={styles.chipRow}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setTaskRecurrence(opt.key)}
                  style={[styles.chip, taskRecurrence === opt.key && styles.chipActive]}>
                  <Text
                    style={[styles.chipText, taskRecurrence === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Assign To (or leave Open)</Text>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setTaskAssigneeId(null)}
                style={[styles.chip, taskAssigneeId === null && styles.chipActive]}>
                <Text style={[styles.chipText, taskAssigneeId === null && styles.chipTextActive]}>
                  Anyone (Open)
                </Text>
              </Pressable>
              {fortState.profiles.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setTaskAssigneeId(p.id)}
                  style={[styles.chip, taskAssigneeId === p.id && styles.chipActive]}>
                  <Text style={[styles.chipText, taskAssigneeId === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton
              label={saving ? 'Saving...' : 'Add Mission'}
              variant="primary"
              disabled={saving || !taskTitle.trim()}
              onPress={() =>
                runAction(async () => {
                  await createTask({
                    title: taskTitle.trim(),
                    areaId: taskAreaId,
                    xp: Math.max(1, Number.parseInt(taskXp, 10) || 10),
                    recurrenceType: taskRecurrence,
                    cooldownDays: taskRecurrence === 'cooldown' ? 3 : null,
                    assignedProfileId: taskAssigneeId,
                  });
                  setTaskTitle('');
                }, 'Mission added to the Battle Board!')
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Goal Reward</Text>
            <TextInput
              value={rewardTitle}
              onChangeText={setRewardTitle}
              placeholder="Optional reward label (or keep it an IRL surprise)"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>XP Target</Text>
            <TextInput
              value={rewardTargetXp}
              onChangeText={(v) => setRewardTargetXp(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Exclude from this reward (tap to exclude)</Text>
            <View style={styles.chipRow}>
              {fortState.profiles.map((p) => {
                const isExcluded = excludedIds.includes(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => toggleExcludedProfile(p.id)}
                    style={[styles.chip, isExcluded && styles.chipExcluded]}>
                    <Text style={[styles.chipText, isExcluded && styles.chipTextActive]}>
                      {isExcluded ? `Excluded: ${p.name}` : p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton
              label={saving ? 'Saving...' : 'Create Goal Reward'}
              variant="secondary"
              disabled={saving}
              onPress={() =>
                runAction(async () => {
                  await createReward({
                    title: rewardTitle.trim() || undefined,
                    targetXp: Math.max(5, Number.parseInt(rewardTargetXp, 10) || 20),
                    excludedProfileIds: excludedIds,
                  });
                  setRewardTitle('');
                  setExcludedIds([]);
                }, 'Goal Reward created!')
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Area</Text>
            <TextInput
              value={areaName}
              onChangeText={setAreaName}
              placeholder="e.g., Garage, Playroom, Laundry"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Suggested Default XP</Text>
            <TextInput
              value={areaXp}
              onChangeText={(v) => setAreaXp(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
            />
            <PrimaryButton
              label={saving ? 'Saving...' : 'Add Area'}
              variant="secondary"
              disabled={saving || !areaName.trim()}
              onPress={() =>
                runAction(async () => {
                  await createArea(areaName.trim(), Math.max(5, Number.parseInt(areaXp, 10) || 15));
                  setAreaName('');
                }, 'Area added!')
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Character Profile</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Character name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Character Archetype</Text>
            <View style={styles.chipRow}>
              {AVATAR_PRESETS.map((preset) => (
                <Pressable
                  key={preset.key}
                  onPress={() => {
                    setProfileAvatarKey(preset.key);
                    setProfileIsAdult(preset.defaultIsAdult);
                  }}
                  style={[styles.chip, profileAvatarKey === preset.key && styles.chipActive]}>
                  <Text
                    style={[
                      styles.chipText,
                      profileAvatarKey === preset.key && styles.chipTextActive,
                    ]}>
                    {preset.shortLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Adult Profile?</Text>
              <Switch
                value={profileIsAdult}
                onValueChange={setProfileIsAdult}
                trackColor={{ false: Colors.border, true: Colors.brandOrange }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Reviewer Role?</Text>
              <Switch
                value={profileRole === 'reviewer'}
                onValueChange={(val) => setProfileRole(val ? 'reviewer' : 'recruit')}
                trackColor={{ false: Colors.border, true: Colors.brandOrange }}
              />
            </View>
            <PrimaryButton
              label={saving ? 'Saving...' : 'Add Character'}
              variant="secondary"
              disabled={saving || !profileName.trim()}
              onPress={() =>
                runAction(async () => {
                  await createProfile({
                    name: profileName.trim(),
                    role: profileRole,
                    isAdult: profileIsAdult,
                    avatarKey: profileAvatarKey,
                  });
                  setProfileName('');
                }, 'Character added to the Fort!')
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Device & Account</Text>
            {lockedProfileId ? (
              <PrimaryButton
                label="Unlock Device Profile Binding"
                variant="secondary"
                onPress={() =>
                  runAction(async () => {
                    await unlockDevice();
                  }, 'Device unlocked—profile picker will show again.')
                }
              />
            ) : null}
            <PrimaryButton
              label="Switch Active Character"
              variant="secondary"
              onPress={() => router.push('/profiles')}
            />
            <PrimaryButton
              label="Sign Out of Fort Account"
              variant="secondary"
              onPress={async () => {
                await logout();
                router.replace('/');
              }}
            />
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
