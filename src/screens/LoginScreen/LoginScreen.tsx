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
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';
import { buildApiUrl } from '@/lib/api';

import { styles } from './LoginScreen.styles';

type ApiStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; message: string }
  | { state: 'error'; message: string };

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: 'idle' });

  const handleAuthAction = (action: 'login' | 'register') => {
    if (!email.trim() || !password.trim()) {
      setFeedback('Enter an email and password to continue.');
      return;
    }
    setFeedback(
      action === 'login'
        ? 'Login endpoint coming in Phase 1.'
        : 'Registration endpoint coming in Phase 1.'
    );
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach /api/health';
      setApiStatus({ state: 'error', message });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <View style={styles.header}>
            <BrandLogo />
            <Text style={styles.tagline}>Claim chores. Earn points. Win the house.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFeedback(null);
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
                  setFeedback(null);
                }}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                style={styles.input}
              />
            </View>

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

            <View style={styles.actionsRow}>
              <PrimaryButton
                label="Register"
                variant="secondary"
                onPress={() => handleAuthAction('register')}
              />
              <PrimaryButton
                label="Login"
                variant="primary"
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
  );
}
