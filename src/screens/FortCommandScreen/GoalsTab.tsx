import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

import { styles } from './FortCommandScreen.styles';

interface GoalsTabProps {
  saving: boolean;
  runAction: (fn: () => Promise<void>, successText: string) => Promise<void>;
}

export function GoalsTab({ saving, runAction }: GoalsTabProps) {
  const { fortState, createReward, updateReward, deleteReward } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardTargetXp, setRewardTargetXp] = useState('50');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetXp, setEditTargetXp] = useState('50');
  const [editExcludedIds, setEditExcludedIds] = useState<string[]>([]);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  if (!fortState) return null;

  const toggleId = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Goal Rewards ({fortState.rewards.length})</Text>
        <Pressable
          onPress={() => setShowAddForm((prev) => !prev)}
          style={styles.smallActionBtn}
          accessibilityRole="button">
          <Feather name={showAddForm ? 'x' : 'plus'} size={14} color={Colors.textPrimary} />
          <Text style={styles.smallActionBtnText}>{showAddForm ? 'Close' : 'Add Goal'}</Text>
        </Pressable>
      </View>

      {showAddForm ? (
        <View style={styles.itemColumnBox}>
          <Text style={styles.label}>Reward Label (optional — or keep it an IRL surprise)</Text>
          <TextInput
            value={rewardTitle}
            onChangeText={setRewardTitle}
            placeholder="e.g., Ice cream trip or Movie night pick"
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
                  onPress={() => setExcludedIds((prev) => toggleId(prev, p.id))}
                  style={[styles.chip, isExcluded && styles.chipExcluded]}>
                  <Text style={[styles.chipText, isExcluded && styles.chipTextActive]}>
                    {isExcluded ? `Excluded: ${p.name}` : p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.rowActions}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              disabled={saving}
              onPress={() => setShowAddForm(false)}
            />
            <PrimaryButton
              label={saving ? 'Saving...' : 'Create Goal'}
              variant="primary"
              disabled={saving}
              onPress={() =>
                void runAction(async () => {
                  await createReward({
                    title: rewardTitle.trim() || undefined,
                    targetXp: Math.max(5, Number.parseInt(rewardTargetXp, 10) || 20),
                    excludedUserIds: excludedIds,
                  });
                  setRewardTitle('');
                  setExcludedIds([]);
                  setShowAddForm(false);
                }, 'Goal Reward created!')
              }
            />
          </View>
        </View>
      ) : null}

      {fortState.rewards.length === 0 ? (
        <Text style={styles.helperText}>No Goal Rewards yet. Tap Add Goal above.</Text>
      ) : (
        <View style={styles.listStack}>
          {fortState.rewards.map((reward) => {
            const isEditing = editingRewardId === reward.id;
            const isConfirming = confirmArchiveId === reward.id;
            const excludedNames = fortState.members
              .filter((m) => reward.excludedUserIds.includes(m.id))
              .map((m) => m.name);

            if (isEditing) {
              return (
                <View key={reward.id} style={styles.itemColumnBox}>
                  <Text style={styles.label}>Reward Label (leave blank for IRL surprise)</Text>
                  <TextInput
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="IRL Surprise Reward"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                  <Text style={styles.label}>XP Target</Text>
                  <TextInput
                    value={editTargetXp}
                    onChangeText={(v) => setEditTargetXp(v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                  <Text style={styles.label}>Exclude from this reward</Text>
                  <View style={styles.chipRow}>
                    {fortState.members.map((p) => {
                      const isExcluded = editExcludedIds.includes(p.id);
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => setEditExcludedIds((prev) => toggleId(prev, p.id))}
                          style={[styles.chip, isExcluded && styles.chipExcluded]}>
                          <Text style={[styles.chipText, isExcluded && styles.chipTextActive]}>
                            {isExcluded ? `Excluded: ${p.name}` : p.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.rowActions}>
                    <PrimaryButton
                      label="Cancel"
                      variant="secondary"
                      disabled={saving}
                      onPress={() => setEditingRewardId(null)}
                    />
                    <PrimaryButton
                      label={saving ? 'Saving...' : 'Save Goal'}
                      variant="primary"
                      disabled={saving}
                      onPress={() =>
                        void runAction(async () => {
                          await updateReward(reward.id, {
                            title: editTitle.trim() || null,
                            targetXp: Math.max(5, Number.parseInt(editTargetXp, 10) || 20),
                            excludedUserIds: editExcludedIds,
                          });
                          setEditingRewardId(null);
                        }, 'Goal Reward updated!')
                      }
                    />
                  </View>
                </View>
              );
            }

            return (
              <View key={reward.id} style={styles.itemRow}>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{reward.title || 'IRL Surprise Reward'}</Text>
                  <Text style={styles.itemSub}>
                    Target: {reward.targetXp} Fort XP
                    {excludedNames.length > 0 ? ` • Excludes ${excludedNames.join(', ')}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setConfirmArchiveId(null);
                    setEditingRewardId(reward.id);
                    setEditTitle(reward.title ?? '');
                    setEditTargetXp(String(reward.targetXp));
                    setEditExcludedIds(reward.excludedUserIds);
                  }}
                  style={styles.iconBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Edit goal reward">
                  <Feather name="edit-2" size={14} color={Colors.textPrimary} />
                </Pressable>
                <Pressable
                  disabled={saving}
                  onPress={() => {
                    if (!isConfirming) {
                      setConfirmArchiveId(reward.id);
                      return;
                    }
                    setConfirmArchiveId(null);
                    void runAction(async () => {
                      await deleteReward(reward.id);
                    }, 'Goal Reward archived.');
                  }}
                  style={[styles.iconBtnDanger, isConfirming && styles.iconBtnDangerConfirm]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={isConfirming ? 'Confirm archive goal' : 'Archive goal'}>
                  <Feather
                    name={isConfirming ? 'check' : 'trash-2'}
                    size={14}
                    color={Colors.error}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
