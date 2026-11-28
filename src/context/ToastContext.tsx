import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ToastBanner, type ToastItem } from '@/components/ToastBanner/ToastBanner';

interface ToastContextValue {
  showSuccess: (message: string, durationMs?: number) => void;
  showError: (message: string) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextIdRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissToast = useCallback(
    (id?: number) => {
      clearTimer();
      setToast((current) => {
        if (!current) return null;
        if (id !== undefined && current.id !== id) return current;
        return null;
      });
    },
    [clearTimer]
  );

  const showSuccess = useCallback(
    (message: string, durationMs = 5600) => {
      clearTimer();
      const id = nextIdRef.current++;
      setToast({ id, variant: 'success', message });
      timerRef.current = setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timerRef.current = null;
      }, durationMs);
    },
    [clearTimer]
  );

  const showError = useCallback(
    (message: string) => {
      clearTimer();
      const id = nextIdRef.current++;
      setToast({ id, variant: 'error', message });
    },
    [clearTimer]
  );

  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess,
      showError,
      dismissToast: () => dismissToast(),
    }),
    [dismissToast, showError, showSuccess]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastBanner toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
