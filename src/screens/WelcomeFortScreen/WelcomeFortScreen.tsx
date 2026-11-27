import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

import { styles } from './WelcomeFortScreen.styles';

export function WelcomeFortScreen() {
  const { session, joinFort, respondToInvitation, logout } = useApp();
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  const handleJoin = async () => {
    if (inviteCode.trim().length < 4) {
      setError('Enter the 6-character Fort invite code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await joinFort(inviteCode.trim());
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join Fort.');
    } finally {
      setBusy(false);
    }
  };

  const handleInviteResponse = async (inviteId: string, action: 'accept' | 'decline') => {
    setBusy(true);
    setError(null);
    try {
      await respondToInvitation(inviteId, action, [session.user.id]);
      if (action === 'accept') {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.header}>
              <BrandLogo />
              <Text style={styles.title}>Welcome, {session.user.name}!</Text>
              <Text style={styles.subtitle}>
                Start your own Fort or join a family/roommate Fort with an invite code.
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {session.pendingInvitations.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pending Invitations</Text>
                {session.pendingInvitations.map((inv) => (
                  <View key={inv.id} style={styles.inviteItem}>
                    <Text style={styles.inviteFort}>{inv.fortName}</Text>
                    <Text style={styles.inviteSub}>
                      Invited by {inv.invitedByName} as {inv.role.toUpperCase()}
                    </Text>
                    {inv.note ? <Text style={styles.inviteNote}>&ldquo;{inv.note}&rdquo;</Text> : null}
                    <View style={styles.inviteActions}>
                      <PrimaryButton
                        label="Decline"
                        variant="secondary"
                        disabled={busy}
                        onPress={() => handleInviteResponse(inv.id, 'decline')}
                      />
                      <PrimaryButton
                        label="Accept & Enter"
                        variant="primary"
                        disabled={busy}
                        onPress={() => handleInviteResponse(inv.id, 'accept')}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Build a New Fort</Text>
              <Text style={styles.cardDesc}>
                Set up your home areas, starter missions, kids&apos; profiles, and first goal reward
                in under a minute.
              </Text>
              <PrimaryButton
                label="Create My Fort"
                variant="primary"
                disabled={busy}
                onPress={() => router.push('/wizard')}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join an Existing Fort</Text>
              <Text style={styles.cardDesc}>
                Have an invite code from a parent, partner, grandparent, or roommate?
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={(value) => {
                  setInviteCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                  setError(null);
                }}
                placeholder="e.g., 7K2P9Q"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                style={styles.codeInput}
              />
              <PrimaryButton
                label={busy ? 'Joining...' : 'Join Fort'}
                variant="secondary"
                disabled={busy || inviteCode.trim().length < 4}
                onPress={handleJoin}
              />
            </View>

            <Pressable
              onPress={() => {
                void logout();
              }}
              style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out ({session.user.email})</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FortBackground>
  );
}
