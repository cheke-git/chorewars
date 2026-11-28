import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Platform, Pressable, Share, Switch, Text, TextInput, View } from 'react-native';

import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { CharacterPicker } from '@/components/CharacterPicker/CharacterPicker';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import {
  AVATAR_PRESETS,
  normalizeAvatarKey,
  type MembershipRole,
} from '@/shared/types';

import { styles } from './FortCommandScreen.styles';

const INVITE_ROLES: { key: MembershipRole; label: string }[] = [
  { key: 'recruit', label: 'Recruit' },
  { key: 'reviewer', label: 'Reviewer' },
  { key: 'coch', label: 'CoCh' },
];

interface SquadTabProps {
  saving: boolean;
  runAction: (fn: () => Promise<void>, successText: string) => Promise<void>;
}

export function SquadTab({ saving, runAction }: SquadTabProps) {
  const {
    session,
    fortState,
    updateFort,
    joinFort,
    sendInvitation,
    revokeInvitation,
    updateMemberRole,
    leaveFort,
    createSupervisedUser,
    updateUser,
    deleteSupervisedUser,
  } = useApp();
  const { showSuccess, showError } = useToast();

  // Invite Code regenerate confirm
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Direct Email Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('recruit');
  const [inviteNote, setInviteNote] = useState('');

  // Add Supervised Character
  const [showAddKidForm, setShowAddKidForm] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatarKey, setProfileAvatarKey] = useState(AVATAR_PRESETS[2].key);
  const [profileIsAdult, setProfileIsAdult] = useState(false);
  const [profileRole, setProfileRole] = useState<'reviewer' | 'recruit'>('recruit');

  // Inline Edit Supervised Kid
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [editKidName, setEditKidName] = useState('');
  const [editKidAvatar, setEditKidAvatar] = useState(AVATAR_PRESETS[2].key);
  const [editKidAdult, setEditKidAdult] = useState(false);

  // Two-tap confirm for remove / delete
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmDeleteKidId, setConfirmDeleteKidId] = useState<string | null>(null);

  if (!fortState || !session) return null;

  const pendingInvitations = fortState.invitations.filter((inv) => inv.status === 'pending');
  const cochCount = fortState.members.filter((m) => m.role === 'coch').length;
  const memberIds = new Set(fortState.members.map((m) => m.id));
  const unassignedSupervisedKids = session.supervisedUsers.filter((kid) => !memberIds.has(kid.id));

  const handleShareInviteCode = async () => {
    const code = fortState.fort.inviteCode;
    const message = `Join ${fortState.fort.name} on Chore Wars! Use invite code: ${code}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        showSuccess(`Copied invite code ${code}!`);
      } else {
        await Share.share({ message });
      }
    } catch {
      showError('Could not copy or share invite code.');
    }
  };

  return (
    <>
      {/* 6-char Fort Invite Code */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fort Invite Code</Text>
        <Text style={styles.helperText}>
          Share this code with family members who already have a Chore Wars account so they can join{' '}
          {fortState.fort.name}.
        </Text>
        <View style={styles.inviteCodeBox}>
          <Text style={styles.inviteCodeText}>{fortState.fort.inviteCode}</Text>
          <View style={styles.inviteCodeActions}>
            <Pressable
              onPress={() => {
                void handleShareInviteCode();
              }}
              style={styles.smallActionBtn}
              accessibilityRole="button">
              <Feather
                name={Platform.OS === 'web' ? 'copy' : 'share-2'}
                size={14}
                color={Colors.textPrimary}
              />
              <Text style={styles.smallActionBtnText}>
                {Platform.OS === 'web' ? 'Copy' : 'Share'}
              </Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => {
                if (!confirmRegen) {
                  setConfirmRegen(true);
                  return;
                }
                setConfirmRegen(false);
                void runAction(async () => {
                  await updateFort(fortState.fort.id, { regenerateInviteCode: true });
                }, 'Invite code regenerated!');
              }}
              style={confirmRegen ? styles.smallDangerBtn : styles.smallActionBtn}
              accessibilityRole="button">
              <Feather
                name="refresh-cw"
                size={14}
                color={confirmRegen ? Colors.error : Colors.textPrimary}
              />
              <Text
                style={
                  confirmRegen ? styles.smallDangerBtnText : styles.smallActionBtnText
                }>
                {confirmRegen ? 'Confirm?' : 'New'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Direct Email Invitations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Invite by Email</Text>
        <Text style={styles.helperText}>
          Send a direct invitation to another adult or guardian&apos;s Chore Wars email. They can
          accept (and bring their supervised kids along!) from their Profile tab.
        </Text>
        <TextInput
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="parent@example.com"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <Text style={styles.label}>Role in {fortState.fort.name}</Text>
        <View style={styles.chipRow}>
          {INVITE_ROLES.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setInviteRole(opt.key)}
              style={[styles.chip, inviteRole === opt.key && styles.chipActive]}>
              <Text style={[styles.chipText, inviteRole === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={inviteNote}
          onChangeText={setInviteNote}
          placeholder="Optional note (e.g., Weekend fort!)"
          placeholderTextColor={Colors.textMuted}
          maxLength={160}
          style={styles.input}
        />
        <PrimaryButton
          label={saving ? 'Sending...' : 'Send Invitation'}
          variant="primary"
          disabled={saving || !inviteEmail.trim()}
          onPress={() =>
            void runAction(async () => {
              await sendInvitation(fortState.fort.id, {
                targetEmail: inviteEmail.trim(),
                role: inviteRole,
                note: inviteNote.trim() || undefined,
              });
              setInviteEmail('');
              setInviteNote('');
            }, 'Invitation sent!')
          }
        />

        {pendingInvitations.length > 0 ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Pending Invitations ({pendingInvitations.length})</Text>
            <View style={styles.listStack}>
              {pendingInvitations.map((inv) => (
                <View key={inv.id} style={styles.itemRow}>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemTitle}>{inv.targetEmail}</Text>
                    <Text style={styles.itemSub}>
                      Role: {inv.role.toUpperCase()}
                      {inv.note ? ` • "${inv.note}"` : ''}
                    </Text>
                  </View>
                  <Pressable
                    disabled={saving}
                    onPress={() =>
                      void runAction(async () => {
                        await revokeInvitation(inv.id);
                      }, `Revoked invitation to ${inv.targetEmail}.`)
                    }
                    style={styles.smallDangerBtn}>
                    <Text style={styles.smallDangerBtnText}>Revoke</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {/* Squad Members & Supervised Accounts */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Squad ({fortState.members.length})</Text>
          <Pressable
            onPress={() => setShowAddKidForm((prev) => !prev)}
            style={styles.smallActionBtn}
            accessibilityRole="button">
            <Feather name={showAddKidForm ? 'x' : 'user-plus'} size={14} color={Colors.textPrimary} />
            <Text style={styles.smallActionBtnText}>
              {showAddKidForm ? 'Close' : 'Add Player'}
            </Text>
          </Pressable>
        </View>

        {showAddKidForm ? (
          <View style={styles.itemColumnBox}>
            <Text style={styles.label}>New Supervised Character Name</Text>
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
            <View style={styles.rowActions}>
              <PrimaryButton
                label="Cancel"
                variant="secondary"
                disabled={saving}
                onPress={() => setShowAddKidForm(false)}
              />
              <PrimaryButton
                label={saving ? 'Saving...' : 'Add Character'}
                variant="primary"
                disabled={saving || !profileName.trim()}
                onPress={() =>
                  void runAction(async () => {
                    await createSupervisedUser({
                      name: profileName.trim(),
                      role: profileRole,
                      isAdult: profileIsAdult,
                      avatarKey: profileAvatarKey,
                      fortId: fortState.fort.id,
                    });
                    setProfileName('');
                    setShowAddKidForm(false);
                  }, 'Character added to the Fort!')
                }
              />
            </View>
          </View>
        ) : null}

        {unassignedSupervisedKids.length > 0 ? (
          <View style={styles.itemColumnBox}>
            <Text style={styles.label}>Add Existing Supervised Accounts to {fortState.fort.name}</Text>
            <View style={styles.chipRow}>
              {unassignedSupervisedKids.map((kid) => (
                <Pressable
                  key={kid.id}
                  disabled={saving}
                  onPress={() =>
                    void runAction(async () => {
                      await joinFort(fortState.fort.inviteCode, [kid.id]);
                    }, `Added ${kid.name} to ${fortState.fort.name}!`)
                  }
                  style={styles.chip}>
                  <Text style={styles.chipText}>+ {kid.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.listStack}>
          {fortState.members.map((member) => {
            const isOwnSupervised =
              member.isSupervised && member.guardianUserId === session.user.id;
            const isSelf = member.id === session.user.id;
            const isSoleCoch = member.role === 'coch' && cochCount <= 1;
            const allowedRoles: MembershipRole[] = member.isSupervised
              ? ['recruit', 'reviewer']
              : ['recruit', 'reviewer', 'coch'];
            const isEditing = editingKidId === member.id;
            const isConfirmingRemove = confirmRemoveId === member.id;
            const isConfirmingDelete = confirmDeleteKidId === member.id;

            if (isEditing) {
              return (
                <View key={member.id} style={styles.itemColumnBox}>
                  <Text style={styles.label}>Edit {member.name}</Text>
                  <TextInput
                    value={editKidName}
                    onChangeText={setEditKidName}
                    placeholder="Character name"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                  <CharacterPicker selectedKey={editKidAvatar} onSelect={setEditKidAvatar} />
                  <View style={styles.toggleRow}>
                    <Text style={styles.label}>Adult Profile?</Text>
                    <Switch
                      value={editKidAdult}
                      onValueChange={setEditKidAdult}
                      trackColor={{ false: Colors.border, true: Colors.brandOrange }}
                    />
                  </View>
                  <View style={styles.rowActions}>
                    <PrimaryButton
                      label="Cancel"
                      variant="secondary"
                      disabled={saving}
                      onPress={() => setEditingKidId(null)}
                    />
                    <PrimaryButton
                      label={saving ? 'Saving...' : 'Save'}
                      variant="primary"
                      disabled={saving || !editKidName.trim()}
                      onPress={() =>
                        void runAction(async () => {
                          await updateUser(member.id, {
                            name: editKidName.trim(),
                            avatarKey: editKidAvatar,
                            isAdult: editKidAdult,
                          });
                          setEditingKidId(null);
                        }, 'Character updated!')
                      }
                    />
                  </View>
                </View>
              );
            }

            return (
              <View key={member.id} style={styles.itemColumnBox}>
                <View style={styles.cardHeaderRow}>
                  <CharacterAvatar
                    name={member.name}
                    avatarKey={member.avatarKey}
                    avatarUrl={member.avatarUrl}
                    xpTotal={member.careerXp}
                    size="sm"
                    variant="hero"
                  />
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemTitle}>
                      {member.name} {isSelf ? '(You)' : ''}
                    </Text>
                    <Text style={styles.itemSub}>
                      {member.isSupervised ? 'Supervised' : 'Full Account'} • {member.fortXp} Fort
                      XP
                    </Text>
                  </View>
                  {isOwnSupervised ? (
                    <Pressable
                      onPress={() => {
                        setEditingKidId(member.id);
                        setEditKidName(member.name);
                        setEditKidAvatar(normalizeAvatarKey(member.avatarKey));
                        setEditKidAdult(member.isAdult);
                      }}
                      style={styles.iconBtn}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${member.name}`}>
                      <Feather name="edit-2" size={14} color={Colors.textPrimary} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.chipRow}>
                  {allowedRoles.map((role) => {
                    const active = member.role === role;
                    const disabled = saving || active || (isSoleCoch && role !== 'coch');
                    return (
                      <Pressable
                        key={role}
                        disabled={disabled}
                        onPress={() =>
                          void runAction(async () => {
                            await updateMemberRole(fortState.fort.id, member.id, role);
                          }, `${member.name} is now ${role.toUpperCase()}.`)
                        }
                        style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {role === 'coch'
                            ? 'CoCh'
                            : role === 'reviewer'
                              ? 'Reviewer'
                              : 'Recruit'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {!isSelf || !isSoleCoch ? (
                  <View style={styles.rowActions}>
                    {!isSoleCoch ? (
                      <Pressable
                        disabled={saving}
                        onPress={() => {
                          if (!isConfirmingRemove) {
                            setConfirmRemoveId(member.id);
                            setConfirmDeleteKidId(null);
                            return;
                          }
                          setConfirmRemoveId(null);
                          void runAction(async () => {
                            await leaveFort(fortState.fort.id, member.id);
                          }, `Removed ${member.name} from ${fortState.fort.name}.`);
                        }}
                        style={styles.smallDangerBtn}>
                        <Text style={styles.smallDangerBtnText}>
                          {isConfirmingRemove ? 'Tap again to remove' : 'Remove from Fort'}
                        </Text>
                      </Pressable>
                    ) : null}

                    {isOwnSupervised ? (
                      <Pressable
                        disabled={saving}
                        onPress={() => {
                          if (!isConfirmingDelete) {
                            setConfirmDeleteKidId(member.id);
                            setConfirmRemoveId(null);
                            return;
                          }
                          setConfirmDeleteKidId(null);
                          void runAction(async () => {
                            await deleteSupervisedUser(member.id);
                          }, `Deleted supervised account ${member.name}.`);
                        }}
                        style={styles.smallDangerBtn}>
                        <Feather name="trash-2" size={12} color={Colors.error} />
                        <Text style={styles.smallDangerBtnText}>
                          {isConfirmingDelete ? 'Confirm delete?' : 'Delete Account'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}
