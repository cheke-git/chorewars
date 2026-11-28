import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterPicker } from '@/components/CharacterPicker/CharacterPicker';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PinEntryCard } from '@/components/PinModal/PinModal';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { AVATAR_PRESETS, type RecurrenceType } from '@/shared/types';

import { styles } from './FortCommandScreen.styles';

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'cooldown', label: 'Every 3d' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'on_demand', label: 'Anytime' },
  { key: 'one_off', label: 'One-Off' },
];

export function FortCommandScreen() {
  const {
    session,
    fortState,
    cochUnlocked,
    isCochOfCurrentFort,
    verifyGuardianPin,
    lockCoch,
    updateMe,
    createArea,
    createTask,
    createSupervisedUser,
    createReward,
  } = useApp();

  const { showSuccess, showError } = useToast();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

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

  // Add Supervised Profile form
  const [profileName, setProfileName] = useState('');
  const [profileAvatarKey, setProfileAvatarKey] = useState(AVATAR_PRESETS[2].key);
  const [profileIsAdult, setProfileIsAdult] = useState(false);
  const [profileRole, setProfileRole] = useState<'reviewer' | 'recruit'>('recruit');

  // Add Reward form
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardTargetXp, setRewardTargetXp] = useState('50');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // Update Guardian PIN form
  const [newPin, setNewPin] = useState('');

  if (!fortState) {
    return null;
  }

  const runAction = async (fn: () => Promise<void>, successText: string) => {
    setSaving(true);
    try {
      await fn();
      showSuccess(successText);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!isCochOfCurrentFort) {
    return (
      <FortBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lockedCenter}>
            <View style={styles.lockedCard}>
              <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
              <Text style={styles.lockedTitle}>Commander Access Only</Text>
              <Text style={styles.lockedDesc}>
                Only a Commander in Chief (CoCh) of {fortState.fort.name} can edit this Fort&apos;s
                missions, areas, and rewards.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </FortBackground>
    );
  }

  if (!cochUnlocked) {
    return (
      <FortBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lockedCenter}>
            <PinEntryCard
              fortName={fortState.fort.name}
              title="Fort Command"
              subtitle="Enter your 4-digit Guardian PIN to unlock missions, areas, and rewards."
              autoFocusTrigger={isFocused}
              onVerify={verifyGuardianPin}
            />
          </View>
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
              {fortState.members.map((p) => (
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
                    assignedUserId: taskAssigneeId,
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
              {fortState.members.map((p) => {
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
                    excludedUserIds: excludedIds,
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
            <Text style={styles.cardTitle}>Add Supervised Character</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Character name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Choose Character</Text>
            <CharacterPicker selectedKey={profileAvatarKey} onSelect={setProfileAvatarKey} />
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
                  await createSupervisedUser({
                    name: profileName.trim(),
                    role: profileRole,
                    isAdult: profileIsAdult,
                    avatarKey: profileAvatarKey,
                    fortId: fortState.fort.id,
                  });
                  setProfileName('');
                }, 'Character added to the Fort!')
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Guardian PIN Security</Text>
            <Text style={styles.label}>
              {session?.user.hasGuardianPin
                ? 'Change 4-Digit Guardian PIN'
                : 'Set 4-Digit Guardian PIN'}
            </Text>
            <TextInput
              value={newPin}
              onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="New 4-digit PIN"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={styles.input}
            />
            <PrimaryButton
              label={saving ? 'Updating...' : 'Update Guardian PIN'}
              variant="secondary"
              disabled={saving || newPin.length !== 4}
              onPress={() =>
                runAction(async () => {
                  await updateMe({ guardianPin: newPin });
                  setNewPin('');
                }, 'Guardian PIN updated!')
              }
            />
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
