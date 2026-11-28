import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { TaskArtPicker } from '@/components/TaskArtPicker/TaskArtPicker';
import { Colors } from '@/constants/theme';
import type { UpdateTaskPayload } from '@/context/AppContext';
import type { AreaDTO, FortMemberDTO, RecurrenceType, TaskDTO } from '@/shared/types';

import { styles } from './TaskEditModal.styles';

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'cooldown', label: 'Every 3d' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'on_demand', label: 'Anytime' },
  { key: 'one_off', label: 'One-Off' },
];

interface TaskEditModalProps {
  task: TaskDTO | null;
  areas: AreaDTO[];
  members: FortMemberDTO[];
  onClose: () => void;
  onSave: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  onArchive: (taskId: string) => Promise<void>;
}

interface TaskEditFormProps {
  task: TaskDTO;
  areas: AreaDTO[];
  members: FortMemberDTO[];
  onClose: () => void;
  onSave: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  onArchive: (taskId: string) => Promise<void>;
}

function TaskEditForm({ task, areas, members, onClose, onSave, onArchive }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [xp, setXp] = useState(String(task.xp));
  const [categoryKey, setCategoryKey] = useState(task.categoryKey || 'custom');
  const [areaId, setAreaId] = useState<string | null>(task.areaId);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task.recurrenceType);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(task.assignedUserId);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Mission title cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(task.id, {
        title: trimmed,
        xp: Math.max(1, Number.parseInt(xp, 10) || 10),
        categoryKey,
        areaId,
        recurrenceType,
        cooldownDays: recurrenceType === 'cooldown' ? (task.cooldownDays ?? 3) : null,
        assignedUserId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update mission.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirmArchive) {
      setConfirmArchive(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onArchive(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not archive mission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Mission</Text>
        <Pressable
          onPress={onClose}
          disabled={saving}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close edit mission modal">
          <Feather name="x" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Mission title"
          placeholderTextColor={Colors.textMuted}
          maxLength={80}
          style={styles.input}
        />

        <Text style={styles.label}>XP Value</Text>
        <TextInput
          value={xp}
          onChangeText={(value) => setXp(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.input}
        />

        <Text style={styles.label}>Illustration</Text>
        <TaskArtPicker selectedKey={categoryKey} onSelect={setCategoryKey} />

        <Text style={styles.label}>Area</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setAreaId(null)}
            style={[styles.chip, areaId === null && styles.chipActive]}>
            <Text style={[styles.chipText, areaId === null && styles.chipTextActive]}>General</Text>
          </Pressable>
          {areas.map((area) => (
            <Pressable
              key={area.id}
              onPress={() => setAreaId(area.id)}
              style={[styles.chip, areaId === area.id && styles.chipActive]}>
              <Text style={[styles.chipText, areaId === area.id && styles.chipTextActive]}>
                {area.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Cadence</Text>
        <View style={styles.chipRow}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setRecurrenceType(opt.key)}
              style={[styles.chip, recurrenceType === opt.key && styles.chipActive]}>
              <Text
                style={[styles.chipText, recurrenceType === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Assign To</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setAssignedUserId(null)}
            style={[styles.chip, assignedUserId === null && styles.chipActive]}>
            <Text style={[styles.chipText, assignedUserId === null && styles.chipTextActive]}>
              Anyone (Open)
            </Text>
          </Pressable>
          {members.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => setAssignedUserId(member.id)}
              style={[styles.chip, assignedUserId === member.id && styles.chipActive]}>
              <Text
                style={[styles.chipText, assignedUserId === member.id && styles.chipTextActive]}>
                {member.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={saving}
          onPress={() => {
            void handleArchive();
          }}
          style={[styles.archiveBtn, confirmArchive && styles.archiveBtnConfirm]}
          accessibilityRole="button">
          <Feather name="trash-2" size={15} color={Colors.error} />
          <Text style={styles.archiveBtnText}>
            {confirmArchive ? 'Tap again to confirm archive' : 'Archive Mission'}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.actions}>
        <PrimaryButton label="Cancel" variant="secondary" disabled={saving} onPress={onClose} />
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save Mission'}
          variant="primary"
          disabled={saving || !title.trim()}
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
    </View>
  );
}

export function TaskEditModal({
  task,
  areas,
  members,
  onClose,
  onSave,
  onArchive,
}: TaskEditModalProps) {
  return (
    <Modal visible={Boolean(task)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {task ? (
          <TaskEditForm
            key={task.id}
            task={task}
            areas={areas}
            members={members}
            onClose={onClose}
            onSave={onSave}
            onArchive={onArchive}
          />
        ) : null}
      </View>
    </Modal>
  );
}
