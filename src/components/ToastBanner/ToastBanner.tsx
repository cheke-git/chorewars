import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

import { styles } from './ToastBanner.styles';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastBannerProps {
  toast: ToastItem | null;
  onDismiss: (id: number) => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim, toast]);

  if (!toast) {
    return null;
  }

  const isError = toast.variant === 'error';

  return (
    <View style={[styles.viewport, { top: Math.max(insets.top, 8) + 8 }]} pointerEvents="box-none">
      <Animated.View
        accessibilityRole="alert"
        style={[
          styles.toast,
          isError ? styles.toastError : styles.toastSuccess,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}>
        <Feather
          name={isError ? 'alert-circle' : 'check-circle'}
          size={18}
          color={isError ? Colors.error : Colors.success}
        />
        <Text style={[styles.message, isError ? styles.messageError : styles.messageSuccess]}>
          {toast.message}
        </Text>
        <Pressable
          onPress={() => onDismiss(toast.id)}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification">
          <Feather name="x" size={15} color={Colors.textPrimary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
