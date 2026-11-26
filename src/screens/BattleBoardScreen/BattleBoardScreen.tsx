import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatRecurrence, getRankInfo } from '@/shared/types';

import { styles } from './BattleBoardScreen.styles';

const FILTER_ALL = '__all__';
const FILTER_MINE = '__mine__';
const FILTER_GENERAL = '__general__';

export function BattleBoardScreen() {
  const {
    fortState,
    activeProfile,
    lockedProfileId,
    refreshFort,
    startTask,
    completeTask,
    cancelTask,
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<string>(FILTER_ALL);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentByTask, setCommentByTask] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const areaNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const area of fortState?.areas ?? []) {
      map.set(area.id, area.name);
    }
    return map;
  }, [fortState?.areas]);

  const profileNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of fortState?.profiles ?? []) {
      map.set(p.id, p.name);
    }
    return map;
  }, [fortState?.profiles]);

  if (!fortState || !activeProfile) {
    return null;
  }

  const rank = getRankInfo(activeProfile.xpTotal);

  const myInProgressTasks = fortState.tasks.filter(
    (t) => t.activeRun?.profileId === activeProfile.id
  );

  const filteredTasks = fortState.tasks.filter((task) => {
    if (selectedFilter === FILTER_ALL) return true;
    if (selectedFilter === FILTER_MINE) return task.assignedProfileId === activeProfile.id;
    if (selectedFilter === FILTER_GENERAL) return task.areaId === null;
    return task.areaId === selectedFilter;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFort();
    } finally {
      setRefreshing(false);
    }
  };

  const handleStart = async (taskId: string) => {
    setBusyTaskId(taskId);
    setBanner(null);
    try {
      await startTask(taskId);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not start mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleComplete = async (taskId: string, xp: number) => {
    setBusyTaskId(taskId);
    setBanner(null);
    try {
      const comment = commentByTask[taskId]?.trim() || undefined;
      await completeTask(taskId, comment);
      setCommentByTask((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setBanner(`Mission complete! +${xp} XP earned for ${activeProfile.name}.`);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not complete mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleCancel = async (taskId: string) => {
    setBusyTaskId(taskId);
    setBanner(null);
    try {
      await cancelTask(taskId);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not cancel mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandOrange}
          />
        }>
        <View style={styles.container}>
          <View style={styles.headerCard}>
            <CharacterAvatar
              name={activeProfile.name}
              avatarKey={activeProfile.avatarKey}
              size="md"
              highlighted={activeProfile.role === 'coch'}
            />
            <View style={styles.headerMeta}>
              <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
              <Text style={styles.playerName}>{activeProfile.name}</Text>
              <Text style={styles.rankText}>
                {rank.title} • {activeProfile.xpTotal} XP
              </Text>
            </View>
            {lockedProfileId ? (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Device Locked</Text>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/profiles')} style={styles.switchBtn}>
                <Text style={styles.switchBtnText}>Switch</Text>
              </Pressable>
            )}
          </View>

          {banner ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{banner}</Text>
            </View>
          ) : null}

          {myInProgressTasks.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Missions</Text>
              {myInProgressTasks.map((task) => {
                const isBusy = busyTaskId === task.id;
                return (
                  <View key={task.id} style={styles.activeCard}>
                    <View style={styles.taskTopRow}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.xpBadge}>+{task.xp} XP</Text>
                    </View>
                    <TextInput
                      value={commentByTask[task.id] ?? ''}
                      onChangeText={(value) =>
                        setCommentByTask((prev) => ({ ...prev, [task.id]: value }))
                      }
                      placeholder="Optional note (e.g., left puzzle on counter)"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.commentInput}
                    />
                    <View style={styles.activeActions}>
                      <Pressable
                        disabled={isBusy}
                        onPress={() => handleCancel(task.id)}
                        style={styles.secondaryActionBtn}>
                        <Text style={styles.secondaryActionText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        disabled={isBusy}
                        onPress={() => handleComplete(task.id, task.xp)}
                        style={styles.primaryActionBtn}>
                        <Text style={styles.primaryActionText}>
                          {isBusy ? 'Saving...' : `Complete (+${task.xp} XP)`}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Menu — Areas</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}>
              <Pressable
                onPress={() => setSelectedFilter(FILTER_ALL)}
                style={[styles.filterChip, selectedFilter === FILTER_ALL && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === FILTER_ALL && styles.filterChipTextActive,
                  ]}>
                  All ({fortState.tasks.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedFilter(FILTER_MINE)}
                style={[
                  styles.filterChip,
                  selectedFilter === FILTER_MINE && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === FILTER_MINE && styles.filterChipTextActive,
                  ]}>
                  Assigned to Me
                </Text>
              </Pressable>

              {fortState.areas.map((area) => (
                <Pressable
                  key={area.id}
                  onPress={() => setSelectedFilter(area.id)}
                  style={[
                    styles.filterChip,
                    selectedFilter === area.id && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === area.id && styles.filterChipTextActive,
                    ]}>
                    {area.name}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => setSelectedFilter(FILTER_GENERAL)}
                style={[
                  styles.filterChip,
                  selectedFilter === FILTER_GENERAL && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === FILTER_GENERAL && styles.filterChipTextActive,
                  ]}>
                  General
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missions</Text>
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No missions in this view yet.</Text>
              </View>
            ) : (
              filteredTasks.map((task) => {
                const isBusy = busyTaskId === task.id;
                const areaLabel = task.areaId ? (areaNameById.get(task.areaId) ?? 'Area') : 'General';
                const assignedLabel = task.assignedProfileId
                  ? profileNameById.get(task.assignedProfileId)
                  : null;
                const inProgressByMe = task.activeRun?.profileId === activeProfile.id;

                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskTopRow}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.xpBadge}>+{task.xp} XP</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaPill}>{areaLabel}</Text>
                      <Text style={styles.metaPill}>
                        {formatRecurrence(task.recurrenceType, task.cooldownDays)}
                      </Text>
                      {assignedLabel ? (
                        <Text style={styles.metaPill}>For {assignedLabel}</Text>
                      ) : (
                        <Text style={styles.metaPill}>Open</Text>
                      )}
                    </View>

                    {task.isAvailable ? (
                      <View style={styles.taskActions}>
                        <Pressable
                          disabled={isBusy}
                          onPress={() => handleStart(task.id)}
                          style={styles.secondaryActionBtn}>
                          <Text style={styles.secondaryActionText}>
                            {isBusy ? '...' : 'Start'}
                          </Text>
                        </Pressable>
                        <Pressable
                          disabled={isBusy}
                          onPress={() => handleComplete(task.id, task.xp)}
                          style={styles.primaryActionBtn}>
                          <Text style={styles.primaryActionText}>
                            {isBusy ? 'Saving...' : 'Done (+XP)'}
                          </Text>
                        </Pressable>
                      </View>
                    ) : task.activeRun ? (
                      <Text style={styles.statusNote}>
                        {inProgressByMe
                          ? 'In progress above — finish when ready!'
                          : `In progress by ${task.activeRun.profileName}`}
                      </Text>
                    ) : (
                      <Text style={styles.cooldownNote}>
                        Completed recently — back after cooldown
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
