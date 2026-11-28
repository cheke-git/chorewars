import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

import { styles } from './FortCommandScreen.styles';

interface FortSettingsTabProps {
  saving: boolean;
  runAction: (fn: () => Promise<void>, successText: string) => Promise<void>;
}

export function FortSettingsTab({ saving, runAction }: FortSettingsTabProps) {
  const { session, fortState, updateFort, updateMe } = useApp();

  const [fortNameDraft, setFortNameDraft] = useState<{ fortId: string; value: string } | null>(
    null
  );
  const [newPin, setNewPin] = useState('');
  const [confirmArchiveFort, setConfirmArchiveFort] = useState(false);

  if (!fortState || !session) return null;

  const fortNameValue =
    fortNameDraft?.fortId === fortState.fort.id ? fortNameDraft.value : fortState.fort.name;
  const hasNameChanged = fortNameValue.trim().length >= 2 && fortNameValue.trim() !== fortState.fort.name;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fort Details</Text>
        <Text style={styles.label}>Fort Name</Text>
        <TextInput
          value={fortNameValue}
          onChangeText={(value) => setFortNameDraft({ fortId: fortState.fort.id, value })}
          placeholder="Fort name"
          placeholderTextColor={Colors.textMuted}
          maxLength={60}
          style={styles.input}
        />
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save Fort Name'}
          variant="primary"
          disabled={saving || !hasNameChanged}
          onPress={() =>
            void runAction(async () => {
              await updateFort(fortState.fort.id, { name: fortNameValue.trim() });
              setFortNameDraft(null);
            }, 'Fort renamed!')
          }
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Build Another Fort</Text>
        <Text style={styles.helperText}>
          Set up an additional Fort for a second home, vacation house, or grandparents&apos; place.
        </Text>
        <PrimaryButton
          label="+ Create New Fort"
          variant="secondary"
          disabled={saving}
          onPress={() => router.push('/wizard')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guardian PIN Security</Text>
        <Text style={styles.label}>
          {session.user.hasGuardianPin
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
            void runAction(async () => {
              await updateMe({ guardianPin: newPin });
              setNewPin('');
            }, 'Guardian PIN updated!')
          }
        />
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.cardTitle}>Danger Zone</Text>
        <Text style={styles.helperText}>
          Archiving {fortState.fort.name} hides it from all members. Career XP earned by every
          player stays safely on their accounts.
        </Text>
        <Pressable
          disabled={saving}
          onPress={() => {
            if (!confirmArchiveFort) {
              setConfirmArchiveFort(true);
              return;
            }
            setConfirmArchiveFort(false);
            void runAction(async () => {
              await updateFort(fortState.fort.id, { isArchived: true });
            }, `Archived ${fortState.fort.name}.`);
          }}
          style={[styles.dangerBtnFull, confirmArchiveFort && styles.dangerBtnFullConfirm]}
          accessibilityRole="button">
          <Feather name="archive" size={16} color={Colors.error} />
          <Text style={styles.dangerBtnFullText}>
            {confirmArchiveFort
              ? `Tap again to archive ${fortState.fort.name}`
              : `Archive ${fortState.fort.name}`}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
