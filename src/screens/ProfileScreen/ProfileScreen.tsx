import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { CharacterPicker } from '@/components/CharacterPicker/CharacterPicker';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PinModal } from '@/components/PinModal/PinModal';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRankInfo, normalizeAvatarKey } from '@/shared/types';

import { styles } from './ProfileScreen.styles';

export function ProfileScreen() {
  const {
    session,
    activeUser,
    activeFortId,
    availableFortsForActiveUser,
    lockedUserId,
    refreshFort,
    selectFort,
    updateMe,
    updateUser,
    joinFort,
    leaveFort,
    respondToInvitation,
    unlockDevice,
    verifyGuardianPin,
    logout,
  } = useApp();

  const [nameDraft, setNameDraft] = useState<{ userId: string; value: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<{ userId: string; key: string } | null>(null);
  const [avatarPickerUserId, setAvatarPickerUserId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [selectedJoinUserIds, setSelectedJoinUserIds] = useState<string[] | null>(null);
  const [inviteUserSelection, setInviteUserSelection] = useState<Record<string, string[]>>({});
  const [unlockPinModalOpen, setUnlockPinModalOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!session || !activeUser) {
    return null;
  }

  const savedAvatar = normalizeAvatarKey(activeUser.avatarKey);
  const isEditingName = nameDraft?.userId === activeUser.id;
  const displayedName = isEditingName ? nameDraft.value : activeUser.name;
  const displayedAvatar =
    avatarPreview?.userId === activeUser.id ? avatarPreview.key : savedAvatar;
  const isAvatarPickerOpen = avatarPickerUserId === activeUser.id;
  const effectiveJoinUserIds = selectedJoinUserIds ?? [session.user.id];

  const isActingAsGuardian = !activeUser.isSupervised;
  const familyUsers = [session.user, ...session.supervisedUsers];
  const rank = getRankInfo(activeUser.careerXp);

  const runAction = async (fn: () => Promise<void>, successText: string) => {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await fn();
      setStatusMessage(successText);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const toggleIdInList = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  const getSelectedForInvite = (inviteId: string): string[] =>
    inviteUserSelection[inviteId] ?? [session.user.id];

  const saveCharacterField = async (payload: { name?: string; avatarKey?: string }) => {
    if (activeUser.id === session.user.id) {
      await updateMe(payload);
    } else {
      await updateUser(activeUser.id, payload);
    }
  };

  const handleCommitName = async () => {
    if (!isEditingName) return;
    const trimmed = nameDraft.value.trim();
    if (!trimmed) return;
    if (trimmed === activeUser.name) {
      setNameDraft(null);
      return;
    }
    await runAction(async () => {
      await saveCharacterField({ name: trimmed });
      setNameDraft(null);
    }, 'Name updated!');
  };

  const handleSelectAvatar = async (key: string) => {
    setAvatarPickerUserId(null);
    if (key === savedAvatar) {
      return;
    }
    setAvatarPreview({ userId: activeUser.id, key });
    await runAction(async () => {
      try {
        await saveCharacterField({ avatarKey: key });
      } finally {
        setAvatarPreview(null);
      }
    }, 'Portrait updated!');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFort();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.brandOrange}
            />
          }>
          <View style={styles.container}>
            <View style={styles.heroCard}>
              {isActingAsGuardian ? (
                <Pressable
                  onPress={() => {
                    void logout();
                  }}
                  style={styles.logoutIconBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Sign Out">
                  <Feather name="log-out" size={19} color={Colors.error} />
                </Pressable>
              ) : null}

              {!lockedUserId && familyUsers.length > 1 ? (
                <Pressable
                  onPress={() => router.push('/profiles')}
                  style={styles.switchIconBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Switch Character">
                  <Feather name="refresh-cw" size={19} color={Colors.textPrimary} />
                </Pressable>
              ) : null}

              <Pressable
                onPress={() =>
                  setAvatarPickerUserId(isAvatarPickerOpen ? null : activeUser.id)
                }
                style={styles.avatarStage}
                accessibilityRole="button"
                accessibilityLabel="Change character portrait">
                <CharacterAvatar
                  name={displayedName || activeUser.name}
                  avatarKey={displayedAvatar}
                  avatarUrl={activeUser.avatarUrl}
                  xpTotal={activeUser.careerXp}
                  size="xl"
                  variant="hero"
                  highlighted={!activeUser.isSupervised}
                  showTierBadge
                />
                <View
                  style={[
                    styles.avatarEditBadge,
                    isAvatarPickerOpen && styles.avatarEditBadgeActive,
                  ]}>
                  <Feather name="edit-2" size={13} color={Colors.textPrimary} />
                </View>
              </Pressable>

              {isEditingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    value={displayedName}
                    onChangeText={(value) => setNameDraft({ userId: activeUser.id, value })}
                    placeholder="Your hero name"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={40}
                    autoFocus
                    editable={!saving}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleCommitName();
                    }}
                    style={styles.nameInput}
                  />
                  <Pressable
                    disabled={saving || !displayedName.trim()}
                    onPress={() => {
                      void handleCommitName();
                    }}
                    style={[
                      styles.nameDoneBtn,
                      (saving || !displayedName.trim()) && styles.iconBtnDisabled,
                    ]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Save display name">
                    <Feather name="check" size={18} color={Colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    disabled={saving}
                    onPress={() => setNameDraft(null)}
                    style={styles.nameCancelBtn}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing name">
                    <Feather name="x" size={18} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setNameDraft({ userId: activeUser.id, value: activeUser.name })}
                  style={styles.nameRow}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Edit display name">
                  <Text style={styles.heroName}>{activeUser.name}</Text>
                  <View style={styles.inlineEditBadge}>
                    <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                  </View>
                </Pressable>
              )}

              <Text style={styles.heroRank}>
                {rank.title} • {activeUser.careerXp} Career XP
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(6, Math.round(rank.progress * 100))}%`,
                      backgroundColor: rank.frameColor,
                    },
                  ]}
                />
              </View>
              {rank.nextTitle && rank.nextXp ? (
                <Text style={styles.nextRankText}>
                  {rank.nextXp - activeUser.careerXp} XP to {rank.nextTitle}
                </Text>
              ) : null}

              {isAvatarPickerOpen ? (
                <View style={styles.avatarAccordion}>
                  <View style={styles.avatarAccordionHeader}>
                    <Text style={styles.avatarAccordionTitle}>Choose Portrait</Text>
                    <Pressable
                      onPress={() => setAvatarPickerUserId(null)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Close portrait picker">
                      <Feather name="chevron-up" size={20} color={Colors.textSecondary} />
                    </Pressable>
                  </View>
                  <CharacterPicker
                    selectedKey={displayedAvatar}
                    onSelect={(key) => {
                      void handleSelectAvatar(key);
                    }}
                  />
                </View>
              ) : null}
            </View>

            {statusMessage ? <Text style={styles.successBanner}>{statusMessage}</Text> : null}
            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            {/* Pending Invitations (Guardian / Full Account only) */}
            {isActingAsGuardian && session.pendingInvitations.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Pending Invitations ({session.pendingInvitations.length})
                </Text>
                {session.pendingInvitations.map((inv) => {
                  const chosenIds = getSelectedForInvite(inv.id);
                  return (
                    <View key={inv.id} style={styles.inviteBox}>
                      <Text style={styles.inviteFort}>{inv.fortName}</Text>
                      <Text style={styles.inviteMeta}>
                        From {inv.invitedByName} • Role: {inv.role.toUpperCase()}
                      </Text>
                      {inv.note ? <Text style={styles.inviteNote}>&ldquo;{inv.note}&rdquo;</Text> : null}

                      {familyUsers.length > 1 ? (
                        <>
                          <Text style={styles.label}>Who is joining?</Text>
                          <View style={styles.chipRow}>
                            {familyUsers.map((u) => {
                              const picked = chosenIds.includes(u.id);
                              return (
                                <Pressable
                                  key={u.id}
                                  onPress={() =>
                                    setInviteUserSelection((prev) => ({
                                      ...prev,
                                      [inv.id]: toggleIdInList(chosenIds, u.id),
                                    }))
                                  }
                                  style={[styles.chip, picked && styles.chipActive]}>
                                  <Text style={[styles.chipText, picked && styles.chipTextActive]}>
                                    {u.name}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      ) : null}

                      <View style={styles.rowActions}>
                        <PrimaryButton
                          label="Decline"
                          variant="secondary"
                          disabled={saving}
                          onPress={() =>
                            runAction(async () => {
                              await respondToInvitation(inv.id, 'decline');
                            }, `Declined invitation to ${inv.fortName}.`)
                          }
                        />
                        <PrimaryButton
                          label="Accept"
                          variant="primary"
                          disabled={saving || chosenIds.length === 0}
                          onPress={() =>
                            runAction(async () => {
                              await respondToInvitation(inv.id, 'accept', chosenIds);
                            }, `Joined ${inv.fortName}!`)
                          }
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* My Forts */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>My Forts ({availableFortsForActiveUser.length})</Text>
              {availableFortsForActiveUser.map((fort) => {
                const isSelected = fort.id === activeFortId;
                return (
                  <View key={fort.id} style={styles.fortRow}>
                    <View style={styles.fortInfo}>
                      <Text style={styles.fortName}>
                        {fort.name} {isSelected ? '• Active' : ''}
                      </Text>
                      <Text style={styles.fortMeta}>
                        {fort.role.toUpperCase()} • {fort.fortXp} Fort XP
                      </Text>
                    </View>
                    <View style={styles.fortBtns}>
                      {!isSelected ? (
                        <Pressable
                          onPress={() => {
                            void selectFort(fort.id);
                            router.replace('/(tabs)');
                          }}
                          style={styles.smallBtn}>
                          <Text style={styles.smallBtnText}>Open</Text>
                        </Pressable>
                      ) : null}
                      {isActingAsGuardian ? (
                        <Pressable
                          disabled={saving}
                          onPress={() =>
                            runAction(async () => {
                              await leaveFort(fort.id, session.user.id);
                            }, `Left ${fort.name}.`)
                          }
                          style={styles.dangerBtn}>
                          <Text style={styles.dangerBtnText}>Leave</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {isActingAsGuardian ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.label}>Join Another Fort with Invite Code</Text>
                  <TextInput
                    value={joinCode}
                    onChangeText={(v) =>
                      setJoinCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
                    }
                    placeholder="Enter 6-char code (e.g., 7K2P9Q)"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                    style={styles.input}
                  />
                  {familyUsers.length > 1 ? (
                    <View style={styles.chipRow}>
                      {familyUsers.map((u) => {
                        const picked = effectiveJoinUserIds.includes(u.id);
                        return (
                          <Pressable
                            key={u.id}
                            onPress={() =>
                              setSelectedJoinUserIds(toggleIdInList(effectiveJoinUserIds, u.id))
                            }
                            style={[styles.chip, picked && styles.chipActive]}>
                            <Text style={[styles.chipText, picked && styles.chipTextActive]}>
                              {u.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  <View style={styles.rowActions}>
                    <PrimaryButton
                      label="Join by Code"
                      variant="secondary"
                      disabled={
                        saving || joinCode.trim().length < 4 || effectiveJoinUserIds.length === 0
                      }
                      onPress={() =>
                        runAction(async () => {
                          await joinFort(joinCode.trim(), effectiveJoinUserIds);
                          setJoinCode('');
                        }, 'Joined Fort!')
                      }
                    />
                    <PrimaryButton
                      label="+ Create Fort"
                      variant="primary"
                      disabled={saving}
                      onPress={() => router.push('/wizard')}
                    />
                  </View>
                </>
              ) : null}
            </View>

            {/* Supervised Kids Control (Guardian only) */}
            {isActingAsGuardian && session.supervisedUsers.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Supervised Accounts</Text>
                <Text style={styles.helperText}>
                  You control which Forts your supervised kids belong to and can retire them from
                  any Fort anytime.
                </Text>
                {session.supervisedUsers.map((kid) => (
                  <View key={kid.id} style={styles.kidCard}>
                    <View style={styles.kidHeader}>
                      <CharacterAvatar
                        name={kid.name}
                        avatarKey={kid.avatarKey}
                        xpTotal={kid.careerXp}
                        size="sm"
                        variant="hero"
                        showTierBadge
                      />
                      <View style={styles.kidMeta}>
                        <Text style={styles.fortName}>{kid.name}</Text>
                        <Text style={styles.fortMeta}>{kid.careerXp} Career XP</Text>
                      </View>
                    </View>
                    {kid.forts.length === 0 ? (
                      <Text style={styles.fortMeta}>Not in any Forts yet.</Text>
                    ) : (
                      kid.forts.map((m) => (
                        <View key={m.membershipId} style={styles.kidFortRow}>
                          <Text style={styles.kidFortText}>
                            {m.fortName} ({m.fortXp} XP)
                          </Text>
                          <Pressable
                            disabled={saving}
                            onPress={() =>
                              runAction(async () => {
                                await leaveFort(m.fortId, kid.id);
                              }, `Retired ${kid.name} from ${m.fortName}.`)
                            }
                            style={styles.dangerBtn}>
                            <Text style={styles.dangerBtnText}>Retire</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Parent Unlock on Kid-Locked Devices */}
            {lockedUserId ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Parent Controls</Text>
                <PrimaryButton
                  label="Parent Unlock (Guardian PIN)"
                  variant="secondary"
                  onPress={() => setUnlockPinModalOpen(true)}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <PinModal
          visible={unlockPinModalOpen}
          onCancel={() => setUnlockPinModalOpen(false)}
          onVerify={async (pin) => {
            await verifyGuardianPin(pin);
            await unlockDevice();
            setUnlockPinModalOpen(false);
            setStatusMessage('Device unlocked! You can now switch characters.');
          }}
        />
      </SafeAreaView>
    </FortBackground>
  );
}
