import { useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';

import { styles } from './PinModal.styles';

interface PinModalProps {
  visible: boolean;
  onCancel: () => void;
  onVerify: (pin: string) => Promise<void>;
}

export function PinModal({ visible, onCancel, onVerify }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter the 4-digit Commander PIN.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onVerify(pin);
      setPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Commander in Chief PIN</Text>
          <Text style={styles.subtitle}>
            Enter your 4-digit PIN to unlock Fort Command settings.
          </Text>

          <TextInput
            value={pin}
            onChangeText={(value) => {
              setPin(value.replace(/[^0-9]/g, '').slice(0, 4));
              setError(null);
            }}
            placeholder="0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              disabled={loading}
              onPress={() => {
                setPin('');
                setError(null);
                onCancel();
              }}
            />
            <PrimaryButton
              label={loading ? 'Checking...' : 'Unlock'}
              variant="primary"
              disabled={loading}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
