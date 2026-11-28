import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { Colors } from '@/constants/theme';

import { styles } from './PinModal.styles';

interface PinEntryCardProps {
  fortName?: string;
  title?: string;
  subtitle?: string;
  autoFocusTrigger?: boolean;
  onCancel?: () => void;
  onVerify: (pin: string) => Promise<void>;
}

export function PinEntryCard({
  fortName,
  title = 'Commander in Chief PIN',
  subtitle = 'Enter your 4-digit Guardian PIN to unlock.',
  autoFocusTrigger = true,
  onCancel,
  onVerify,
}: PinEntryCardProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const verifyingRef = useRef(false);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  useEffect(() => {
    if (autoFocusTrigger) {
      focusInput();
    }
  }, [autoFocusTrigger]);

  const submitPin = async (digits: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      await onVerify(digits);
      setPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect PIN.');
      setPin('');
      focusInput();
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  const handleChangeText = (value: string) => {
    if (loading) return;
    const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(digits);
    if (error) setError(null);
    if (digits.length === 4) {
      void submitPin(digits);
    }
  };

  return (
    <View style={styles.card}>
      {fortName ? <Text style={styles.fortLabel}>{fortName}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChangeText}
        placeholder="••••"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        autoFocus={autoFocusTrigger}
        editable={!loading}
        style={styles.input}
      />

      {loading ? <Text style={styles.checking}>Checking PIN...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {onCancel ? (
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
        </View>
      ) : null}
    </View>
  );
}

interface PinModalProps {
  visible: boolean;
  onCancel: () => void;
  onVerify: (pin: string) => Promise<void>;
}

export function PinModal({ visible, onCancel, onVerify }: PinModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {visible ? (
          <PinEntryCard
            autoFocusTrigger={visible}
            onCancel={onCancel}
            onVerify={onVerify}
          />
        ) : null}
      </View>
    </Modal>
  );
}
