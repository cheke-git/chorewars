import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { CharacterPicker } from '@/components/CharacterPicker/CharacterPicker';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { TaskArtBadge } from '@/components/TaskArtBadge/TaskArtBadge';
import { TaskArtPicker } from '@/components/TaskArtPicker/TaskArtPicker';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { generateStarterPlan, type StarterTaskTemplate } from '@/shared/templates';
import {
  AVATAR_PRESETS,
  formatRecurrence,
  normalizeAvatarKey,
  type HomeType,
  type RecurrenceType,
} from '@/shared/types';

import { styles } from './FortWizardScreen.styles';

interface DraftMember {
  id: string;
  name: string;
  role: 'reviewer' | 'recruit';
  isAdult: boolean;
  avatarKey: string;
}

interface DraftGoal {
  id: string;
  title: string;
  targetXp: string;
  excludeAdults: boolean;
}

interface DraftStarterTask extends StarterTaskTemplate {
  id: string;
}

const HOME_TYPES: { key: HomeType; label: string }[] = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'studio', label: 'Studio' },
];

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'cooldown', label: 'Every 3d' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'on_demand', label: 'Anytime' },
  { key: 'one_off', label: 'One-Off' },
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
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([]);
  const [members, setMembers] = useState<DraftMember[]>([]);

  // Step 3: Editable Starter Missions & Multiple Goals
  const planFingerprint = `${homeType}-${bedroomCount}-${bathroomCount}-${hasKitchen}-${hasYard}-${hasPets}`;
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

  const [customTasksState, setCustomTasksState] = useState<{
    fingerprint: string;
    tasks: DraftStarterTask[];
  } | null>(null);

  const draftTasks: DraftStarterTask[] = useMemo(() => {
    if (customTasksState && customTasksState.fingerprint === planFingerprint) {
      return customTasksState.tasks;
    }
    return starterPlan.tasks.map((task, idx) => ({
      ...task,
      id: `${planFingerprint}-${idx}`,
    }));
  }, [customTasksState, planFingerprint, starterPlan.tasks]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskXp, setEditTaskXp] = useState('15');
  const [editTaskCategoryKey, setEditTaskCategoryKey] = useState('custom');
  const [editTaskRecurrence, setEditTaskRecurrence] = useState<RecurrenceType>('daily');
  const [editTaskAreaKey, setEditTaskAreaKey] = useState<string | null>(null);

  const [goals, setGoals] = useState<DraftGoal[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const areaNameByTempKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const area of starterPlan.areas) {
      map.set(area.tempKey, area.name);
    }
    return map;
  }, [starterPlan.areas]);

  const updateDraftTasks = (updater: (prev: DraftStarterTask[]) => DraftStarterTask[]) => {
    setCustomTasksState({
      fingerprint: planFingerprint,
      tasks: updater(draftTasks),
    });
  };

  const handleStartEditTask = (task: DraftStarterTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskXp(String(task.xp));
    setEditTaskCategoryKey(task.categoryKey);
    setEditTaskRecurrence(task.recurrenceType);
    setEditTaskAreaKey(task.areaTempKey);
    setError(null);
  };

  const handleSaveEditTask = () => {
    if (!editingTaskId) return;
    const trimmed = editTaskTitle.trim();
    if (!trimmed) {
      setError('Mission title cannot be empty.');
      return;
    }
    const parsedXp = Math.max(1, Number.parseInt(editTaskXp, 10) || 10);
    updateDraftTasks((prev) =>
      prev.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: trimmed,
              xp: parsedXp,
              categoryKey: editTaskCategoryKey,
              recurrenceType: editTaskRecurrence,
              cooldownDays: editTaskRecurrence === 'cooldown' ? (task.cooldownDays ?? 3) : null,
              areaTempKey: editTaskAreaKey,
            }
          : task
      )
    );
    setEditingTaskId(null);
    setError(null);
  };

  const handleRemoveTask = (taskId: string) => {
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
    updateDraftTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleAddMemberCard = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: '',
        role: 'recruit',
        isAdult: false,
        avatarKey: AVATAR_PRESETS[(prev.length + 2) % AVATAR_PRESETS.length].key,
      },
    ]);
    setError(null);
  };

  const handleUpdateMember = (id: string, patch: Partial<Omit<DraftMember, 'id'>>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setError(null);
  };

  const handleAddGoalCard = () => {
    setGoals((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        title: '',
        targetXp: prev.length === 0 ? '30' : '50',
        excludeAdults: true,
      },
    ]);
    setError(null);
  };

  const handleUpdateGoal = (id: string, patch: Partial<Omit<DraftGoal, 'id'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const handleRemoveGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setError(null);
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
      if (members.some((m) => !m.name.trim())) {
        setError('Enter a name for each added player, or remove any blank card.');
        return;
      }
      setStep(3);
    }
  };

  const handleLaunchFort = async () => {
    setError(null);

    const parsedGoals: { title?: string; targetXp: number; excludeAdults: boolean }[] = [];
    for (const goal of goals) {
      const parsedXp = Number.parseInt(goal.targetXp, 10);
      if (!Number.isFinite(parsedXp) || parsedXp < 5) {
        setError('Every Goal XP Target must be at least 5 (or remove unused goals).');
        return;
      }
      parsedGoals.push({
        title: goal.title.trim() || undefined,
        targetXp: parsedXp,
        excludeAdults: goal.excludeAdults,
      });
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
            name: m.name.trim(),
            role: m.role,
            isAdult: m.isAdult,
            avatarKey: m.avatarKey,
          })),
        ],
        starterTasks: draftTasks.map((t) => ({
          areaTempKey: t.areaTempKey,
          title: t.title,
          categoryKey: t.categoryKey,
          xp: t.xp,
          recurrenceType: t.recurrenceType,
          cooldownDays: t.cooldownDays,
        })),
        starterRewards: parsedGoals,
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
                    : 'Review Missions & Goals'}
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
                    <Text style={styles.sectionHeading}>Supervised Accounts</Text>
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
                <Text style={styles.sectionHeading}>Players</Text>

                {members.map((member, index) => (
                  <View key={member.id} style={styles.inlineFormBox}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>New Character Name</Text>
                      <TextInput
                        value={member.name}
                        onChangeText={(value) => handleUpdateMember(member.id, { name: value })}
                        placeholder="e.g., Leo, Maya, Partner"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus={index === members.length - 1}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Choose Character</Text>
                      <CharacterPicker
                        selectedKey={member.avatarKey}
                        onSelect={(key) => handleUpdateMember(member.id, { avatarKey: key })}
                      />
                    </View>

                    <View style={styles.toggleRow}>
                      <Text style={styles.counterLabel}>Adult Profile?</Text>
                      <Switch
                        value={member.isAdult}
                        onValueChange={(value) => handleUpdateMember(member.id, { isAdult: value })}
                        trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                      />
                    </View>

                    <View style={styles.toggleRow}>
                      <Text style={styles.counterLabel}>Can Review Chores?</Text>
                      <Switch
                        value={member.role === 'reviewer'}
                        onValueChange={(val) =>
                          handleUpdateMember(member.id, { role: val ? 'reviewer' : 'recruit' })
                        }
                        trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                      />
                    </View>

                    <Pressable
                      onPress={() => handleRemoveMember(member.id)}
                      style={styles.removeCardBtn}
                      accessibilityRole="button">
                      <Feather name="trash-2" size={14} color={Colors.error} />
                      <Text style={styles.removeCardBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}

                <PrimaryButton
                  label={members.length > 0 ? '+ Add Another Player' : '+ Add Player'}
                  variant="secondary"
                  onPress={handleAddMemberCard}
                />
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>
                  Starter Missions ({starterPlan.areas.length} Areas, {draftTasks.length} Missions)
                </Text>
                <Text style={styles.helperText}>
                  Generated from your home setup. Edit or remove any mission below—you can also
                  adjust them anytime in Fort Command.
                </Text>

                {draftTasks.length === 0 ? (
                  <Text style={styles.helperText}>
                    No starter missions selected. You can add missions anytime in Fort Command.
                  </Text>
                ) : (
                  <View style={styles.previewList}>
                    {draftTasks.map((task) => {
                      const isEditing = editingTaskId === task.id;
                      const areaLabel = task.areaTempKey
                        ? (areaNameByTempKey.get(task.areaTempKey) ?? 'General')
                        : 'General';

                      if (isEditing) {
                        return (
                          <View key={task.id} style={styles.inlineFormBox}>
                            <View style={styles.fieldGroup}>
                              <Text style={styles.label}>Title</Text>
                              <TextInput
                                value={editTaskTitle}
                                onChangeText={setEditTaskTitle}
                                placeholder="Mission title"
                                placeholderTextColor={Colors.textMuted}
                                maxLength={80}
                                style={styles.input}
                              />
                            </View>

                            <View style={styles.fieldGroup}>
                              <Text style={styles.label}>XP Value</Text>
                              <TextInput
                                value={editTaskXp}
                                onChangeText={(v) => setEditTaskXp(v.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={4}
                                style={styles.input}
                              />
                            </View>

                            <View style={styles.fieldGroup}>
                              <Text style={styles.label}>Illustration</Text>
                              <TaskArtPicker
                                selectedKey={editTaskCategoryKey}
                                onSelect={setEditTaskCategoryKey}
                              />
                            </View>

                            <View style={styles.fieldGroup}>
                              <Text style={styles.label}>Area</Text>
                              <View style={styles.chipRow}>
                                <Pressable
                                  onPress={() => setEditTaskAreaKey(null)}
                                  style={[
                                    styles.chipCompact,
                                    editTaskAreaKey === null && styles.chipActive,
                                  ]}>
                                  <Text
                                    style={[
                                      styles.chipCompactText,
                                      editTaskAreaKey === null && styles.chipTextActive,
                                    ]}>
                                    General
                                  </Text>
                                </Pressable>
                                {starterPlan.areas.map((area) => (
                                  <Pressable
                                    key={area.tempKey}
                                    onPress={() => setEditTaskAreaKey(area.tempKey)}
                                    style={[
                                      styles.chipCompact,
                                      editTaskAreaKey === area.tempKey && styles.chipActive,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.chipCompactText,
                                        editTaskAreaKey === area.tempKey && styles.chipTextActive,
                                      ]}>
                                      {area.name}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>

                            <View style={styles.fieldGroup}>
                              <Text style={styles.label}>Cadence</Text>
                              <View style={styles.chipRow}>
                                {RECURRENCE_OPTIONS.map((opt) => (
                                  <Pressable
                                    key={opt.key}
                                    onPress={() => setEditTaskRecurrence(opt.key)}
                                    style={[
                                      styles.chipCompact,
                                      editTaskRecurrence === opt.key && styles.chipActive,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.chipCompactText,
                                        editTaskRecurrence === opt.key && styles.chipTextActive,
                                      ]}>
                                      {opt.label}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>

                            <View style={styles.inlineFormActions}>
                              <PrimaryButton
                                label="Cancel"
                                variant="secondary"
                                onPress={() => setEditingTaskId(null)}
                              />
                              <PrimaryButton
                                label="Save"
                                variant="primary"
                                onPress={handleSaveEditTask}
                              />
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={task.id} style={styles.previewRow}>
                          <TaskArtBadge categoryKey={task.categoryKey} size="sm" />
                          <View style={styles.previewMeta}>
                            <Text style={styles.previewTitle}>{task.title}</Text>
                            <Text style={styles.previewSub}>
                              {areaLabel} • {formatRecurrence(task.recurrenceType, task.cooldownDays)}
                            </Text>
                          </View>
                          <Text style={styles.previewXp}>+{task.xp} XP</Text>
                          <Pressable
                            onPress={() => handleStartEditTask(task)}
                            style={styles.rowIconBtn}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${task.title}`}>
                            <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemoveTask(task.id)}
                            style={styles.rowIconBtnDanger}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${task.title}`}>
                            <Feather name="trash-2" size={14} color={Colors.error} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionHeading}>Goals</Text>
                <Text style={styles.helperText}>
                  Optional XP milestones that unlock rewards (or IRL surprises) for your squad.
                </Text>

                {goals.map((goal, index) => (
                  <View key={goal.id} style={styles.inlineFormBox}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Goal XP Target</Text>
                      <TextInput
                        value={goal.targetXp}
                        onChangeText={(v) =>
                          handleUpdateGoal(goal.id, { targetXp: v.replace(/[^0-9]/g, '') })
                        }
                        keyboardType="number-pad"
                        placeholder="30"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus={index === goals.length - 1}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Reward Name (optional — or tell them IRL!)</Text>
                      <TextInput
                        value={goal.title}
                        onChangeText={(value) => handleUpdateGoal(goal.id, { title: value })}
                        placeholder="e.g., Ice cream on weekend road trip"
                        placeholderTextColor={Colors.textMuted}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.toggleRow}>
                      <Text style={styles.counterLabel}>Kids Only (Exclude Adults)</Text>
                      <Switch
                        value={goal.excludeAdults}
                        onValueChange={(value) =>
                          handleUpdateGoal(goal.id, { excludeAdults: value })
                        }
                        trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                      />
                    </View>

                    <Pressable
                      onPress={() => handleRemoveGoal(goal.id)}
                      style={styles.removeCardBtn}
                      accessibilityRole="button">
                      <Feather name="trash-2" size={14} color={Colors.error} />
                      <Text style={styles.removeCardBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}

                <PrimaryButton
                  label={goals.length > 0 ? '+ Add Another Goal' : '+ Add Goal'}
                  variant="secondary"
                  onPress={handleAddGoalCard}
                />
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
