import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

import { styles } from './FortCommandScreen.styles';

interface AreasTabProps {
  saving: boolean;
  runAction: (fn: () => Promise<void>, successText: string) => Promise<void>;
}

export function AreasTab({ saving, runAction }: AreasTabProps) {
  const { fortState, createArea, updateArea, deleteArea } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaXp, setAreaXp] = useState('15');

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editXp, setEditXp] = useState('15');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!fortState) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Areas ({fortState.areas.length})</Text>
        <Pressable
          onPress={() => setShowAddForm((prev) => !prev)}
          style={styles.smallActionBtn}
          accessibilityRole="button">
          <Feather name={showAddForm ? 'x' : 'plus'} size={14} color={Colors.textPrimary} />
          <Text style={styles.smallActionBtnText}>{showAddForm ? 'Close' : 'Add Area'}</Text>
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        Deleting an area keeps all its missions and moves them to General.
      </Text>

      {showAddForm ? (
        <View style={styles.itemColumnBox}>
          <Text style={styles.label}>Area Name</Text>
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
          <View style={styles.rowActions}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              disabled={saving}
              onPress={() => setShowAddForm(false)}
            />
            <PrimaryButton
              label={saving ? 'Saving...' : 'Add Area'}
              variant="primary"
              disabled={saving || !areaName.trim()}
              onPress={() =>
                void runAction(async () => {
                  await createArea(areaName.trim(), Math.max(5, Number.parseInt(areaXp, 10) || 15));
                  setAreaName('');
                  setShowAddForm(false);
                }, 'Area added!')
              }
            />
          </View>
        </View>
      ) : null}

      {fortState.areas.length === 0 ? (
        <Text style={styles.helperText}>No areas configured yet.</Text>
      ) : (
        <View style={styles.listStack}>
          {fortState.areas.map((area) => {
            const taskCount = fortState.tasks.filter((t) => t.areaId === area.id).length;
            const isEditing = editingAreaId === area.id;
            const isConfirming = confirmDeleteId === area.id;

            if (isEditing) {
              return (
                <View key={area.id} style={styles.itemColumnBox}>
                  <Text style={styles.label}>Area Name</Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Area name"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                  <Text style={styles.label}>Default XP</Text>
                  <TextInput
                    value={editXp}
                    onChangeText={(v) => setEditXp(v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                  <View style={styles.rowActions}>
                    <PrimaryButton
                      label="Cancel"
                      variant="secondary"
                      disabled={saving}
                      onPress={() => setEditingAreaId(null)}
                    />
                    <PrimaryButton
                      label={saving ? 'Saving...' : 'Save Area'}
                      variant="primary"
                      disabled={saving || !editName.trim()}
                      onPress={() =>
                        void runAction(async () => {
                          await updateArea(area.id, {
                            name: editName.trim(),
                            defaultXp: Math.max(5, Number.parseInt(editXp, 10) || 15),
                          });
                          setEditingAreaId(null);
                        }, 'Area updated!')
                      }
                    />
                  </View>
                </View>
              );
            }

            return (
              <View key={area.id} style={styles.itemRow}>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{area.name}</Text>
                  <Text style={styles.itemSub}>
                    Default +{area.defaultXp} XP • {taskCount}{' '}
                    {taskCount === 1 ? 'mission' : 'missions'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setConfirmDeleteId(null);
                    setEditingAreaId(area.id);
                    setEditName(area.name);
                    setEditXp(String(area.defaultXp));
                  }}
                  style={styles.iconBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${area.name}`}>
                  <Feather name="edit-2" size={14} color={Colors.textPrimary} />
                </Pressable>
                <Pressable
                  disabled={saving}
                  onPress={() => {
                    if (!isConfirming) {
                      setConfirmDeleteId(area.id);
                      return;
                    }
                    setConfirmDeleteId(null);
                    void runAction(async () => {
                      await deleteArea(area.id);
                    }, `Deleted "${area.name}". Its missions moved to General.`);
                  }}
                  style={[styles.iconBtnDanger, isConfirming && styles.iconBtnDangerConfirm]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isConfirming ? `Confirm delete ${area.name}` : `Delete ${area.name}`
                  }>
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
