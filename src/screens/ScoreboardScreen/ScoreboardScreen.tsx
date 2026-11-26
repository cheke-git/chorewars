import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getRankInfo } from '@/shared/types';

import { styles } from './ScoreboardScreen.styles';

export function ScoreboardScreen() {
  const { fortState, activeProfile, refreshFort } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  if (!fortState) {
    return null;
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandOrange}
          />
        }>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
            <Text style={styles.title}>Fort Scoreboard</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            {fortState.profiles.map((profile, index) => {
              const rank = getRankInfo(profile.xpTotal);
              const isMe = profile.id === activeProfile?.id;
              return (
                <View
                  key={profile.id}
                  style={[styles.leaderCard, isMe && styles.leaderCardActive]}>
                  <Text style={styles.position}>#{index + 1}</Text>
                  <CharacterAvatar
                    name={profile.name}
                    avatarKey={profile.avatarKey}
                    avatarUrl={profile.avatarUrl}
                    xpTotal={profile.xpTotal}
                    size="sm"
                    highlighted={index === 0}
                  />
                  <View style={styles.leaderMeta}>
                    <View style={styles.leaderNameRow}>
                      <Text style={styles.leaderName}>{profile.name}</Text>
                      <Text style={styles.leaderXp}>{profile.xpTotal} XP</Text>
                    </View>
                    <Text style={styles.leaderRank}>
                      {rank.title}
                      {rank.nextXp ? ` • ${rank.nextXp - profile.xpTotal} XP to ${rank.nextTitle}` : ' • Max Rank'}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round(rank.progress * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Rewards</Text>
            {fortState.rewards.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No goal rewards yet—CoCh can add them in Fort Command.
                </Text>
              </View>
            ) : (
              fortState.rewards.map((reward) => {
                const eligibleProfiles = fortState.profiles.filter(
                  (p) => !reward.excludedProfileIds.includes(p.id)
                );

                return (
                  <View key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardTopRow}>
                      <Text style={styles.rewardTitle}>
                        {reward.title || 'Surprise IRL Reward'}
                      </Text>
                      <Text style={styles.rewardGoalPill}>{reward.targetXp} XP Goal</Text>
                    </View>

                    {eligibleProfiles.map((member) => {
                      const pct = Math.min(100, Math.round((member.xpTotal / reward.targetXp) * 100));
                      const unlocked = member.xpTotal >= reward.targetXp;
                      return (
                        <View key={member.id} style={styles.rewardMemberRow}>
                          <View style={styles.rewardMemberTop}>
                            <Text style={styles.rewardMemberName}>{member.name}</Text>
                            <Text
                              style={[
                                styles.rewardMemberStatus,
                                unlocked && styles.rewardUnlockedText,
                              ]}>
                              {unlocked
                                ? 'UNLOCKED!'
                                : `${member.xpTotal} / ${reward.targetXp} XP`}
                            </Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                unlocked && styles.progressFillSuccess,
                                { width: `${pct}%` },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {fortState.recentRuns.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Complete a mission on the Battle Board to kick off the war!
                </Text>
              </View>
            ) : (
              fortState.recentRuns.slice(0, 10).map((run) => (
                <View key={run.id} style={styles.activityRow}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityTitle}>
                      {run.profileName} completed {run.taskTitle}
                    </Text>
                    {run.comment ? (
                      <Text style={styles.activityComment}>&ldquo;{run.comment}&rdquo;</Text>
                    ) : null}
                  </View>
                  <Text style={styles.activityXp}>+{run.xpAwarded} XP</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
