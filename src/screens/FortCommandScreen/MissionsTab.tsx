import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { TaskArtBadge } from '@/components/TaskArtBadge/TaskArtBadge';
import { TaskArtPicker } from '@/components/TaskArtPicker/TaskArtPicker';
import { TaskEditModal } from '@/components/TaskEditModal/TaskEditModal';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatRecurrence, type RecurrenceType, type TaskDTO } from '@/shared/types';

import { styles } from './FortCommandScreen.styles';

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'cooldown', label: 'Every 3d' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'on_demand', label: 'Anytime' },
  { key: 'one_off', label: 'One-Off' },
];

interface MissionsTabProps {
  saving: boolean;
  runAction: (fn: () => Promise<void>, successText: string) => Promise<void>;
}

export function MissionsTab({ saving, runAction }: MissionsTabProps) {
  const { fortState, createTask, updateTask, deleteTask } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAreaId, setTaskAreaId] = useState<string | null>(null);
  const [taskCategoryKey, setTaskCategoryKey] = useState('custom');
  const [taskXp, setTaskXp] = useState('15');
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceType>('daily');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const areaNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of fortState?.areas ?? []) map.set(a.id, a.name);
    return map;
  }, [fortState?.areas]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of fortState?.members ?? []) map.set(m.id, m.name);
    return map;
  }, [fortState?.members]);

  if (!fortState) return null;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Missions ({fortState.tasks.length})</Text>
          <Pressable
            onPress={() => setShowAddForm((prev) => !prev)}
            style={styles.smallActionBtn}
            accessibilityRole="button">
            <Feather name={showAddForm ? 'x' : 'plus'} size={14} color={Colors.textPrimary} />
            <Text style={styles.smallActionBtnText}>
              {showAddForm ? 'Close' : 'Add Mission'}
            </Text>
          </Pressable>
        </View>

        {showAddForm ? (
          <View style={styles.itemColumnBox}>
            <Text style={styles.label}>Mission Title</Text>
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g., Fold towels or Empty dishwasher"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Illustration</Text>
            <TaskArtPicker selectedKey={taskCategoryKey} onSelect={setTaskCategoryKey} />

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
                  <Text style={[styles.chipText, taskAreaId === area.id && styles.chipTextActive]}>
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

            <View style={styles.rowActions}>
              <PrimaryButton
                label="Cancel"
                variant="secondary"
                disabled={saving}
                onPress={() => setShowAddForm(false)}
              />
              <PrimaryButton
                label={saving ? 'Saving...' : 'Add Mission'}
                variant="primary"
                disabled={saving || !taskTitle.trim()}
                onPress={() =>
                  void runAction(async () => {
                    await createTask({
                      title: taskTitle.trim(),
                      areaId: taskAreaId,
                      categoryKey: taskCategoryKey,
                      xp: Math.max(1, Number.parseInt(taskXp, 10) || 10),
                      recurrenceType: taskRecurrence,
                      cooldownDays: taskRecurrence === 'cooldown' ? 3 : null,
                      assignedUserId: taskAssigneeId,
                    });
                    setTaskTitle('');
                    setTaskCategoryKey('custom');
                    setShowAddForm(false);
                  }, 'Mission added to the Battle Board!')
                }
              />
            </View>
          </View>
        ) : null}

        {fortState.tasks.length === 0 ? (
          <Text style={styles.helperText}>No active missions yet. Tap Add Mission above.</Text>
        ) : (
          <View style={styles.listStack}>
            {fortState.tasks.map((task) => {
              const areaName = task.areaId ? (areaNameById.get(task.areaId) ?? 'General') : 'General';
              const assigneeName = task.assignedUserId
                ? memberNameById.get(task.assignedUserId)
                : null;
              const isConfirming = confirmArchiveId === task.id;

              return (
                <View key={task.id} style={styles.itemRow}>
                  <TaskArtBadge categoryKey={task.categoryKey} size="sm" />
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemTitle}>{task.title}</Text>
                    <Text style={styles.itemSub}>
                      {areaName} • {formatRecurrence(task.recurrenceType, task.cooldownDays)}
                      {assigneeName ? ` • ${assigneeName}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.xpPill}>+{task.xp}</Text>
                  <Pressable
                    onPress={() => {
                      setConfirmArchiveId(null);
                      setEditingTask(task);
                    }}
                    style={styles.iconBtn}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${task.title}`}>
                    <Feather name="edit-2" size={14} color={Colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    disabled={saving}
                    onPress={() => {
                      if (!isConfirming) {
                        setConfirmArchiveId(task.id);
                        return;
                      }
                      setConfirmArchiveId(null);
                      void runAction(async () => {
                        await deleteTask(task.id);
                      }, `Archived "${task.title}".`);
                    }}
                    style={[styles.iconBtnDanger, isConfirming && styles.iconBtnDangerConfirm]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isConfirming ? `Confirm archive ${task.title}` : `Archive ${task.title}`
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

      <TaskEditModal
        task={editingTask}
        areas={fortState.areas}
        members={fortState.members}
        onClose={() => setEditingTask(null)}
        onSave={async (taskId, payload) => {
          await runAction(async () => {
            await updateTask(taskId, payload);
          }, 'Mission updated!');
        }}
        onArchive={async (taskId) => {
          await runAction(async () => {
            await deleteTask(taskId);
          }, 'Mission archived.');
        }}
      />
    </>
  );
}
