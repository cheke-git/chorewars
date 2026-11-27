import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { CharacterPicker } from '@/components/CharacterPicker/CharacterPicker';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { generateStarterPlan } from '@/shared/templates';
import { AVATAR_PRESETS, normalizeAvatarKey, type HomeType } from '@/shared/types';

import { styles } from './FortWizardScreen.styles';

interface DraftMember {
  id: string;
  existingUserId?: string;
  name: string;
  role: 'reviewer' | 'recruit';
  isAdult: boolean;
  avatarKey: string;
}

const HOME_TYPES: { key: HomeType; label: string }[] = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'studio', label: 'Studio' },
];

export function FortWizardScreen() {
  const { session, setupFort, logout } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const hasExistingPin = Boolean(session?.user.hasGuardianPin);
  const hasExistingForts = (session?.forts.length ?? 0) > 0;
  const existingSupervised = session?.supervisedUsers ?? [];

  // Step 1: Home details
  const [fortName, setFortName] = useState('');
  const [homeType, setHomeType] = useState<HomeType>('house');
  const [bedroomCount, setBedroomCount] = useState(3);
  const [bathroomCount, setBathroomCount] = useState(2);
  const [hasKitchen, setHasKitchen] = useState(true);
  const [hasYard, setHasYard] = useState(true);
  const [hasPets, setHasPets] = useState(false);

  // Step 2: Squad & CoCh PIN
  const [cochName, setCochName] = useState(session?.user.name ?? 'Commander');
  const [cochAvatar, setCochAvatar] = useState(
    normalizeAvatarKey(session?.user.avatarKey ?? AVATAR_PRESETS[0].key)
  );
  const [cochPin, setCochPin] = useState('');
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>(
    existingSupervised.map((u) => u.id)
  );
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberIsAdult, setNewMemberIsAdult] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'reviewer' | 'recruit'>('recruit');
  const [newMemberAvatar, setNewMemberAvatar] = useState(AVATAR_PRESETS[2].key);

  // Step 3: Starter Goal Reward
  const [includeReward, setIncludeReward] = useState(true);
  const [rewardTitle, setRewardTitle] = useState('Ice cream on the weekend');
  const [rewardTargetXp, setRewardTargetXp] = useState('30');
  const [excludeAdultsFromReward, setExcludeAdultsFromReward] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const starterPlan = useMemo(
    () =>
      generateStarterPlan({
        homeType,
        bedroomCount,
        bathroomCount,
        hasKitchen,
        hasYard,
        hasPets,
      }),
    [homeType, bedroomCount, bathroomCount, hasKitchen, hasYard, hasPets]
  );

  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      setError('Enter a Character name to add.');
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: trimmed,
        role: newMemberRole,
        isAdult: newMemberIsAdult,
        avatarKey: newMemberAvatar,
      },
    ]);
    setNewMemberName('');
    setNewMemberIsAdult(false);
    setNewMemberRole('recruit');
    setNewMemberAvatar(AVATAR_PRESETS[(members.length + 2) % AVATAR_PRESETS.length].key);
    setError(null);
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (fortName.trim().length < 2) {
        setError('Give your Fort a name (at least 2 characters).');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!cochName.trim()) {
        setError('Enter a name for the Commander in Chief.');
        return;
      }
      if (!hasExistingPin && !/^\d{4}$/.test(cochPin)) {
        setError('Choose a 4-digit Guardian PIN (numbers only).');
        return;
      }
      if (cochPin.length > 0 && !/^\d{4}$/.test(cochPin)) {
        setError('Guardian PIN must be exactly 4 digits.');
        return;
      }
      setStep(3);
    }
  };

  const handleLaunchFort = async () => {
    setError(null);
    const parsedTargetXp = Number.parseInt(rewardTargetXp, 10);
    if (includeReward && (!Number.isFinite(parsedTargetXp) || parsedTargetXp < 5)) {
      setError('Goal XP must be at least 5.');
      return;
    }

    setSubmitting(true);
    try {
      const existingChosen = existingSupervised
        .filter((u) => selectedExistingIds.includes(u.id))
        .map((u) => ({
          existingUserId: u.id,
          name: u.name,
          role: 'recruit' as const,
          isAdult: u.isAdult,
          avatarKey: u.avatarKey,
        }));

      await setupFort({
        name: fortName.trim(),
        homeType,
        bedroomCount,
        bathroomCount,
        hasKitchen,
        hasYard,
        hasPets,
        cochName: cochName.trim(),
        cochAvatarKey: cochAvatar,
        cochPin: cochPin.length === 4 ? cochPin : undefined,
        supervisedMembers: [
          ...existingChosen,
          ...members.map((m) => ({
            name: m.name,
            role: m.role,
            isAdult: m.isAdult,
            avatarKey: m.avatarKey,
          })),
        ],
        starterReward: includeReward
          ? {
              title: rewardTitle.trim() || undefined,
              targetXp: parsedTargetXp,
              excludeAdults: excludeAdultsFromReward,
            }
          : undefined,
      });

      const hasKids = existingChosen.length + members.length > 0;
      router.replace(!hasExistingForts && hasKids ? '/profiles' : '/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up Fort.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.topRow}>
            <BrandLogo />
            <Pressable
              onPress={() => {
                if (hasExistingForts) {
                  router.replace('/(tabs)/profile');
                } else {
                  router.replace('/welcome');
                }
              }}
              style={styles.signOutBtn}>
              <Text style={styles.signOutText}>
                {hasExistingForts ? '← Back to Profile' : '← Back to Welcome'}
              </Text>
            </Pressable>
            {!hasExistingForts ? (
              <Pressable
                onPress={() => {
                  void logout();
                }}
                style={styles.signOutBtn}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.stepBar}>
            <Text style={styles.stepPill}>Step {step} of 3</Text>
            <Text style={styles.stepTitle}>
              {step === 1
                ? 'Build Your Fort'
                : step === 2
                  ? 'Assemble Your Squad'
                  : 'Review Missions & Goal'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Fort Name</Text>
                <TextInput
                  value={fortName}
                  onChangeText={setFortName}
                  placeholder="e.g., Fort Vega or Apt 4B"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Home Type</Text>
                <View style={styles.chipRow}>
                  {HOME_TYPES.map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => setHomeType(item.key)}
                      style={[styles.chip, homeType === item.key && styles.chipActive]}>
                      <Text
                        style={[styles.chipText, homeType === item.key && styles.chipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Bedrooms</Text>
                <View style={styles.counterControls}>
                  <Pressable
                    onPress={() => setBedroomCount((c) => Math.max(0, c - 1))}
                    style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{bedroomCount}</Text>
                  <Pressable
                    onPress={() => setBedroomCount((c) => Math.min(10, c + 1))}
                    style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Bathrooms</Text>
                <View style={styles.counterControls}>
                  <Pressable
                    onPress={() => setBathroomCount((c) => Math.max(0, c - 1))}
                    style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{bathroomCount}</Text>
                  <Pressable
                    onPress={() => setBathroomCount((c) => Math.min(8, c + 1))}
                    style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.counterLabel}>Has Kitchen</Text>
                <Switch
                  value={hasKitchen}
                  onValueChange={setHasKitchen}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.counterLabel}>Has Yard / Patio</Text>
                <Switch
                  value={hasYard}
                  onValueChange={setHasYard}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.counterLabel}>Has Pets</Text>
                <Switch
                  value={hasPets}
                  onValueChange={setHasPets}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Commander in Chief (CoCh)</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Commander Name</Text>
                <TextInput
                  value={cochName}
                  onChangeText={setCochName}
                  placeholder="Mom, Dad, or your name"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Choose Character</Text>
                <CharacterPicker selectedKey={cochAvatar} onSelect={setCochAvatar} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {hasExistingPin
                    ? '4-Digit Guardian PIN (optional — already set)'
                    : '4-Digit Guardian PIN (protects Fort settings)'}
                </Text>
                <TextInput
                  value={cochPin}
                  onChangeText={(value) => setCochPin(value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder={hasExistingPin ? 'Keep existing PIN' : '1234'}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  style={styles.input}
                />
              </View>

              {existingSupervised.length > 0 ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionHeading}>Include Your Supervised Kids</Text>
                  <View style={styles.chipRow}>
                    {existingSupervised.map((kid) => {
                      const picked = selectedExistingIds.includes(kid.id);
                      return (
                        <Pressable
                          key={kid.id}
                          onPress={() =>
                            setSelectedExistingIds((prev) =>
                              picked ? prev.filter((id) => id !== kid.id) : [...prev, kid.id]
                            )
                          }
                          style={[styles.chip, picked && styles.chipActive]}>
                          <Text style={[styles.chipText, picked && styles.chipTextActive]}>
                            {picked ? `✓ ${kid.name}` : kid.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Add Players (Netflix-Style Profiles)</Text>

              {members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <CharacterAvatar name={member.name} avatarKey={member.avatarKey} size="sm" />
                  <View style={styles.memberMeta}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberSub}>
                      {member.role === 'reviewer' ? 'Reviewer' : 'Recruit'} •{' '}
                      {member.isAdult ? 'Adult' : 'Kid'}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemoveMember(member.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Character Name</Text>
                <TextInput
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="e.g., Leo, Maya, Partner"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Choose Character</Text>
                <CharacterPicker selectedKey={newMemberAvatar} onSelect={setNewMemberAvatar} />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.counterLabel}>Adult Profile?</Text>
                <Switch
                  value={newMemberIsAdult}
                  onValueChange={setNewMemberIsAdult}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.counterLabel}>Can Review Chores?</Text>
                <Switch
                  value={newMemberRole === 'reviewer'}
                  onValueChange={(val) => setNewMemberRole(val ? 'reviewer' : 'recruit')}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>

              <PrimaryButton
                label="+ Add Character to Fort"
                variant="secondary"
                onPress={handleAddMember}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>
                Starter Blueprint ({starterPlan.areas.length} Areas, {starterPlan.tasks.length}{' '}
                Missions)
              </Text>
              <Text style={styles.helperText}>
                Generated from your home setup. All tasks start on the Honor System and can be
                edited anytime in Fort Command.
              </Text>

              <View style={styles.previewList}>
                {starterPlan.tasks.map((task, idx) => (
                  <View key={`${task.title}-${idx}`} style={styles.previewRow}>
                    <Text style={styles.previewTitle}>{task.title}</Text>
                    <Text style={styles.previewXp}>+{task.xp} XP</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <Text style={styles.sectionHeading}>Starter Goal Reward</Text>
                <Switch
                  value={includeReward}
                  onValueChange={setIncludeReward}
                  trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                />
              </View>

              {includeReward ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Goal XP Target</Text>
                    <TextInput
                      value={rewardTargetXp}
                      onChangeText={(v) => setRewardTargetXp(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="30"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Reward Name (optional — or tell them IRL!)</Text>
                    <TextInput
                      value={rewardTitle}
                      onChangeText={setRewardTitle}
                      placeholder="e.g., Ice cream on weekend road trip"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <Text style={styles.counterLabel}>Kids Only (Exclude Adults)</Text>
                    <Switch
                      value={excludeAdultsFromReward}
                      onValueChange={setExcludeAdultsFromReward}
                      trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                    />
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footerActions}>
            {step > 1 ? (
              <PrimaryButton
                label="Back"
                variant="secondary"
                disabled={submitting}
                onPress={() => setStep((s) => (s === 3 ? 2 : 1))}
              />
            ) : null}
            {step < 3 ? (
              <PrimaryButton label="Continue" variant="primary" onPress={handleNext} />
            ) : (
              <PrimaryButton
                label={submitting ? 'Launching Fort...' : 'Launch Fort'}
                variant="primary"
                disabled={submitting}
                onPress={handleLaunchFort}
              />
            )}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
