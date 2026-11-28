import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FortBackground } from '@/components/FortBackground/FortBackground';
import { FortSwitcher } from '@/components/FortSwitcher/FortSwitcher';
import { PinEntryCard } from '@/components/PinModal/PinModal';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';

import { AreasTab } from './AreasTab';
import { styles } from './FortCommandScreen.styles';
import { FortSettingsTab } from './FortSettingsTab';
import { GoalsTab } from './GoalsTab';
import { MissionsTab } from './MissionsTab';
import { SquadTab } from './SquadTab';

type CommandTab = 'missions' | 'areas' | 'squad' | 'goals' | 'fort';

export function FortCommandScreen() {
  const {
    fortState,
    cochUnlocked,
    isCochOfCurrentFort,
    verifyGuardianPin,
    lockCoch,
    refreshFort,
  } = useApp();
  const { showSuccess, showError } = useToast();

  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<CommandTab>('missions');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  if (!fortState) {
    return null;
  }

  const runAction = async (fn: () => Promise<void>, successText: string) => {
    setSaving(true);
    try {
      await fn();
      showSuccess(successText);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFort();
    } finally {
      setRefreshing(false);
    }
  };

  if (!isCochOfCurrentFort) {
    return (
      <FortBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lockedCenter}>
            <View style={styles.lockedCard}>
              <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
              <Text style={styles.lockedTitle}>Commander Access Only</Text>
              <Text style={styles.lockedDesc}>
                Only a Commander in Chief (CoCh) of {fortState.fort.name} can edit this Fort&apos;s
                missions, areas, and rewards.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </FortBackground>
    );
  }

  if (!cochUnlocked) {
    return (
      <FortBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lockedCenter}>
            <PinEntryCard
              fortName={fortState.fort.name}
              title="Fort Command"
              subtitle="Enter your 4-digit Guardian PIN to unlock missions, areas, and rewards."
              autoFocusTrigger={isFocused}
              onVerify={verifyGuardianPin}
            />
          </View>
        </SafeAreaView>
      </FortBackground>
    );
  }

  const tabs: { key: CommandTab; label: string }[] = [
    { key: 'missions', label: 'Missions' },
    { key: 'areas', label: 'Areas' },
    { key: 'squad', label: 'Squad' },
    { key: 'goals', label: 'Goals' },
    { key: 'fort', label: 'Fort' },
  ];

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
            <FortSwitcher />

            <View style={styles.topHeader}>
              <View>
                <Text style={styles.fortLabel}>{fortState.fort.name}</Text>
                <Text style={styles.title}>Fort Command</Text>
              </View>
              <Pressable onPress={lockCoch} style={styles.lockBtn} accessibilityRole="button">
                <Feather name="lock" size={13} color={Colors.textPrimary} />
                <Text style={styles.lockBtnText}>Lock</Text>
              </Pressable>
            </View>

            <View style={styles.tabBarRow}>
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === 'missions' ? (
              <MissionsTab saving={saving} runAction={runAction} />
            ) : null}
            {activeTab === 'areas' ? <AreasTab saving={saving} runAction={runAction} /> : null}
            {activeTab === 'squad' ? <SquadTab saving={saving} runAction={runAction} /> : null}
            {activeTab === 'goals' ? <GoalsTab saving={saving} runAction={runAction} /> : null}
            {activeTab === 'fort' ? (
              <FortSettingsTab saving={saving} runAction={runAction} />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
