import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { type ComponentRef, useMemo, useRef, useState } from 'react';
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
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { FortSwitcher } from '@/components/FortSwitcher/FortSwitcher';
import { PinModal } from '@/components/PinModal/PinModal';
import { TaskArtBadge } from '@/components/TaskArtBadge/TaskArtBadge';
import { TaskEditModal } from '@/components/TaskEditModal/TaskEditModal';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import {
  formatRecurrence,
  getRankInfo,
  type FortMemberDTO,
  type TaskDTO,
} from '@/shared/types';

import { styles } from './BattleBoardScreen.styles';

const FILTER_MINE = '__mine__';
const FILTER_TODO = '__todo__';
const FILTER_DONE = '__done__';
const FILTER_GENERAL = '__general__';

function getTaskSortPriority(task: TaskDTO, activeUserId: string): number {
  if (task.isAvailable) return 0;
  if (task.activeRun?.userId === activeUserId) return 1;
  if (task.activeRun) return 2;
  return 3;
}

export function BattleBoardScreen() {
  const {
    fortState,
    activeUser,
    activeMember,
    lockedUserId,
    cochUnlocked,
    verifyGuardianPin,
    refreshFort,
    startTask,
    completeTask,
    cancelTask,
    undoTask,
    updateTask,
    deleteTask,
  } = useApp();

  const { showSuccess, showError } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<string>(FILTER_TODO);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentByTask, setCommentByTask] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [pendingEditTask, setPendingEditTask] = useState<TaskDTO | null>(null);

  const filterScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [filterScrollX, setFilterScrollX] = useState(0);
  const [filterContentWidth, setFilterContentWidth] = useState(0);
  const [filterViewportWidth, setFilterViewportWidth] = useState(0);

  const memberById = useMemo(() => {
    const map = new Map<string, FortMemberDTO>();
    for (const m of fortState?.members ?? []) {
      map.set(m.id, m);
    }
    return map;
  }, [fortState?.members]);

  if (!fortState || !activeUser) {
    return null;
  }

  const rank = getRankInfo(activeUser.careerXp);
  const fortXp = activeMember?.fortXp ?? 0;
  const isActiveUserCoch = Boolean(!activeUser.isSupervised && activeMember?.role === 'coch');

  const myInProgressTasks = fortState.tasks.filter(
    (t) => t.activeRun?.userId === activeUser.id
  );

  const mineCount = fortState.tasks.filter((task) => task.assignedUserId === activeUser.id).length;
  const todoCount = fortState.tasks.filter(
    (task) => task.isAvailable || Boolean(task.activeRun)
  ).length;
  const doneCount = fortState.tasks.filter(
    (task) => !task.isAvailable && !task.activeRun
  ).length;
  const generalCount = fortState.tasks.filter((task) => task.areaId === null).length;

  const activeFilter =
    selectedFilter === FILTER_MINE && mineCount === 0
      ? FILTER_TODO
      : selectedFilter === FILTER_GENERAL && generalCount === 0
        ? FILTER_TODO
        : selectedFilter;

  const visibleTasks = fortState.tasks
    .filter((task) => {
      if (activeFilter === FILTER_MINE) return task.assignedUserId === activeUser.id;
      if (activeFilter === FILTER_TODO) return task.isAvailable || Boolean(task.activeRun);
      if (activeFilter === FILTER_DONE) return !task.isAvailable && !task.activeRun;
      if (activeFilter === FILTER_GENERAL) return task.areaId === null;
      return task.areaId === activeFilter;
    })
    .sort(
      (a, b) =>
        getTaskSortPriority(a, activeUser.id) - getTaskSortPriority(b, activeUser.id)
    );

  const canScrollLeft = filterScrollX > 6;
  const canScrollRight = filterContentWidth - filterViewportWidth - filterScrollX > 6;

  const scrollFiltersBy = (delta: number) => {
    const maxOffset = Math.max(0, filterContentWidth - filterViewportWidth);
    const nextX = Math.max(0, Math.min(maxOffset, filterScrollX + delta));
    filterScrollRef.current?.scrollTo({ x: nextX, animated: true });
  };

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
    try {
      await startTask(taskId);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not start mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleComplete = async (taskId: string, xp: number) => {
    setBusyTaskId(taskId);
    const prevRank = getRankInfo(activeUser.careerXp);
    const nextRank = getRankInfo(activeUser.careerXp + xp);
    try {
      const comment = commentByTask[taskId]?.trim() || undefined;
      await completeTask(taskId, comment);
      setCommentByTask((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      if (nextRank.artTier > prevRank.artTier) {
        showSuccess(
          `EVOLUTION! ${activeUser.name} reached Tier ${nextRank.artTier} — ${nextRank.title}! (+${xp} XP)`,
          7000
        );
      } else if (nextRank.id !== prevRank.id || nextRank.prestigeLevel > prevRank.prestigeLevel) {
        showSuccess(
          `RANK UP! ${activeUser.name} promoted to ${nextRank.title}! (+${xp} XP)`,
          6500
        );
      } else {
        showSuccess(`Mission complete! +${xp} XP earned for ${activeUser.name}.`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not complete mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleCancel = async (taskId: string) => {
    setBusyTaskId(taskId);
    try {
      await cancelTask(taskId);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not cancel mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleUndo = async (task: TaskDTO) => {
    setBusyTaskId(task.id);
    const revertedXp = task.lastCompletedRun?.xpAwarded ?? task.xp;
    try {
      await undoTask(task.id);
      showSuccess(`Undid "${task.title}" (-${revertedXp} XP). Mission is ready again!`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not undo mission.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleRequestEdit = (task: TaskDTO) => {
    if (!isActiveUserCoch) return;
    if (cochUnlocked) {
      setEditingTask(task);
    } else {
      setPendingEditTask(task);
    }
  };

  return (
    <FortBackground>
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
            <FortSwitcher />
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.headerCard}
              accessibilityRole="button">
              <CharacterAvatar
                name={activeUser.name}
                avatarKey={activeUser.avatarKey}
                avatarUrl={activeUser.avatarUrl}
                xpTotal={activeUser.careerXp}
                size="md"
                variant="hero"
                highlighted={activeMember?.role === 'coch'}
                showTierBadge
              />
              <View style={styles.headerMeta}>
                <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
                <Text style={styles.playerName}>{activeUser.name}</Text>
                <Text style={styles.rankText}>
                  {rank.title} • {fortXp} Fort XP ({activeUser.careerXp} Career)
                </Text>
                <View style={styles.headerProgressTrack}>
                  <View
                    style={[
                      styles.headerProgressFill,
                      {
                        width: `${Math.max(6, Math.round(rank.progress * 100))}%`,
                        backgroundColor: rank.frameColor,
                      },
                    ]}
                  />
                </View>
              </View>
              {lockedUserId ? (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>Locked</Text>
                </View>
              ) : null}
            </Pressable>

            {myInProgressTasks.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Missions</Text>
                {myInProgressTasks.map((task) => {
                  const isBusy = busyTaskId === task.id;
                  return (
                    <View key={task.id} style={styles.activeCard}>
                      <View style={styles.activeTopRow}>
                        <TaskArtBadge categoryKey={task.categoryKey} size="sm" />
                        <Text style={styles.activeTaskTitle}>{task.title}</Text>
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

            <View style={styles.filterBarShell}>
              <ScrollView
                ref={filterScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onLayout={(e) => setFilterViewportWidth(e.nativeEvent.layout.width)}
                onContentSizeChange={(width) => setFilterContentWidth(width)}
                onScroll={(e) => setFilterScrollX(e.nativeEvent.contentOffset.x)}
                contentContainerStyle={styles.filterRow}>
                {mineCount > 0 ? (
                  <Pressable
                    onPress={() => setSelectedFilter(FILTER_MINE)}
                    style={[
                      styles.filterChip,
                      activeFilter === FILTER_MINE && styles.filterChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        activeFilter === FILTER_MINE && styles.filterChipTextActive,
                      ]}>
                      Mine ({mineCount})
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => setSelectedFilter(FILTER_TODO)}
                  style={[
                    styles.filterChip,
                    activeFilter === FILTER_TODO && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === FILTER_TODO && styles.filterChipTextActive,
                    ]}>
                    To Do ({todoCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedFilter(FILTER_DONE)}
                  style={[
                    styles.filterChip,
                    activeFilter === FILTER_DONE && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === FILTER_DONE && styles.filterChipTextActive,
                    ]}>
                    Done ({doneCount})
                  </Text>
                </Pressable>

                {fortState.areas.map((area) => (
                  <Pressable
                    key={area.id}
                    onPress={() => setSelectedFilter(area.id)}
                    style={[
                      styles.filterChip,
                      activeFilter === area.id && styles.filterChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        activeFilter === area.id && styles.filterChipTextActive,
                      ]}>
                      {area.name}
                    </Text>
                  </Pressable>
                ))}

                {generalCount > 0 ? (
                  <Pressable
                    onPress={() => setSelectedFilter(FILTER_GENERAL)}
                    style={[
                      styles.filterChip,
                      activeFilter === FILTER_GENERAL && styles.filterChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        activeFilter === FILTER_GENERAL && styles.filterChipTextActive,
                      ]}>
                      General
                    </Text>
                  </Pressable>
                ) : null}
              </ScrollView>

              {canScrollLeft ? (
                <Pressable
                  onPress={() => scrollFiltersBy(-180)}
                  style={[styles.scrollArrowBtn, styles.scrollArrowLeft]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Scroll filters left">
                  <Feather name="chevron-left" size={16} color={Colors.textPrimary} />
                </Pressable>
              ) : null}

              {canScrollRight ? (
                <Pressable
                  onPress={() => scrollFiltersBy(180)}
                  style={[styles.scrollArrowBtn, styles.scrollArrowRight]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Scroll filters right">
                  <Feather name="chevron-right" size={16} color={Colors.textPrimary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.section}>
              {visibleTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    {activeFilter === FILTER_TODO
                      ? 'All caught up! No pending missions right now.'
                      : activeFilter === FILTER_DONE
                        ? 'No completed missions yet.'
                        : 'No missions in this view yet.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.missionGrid}>
                  {visibleTasks.map((task) => {
                    const isBusy = busyTaskId === task.id;
                    const assignedMember = task.assignedUserId
                      ? memberById.get(task.assignedUserId) ?? null
                      : null;
                    const inProgressByMe = task.activeRun?.userId === activeUser.id;
                    const isCooldown = !task.isAvailable && !task.activeRun;
                    const canUndo =
                      isCooldown &&
                      Boolean(task.lastCompletedRun) &&
                      (task.lastCompletedRun?.userId === activeUser.id || isActiveUserCoch);

                    return (
                      <View
                        key={task.id}
                        style={[
                          styles.gridCard,
                          inProgressByMe && styles.gridCardInProgress,
                          isCooldown && styles.gridCardCooldown,
                        ]}>
                        <View style={styles.gridArtStage}>
                          <View style={isCooldown ? styles.gridArtDimmed : undefined}>
                            <TaskArtBadge categoryKey={task.categoryKey} size="hero" />
                          </View>

                          <View style={styles.gridTopOverlay}>
                            {assignedMember ? (
                              <View style={styles.assigneeChip}>
                                <Text style={styles.assigneeChipText} numberOfLines={1}>
                                  {assignedMember.name}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.cadencePill}>
                                <Text style={styles.cadenceText}>
                                  {formatRecurrence(task.recurrenceType, task.cooldownDays)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.xpBadgeCompact}>+{task.xp}</Text>
                          </View>

                          {isActiveUserCoch ? (
                            <Pressable
                              onPress={() => handleRequestEdit(task)}
                              style={styles.gridEditBtn}
                              hitSlop={6}
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${task.title}`}>
                              <Feather name="edit-2" size={13} color={Colors.textPrimary} />
                            </Pressable>
                          ) : null}
                        </View>

                        <View style={styles.gridBody}>
                          <Text style={styles.gridTaskTitle} numberOfLines={2}>
                            {task.title}
                          </Text>

                          {task.isAvailable ? (
                            <View style={styles.gridActions}>
                              <Pressable
                                disabled={isBusy}
                                onPress={() => handleStart(task.id)}
                                style={styles.gridStartBtn}>
                                <Text style={styles.gridStartText}>
                                  {isBusy ? '...' : 'Start'}
                                </Text>
                              </Pressable>
                              <Pressable
                                disabled={isBusy}
                                onPress={() => handleComplete(task.id, task.xp)}
                                style={styles.gridDoneBtn}>
                                <Text style={styles.gridDoneText}>{isBusy ? '...' : 'Done'}</Text>
                              </Pressable>
                            </View>
                          ) : task.activeRun ? (
                            <View style={styles.gridStatusPill}>
                              <Text style={styles.gridStatusText} numberOfLines={1}>
                                {inProgressByMe ? 'Active ↑' : task.activeRun.userName}
                              </Text>
                            </View>
                          ) : canUndo ? (
                            <View style={styles.gridCompletedRow}>
                              <View style={styles.gridCooldownPillFlex}>
                                <Text style={styles.gridCooldownText}>Done ✓</Text>
                              </View>
                              <Pressable
                                disabled={isBusy}
                                onPress={() => {
                                  void handleUndo(task);
                                }}
                                style={styles.gridUndoBtn}
                                accessibilityRole="button"
                                accessibilityLabel={`Undo ${task.title}`}>
                                <Feather name="rotate-ccw" size={12} color={Colors.textPrimary} />
                                <Text style={styles.gridUndoText}>
                                  {isBusy ? '...' : 'Undo'}
                                </Text>
                              </Pressable>
                            </View>
                          ) : (
                            <View style={styles.gridCooldownPill}>
                              <Text style={styles.gridCooldownText}>Done ✓</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <PinModal
          visible={Boolean(pendingEditTask)}
          onCancel={() => setPendingEditTask(null)}
          onVerify={async (pin) => {
            await verifyGuardianPin(pin);
            const target = pendingEditTask;
            setPendingEditTask(null);
            if (target) {
              setEditingTask(target);
            }
          }}
        />

        <TaskEditModal
          task={editingTask}
          areas={fortState.areas}
          members={fortState.members}
          onClose={() => setEditingTask(null)}
          onSave={async (taskId, payload) => {
            await updateTask(taskId, payload);
            showSuccess('Mission updated!');
          }}
          onArchive={async (taskId) => {
            await deleteTask(taskId);
            showSuccess('Mission archived.');
          }}
        />
      </SafeAreaView>
    </FortBackground>
  );
}
