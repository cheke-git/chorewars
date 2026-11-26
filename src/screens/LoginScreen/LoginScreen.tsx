import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo/BrandLogo';
import { FortBackground } from '@/components/FortBackground/FortBackground';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { buildApiUrl } from '@/lib/api';

import { styles } from './LoginScreen.styles';

type ApiStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; message: string }
  | { state: 'error'; message: string };

export function LoginScreen() {
  const { login, register, lockedProfileId } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<'login' | 'register' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: 'idle' });

  const handleAuthAction = async (action: 'login' | 'register') => {
    if (!email.trim() || !password.trim()) {
      setError('Enter an email and password to continue.');
      return;
    }

    setSubmitting(action);
    setError(null);
    try {
      const result =
        action === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password);

      if (!result.hasFort) {
        router.replace('/wizard');
      } else if (lockedProfileId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/profiles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(null);
    }
  };

  const checkApiHealth = async () => {
    setApiStatus({ state: 'loading' });
    try {
      const response = await fetch(buildApiUrl('/api/health'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { status?: string; timestamp?: string };
      setApiStatus({
        state: 'ok',
        message: `API ${data.status ?? 'ok'} (${data.timestamp ?? 'reachable'})`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach /api/health';
      setApiStatus({ state: 'error', message });
    }
  };

  return (
    <FortBackground>
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <View style={styles.header}>
            <BrandLogo />
            <Text style={styles.tagline}>Claim chores. Earn XP. Win the Fort.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Commander Email</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionsRow}>
              <PrimaryButton
                label={submitting === 'register' ? 'Creating...' : 'Register'}
                variant="secondary"
                disabled={submitting !== null}
                onPress={() => handleAuthAction('register')}
              />
              <PrimaryButton
                label={submitting === 'login' ? 'Signing in...' : 'Login'}
                variant="primary"
                disabled={submitting !== null}
                onPress={() => handleAuthAction('login')}
              />
            </View>
          </View>

          <View style={styles.apiFooter}>
            <Pressable onPress={checkApiHealth} style={styles.apiPill} accessibilityRole="button">
              <Text style={styles.apiPillText}>
                {apiStatus.state === 'loading' ? 'Checking /api/health...' : 'Test /api/health'}
              </Text>
            </Pressable>
            {apiStatus.state === 'ok' ? (
              <Text style={styles.apiSuccess}>{apiStatus.message}</Text>
            ) : null}
            {apiStatus.state === 'error' ? (
              <Text style={styles.apiError}>{apiStatus.message}</Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </FortBackground>
  );
}
